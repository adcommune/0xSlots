# Adland monorepo split — design

**Date:** 2026-07-26
**Status:** Approved, pending implementation plan
**Source repo:** `0xSlots` (`pco-protocol` workspace)
**Target repo:** `nezz0746/adland` — private, fresh git history

## Goal

Extract the adland surface (API, postgres, analytics, published packages) from
`0xSlots` into its own private monorepo, swap IPFS from Pinata to econome-ipfs,
and add a web app serving a landing page at `/` and a Farcaster miniapp at
`/app`.

The subgraph and its indexing stay in `0xSlots`. Adland reaches on-chain data
through the published `@0xslots/sdk`, whose `MetadataModule` (reported on-chain
as `AdLandModule`) already exposes every method adland needs.

## Scope

### Moves to `adland`

| Source | Destination | Notes |
| --- | --- | --- |
| `apps/api` | `apps/api` | Hono, port 3069 |
| `packages/adland-data` | `packages/data` | `@adland/data`, published |
| `packages/adland-react` | `packages/react` | `@adland/react`, published |
| `.github/workflows/db-migrate.yml` | `.github/workflows/db-migrate.yml` | retargeted |

### New in `adland`

- `apps/web` — Next 16 app: landing at `/`, miniapp at `/app`
- `packages/chains` — `@adland/chains`, private, vendored from `@0xslots/config`

### Stays in `0xSlots`

`packages/subgraph`, `packages/ponder`, `packages/sdk`, `packages/contracts`,
`packages/config`, `packages/mcp`, `apps/landing`, `apps/vitrine`, `apps/docs`,
`apps/contracts`, `apps/graph-node`.

### Explicitly out of scope

- **`startEventListener`** (`apps/api/src/services/events.ts`) — ports as-is.
  It polls `SlotEvent` every 15s and only `console.log`s; nothing is persisted.
  Fixing or removing it is a separate decision.
- **`apps/landing`'s `metadata-form` authoring UI** — stays in `0xSlots`. The
  miniapp is shell-only at v1, so the authoring surface does not move.

## Repository layout

```
adland/
├── apps/
│   ├── api/                 Hono — postgres, analytics, verify/metadata, ipfs proxy
│   └── web/                 Next 16 — landing + miniapp
├── packages/
│   ├── data/                @adland/data    (published)
│   ├── react/               @adland/react   (published)
│   └── chains/              @adland/chains  (private)
├── .changeset/
├── .github/workflows/
│   ├── publish.yml
│   └── db-migrate.yml
├── biome.json
├── pnpm-workspace.yaml      apps/*, packages/*
└── turbo.json
```

Toolchain mirrors `0xSlots`: pnpm 10.33.0, turbo, biome, changesets, Node 22.

## Cross-repo dependency contract

After the split the two repos reference each other through npm:

```
adland/packages/react  ──peer──▶  @0xslots/sdk        (published from 0xSlots)
0xSlots/apps/landing   ──dep───▶  @adland/data        (published from adland)
0xSlots/apps/landing   ──dep───▶  @adland/react       (published from adland)
```

This is not circular at the package level, but it introduces a duplicate-instance
hazard that the design must prevent.

### `@0xslots/sdk` must become a peerDependency of `@adland/react`

`apps/landing` links `@0xslots/sdk` as `workspace:*`. If `@adland/react` declares
`@0xslots/sdk` as a regular `dependency`, npm resolution gives landing a second,
independently-versioned copy of the SDK in its tree. Consequences:

- `SlotsChain` is used as a **value** in `@adland/react/src/components/Ad.tsx`.
  Two enum objects means identity comparisons and `Record<SlotsChain, …>` lookups
  can silently miss.
- Two `viem` instances get linked in.

**Resolution:** `@0xslots/sdk` moves from `dependencies` to `peerDependencies`
in `@adland/react` (it already peers `react`/`react-dom`). Consumers supply one
copy. This is the single most important correctness detail in the split.

### Known constraint carried over

`new SlotsClient({chainId, publicClient})` unconditionally constructs a
`GraphQLClient` and throws when no subgraph URL resolves for the chain
(`packages/sdk/src/client.ts:138-146`). `@adland/react` never issues a GraphQL
query — its two SDK calls (`getSlotInfo`, `modules.metadata.getURI`) are
`readContract` calls — but it remains hard-pinned to Base / Base Sepolia and
links `graphql-request` into its bundle. Accepted as-is; fixing it is an SDK
change in `0xSlots`.

## API design

### Route inventory after the split

