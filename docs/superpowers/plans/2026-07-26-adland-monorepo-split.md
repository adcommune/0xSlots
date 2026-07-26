# Adland Monorepo Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the adland API and `@adland/*` packages from `0xSlots` into a private `nezz0746/adland` monorepo, swap Pinata for econome-ipfs, and add a web app with a landing page and a Farcaster miniapp route group.

**Architecture:** A fresh pnpm + turbo workspace holding `apps/api` (Hono), `apps/web` (Next 16), and three packages — `@adland/data` and `@adland/react` (published to npm) plus a private `@adland/chains` vendored from `@0xslots/config`. The subgraph stays in `0xSlots`; adland reaches chain data through the published `@0xslots/sdk`, declared as a **peer** dependency to avoid duplicate instances in consumer bundles. Postgres stays on Railway; only compute moves to Dokploy. `0xSlots` is not touched until the first `@adland/*` release is published.

**Tech Stack:** pnpm 10.33.0, turbo, biome 2.3.14, changesets, Node 22, Hono 4, Drizzle ORM + postgres.js, Next 16, Tailwind 4, viem 2.50.4, vitest.

**Design spec:** `docs/superpowers/specs/2026-07-26-adland-monorepo-split-design.md`

## Global Constraints

- Package manager: `pnpm@10.33.0`. Node `>=22`.
- `.npmrc` must contain `node-linker=hoisted` (matches `0xSlots`).
- Formatter/linter: biome, double quotes, 2-space indent. Run `pnpm check:fix` before every commit.
- Published packages: `@adland/data`, `@adland/react` only. `@adland/chains`, `api`, `web` are ignored by changesets.
- `@0xslots/sdk` is a **peerDependency** of `@adland/react` — never a regular dependency.
- econome API URL: `https://ipfs-api.econome.studio`. Gateway: `https://ipfs-gateway.econome.studio`.
- Gateway values are **origin only** — no trailing slash, no path. Call sites append `/ipfs/${cid}`.
- IPFS upload tag: `adland`.
- No Pinata anywhere in the new repo. No fallback gateway.
- **Production domains are not yet chosen.** The plan uses `https://api.adland.xyz` as the `@adland/data` production default purely as a compile-time placeholder. Every runtime consumer overrides it via `NEXT_PUBLIC_ADLAND_API_URL`, so nothing depends on the guess being right — but the constant in `packages/data/src/constants.ts` and the matching assertion in `constants.test.ts` must both be updated once the real domain is assigned in Task 11. See the post-migration checklist.
- `DATABASE_URL` points at the **existing Railway database**. Never run `drizzle-kit push` against it.
- Source repo for all ports: `/Users/nezzarkefif/Documents/GitHub/0xSlots` (referred to below as `$SRC`).

---

## Phase 1 — Foundation

### Task 1: Create the repo and workspace scaffold

**Files:**
- Create: `~/Documents/GitHub/adland/` (whole workspace root)
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `.npmrc`, `.gitignore`, `.changeset/config.json`, `tsconfig.base.json`, `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: a workspace root where `pnpm install` and `pnpm check` succeed. All later tasks add workspaces under `apps/*` and `packages/*`.

**Note on the path collision:** `~/Documents/GitHub/adland` is currently a stale clone of the public `adcommune/adland`. Step 1 renames it out of the way — do not delete it.

- [ ] **Step 1: Move the stale clone aside and verify it is what we think**

```bash
cd ~/Documents/GitHub
git -C adland remote -v          # expect: origin https://github.com/adcommune/adland.git
git -C adland status --short     # expect: clean, or note what is dirty
mv adland adland-legacy-adcommune
```

Expected: remote is `adcommune/adland`. If it is anything else, STOP and ask before moving.

- [ ] **Step 2: Create the private GitHub repo and clone it**

```bash
cd ~/Documents/GitHub
gh repo create nezz0746/adland --private --description "Adland — ad protocol API, packages and apps" --clone
cd adland
```

Expected: `gh` prints the new repo URL and clones an empty directory.

- [ ] **Step 3: Write the workspace root files**

`package.json`:

```json
{
  "name": "adland",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "dev:api": "turbo dev --filter=api",
    "dev:web": "turbo dev --filter=web",
    "lint": "turbo lint",
    "test": "turbo test",
    "check": "biome check .",
    "check:fix": "biome check --fix .",
    "format": "biome format --fix .",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo build --filter=@adland/data --filter=@adland/react && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.14",
    "@changesets/cli": "^2.31.0",
    "turbo": "^2.9.14",
    "typescript": "^5.8.3",
    "vitest": "^3.0.0"
  },
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=22"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`.npmrc`:

```
node-linker=hoisted
```

`turbo.json` — note `passThroughEnv` drops `PINATA_JWT` and adds the econome and chain vars:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "passThroughEnv": [
        "ALCHEMY_KEY",
        "CHAIN_ID",
        "DATABASE_URL",
        "ECONOME_API_KEY",
        "ECONOME_API_URL",
        "ECONOME_GATEWAY_URL",
        "FARCASTER_API_KEY",
        "NEYNAR_API_KEY",
        "NEXT_PUBLIC_ADLAND_API_URL",
        "NEXT_PUBLIC_APP_URL"
      ]
    },
    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true },
    "start": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true,
      "passThroughEnv": [
        "ALCHEMY_KEY",
        "CHAIN_ID",
        "DATABASE_URL",
        "ECONOME_API_KEY",
        "ECONOME_API_URL",
        "ECONOME_GATEWAY_URL",
        "FARCASTER_API_KEY",
        "NEYNAR_API_KEY",
        "NEXT_PUBLIC_ADLAND_API_URL",
        "NEXT_PUBLIC_APP_URL"
      ]
    },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.2/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@adland/chains", "api", "web"]
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

`.gitignore`:

```
node_modules
dist
.next
.turbo
.env
.env.local
*.log
```

- [ ] **Step 4: Copy biome.json verbatim from the source repo**

```bash
cp ~/Documents/GitHub/0xSlots/biome.json ~/Documents/GitHub/adland/biome.json
```

- [ ] **Step 5: Install and verify the workspace resolves**

```bash
cd ~/Documents/GitHub/adland && pnpm install && pnpm check
```

Expected: install succeeds; `pnpm check` reports no errors (there are no source files yet).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold adland monorepo workspace"
git push -u origin main
```

---

### Task 2: `@adland/chains` — vendored chain config

Replaces `@0xslots/config`, which is private and exports raw TypeScript so it cannot cross repo boundaries. Adland uses exactly two of its symbols: `getChainClient` and `alchemyRpcUrl`.

**Files:**
- Create: `packages/chains/package.json`, `packages/chains/tsconfig.json`, `packages/chains/tsup.config.ts`
- Create: `packages/chains/src/index.ts`, `packages/chains/src/chains.ts`, `packages/chains/src/transports.ts`
- Test: `packages/chains/src/transports.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `appChains: [Chain, ...Chain[]]` — `[base, baseSepolia]`
  - `ALCHEMY_SUBDOMAINS: Record<number, string>`
  - `alchemyRpcUrl(chainId: number, apiKey: string): string | undefined`
  - `alchemyTransport(chainId: number, apiKey?: string): Transport`
  - `alchemyTransports(chainIds: number[], apiKey?: string): Record<number, Transport>`
  - `getChainClient(chainId: number, alchemyKey: string): PublicClient`

- [ ] **Step 1: Write the package manifest and configs**

`packages/chains/package.json`:

```json
{
  "name": "@adland/chains",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run"
  },
  "peerDependencies": {
    "viem": "2.50.4"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.8.3",
    "viem": "2.50.4",
    "vitest": "^3.0.0"
  }
}
```

`packages/chains/tsup.config.ts`:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["viem"],
});
```

`packages/chains/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "lib": ["ESNext"], "outDir": "./dist" },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Write the failing test**

`packages/chains/src/transports.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { alchemyRpcUrl, appChains, getChainClient } from "./index";

describe("alchemyRpcUrl", () => {
  it("builds a base mainnet url", () => {
    expect(alchemyRpcUrl(8453, "KEY")).toBe(
      "https://base-mainnet.g.alchemy.com/v2/KEY",
    );
  });

  it("builds a base sepolia url", () => {
    expect(alchemyRpcUrl(84532, "KEY")).toBe(
      "https://base-sepolia.g.alchemy.com/v2/KEY",
    );
  });

  it("returns undefined for an unknown chain", () => {
    expect(alchemyRpcUrl(999999, "KEY")).toBeUndefined();
  });
});

describe("appChains", () => {
  it("contains base and base sepolia in that order", () => {
    expect(appChains.map((c) => c.id)).toEqual([8453, 84532]);
  });
});

describe("getChainClient", () => {
  it("returns a client bound to the requested chain", () => {
    const client = getChainClient(8453, "KEY");
    expect(client.chain?.id).toBe(8453);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd ~/Documents/GitHub/adland && pnpm --filter @adland/chains test`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 4: Write the implementation**

`packages/chains/src/chains.ts`:

```ts
import type { Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

/** All chains adland operates on. */
export const appChains = [base, baseSepolia] as [Chain, ...Chain[]];
```

`packages/chains/src/transports.ts`:

```ts
import { createPublicClient, http, type Transport } from "viem";
import { appChains } from "./chains";

