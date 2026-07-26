# @0xslots/api

A small Hono server exposing the slots-protocol surface that stayed in this
repo after the adland functionality moved to its own repo (`adland.space` /
`api.adland.space`). This service no longer serves any adland routes
(`/ipfs/upload`, `/analytics/*`, etc.) — only slots concerns.

## Routes

- `GET /` — health/identity check, returns `{ "message": "0xSlots API" }`.
- `GET /ad/slot/:slotAddress` — looks up the slot's metadata via the subgraph
  client, fetches the ad content from its URI (resolving `ipfs://` through
  the econome IPFS gateway), and returns the parsed ad JSON. Returns 404 with
  `{ "error": "NO_AD" }` if the slot has no ad set, or 500 with
  `{ "error": "ERROR" }` on failure.

## Environment variables

See `.env.example` for the full list.

- `ALCHEMY_KEY` — Alchemy RPC key. Currently only used by the on-chain event
  listener (`src/services/events.ts`), whose invocation is commented out in
  `src/index.ts`.
- `CHAIN_ID` — chain ID for the event listener (default: `8453`, Base
  mainnet). Same caveat as above — unused while the listener stays disabled.

## Running locally

```
pnpm install
pnpm --filter api dev
```

The server listens on `http://localhost:3069`.

To build and run the production bundle:

```
pnpm --filter api build
pnpm --filter api start
```