| Method | Path | Change |
| --- | --- | --- |
| GET | `/` | unchanged |
| POST | `/ipfs/upload` | **rewritten** — econome instead of Pinata |
| POST | `/track` | unchanged |
| GET | `/analytics/domains` | unchanged |
| GET | `/analytics/domains/:domain` | unchanged |
| GET | `/analytics/slots/:slot` | unchanged |
| GET | `/analytics/slots/:slot/domains` | unchanged |
| `/adland/verify/*` | 5 routes | unchanged |
| `/adland/metadata/*` | 6 routes | unchanged |
| GET | `/adland/tweet` | unchanged |
| ~~GET~~ | ~~`/ad/slot/:slotAddress`~~ | **deleted** |

Deleting `/ad/slot/:slotAddress` removes the only subgraph-backed endpoint
(`slotsClient.modules.metadata.getSlot`, a real `GetMetadataSlot` GraphQL query,
hardcoded to `SlotsChain.BASE_SEPOLIA`). Nothing in either repo calls it.
`@0xslots/sdk` and `src/services/subgraph.ts` leave `apps/api` entirely.

### IPFS: Pinata → econome

econome-ipfs offers no JSON-pin endpoint. `POST /ingest` is multipart-only and
returns `{cid, name, size, tags}`.

New `apps/api/src/services/econome.ts`:

```ts
const form = new FormData();
form.append(
  "file",
  new Blob([JSON.stringify(doc)], { type: "application/json" }),
  "metadata.json",
);
form.append("tags", "adland");

const res = await fetch(`${ECONOME_API_URL}/ingest`, {
  method: "POST",
  headers: { "x-api-key": ECONOME_API_KEY },
  body: form,
});
const { cid } = await res.json();
```

`POST /ipfs/upload` keeps its existing response contract: `{cid, uri: "ipfs://<cid>"}`.
The upload stays server-side so the `eco_…` key is never exposed — econome's CORS
is fully open (`cors()` with no options) and would permit a direct browser call,
but that would leak the key.

The `adland` tag makes uploads eligible for opt-in replication by econome
participants subscribed to that tag. Untagged content pins to the main peer only.

**Removed:** `pinata` SDK dependency, `PINATA_JWT`, `src/services/pinata.ts`.

### Gateway reads

All three current read paths use different Pinata gateways. After the split:

| Site | Before | After |
| --- | --- | --- |
| `apps/api` `/ad/slot` | `gateway.pinata.cloud` | route deleted |
| `packages/react/src/fetch.ts` | hardcoded `…mypinata.cloud` | `gateway` option, defaults to econome |
| `0xSlots/apps/landing/src/app/api/ipfs/route.ts` | `gateway.pinata.cloud` | **stays in 0xSlots**, repointed to econome |

`@adland/react`'s `IPFS_GATEWAY` constant becomes a configurable option defaulting
to `https://ipfs-gateway.econome.studio/ipfs/`. Configurable so external consumers
retain an escape hatch; **single attempt, no fallback chain** — CIDs are already
replicated to econome.

Gateway URL convention, applied everywhere: the configured value is the **origin
only** (`https://ipfs-gateway.econome.studio`, no trailing slash, no path). Call
sites append `/ipfs/${cid}`. This matches econome's own consumers
(`packages/payload-storage-ipfs/src/index.ts:110`) and differs from today's
`@adland/react` constant, which bakes in the trailing `/ipfs/`.

### `@0xslots/config` → `@adland/chains`

`@0xslots/config` is private and exports raw TypeScript, so it cannot be consumed
across repos. Adland uses exactly two symbols: `getChainClient`
(`src/routes/adland.ts:5`, token multicalls) and `alchemyRpcUrl`
(`src/services/events.ts:1`).

`packages/chains` (`@adland/chains`, private, built with tsup) vendors: `base` /
`baseSepolia` chain definitions, `alchemyRpcUrl`, `alchemyTransports`, and
`getChainClient`. Roughly 50 lines. Adland stops inheriting `0xSlots` chain-config
churn.

### Environment variables

| Var | Status |
| --- | --- |
| `DATABASE_URL` | unchanged — points at the **existing** database |
| `ALCHEMY_KEY` | unchanged |
| `NEYNAR_API_KEY` | unchanged |
| `FARCASTER_API_KEY` | unchanged |
| `CHAIN_ID` | unchanged; must be documented in `.env.example` (it is not today) |
| `ECONOME_API_URL` | **new** — `https://ipfs-api.econome.studio` |
| `ECONOME_API_KEY` | **new** — `eco_…`, manually minted (see Prerequisites) |
| `ECONOME_GATEWAY_URL` | **new** — `https://ipfs-gateway.econome.studio` |
| ~~`PINATA_JWT`~~ | **removed** |