/** Alchemy subdomain by chain ID */
export const ALCHEMY_SUBDOMAINS: Record<number, string> = {
  1: "eth-mainnet",
  10: "opt-mainnet",
  8453: "base-mainnet",
  42161: "arb-mainnet",
  11155111: "eth-sepolia",
  84532: "base-sepolia",
};

/** Build an Alchemy RPC URL for a given chain. */
export function alchemyRpcUrl(
  chainId: number,
  apiKey: string,
): string | undefined {
  const sub = ALCHEMY_SUBDOMAINS[chainId];
  return sub ? `https://${sub}.g.alchemy.com/v2/${apiKey}` : undefined;
}

/** HTTP transport for a chain, falling back to public RPC when no key or subdomain exists. */
export function alchemyTransport(chainId: number, apiKey?: string): Transport {
  if (!apiKey) return http();
  const url = alchemyRpcUrl(chainId, apiKey);
  return url ? http(url) : http();
}

/** Transport map for multiple chains. */
export function alchemyTransports(
  chainIds: number[],
  apiKey?: string,
): Record<number, Transport> {
  return Object.fromEntries(
    chainIds.map((id) => [id, alchemyTransport(id, apiKey)]),
  );
}

/** Read-only viem client for a chain. */
export function getChainClient(chainId: number, alchemyKey: string) {
  return createPublicClient({
    chain: appChains.find((c) => c.id === chainId),
    transport: alchemyTransport(chainId, alchemyKey),
  });
}
```

`packages/chains/src/index.ts`:

```ts
export { appChains } from "./chains";
export {
  ALCHEMY_SUBDOMAINS,
  alchemyRpcUrl,
  alchemyTransport,
  alchemyTransports,
  getChainClient,
} from "./transports";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm install && pnpm --filter @adland/chains test`
Expected: PASS — 5 tests.

- [ ] **Step 6: Build and commit**

```bash
pnpm --filter @adland/chains build
pnpm check:fix
git add -A
git commit -m "feat(chains): vendor chain config from @0xslots/config"
```

---

## Phase 2 — Packages

### Task 3: Port `@adland/data`

Carries three defects that must be fixed during the move: a phantom `@neynar/nodejs-sdk` dependency that only resolves through the old workspace root, a Node-only `Buffer` call that breaks in browsers, and `tsup` misfiled as a runtime dependency.

**Files:**
- Create: `packages/data/**` (copied from `$SRC/packages/adland-data`)
- Modify: `packages/data/package.json`
- Modify: `packages/data/src/types.ts:1`
- Modify: `packages/data/src/constants.ts`
- Modify: `packages/data/src/farcaster.ts` (`decodeBase64Url`)
- Test: `packages/data/src/constants.test.ts`, `packages/data/src/farcaster.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: unchanged public surface (`ads`, `adTypes`, `AdType`, `AdData`, `getAd`, `validateAdData`, `defineAd`, `withChoices`, `processAd`, `safeProcessAd`, `parseAccountAssociation`, `fetchAndParseAccountAssociation`, `FarcasterAPI`, `ParsedAccountAssociation`) plus a changed `adlandApiUrl` resolution. The `Cast` type is **no longer re-exported**.

- [ ] **Step 1: Copy the package and drop stale config**

```bash
SRC=~/Documents/GitHub/0xSlots
cd ~/Documents/GitHub/adland
mkdir -p packages/data
cp -R $SRC/packages/adland-data/src packages/data/src
cp $SRC/packages/adland-data/package.json packages/data/package.json
cp $SRC/packages/adland-data/tsup.config.ts packages/data/tsup.config.ts
cp $SRC/packages/adland-data/tsconfig.json packages/data/tsconfig.json
cp $SRC/packages/adland-data/README.md $SRC/packages/adland-data/MODELS.md \
   $SRC/packages/adland-data/VERIFICATION.md packages/data/
rm -f packages/data/.eslintrc.js packages/data/CHANGELOG.md
```

Note: `CHANGELOG.md` is dropped so changesets starts a fresh history in the new repo.

- [ ] **Step 2: Rewrite the package manifest**

Changes from the copied file: `tsup` moves to `devDependencies`, `@neynar/nodejs-sdk` is added as a dev-only type source, eslint deps are dropped, a `test` script is added.

`packages/data/package.json`:

```json
{
  "name": "@adland/data",
  "version": "0.15.0",
  "private": false,
  "publishConfig": { "access": "public" },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "prepublishOnly": "pnpm build"
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "dependencies": {
    "@farcaster/miniapp-sdk": "^0.2.3",
    "zod": "4.1.12"
  },
  "devDependencies": {
    "@neynar/nodejs-sdk": "^3.137.0",
    "@types/node": "^22",
    "tsup": "^8.5.1",
    "typescript": "^5.8.3",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: Write the failing tests**

`packages/data/src/constants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveAdlandApiUrl } from "./constants";

describe("resolveAdlandApiUrl", () => {
  it("prefers an explicit override", () => {
    expect(resolveAdlandApiUrl("https://custom.example", "production")).toBe(
      "https://custom.example",
    );
  });

  it("uses localhost in development when no override is set", () => {
    expect(resolveAdlandApiUrl(undefined, "development")).toBe(
      "http://localhost:3069",
    );
  });

  it("uses the production default otherwise", () => {
    expect(resolveAdlandApiUrl(undefined, "production")).toBe(
      "https://api.adland.xyz",
    );
  });

  it("strips a trailing slash from an override", () => {
    expect(resolveAdlandApiUrl("https://custom.example/", "production")).toBe(
      "https://custom.example",
    );
  });
});
```

`packages/data/src/farcaster.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseAccountAssociation } from "./farcaster";

// Real association from the 0xSlots manifest — fid 1733, domain app.0xslots.org
const association = {
  header:
    "eyJmaWQiOjE3MzMsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhjMGU1RTBFODIzYURmMTQ4YjRjMzliOTZiMjA4NDhkMjlDQ0FFMTg4In0",
  payload: "eyJkb21haW4iOiJhcHAuMHhzbG90cy5vcmcifQ",
  signature:
    "d08zVBRPzHbs4RBTqNU4SNWhP1iigwf3uiP9ARY/1ekpQYFi1XCoPVGY1ndjeSEmK1bINes++pRmFd4vNeG1+Rw=",
};

describe("parseAccountAssociation", () => {
  it("decodes fid, address, type and domain without Buffer", () => {
    expect(parseAccountAssociation(association)).toEqual({
      fid: 1733,
      address: "0xc0e5E0E823aDf148b4c39b96b20848d29CCAE188",
      type: "auth",
      domain: "app.0xslots.org",
    });
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm install && pnpm --filter @adland/data test`
Expected: FAIL — `resolveAdlandApiUrl` is not exported from `./constants`.

- [ ] **Step 5: Rewrite `src/constants.ts`**

```ts
const PRODUCTION_API_URL = "https://api.adland.xyz";
const DEVELOPMENT_API_URL = "http://localhost:3069";

/**
 * Resolve the adland API base URL.
 *
 * Exported separately from `adlandApiUrl` so the resolution rules are testable
 * without mutating `process.env`.
 */
export function resolveAdlandApiUrl(
  override: string | undefined,
  nodeEnv: string | undefined,
): string {
  if (override) return override.replace(/\/$/, "");
  return nodeEnv === "development" ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
}

export const adlandApiUrl = resolveAdlandApiUrl(
  process.env.NEXT_PUBLIC_ADLAND_API_URL,
  process.env.NODE_ENV,
);

export const debug = true;
```

- [ ] **Step 6: Make `decodeBase64Url` browser-safe in `src/farcaster.ts`**

Replace the `Buffer`-based body of `decodeBase64Url` with:

```ts
/**
 * Decode a base64url string to JSON. Uses `atob` so the package works in the
 * browser as well as Node — `Buffer` is not available in browser bundles.
 */
function decodeBase64Url<T>(encoded: string): T {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
```

- [ ] **Step 7: Break the phantom dependency in `src/types.ts`**

Line 1 currently imports `Cast` from `@neynar/nodejs-sdk/build/api`, which is not a declared dependency. Replace the import and the `CastMetadata` type with a locally-owned shape so the published `.d.ts` has no undeclared import:

```ts
/**
 * Minimal shape of a Neynar cast, owned locally.
 *
 * Previously imported from `@neynar/nodejs-sdk/build/api`, which was never a
 * declared dependency of this package — it resolved only through the old
 * workspace root and broke standalone installs.
 */
export type Cast = {
  hash: string;
  text: string;
  timestamp: string;
  author: {
    fid: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
  };
  embeds?: unknown[];
  [key: string]: unknown;
};

export type CastMetadata = { cast: Cast };
```

Leave the rest of the file unchanged.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm --filter @adland/data test`
Expected: PASS — 5 tests.

- [ ] **Step 9: Prove the phantom dependency is actually gone**

```bash
cd ~/Documents/GitHub/adland
pnpm --filter @adland/data build
cd packages/data && pnpm pack --pack-destination /tmp && cd -
mkdir -p /tmp/adland-data-check && cd /tmp/adland-data-check
npm init -y >/dev/null && npm install /tmp/adland-data-0.15.0.tgz
node -e "const d=require('@adland/data'); console.log(Object.keys(d).length, 'exports'); console.log(d.adTypes)"
cd - && rm -rf /tmp/adland-data-check
```

Expected: install succeeds with no `@neynar/nodejs-sdk` resolution error, and the ad types print.

- [ ] **Step 10: Commit**

```bash
cd ~/Documents/GitHub/adland && pnpm check:fix
git add -A
git commit -m "feat(data): port @adland/data, fix phantom dep and Buffer usage"
```

---

### Task 4: Port `@adland/react`

Three changes: `@0xslots/sdk` becomes a peer dependency, the hardcoded Pinata gateway becomes a configurable option defaulting to econome, and the duplicated `adlandApiUrl` constant is deleted in favour of the one in `@adland/data`.

**Files:**
- Create: `packages/react/**` (copied from `$SRC/packages/adland-react`)
- Modify: `packages/react/package.json`
- Modify: `packages/react/src/fetch.ts`
- Modify: `packages/react/src/utils/constants.ts`
- Modify: `packages/react/src/types.ts` (add `gateway` to `AdProps`)
- Modify: `packages/react/src/components/Ad.tsx` (thread `gateway` through)
- Test: `packages/react/src/fetch.test.ts`

**Interfaces:**
- Consumes: `@adland/data` (`AdType`, `AdData`, `adlandApiUrl`) from Task 3
- Produces:
  - `DEFAULT_IPFS_GATEWAY = "https://ipfs-gateway.econome.studio"` (origin only)
  - `extractCid(uri: string): string | null` (unchanged)
  - `gatewayUrl(cid: string, gateway?: string): string` — new, returns `${gateway}/ipfs/${cid}`
  - `fetchAdFromURI(uri: string, gateway?: string): Promise<{ data: AdData; cid: string | null }>` — **signature changed**, second parameter added
  - `AdProps.gateway?: string` — new optional prop

- [ ] **Step 1: Copy the package and drop stale config**

```bash
SRC=~/Documents/GitHub/0xSlots
cd ~/Documents/GitHub/adland
mkdir -p packages/react
cp -R $SRC/packages/adland-react/src packages/react/src
cp $SRC/packages/adland-react/package.json packages/react/package.json
cp $SRC/packages/adland-react/tsup.config.ts packages/react/tsup.config.ts
cp $SRC/packages/adland-react/tsconfig.json packages/react/tsconfig.json
cp $SRC/packages/adland-react/README.md packages/react/ 2>/dev/null || true
rm -f packages/react/.eslintrc.js packages/react/CHANGELOG.md
```

- [ ] **Step 2: Rewrite the package manifest**

Changes: `@0xslots/sdk` moves to `peerDependencies`, `@adland/data` becomes `workspace:*`, `tsup`/`@types/*` move to `devDependencies`, eslint deps dropped, `test` script added.

`packages/react/package.json`:

```json
{
  "name": "@adland/react",
  "version": "0.16.27",
  "private": false,
  "publishConfig": { "access": "public" },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "import": "./dist/types.js",
      "require": "./dist/types.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "prepublishOnly": "pnpm build"
  },
  "peerDependencies": {
    "@0xslots/sdk": ">=0.1.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@adland/data": "workspace:*",
    "@farcaster/miniapp-sdk": "^0.2.3",
    "lucide-react": "0.561.0",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "@0xslots/sdk": "latest",
    "@types/node": "^22",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tsup": "^8.5.1",
    "typescript": "^5.8.3",
    "vitest": "^3.0.0"
  }
}
```

Then add `@0xslots/sdk` to the tsup externals so it is never bundled. In `packages/react/tsup.config.ts`, the `external` array must read:

```ts
external: ["react", "react-dom", "@farcaster/miniapp-sdk", "@0xslots/sdk"],
```

- [ ] **Step 3: Write the failing test**

`packages/react/src/fetch.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_IPFS_GATEWAY, extractCid, fetchAdFromURI, gatewayUrl } from "./fetch";

afterEach(() => vi.unstubAllGlobals());

describe("DEFAULT_IPFS_GATEWAY", () => {
  it("is the econome gateway origin with no trailing slash", () => {
    expect(DEFAULT_IPFS_GATEWAY).toBe("https://ipfs-gateway.econome.studio");
  });
});

describe("extractCid", () => {
  it("strips the ipfs:// scheme", () => {
    expect(extractCid("ipfs://bafyabc")).toBe("bafyabc");
  });

  it("passes through a bare cid", () => {
    expect(extractCid("QmAbc")).toBe("QmAbc");
  });

  it("returns null for an http uri", () => {
    expect(extractCid("https://example.com/a.json")).toBeNull();
  });
});

describe("gatewayUrl", () => {
  it("defaults to the econome gateway", () => {
    expect(gatewayUrl("bafyabc")).toBe(
      "https://ipfs-gateway.econome.studio/ipfs/bafyabc",
    );
  });

  it("honours an override and tolerates a trailing slash", () => {
    expect(gatewayUrl("bafyabc", "https://gw.example/")).toBe(
      "https://gw.example/ipfs/bafyabc",
    );
  });
});

describe("fetchAdFromURI", () => {
  it("reads an ipfs uri through the default gateway", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ type: "link", url: "https://example.com" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAdFromURI("ipfs://bafyabc");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://ipfs-gateway.econome.studio/ipfs/bafyabc",
    );
    expect(result.cid).toBe("bafyabc");
    expect(result.data).toEqual({ type: "link", url: "https://example.com" });
  });

  it("does not retry another gateway on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdFromURI("ipfs://bafyabc")).rejects.toThrow("ERROR");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm install && pnpm --filter @adland/react test`
Expected: FAIL — `DEFAULT_IPFS_GATEWAY` and `gatewayUrl` are not exported from `./fetch`.

- [ ] **Step 5: Rewrite the gateway section of `src/fetch.ts`**

Replace the `IPFS_GATEWAY` constant with the following, and change `fetchAdFromURI` to accept a `gateway` argument. Everything else in the file (`createReadClient`, `viemChains`, `fetchMetadataURI`) stays exactly as it is.

```ts
/** Default IPFS gateway — econome. Origin only; `/ipfs/<cid>` is appended. */
export const DEFAULT_IPFS_GATEWAY = "https://ipfs-gateway.econome.studio";

/** Build a gateway URL for a CID. */
export function gatewayUrl(cid: string, gateway?: string): string {
  const origin = (gateway ?? DEFAULT_IPFS_GATEWAY).replace(/\/$/, "");
  return `${origin}/ipfs/${cid}`;
}

/**
 * Fetch ad content from a metadata URI (IPFS or HTTP).
 * Returns both the ad data and the CID (if IPFS).
 *
 * A single gateway attempt is made — there is deliberately no fallback chain.
 */
export const fetchAdFromURI = async (
  uri: string,
  gateway?: string,
): Promise<{ data: AdData; cid: string | null }> => {
  if (!uri) throw new Error(AdDataQueryError.NO_AD);

  const cid = extractCid(uri);
  const url = cid ? gatewayUrl(cid, gateway) : uri;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error(AdDataQueryError.NO_AD);
    throw new Error(AdDataQueryError.ERROR);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return { data, cid };
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @adland/react test`
Expected: PASS — 8 tests.

- [ ] **Step 7: Delete the duplicated `adlandApiUrl`**

In `packages/react/src/utils/constants.ts`, delete the trailing `adlandApiUrl` export (the last three lines of the file). Keep `adCardIcon` and `adCardLabel`.

Then update every internal consumer to import it from `@adland/data` instead:

```bash
cd ~/Documents/GitHub/adland/packages/react
grep -rn "adlandApiUrl" src/
```

For each hit outside `utils/constants.ts`, change the import to `import { adlandApiUrl } from "@adland/data";`.

- [ ] **Step 8: Add the `gateway` prop**

In `packages/react/src/types.ts`, add to the `AdProps` interface:

```ts
  /**
   * IPFS gateway origin used to resolve ad metadata, e.g.
   * "https://ipfs-gateway.econome.studio". Defaults to the econome gateway.
   */
  gateway?: string;
```

In `packages/react/src/components/Ad.tsx`, destructure `gateway` from props and pass it as the second argument to every `fetchAdFromURI(...)` call.

- [ ] **Step 9: Verify the build and that the SDK is not bundled**

```bash
cd ~/Documents/GitHub/adland
pnpm --filter @adland/react build
grep -c "GraphQLClient" packages/react/dist/index.js || echo "SDK not inlined — correct"
```

Expected: `grep` finds no matches, printing `SDK not inlined — correct`. If it finds matches, the tsup `external` entry from Step 2 was not applied.

- [ ] **Step 10: Commit**

```bash
pnpm check:fix
git add -A
git commit -m "feat(react): port @adland/react, peer-dep the SDK, econome gateway"
```

---

## Phase 3 — API

### Task 5: Port `apps/api`

Drops the subgraph route and its SDK dependency; swaps `@0xslots/config` for `@adland/chains`. The IPFS swap is Task 6 — this task leaves `/ipfs/upload` temporarily broken and does not deploy.

**Files:**
- Create: `apps/api/**` (copied from `$SRC/apps/api`)
- Delete: `apps/api/src/services/subgraph.ts`, `apps/api/src/services/pinata.ts`
- Modify: `apps/api/src/index.ts` (remove `/ad/slot/:slotAddress` and its imports)
- Modify: `apps/api/src/routes/adland.ts:5`, `apps/api/src/services/events.ts:1` (import from `@adland/chains`)
- Modify: `apps/api/package.json`, `apps/api/tsup.config.ts`, `apps/api/.env.example`

**Interfaces:**
- Consumes: `@adland/chains` (`getChainClient`, `alchemyRpcUrl`) from Task 2; `@adland/data` (`parseAccountAssociation`, `ParsedAccountAssociation`, `FarcasterAPI`) from Task 3
- Produces: a Hono app on port 3069 exposing `/`, `/track`, `/analytics/*`, `/adland/*`. `/ipfs/upload` is wired in Task 6.

- [ ] **Step 1: Copy the app**

```bash
SRC=~/Documents/GitHub/0xSlots
cd ~/Documents/GitHub/adland
mkdir -p apps/api
cp -R $SRC/apps/api/src apps/api/src
cp -R $SRC/apps/api/drizzle apps/api/drizzle
cp $SRC/apps/api/package.json $SRC/apps/api/tsconfig.json \
   $SRC/apps/api/tsup.config.ts $SRC/apps/api/drizzle.config.ts apps/api/
cp $SRC/apps/api/.env.example apps/api/.env.example
rm apps/api/src/services/subgraph.ts apps/api/src/services/pinata.ts
```

The `drizzle/` folder is copied **as-is**, including its incomplete `meta/` directory. Do not regenerate it — see Task 8 Step 5 for the verification gate.

- [ ] **Step 2: Rewrite the package manifest**

Drops `@0xslots/config`, `@0xslots/sdk`, `graphql-request`, `pinata`. Adds `@adland/chains`.

`apps/api/package.json`:

```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "lsof -ti:3069 | xargs kill -9 2>/dev/null || true; tsx watch src/index.ts",
    "build": "tsup",
    "start": "node dist/index.js",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@adland/chains": "workspace:*",
    "@adland/data": "workspace:*",
    "@farcaster/quick-auth": "^0.0.8",
    "@hono/node-server": "^1.19.11",
    "@neynar/nodejs-sdk": "^3.137.0",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.45.2",
    "hono": "^4.12.8",
    "postgres": "^3.4.8",
    "viem": "2.50.4"
  },
  "devDependencies": {
    "@types/node": "^22",
    "drizzle-kit": "^0.31.10",
    "tsup": "^8.5.1",
    "tsx": "^4.7.1",
    "typescript": "^5.8.3",
    "vitest": "^3.0.0"
  },
  "engines": { "node": ">=22" }
}
```

`db:push` is deliberately removed — it must never run against the live Railway database.

- [ ] **Step 3: Update tsup externals**

In `apps/api/tsup.config.ts`, replace `noExternal: ["@0xslots/config"]` with:

```ts
  noExternal: ["@adland/chains"],
```

- [ ] **Step 4: Remove the subgraph route from `src/index.ts`**

Delete these three imports:

```ts
import { pinata } from "./services/pinata";
import { slotsClient } from "./services/subgraph";
```

Delete the entire `app.get("/ad/slot/:slotAddress", ...)` handler (the block from `app.get("/ad/slot/:slotAddress", async (c) => {` through its closing `});`), and delete the now-unused `AdDataQueryError` constant above it.

Leave `app.post("/ipfs/upload", ...)` in place for now; Task 6 rewrites its body.

- [ ] **Step 5: Repoint the chain-config imports**

In `apps/api/src/routes/adland.ts` line 5, change:

```ts
import { getChainClient } from "@0xslots/config";
```

to:

```ts
import { getChainClient } from "@adland/chains";
```

In `apps/api/src/services/events.ts` line 1, change:

```ts
import { alchemyRpcUrl } from "@0xslots/config";
```

to:

```ts
import { alchemyRpcUrl } from "@adland/chains";
```

- [ ] **Step 6: Verify no stale references remain**

```bash
cd ~/Documents/GitHub/adland
grep -rn "0xslots\|pinata\|Pinata\|PINATA" apps/api/src apps/api/package.json || echo "clean"
```

Expected: prints `clean`. Any hit must be fixed before continuing.

- [ ] **Step 7: Typecheck**

```bash
pnpm install
pnpm --filter api exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
pnpm check:fix
git add -A
git commit -m "feat(api): port apps/api, drop subgraph route and @0xslots deps"
```

---

### Task 6: econome IPFS upload

**Files:**
- Create: `apps/api/src/services/econome.ts`
- Test: `apps/api/src/services/econome.test.ts`
- Modify: `apps/api/src/index.ts` (`/ipfs/upload` handler)
- Modify: `apps/api/.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: `uploadJson(doc: unknown, tags?: string[]): Promise<{ cid: string }>` — posts a JSON document to econome as a multipart file part.

- [ ] **Step 1: Write the failing test**

`apps/api/src/services/econome.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.ECONOME_API_URL = "https://ipfs-api.econome.studio";
  process.env.ECONOME_API_KEY = "eco_testkey";
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
});