`turbo.json` `passThroughEnv` must list all of the above for `build` and `start`.
The untracked `TWITTER_API_*` keys are read by no code (`src/services/twitter.ts`
uses only free public endpoints) and are not carried over.

## Package changes

### `@adland/data`

- **Fix the phantom dependency.** `src/types.ts:1` imports
  `@neynar/nodejs-sdk/build/api` for the `Cast` type, but the package is not in
  its `package.json` — it resolves only through the pnpm workspace root today and
  will break a standalone install and the dts build. Add it as a dev-only type
  dependency and stop re-exporting `Cast` from the public surface.
- Move `tsup` from `dependencies` to `devDependencies`.
- `adlandApiUrl` (`src/constants.ts`) currently hardcodes
  `https://api.0xslots.org` in production. Repoint at the new adland API domain
  and make it overridable via `NEXT_PUBLIC_ADLAND_API_URL`.
- `src/farcaster.ts` `decodeBase64Url` uses Node `Buffer` — not browser-safe.
  Replace with `atob`-based decoding.

### `@adland/react`

- `@0xslots/sdk` → `peerDependencies` (see cross-repo contract above).
- Configurable IPFS gateway, econome default.
- Delete `src/utils/constants.ts`'s duplicate `adlandApiUrl`; import from
  `@adland/data` instead.
- Move `tsup` and `@types/*` from `dependencies` to `devDependencies`.

## Web app

```
apps/web/src/app/
├── layout.tsx
├── page.tsx                              /       landing page
├── .well-known/farcaster.json/route.ts   manifest, homeUrl = {APP_URL}/app
├── (miniapp)/
│   ├── layout.tsx                        FarcasterProvider + wagmi miniapp config
│   └── app/page.tsx                      /app    miniapp entry (placeholder)
└── api/og/route.tsx
```

The `(miniapp)` route group gives the miniapp its own provider layout without
adding a URL segment; `/app` is the real path the manifest points at.

**Ported from `apps/landing`, not rewritten:**

| Source | Purpose |
| --- | --- |
| `src/context/farcaster.tsx` | `FarcasterProvider`, `sdk.context`, `sdk.actions.ready` |
| `src/config/wagmi-miniapp.ts` | `farcasterMiniApp()` connector — retarget to `@adland/chains` |
| `src/lib/frame-metadata.ts` | `fc:frame` / `launch_miniapp` metadata |
| `src/app/api/og/route.tsx` | OG image generation |
| tailwind 4 + shadcn base | styling foundation |

**v1 contains the working shell only** — route group, manifest, Farcaster SDK
context, wagmi connector, OG route, placeholder screen. No authoring flow, no
analytics dashboards.

## Data and infrastructure

### Database — stays on Railway

The database **does not move in this cycle**. It stays on Railway, and the new
API takes the existing `DATABASE_URL` unchanged. No dump, no restore, no
downtime, and all analytics history is retained. The database simply stops being
owned by the `0xSlots` repo.

Migrating the data onto a Dokploy-hosted Postgres is deliberately deferred to a
later cycle, so this split changes exactly one thing about the database: which
repo deploys against it.

The schema is unchanged: enums `event_type` / `auth_type`, tables `events`
(6 indexes) and `domains`, and the `events.domain → domains.domain` FK.

### Migration state — no action needed at cutover

`db:migrate` is `drizzle-kit migrate`, which applies only journal entries whose
hash is absent from the database's `__drizzle_migrations` table. Both
`0000_jazzy_betty_ross` and `0001_rename_domains_add_miniapp` are already applied
on Railway, so running it from a fresh checkout of the new repo is a **no-op**.
Nothing needs repairing before the move.

There is a latent defect worth recording, but it is not a cutover blocker:
`drizzle/meta/_journal.json` lists two migrations while `meta/0000_snapshot.json`
is missing (only `0001_snapshot.json` exists). This affects `drizzle-kit
**generate**`, not `migrate` — the next time a migration is authored, it diffs
against an incomplete snapshot chain and may emit wrong SQL.

Handling: before authoring the first new migration in the adland repo, run
`drizzle-kit generate` against the unchanged schema and confirm it emits an empty
diff. If it instead tries to recreate existing objects, squash the folder to a
single `0000_init` with a matching snapshot and reconcile
`__drizzle_migrations`. Verify, rather than performing that surgery preemptively.

Note `domains.owner` is typed with `ParsedAccountAssociation` imported from
`@adland/data` (`src/db/schema.ts:12`) — that import survives the move.

### Deployment — Dokploy

Both `apps/api` and `apps/web` deploy to Dokploy, alongside econome-ipfs. Each
needs a Dockerfile (neither exists today; only `apps/graph-node` has one) and a
Dokploy domain.