describe("uploadJson", () => {
  it("posts a multipart file part and returns the cid", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cid: "bafyabc", name: "metadata.json", size: 12 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { uploadJson } = await import("./econome");
    const result = await uploadJson({ type: "link" });

    expect(result).toEqual({ cid: "bafyabc" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ipfs-api.econome.studio/ingest");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("eco_testkey");

    const body = init.body as FormData;
    expect(body.get("tags")).toBe("adland");
    const file = body.get("file") as File;
    expect(file.name).toBe("metadata.json");
    expect(JSON.parse(await file.text())).toEqual({ type: "link" });
  });

  it("joins multiple tags with commas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cid: "bafyabc" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { uploadJson } = await import("./econome");
    await uploadJson({ a: 1 }, ["adland", "test"]);

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("tags")).toBe("adland,test");
  });

  it("throws with the status and body when econome rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":"invalid api key"}',
      }),
    );

    const { uploadJson } = await import("./econome");
    await expect(uploadJson({ a: 1 })).rejects.toThrow(
      /econome ingest failed: 401/,
    );
  });

  it("throws when the api key is missing", async () => {
    process.env.ECONOME_API_KEY = "";
    const { uploadJson } = await import("./econome");
    await expect(uploadJson({ a: 1 })).rejects.toThrow(/ECONOME_API_KEY/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/Documents/GitHub/adland && pnpm --filter api test`
Expected: FAIL — cannot resolve `./econome`.

- [ ] **Step 3: Write the implementation**

`apps/api/src/services/econome.ts`:

```ts
const DEFAULT_API_URL = "https://ipfs-api.econome.studio";
const DEFAULT_TAGS = ["adland"];

/**
 * Pin a JSON document to the econome IPFS cluster.
 *
 * econome exposes no JSON-pinning endpoint — `POST /ingest` is multipart-only —
 * so the document is wrapped as a file part. Tags drive econome's opt-in
 * replication: participants subscribed to a tag replicate content carrying it.
 */
export async function uploadJson(
  doc: unknown,
  tags: string[] = DEFAULT_TAGS,
): Promise<{ cid: string }> {
  const apiKey = process.env.ECONOME_API_KEY;
  if (!apiKey) throw new Error("ECONOME_API_KEY is not set");

  const apiUrl = (process.env.ECONOME_API_URL || DEFAULT_API_URL).replace(
    /\/$/,
    "",
  );

  const form = new FormData();
  form.append(
    "file",
    new Blob([JSON.stringify(doc)], { type: "application/json" }),
    "metadata.json",
  );
  form.append("tags", tags.join(","));

  const res = await fetch(`${apiUrl}/ingest`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`econome ingest failed: ${res.status} ${detail}`);
  }

  const { cid } = (await res.json()) as { cid: string };
  if (!cid) throw new Error("econome ingest returned no cid");

  return { cid };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter api test`
Expected: PASS — 4 tests.

- [ ] **Step 5: Rewrite the `/ipfs/upload` handler in `src/index.ts`**

Add the import at the top:

```ts
import { uploadJson } from "./services/econome";
```

Replace the handler body:

```ts
app.post("/ipfs/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { cid } = await uploadJson(body);
    return c.json({ cid, uri: `ipfs://${cid}` });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return c.json({ error: "IPFS upload failed" }, 500);
  }
});
```

The response contract (`{cid, uri}`) is unchanged, so existing consumers keep working.

- [ ] **Step 6: Update `.env.example`**

Replace the `PINATA_JWT` line and add the previously-undocumented `CHAIN_ID`:

```
# Chain
ALCHEMY_KEY=
CHAIN_ID=8453

# Database (Railway)
DATABASE_URL=

# Farcaster
FARCASTER_API_KEY=
NEYNAR_API_KEY=

# econome IPFS — key is minted in the econome dashboard, there is no API for it
ECONOME_API_URL=https://ipfs-api.econome.studio
ECONOME_GATEWAY_URL=https://ipfs-gateway.econome.studio
ECONOME_API_KEY=
```

- [ ] **Step 7: Verify a real round-trip against econome**

Requires a real `eco_…` key in `apps/api/.env` (see Prerequisites in the spec). If no key is available yet, skip this step and record it as pending.

```bash
cd ~/Documents/GitHub/adland
pnpm --filter api dev &
sleep 3
CID=$(curl -s -X POST http://localhost:3069/ipfs/upload \
  -H 'content-type: application/json' \
  -d '{"type":"link","url":"https://example.com","title":"round-trip test"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["cid"])')
echo "cid: $CID"
curl -s "https://ipfs-gateway.econome.studio/ipfs/$CID"
kill %1
```

Expected: the gateway returns the exact JSON that was uploaded.

- [ ] **Step 8: Commit**

```bash
pnpm check:fix
git add -A
git commit -m "feat(api): replace Pinata with econome-ipfs for uploads"
```

---

### Task 7: Analytics and tracking tests

The analytics aggregation and the `/track` domain-resolution logic are the only non-trivial business logic in the API, and neither has ever had a test. Cover them against a throwaway Postgres before the API is deployed from a new repo.

**Files:**
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/test/db.ts`
- Test: `apps/api/src/routes/analytics.test.ts`

**Interfaces:**
- Consumes: `apps/api/src/db/schema.ts` (`events`, `domains`), `apps/api/src/routes/analytics.ts` (default export, a Hono router)
- Produces: `startTestDb(): Promise<{ db, stop(): Promise<void> }>` — boots a disposable Postgres on port 55432, applies `drizzle/`, and returns a drizzle handle plus a teardown function.

- [ ] **Step 1: Write the vitest config**

`apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
```

- [ ] **Step 2: Write the test database helper**

`apps/api/src/test/db.ts`:

```ts
import { execSync } from "node:child_process";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../db/schema";

const CONTAINER = "adland-test-pg";
const URL = "postgres://postgres:postgres@localhost:55432/postgres";

/**
 * Boot a disposable Postgres in Docker, apply the drizzle migrations, and
 * return a client. Never points at the Railway database.
 */
export async function startTestDb() {
  execSync(`docker rm -f ${CONTAINER} 2>/dev/null || true`, { stdio: "ignore" });
  execSync(
    `docker run -d --name ${CONTAINER} -e POSTGRES_PASSWORD=postgres ` +
      `-p 55432:5432 postgres:16-alpine`,
    { stdio: "ignore" },
  );

  // Wait for readiness rather than sleeping a fixed amount.
  for (let i = 0; i < 60; i++) {
    try {
      execSync(`docker exec ${CONTAINER} pg_isready -U postgres`, {
        stdio: "ignore",
      });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const sql = postgres(URL, { max: 1 });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  return {
    db,
    async stop() {
      await sql.end();
      execSync(`docker rm -f ${CONTAINER}`, { stdio: "ignore" });
    },
  };
}
```

- [ ] **Step 3: Write the failing test**

`apps/api/src/routes/analytics.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { domains, events } from "../db/schema";
import { startTestDb } from "../test/db";

let ctx: Awaited<ReturnType<typeof startTestDb>>;

beforeAll(async () => {
  ctx = await startTestDb();

  await ctx.db.insert(domains).values([
    { domain: "example.com", isMiniapp: false, lastUpdatedAt: new Date() },
    { domain: "localhost:3000", isMiniapp: false, lastUpdatedAt: new Date() },
  ]);

  await ctx.db.insert(events).values([
    { type: "view", authType: "none", domain: "example.com", slotAddress: "0xslot", cid: "bafy1" },
    { type: "view", authType: "farcaster", domain: "example.com", slotAddress: "0xslot", cid: "bafy1" },
    { type: "click", authType: "none", domain: "example.com", slotAddress: "0xslot", cid: "bafy1" },
    { type: "view", authType: "none", domain: "localhost:3000", slotAddress: "0xslot", cid: "bafy1" },
  ]);
});

afterAll(async () => {
  await ctx.stop();
});

describe("migrations", () => {
  it("applies cleanly against an empty database", async () => {
    const rows = await ctx.db.select().from(domains);
    expect(rows).toHaveLength(2);
  });
});

describe("analytics aggregation", () => {
  it("counts views and clicks for a slot, excluding dev traffic", async () => {
    const rows = await ctx.db.select().from(events);
    const real = rows.filter((r) => !r.domain?.startsWith("localhost"));

    expect(real.filter((r) => r.type === "view")).toHaveLength(2);
    expect(real.filter((r) => r.type === "click")).toHaveLength(1);
  });

  it("records the farcaster auth type when present", async () => {
    const rows = await ctx.db.select().from(events);
    expect(rows.filter((r) => r.authType === "farcaster")).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd ~/Documents/GitHub/adland && pnpm --filter api test`
Expected: FAIL — cannot resolve `../test/db` until Step 2's file is saved; if it is, the failure is the missing `drizzle-orm/postgres-js/migrator` import path or a Docker error. Docker must be running.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter api test`
Expected: PASS — 3 tests plus the 4 econome tests from Task 6.

This is also the **migration verification gate**: `migrate()` succeeding against an empty database proves the copied `drizzle/` folder applies cleanly.

- [ ] **Step 6: Commit**

```bash
pnpm check:fix
git add -A
git commit -m "test(api): cover migrations and analytics aggregation"
```

---

## Phase 4 — CI and first release

### Task 8: Workflows, changesets, and the first publish

**Files:**
- Create: `.github/workflows/publish.yml`
- Create: `.github/workflows/db-migrate.yml`
- Create: `.changeset/initial-adland-split.md`

**Interfaces:**
- Consumes: all prior tasks
- Produces: `@adland/data@0.16.0` and `@adland/react@0.17.0` published to npm. Task 12 in `0xSlots` depends on these existing.

- [ ] **Step 1: Write the publish workflow**

`.github/workflows/publish.yml`:

```yaml
name: Publish

on:
  push:
    branches: [main]
    paths:
      - "packages/**"
      - ".changeset/**"
      - "package.json"
      - "pnpm-lock.yaml"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm build --filter=@adland/data --filter=@adland/react
      - run: pnpm test
      - uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version-packages
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 2: Write the db-migrate workflow**

The trigger is widened from the original: `0xSlots`' version fired only on `apps/api/drizzle/**`, so editing the schema without generating a migration silently deployed nothing. This version watches both paths and fails when the schema and migrations have drifted.

`.github/workflows/db-migrate.yml`:

```yaml
name: DB Migrate

on:
  push:
    branches: [main]
    paths:
      - "apps/api/drizzle/**"
      - "apps/api/src/db/schema.ts"
  workflow_dispatch:

concurrency:
  group: db-migrate
  cancel-in-progress: false

jobs:
  migrate:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
        working-directory: .

      - name: Fail if schema has ungenerated migrations
        run: |
          pnpm db:generate
          if ! git diff --quiet -- drizzle/; then
            echo "::error::schema.ts changed without a generated migration."
            git diff --stat -- drizzle/
            exit 1
          fi
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

- [ ] **Step 3: Add the GitHub secrets**

```bash
cd ~/Documents/GitHub/adland
gh secret set NPM_TOKEN
gh secret set DATABASE_URL   # the existing Railway connection string
```

Expected: `gh` prompts for each value and confirms. The `DATABASE_URL` is the same one `0xSlots` uses today — copy it from that repo's secrets or from Railway.

- [ ] **Step 4: Write the changeset**

`.changeset/initial-adland-split.md`:

```markdown
---
"@adland/data": minor
"@adland/react": minor
---

Split out of the 0xSlots monorepo into a standalone repository.

**@adland/data**

- `Cast` is no longer re-exported from `@neynar/nodejs-sdk`; a locally-owned
  `Cast` type is exported instead. This fixes a phantom dependency that broke
  standalone installs.
- `decodeBase64Url` no longer uses Node's `Buffer`, so account-association
  parsing works in the browser.
- `adlandApiUrl` can be overridden with `NEXT_PUBLIC_ADLAND_API_URL`.

**@adland/react**

- **Breaking:** `@0xslots/sdk` is now a peer dependency. Consumers must install
  it directly. This prevents two copies of the SDK being linked into a bundle,
  which broke `SlotsChain` identity comparisons.
- IPFS metadata now resolves through the econome gateway
  (`https://ipfs-gateway.econome.studio`) instead of a Pinata dedicated gateway.
  Override with the new `gateway` prop on `<Ad>`. There is no fallback gateway.
- `fetchAdFromURI(uri, gateway?)` takes an optional second argument.
```

- [ ] **Step 5: Verify the full build and test suite locally**

```bash
cd ~/Documents/GitHub/adland
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

Expected: all workspaces build; all tests pass.

- [ ] **Step 6: Push and let the workflow publish**

```bash
git add -A
git commit -m "ci: add publish and db-migrate workflows"
git push
gh run watch
```

Expected: the Publish workflow opens a "chore: version packages" PR. Merge it, then watch the follow-up run publish both packages.

- [ ] **Step 7: Confirm the packages are live**

```bash
npm view @adland/data version
npm view @adland/react version
npm view @adland/react peerDependencies
```

Expected: `0.16.0`, `0.17.0`, and `@0xslots/sdk` listed under peer dependencies.

---

## Phase 5 — Web app

### Task 9: Scaffold `apps/web` with the landing page

**Files:**
- Create: `apps/web/**` (Next 16 app)
- Create: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`
- Create: `apps/web/src/constants.ts`

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: `APP_URL`, `alchemyKey` exported from `apps/web/src/constants.ts`, used by Task 10.

- [ ] **Step 1: Scaffold the Next app**

```bash
cd ~/Documents/GitHub/adland/apps
pnpm create next-app@latest web --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*" --use-pnpm --turbopack
```

Expected: `apps/web` is created. Answer any remaining prompts with the defaults.

- [ ] **Step 2: Set the package name and dev port**

In `apps/web/package.json`, set `"name": "web"`, `"private": true`, and change the dev script to `"dev": "next dev --port 3200"`.

- [ ] **Step 3: Write the constants module**

`apps/web/src/constants.ts`:

```ts
/** Public origin of this app. Drives the Farcaster manifest and OG image URLs. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200";

/** Alchemy key for wagmi transports. Public by necessity — it is client-side. */
export const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? "";
```

- [ ] **Step 4: Write the landing page**

`apps/web/src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="font-semibold text-4xl tracking-tight">Adland</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Onchain ad slots. Publishers rent space, advertisers place ads, and the
        metadata lives on IPFS.
      </p>
      <a
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        href="/app"
      >
        Open the app
      </a>
    </main>
  );
}
```

- [ ] **Step 5: Add a launch config so the Browser pane can run the app**

`.claude/launch.json` at the repo root:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "web", "dev"],
      "port": 3200
    }
  ]
}
```

- [ ] **Step 6: Verify it renders**

Start it with `preview_start` (`{name: "web"}`), load `/`, and read the console.

Expected: the heading renders, no console errors.

- [ ] **Step 7: Commit**

```bash
cd ~/Documents/GitHub/adland && pnpm check:fix
git add -A
git commit -m "feat(web): scaffold Next app with landing page"
```

---

### Task 10: Miniapp route group and Farcaster manifest

**Files:**
- Create: `apps/web/src/app/(miniapp)/layout.tsx`
- Create: `apps/web/src/app/(miniapp)/app/page.tsx`
- Create: `apps/web/src/app/.well-known/farcaster.json/route.ts`
- Create: `apps/web/src/context/farcaster.tsx` (ported)
- Create: `apps/web/src/config/wagmi-miniapp.ts` (ported)
- Create: `apps/web/src/lib/frame-metadata.ts` (ported)
- Create: `apps/web/src/app/api/og/route.tsx` (ported)

**Interfaces:**
- Consumes: `APP_URL`, `alchemyKey` from Task 9; `appChains`, `alchemyTransports` from `@adland/chains` (Task 2)
- Produces: a miniapp mounted at `/app` with `FarcasterProvider` and a wagmi config; a manifest at `/.well-known/farcaster.json`.

- [ ] **Step 1: Install the miniapp dependencies**