**Postgres stays on Railway** and is reached over its public connection string.
Compute moves to Dokploy; storage does not. A later cycle migrates the data onto
a Dokploy Postgres.

### CI

`.github/workflows/publish.yml` — changesets, triggered on `packages/**`,
`.changeset/**`, `package.json`, `pnpm-lock.yaml`. Publishable set is exactly
`@adland/data` and `@adland/react`; `@adland/chains`, `api`, and `web` go in
`.changeset/config.json`'s `ignore`.

`.github/workflows/db-migrate.yml` — carried over, but its trigger must widen.
Today it fires only on `apps/api/drizzle/**`, so a `src/db/schema.ts` edit
without a generated migration silently fails to deploy. New trigger covers both
paths, and the job fails if `drizzle-kit generate` produces a diff.

## Changes in `0xSlots`

Applied **only after** the first `@adland/*` release ships from the new repo.

| File | Change |
| --- | --- |
| `apps/landing/package.json` | `@adland/data`, `@adland/react`: `workspace:*` → npm semver |
| `apps/landing/src/app/api/ipfs/route.ts` | Pinata gateway → econome gateway |
| `package.json` | drop `@adland/*` from `release`; delete `build:adland`, `start:adland`, `dev:api` |
| `.changeset/config.json` | drop `@adland/*` from publishable set; drop `api` from `ignore` |
| `.github/workflows/publish.yml` | drop `@adland/*` build filters |
| `.github/workflows/db-migrate.yml` | delete |
| `apps/api/`, `packages/adland-data/`, `packages/adland-react/` | delete |

`apps/landing` keeps `@0xslots/sdk` as `workspace:*` — with the peer-dependency
fix, that becomes the single SDK copy in its tree.

## Prerequisites requiring manual action

These cannot be automated and block parts of the cutover:

1. **econome API key.** No HTTP route mints one — creation is dashboard-only via
   the Next server action `createApiKey`, gated by a Better Auth session. An
   `eco_…` key must be created in the econome dashboard and set as
   `ECONOME_API_KEY` in Dokploy before uploads work.

2. **Farcaster account association.** `apps/landing`'s manifest carries a
   hardcoded `accountAssociation` (fid 1733) signed for `app.0xslots.org`. The
   signature is domain-bound and cannot be reused. A new association must be
   signed for the adland domain in Farcaster's developer tools. The manifest ships
   env-driven with the association stubbed and a `TODO` until then.

3. **Adland production domain.** Needed for `adlandApiUrl`, the manifest
   `homeUrl`, and Dokploy domain configuration. Env-driven
   (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADLAND_API_URL`) so it is not
   implementation-blocking, only deploy-blocking.

## Sequencing

1. Scaffold `nezz0746/adland`; move `apps/api` and both packages; vendor
   `@adland/chains`; apply package fixes.
2. Swap IPFS write and read paths to econome.
3. Scaffold `apps/web` with the landing page and miniapp shell.
4. Wire CI; publish the first `@adland/data` + `@adland/react` release.
5. Deploy api and web to Dokploy, pointed at the existing Railway database.
6. Only then: apply the `0xSlots` changes and delete the moved directories.

## Testing

- **Packages** — `@adland/data` validation (`validateAdData`, `getAd`, the 5 ad
  definitions) and `@adland/react` field helpers under unit tests. A standalone
  `pnpm pack` + install in a scratch directory proves the phantom-dependency fix.
- **API** — route tests against a throwaway Postgres for `/track` and the four
  `/analytics/*` endpoints, including the daily-series aggregation and the
  hardcoded dev-traffic exclusion list. econome upload covered by an integration
  test asserting a real CID round-trips through the gateway.
- **Migration** — the no-op check in step 5 above is the gate.
- **Web** — the miniapp shell verified in the browser preview: manifest serves
  valid JSON at `/.well-known/farcaster.json`, `/app` mounts the Farcaster
  provider without console errors, `/` renders.

## Risks

| Risk | Mitigation |
| --- | --- |
| Duplicate `@0xslots/sdk` in landing's tree | peerDependency (above) |
| Dokploy-hosted API cannot reach Railway Postgres | Confirm the public connection string and egress before cutover; keep the old deployment running until the new one answers |
| Incomplete snapshot chain emits wrong SQL on the next `generate` | Dry-run `generate` and inspect the diff before authoring any new migration |
| CIDs not yet replicated to econome render as ad errors | Verify replication before cutover; no fallback by design |
| `0xSlots` breaks when adland packages disappear | Publish first, switch landing second, delete last |
| Farcaster manifest invalid on the new domain | Ships stubbed; miniapp is not announced until re-signed |