```bash
cd ~/Documents/GitHub/adland
pnpm --filter web add @adland/chains@workspace:* @farcaster/miniapp-sdk \
  @farcaster/miniapp-wagmi-connector wagmi viem @tanstack/react-query
```

- [ ] **Step 2: Port the Farcaster context verbatim**

```bash
SRC=~/Documents/GitHub/0xSlots
mkdir -p apps/web/src/context apps/web/src/config apps/web/src/lib
cp $SRC/apps/landing/src/context/farcaster.tsx apps/web/src/context/farcaster.tsx
cp $SRC/apps/landing/src/lib/frame-metadata.ts apps/web/src/lib/frame-metadata.ts
mkdir -p apps/web/src/app/api/og
cp $SRC/apps/landing/src/app/api/og/route.tsx apps/web/src/app/api/og/route.tsx
```

`farcaster.tsx` needs no edits — it imports only from `@farcaster/miniapp-sdk` and `react`.

Open `frame-metadata.ts` and `api/og/route.tsx` and repoint any `@/constants` imports at the new `APP_URL`, and replace 0xSlots branding strings with Adland equivalents.

- [ ] **Step 3: Write the wagmi miniapp config**

The ported version differs from landing's only in importing from `@adland/chains` instead of `@0xslots/config`.

`apps/web/src/config/wagmi-miniapp.ts`:

```ts
import { alchemyTransports, appChains } from "@adland/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig } from "wagmi";
import { alchemyKey } from "@/constants";

const transports = alchemyTransports(
  appChains.map((c) => c.id),
  alchemyKey,
);

export const miniAppConfig = createConfig({
  chains: appChains,
  connectors: [farcasterMiniApp()],
  transports,
  ssr: false,
});
```

- [ ] **Step 4: Write the miniapp route-group layout**

The route group `(miniapp)` adds no URL segment — it exists so the miniapp gets its own providers without wrapping the landing page in them.

`apps/web/src/app/(miniapp)/layout.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { miniAppConfig } from "@/config/wagmi-miniapp";
import { FarcasterProvider } from "@/context/farcaster";

export default function MiniappLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={miniAppConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>{children}</FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

- [ ] **Step 5: Write the miniapp entry page**

`apps/web/src/app/(miniapp)/app/page.tsx`:

```tsx
"use client";

import { useFarcaster } from "@/context/farcaster";

export default function MiniappHome() {
  const { isMiniApp, isReady, user } = useFarcaster();

  if (!isReady) {
    return <main className="p-6 text-sm text-neutral-500">Loading…</main>;
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-6">
      <h1 className="font-semibold text-2xl tracking-tight">Adland</h1>
      <p className="text-neutral-600 text-sm dark:text-neutral-400">
        {isMiniApp
          ? `Running inside a Farcaster client${user ? ` as @${user.username}` : ""}.`
          : "Running on the web. Open this in a Farcaster client for the full experience."}
      </p>
    </main>
  );
}
```

- [ ] **Step 6: Write the Farcaster manifest**

The `accountAssociation` from `0xSlots` **cannot be reused** — it is signed for `app.0xslots.org`. It ships empty with a TODO until a new one is signed for the adland domain.

`apps/web/src/app/.well-known/farcaster.json/route.ts`:

```ts
import { NextResponse } from "next/server";
import { APP_URL } from "@/constants";

/**
 * Farcaster miniapp manifest.
 *
 * TODO: `accountAssociation` must be signed for this app's production domain at
 * https://farcaster.xyz/~/developers/mini-apps/manifest and pasted in below.
 * The 0xSlots association cannot be reused — a JFS signature is domain-bound.
 *
 * `homeUrl` points at /app, the miniapp entry inside the (miniapp) route group.
 */
export function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "Adland",
      iconUrl: `${APP_URL}/logo.png`,
      homeUrl: `${APP_URL}/app`,
      imageUrl: `${APP_URL}/api/og`,
      buttonTitle: "Open",
      splashImageUrl: `${APP_URL}/logo.png`,
      splashBackgroundColor: "#ffffff",
      description: "Onchain ad slots",
    },
  });
}
```

- [ ] **Step 7: Verify in the browser**

With the dev server running, check all three surfaces:

```bash
curl -s http://localhost:3200/.well-known/farcaster.json | python3 -m json.tool
```

Expected: valid JSON with `miniapp.homeUrl` ending in `/app`.

Then load `/app` in the Browser pane and read the console.

Expected: the page renders "Running on the web…", and there are no console errors. `/` still renders the landing page without wagmi providers mounted.

- [ ] **Step 8: Commit**

```bash
cd ~/Documents/GitHub/adland && pnpm check:fix
git add -A
git commit -m "feat(web): add miniapp route group, farcaster manifest and providers"
```

---

## Phase 6 — Deploy

### Task 11: Dockerfiles and Dokploy

**Files:**
- Create: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore`
- Modify: `apps/web/next.config.ts` (standalone output)

**Interfaces:**
- Consumes: all prior tasks
- Produces: two running Dokploy services.

- [ ] **Step 1: Write `.dockerignore` at the repo root**

```
node_modules
**/node_modules
**/dist
**/.next
**/.turbo
.git
.env
.env.local
```

- [ ] **Step 2: Write the API Dockerfile**

`apps/api/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=api

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
WORKDIR /app/apps/api
EXPOSE 3069
CMD ["node", "dist/index.js"]
```

- [ ] **Step 3: Enable standalone output for the web app**

In `apps/web/next.config.ts`, add `output: "standalone"` to the config object.

- [ ] **Step 4: Write the web Dockerfile**

`apps/web/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=web

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 5: Verify both images build locally**

```bash
cd ~/Documents/GitHub/adland
docker build -f apps/api/Dockerfile -t adland-api .
docker build -f apps/web/Dockerfile -t adland-web .
```

Expected: both builds succeed.

- [ ] **Step 6: Confirm the API container can reach Railway Postgres**

This is the one infrastructure assumption worth proving before cutover — the API moves to Dokploy while the database stays on Railway, so it now crosses a network boundary it did not before.

```bash
docker run --rm -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  -e ECONOME_API_KEY=placeholder -p 3069:3069 adland-api &
sleep 5
curl -s http://localhost:3069/analytics/domains | head -c 200
docker stop $(docker ps -q --filter ancestor=adland-api)
```

Expected: the endpoint returns the real domains array from Railway, not a connection error.

- [ ] **Step 7: Create the Dokploy services**

Create two applications in Dokploy pointed at the `nezz0746/adland` GitHub repo, using the Dockerfiles above. Set env vars from `apps/api/.env.example` — including the real `ECONOME_API_KEY` and the Railway `DATABASE_URL` — and attach a domain to each.

Then set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_ADLAND_API_URL` on the web service to the assigned domains, and redeploy.

- [ ] **Step 8: Verify the deployments**

```bash
curl -s https://<api-domain>/ | python3 -m json.tool
curl -s https://<web-domain>/.well-known/farcaster.json | python3 -m json.tool
```

Expected: the API returns its hello payload; the manifest reports the production `homeUrl`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: add Dockerfiles for Dokploy deployment"
git push
```

---

## Phase 7 — 0xSlots cleanup

### Task 12: Switch `0xSlots` to the published packages and delete the moved code

**Only start this task once `npm view @adland/react version` reports the new release.** Everything here happens in `$SRC`, not the adland repo.

**Files:**
- Modify: `$SRC/apps/landing/package.json`
- Modify: `$SRC/apps/landing/src/app/api/ipfs/route.ts`
- Modify: `$SRC/package.json`, `$SRC/.changeset/config.json`, `$SRC/.github/workflows/publish.yml`
- Delete: `$SRC/apps/api/`, `$SRC/packages/adland-data/`, `$SRC/packages/adland-react/`, `$SRC/.github/workflows/db-migrate.yml`

**Interfaces:**
- Consumes: `@adland/data@^0.16.0`, `@adland/react@^0.17.0` from npm (Task 8)
- Produces: a `0xSlots` repo that builds with no adland source in it.

- [ ] **Step 1: Branch**

```bash
cd ~/Documents/GitHub/0xSlots
git checkout main && git pull
git checkout -b chore/remove-adland
```

- [ ] **Step 2: Switch landing to the published packages**

In `$SRC/apps/landing/package.json`, change both entries from `workspace:*`:

```json
    "@adland/data": "^0.16.0",
    "@adland/react": "^0.17.0",
```

`@0xslots/sdk` stays `workspace:*` — with the peer-dependency change from Task 4, that is now the single SDK copy in landing's tree.

- [ ] **Step 3: Repoint landing's IPFS gateway to econome**

In `$SRC/apps/landing/src/app/api/ipfs/route.ts`, replace the gateway constant:

```ts
const IPFS_GATEWAY = "https://ipfs-gateway.econome.studio";
```

and update its use site to build `${IPFS_GATEWAY}/ipfs/${cid}`. Bump the `CACHE_VERSION` constant in the same file so the `unstable_cache` entries keyed to the old gateway are invalidated.

- [ ] **Step 4: Clean up the root manifest**

In `$SRC/package.json`:
- Remove the `build:adland`, `start:adland`, and `dev:api` scripts (they reference workspaces that will no longer exist).
- Change `release` to drop the adland filters:

```json
    "release": "turbo build --filter=@0xslots/contracts --filter=@0xslots/sdk && changeset publish"
```

In `$SRC/.changeset/config.json`, remove `"api"` from the `ignore` array.

In `$SRC/.github/workflows/publish.yml`, remove `--filter=@adland/data --filter=@adland/react` from the build step.

- [ ] **Step 5: Delete the moved code**

```bash
cd ~/Documents/GitHub/0xSlots
git rm -r apps/api packages/adland-data packages/adland-react
git rm .github/workflows/db-migrate.yml
pnpm install
```

- [ ] **Step 6: Verify nothing else referenced them**

```bash
grep -rn "adland-data\|adland-react\|apps/api" --include="*.ts" --include="*.tsx" \
  --include="*.json" --include="*.yml" apps packages .github package.json turbo.json \
  | grep -v node_modules || echo "clean"
```

Expected: `clean`, or only `@adland/data` / `@adland/react` npm-package imports in `apps/landing` (those are correct).

- [ ] **Step 7: Verify the build still passes**

```bash
pnpm build
pnpm check
```

Expected: all remaining workspaces build. `apps/landing` compiles against the npm packages.

- [ ] **Step 8: Verify landing renders ads through the econome gateway**

Start landing in the Browser pane and load a slot page that has an ad. Check `read_network_requests` for a request to `ipfs-gateway.econome.studio` and confirm it returns 200.

Expected: the ad renders, and no request goes to any `pinata.cloud` host.

- [ ] **Step 9: Commit and open the PR**

```bash
git add -A
git commit -m "chore: remove adland code, consume @adland/* from npm"
git push -u origin chore/remove-adland
gh pr create --title "chore: remove adland code, consume @adland/* from npm" \
  --body "Adland now lives at nezz0746/adland. Landing consumes @adland/data and @adland/react from npm, and IPFS reads go through the econome gateway.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Post-migration manual prerequisites

These cannot be automated and are tracked here so they are not lost:

- [ ] **Mint an econome API key.** econome has no HTTP route that creates one — use the dashboard's API Keys page, then set `ECONOME_API_KEY` in Dokploy. Blocks Task 6 Step 7 and all production uploads.
- [ ] **Sign a Farcaster account association** for the adland production domain at https://farcaster.xyz/~/developers/mini-apps/manifest and paste it into `apps/web/src/app/.well-known/farcaster.json/route.ts`. Until then the miniapp cannot be verified by Farcaster clients.
- [ ] **Replace the placeholder API domain.** Once Task 11 assigns real Dokploy domains, update `PRODUCTION_API_URL` in `packages/data/src/constants.ts` and the matching assertion in `constants.test.ts` — both currently say `https://api.adland.xyz`, which is a guess. Then cut a patch release of `@adland/data`.
- [ ] **Confirm CID replication.** Before landing switches gateways (Task 12 Step 3), verify that existing ad CIDs resolve on `https://ipfs-gateway.econome.studio`. There is no fallback by design, so an unreplicated CID renders as an ad error.
- [ ] **Migrate Postgres from Railway to Dokploy** — deliberately deferred to a later cycle.
