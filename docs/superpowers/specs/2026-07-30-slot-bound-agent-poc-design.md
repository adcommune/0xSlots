# Slot-Bound Agent — POC Design

**Date:** 2026-07-30
**Status:** Design — pending review
**Scope:** Thin end-to-end proof of concept. Prove the whole flow works and feels worth pursuing, not production hardening.

## One-line concept

A single NFT whose owner *is* the current occupant of its backing slot. While you occupy it, you can talk to an agent that holds the NFT's accumulated memory. The agent decides, on its own judgment, when a piece of the conversation is worth remembering. Each remembered item is stored offchain in full and anchored onchain as an EAS attestation. The memory belongs to the NFT and evolves across occupants.

## Goal of this POC

Validate a **thin vertical slice of the entire loop**, each part shallow but visibly connected:

`occupy slot (existing app) → prove you're the owner → chat → agent replies seeded with the NFT's memory → agent decides to remember → full record pinned to IPFS + EAS attestation on Base Sepolia → memory feed updates → the next occupant inherits the evolved mind.`

If this feels compelling and the mechanics hold together, it's worth going deeper.

## Non-goals (explicitly out of scope for the POC)

- Building takeover / bidding / transaction UI (already exists in the app).
- A new NFT contract or slot module (not needed — see below).
- Multiple NFTs. The POC targets **one** token in one `ERC721Slots` collection.
- Production auth, rate limiting, key management, or gas sponsorship.
- Agent "values / core beliefs" evolution. Architected for, but **only `memory` is implemented now** (see Facet model).
- Session resets per occupant. Memory is bound to the NFT, not the occupant.

## Key decisions (settled during brainstorming)

1. **No new contract, no module.** `ERC721Slots.ownerOf(tokenId)` already returns `Slot(slot).occupant()` live (`apps/contracts/src/ERC721Slots.sol:172-181`), with transfers disabled. The read-through NFT already exists. The API reads ownership directly; there is nothing to deploy and no `ISlotsModule` callback needed.
2. **Memory belongs to the NFT, not the occupant.** One evolving mind per NFT. Occupancy gates *who may talk to it right now*; it does not reset or partition memory. The next occupant inherits everything.
3. **Gate = SIWE-style signature per message.** Caller signs the outgoing message with wagmi; the API recovers the signer and checks it equals `ERC721Slots.ownerOf(tokenId)`. Stateless, no sessions, no JWT.
4. **Onchain proof = EAS attestation; full record offchain.** When a memory is committed: full content → econome IPFS ingest endpoint (CID); EAS attestation on Base Sepolia references the CID; recipient of the attestation = the occupant at the time of the memory (occupant attribution).
5. **Target chain = Base Sepolia. Agent model = OpenAI** (user-provided `OPENAI_API_KEY`, e.g. `gpt-4o` / `gpt-4.1`). Not Claude.
6. **Agent runtime = Mastra.** A Mastra `Agent` with one tool (`saveFacet`) and the NFT's facets injected as context. The model is wired through Mastra's provider layer (`@ai-sdk/openai`) and kept intentionally minimal — we are **not** building on the Vercel AI SDK directly and **not** deploying to Vercel; the `@ai-sdk/openai` package is only the model adapter Mastra consumes. Mastra's own agent/memory primitives give room to grow into future facet types (values, beliefs) without re-architecting.

## Architecture

Everything new lives in `apps/api` (Hono) plus one small UI panel. Reused: the Slot/`ERC721Slots` contracts, subgraph/SDK, IPFS gateway, existing wallet/takeover flow in the app.

```
┌────────────────────────┐        ┌──────────────────────────────────────────┐
│  UI panel (wagmi)      │        │  apps/api (Hono)                           │
│  - connect + sign msg  │──────► │  POST /agent/:collection/:tokenId/message  │
│  - chat transcript     │        │    1. recover signer, check == ownerOf     │
│  - memory feed         │◄────── │    2. run agent (AI SDK + Claude)          │
└────────────────────────┘        │    3. agent may call saveFacet tool        │
                                   │  GET  /agent/:collection/:tokenId/memory   │
                                   │  POST /agent/:collection/:tokenId/secure   │
                                   └───────────────┬────────────────────────────┘
                                                   │
                     ┌─────────────────────────────┼───────────────────────────┐
                     ▼                             ▼                             ▼
             ┌───────────────┐          ┌────────────────────┐        ┌──────────────────┐
             │ FacetStore    │          │ econome IPFS ingest│        │ EAS (Base Sepolia)│
             │ (SQLite/JSON) │          │  → CID             │        │  → attestation UID│
             └───────────────┘          └────────────────────┘        └──────────────────┘
                     ▲                                                          │
                     └──────────── on-chain read: ERC721Slots.ownerOf ─────────┘
```

## Components

### 1. The gate (`verifyOccupant`)
A small helper. Input: `collection`, `tokenId`, `message`, `signature`, and a signed payload containing the message plus a freshness field (timestamp/nonce). Steps:
- Recover signer with viem `recoverMessageAddress`.
- Read `ERC721Slots(collection).ownerOf(tokenId)` on Base Sepolia.
- Reject if signer ≠ owner, or if owner is the collection contract itself (slot vacant), or if the payload is stale (freshness window, e.g. 5 min).

Replay protection for the POC is a freshness window only; a proper nonce store is a documented follow-up.

### 2. The agent (Mastra `Agent`, OpenAI model)
- Model: OpenAI via Mastra's provider layer (`@ai-sdk/openai`), configured minimally.
- Instructions assembled from the NFT's facets (see FacetStore). Facets are grouped by `type`; today only `memory` exists, injected as "Things you remember."
- One tool exposed to the model: **`saveFacet({ type, content, summary })`**. The model is instructed to call it *only when something genuinely worth remembering emerges*. For the POC the prompt restricts `type` to `"memory"`, but the tool signature already accepts other types so no door is closed.
- The agent is a persona bound to the NFT ("you are the mind of NFT #<id>"), aware it is talking to whoever currently occupies it.

### 3. FacetStore (the extensibility seam)
The single abstraction that keeps future agent "facets" open. A facet is one durable thing the agent chose to keep.

```ts
type FacetType = "memory"; // future: "value" | "belief" | ...

interface Facet {
  id: string;
  collection: string;      // ERC721Slots address
  tokenId: string;         // the NFT identity — memory key
  type: FacetType;
  content: string;         // full text the agent chose to keep
  summary: string;         // short label, used in attestation + feed
  cid: string | null;      // econome IPFS CID of the full record
  attestationUID: string | null; // EAS UID on Base Sepolia
  createdByOccupant: string;      // occupant address at time of memory
  createdAt: number;
}
```

Storage: SQLite (via `better-sqlite3`) or a JSON file for the POC — an implementation detail behind the `FacetStore` interface (`list(collection,tokenId)`, `add(facet)`, `allCids(collection,tokenId)`). Memory is keyed by `(collection, tokenId)` — never by occupant.

### 4. Persistence pipeline (runs when `saveFacet` is called)
1. Persist the full record to `FacetStore` (so chat continuity survives even if the next steps fail).
2. `POST` the full content to the **econome IPFS ingest endpoint** (`ECONOME_IPFS_INGEST_URL`, configurable) → `cid`. Read-back verified against the existing gateway `https://ipfs-gateway.econome.studio`.
3. Create an **EAS attestation** on Base Sepolia via the EAS SDK, using a pre-registered schema. Recipient = `createdByOccupant`.
4. Write `cid` and `attestationUID` back onto the stored facet.

Each step is best-effort and logged; a failure downstream degrades gracefully (the memory still exists offchain, and can be re-anchored via the secure endpoint).

**EAS schema (registered once, UID in env):**
`address collection, uint256 tokenId, address occupant, string facetType, string cid, string summary`
Attester = a server-held wallet with Base Sepolia ETH (`EAS_ATTESTER_PRIVATE_KEY`). The EAS `recipient` is set to the occupant, **and** the occupant address is stored explicitly in the `occupant` schema field so the account the agent formed the memory with is easily queryable.

### 5. Endpoints
- `POST /agent/:collection/:tokenId/message` — occupant-gated. Body: `{ message, signature, signedPayload }`. Runs the agent, returns `{ reply, savedFacets: Facet[] }`.
- `GET /agent/:collection/:tokenId/memory` — public read of the NFT's facets (powers the memory feed). Returns facets with CID + attestation links.
- `POST /agent/:collection/:tokenId/secure-pinset` — occupant-gated. Re-sends every facet CID for this NFT to the ingest endpoint to guarantee it stays pinned; returns the list. This is the "secure the memory pinset through an endpoint" mechanism.

### 6. UI panel
One minimal panel where the existing wallet/takeover flow already lives (wagmi). Not a redesign:
- If `ownerOf(tokenId) == connectedAddress`: show a chat box. On send, `signMessage` the payload, POST to `/message`, append reply.
- Always: a read-only **memory feed** from `/memory`, each item linking to its IPFS record and its EAS attestation on easscan.
- If not the occupant: feed is visible, chat is disabled with "occupy this slot to talk to it."

## Data flow (sequence)

1. User occupies the slot through the existing app → `ownerOf(tokenId)` now returns their address.
2. User types a message; wallet signs `{ message, tokenId, ts }`.
3. `/message` recovers signer, confirms `== ownerOf(tokenId)`.
4. Agent runs with the NFT's facets as context, replies.
5. If the agent judged something memorable, it called `saveFacet` → store → IPFS ingest → EAS attest (recipient = this occupant).
6. Memory feed refreshes; the new memory shows CID + attestation UID.
7. Later, a different occupant talks to the same NFT and the agent already "knows" the earlier memory — the mind evolved.

## Config / env (new)

- `OPENAI_API_KEY` — agent model (user-provided).
- `ECONOME_IPFS_INGEST_URL` — econome pinning ingest endpoint.
- `EAS_ATTESTER_PRIVATE_KEY` — server attester wallet (Base Sepolia, funded).
- `EAS_SCHEMA_UID` — pre-registered schema UID.
- `NFT_COLLECTION`, `NFT_TOKEN_ID` — the single NFT the POC targets (UI convenience; routes still take params).
- Reuses existing `CHAIN_ID` (default Base Sepolia `84532`), RPC config.

## Build vs. reuse

**Reuse:** `ERC721Slots` / `Slot` contracts, subgraph + `@0xslots/sdk`, IPFS gateway, existing wallet + takeover UI.
**New:** `verifyOccupant` helper, Mastra agent (`saveFacet` tool), `FacetStore`, IPFS-ingest + EAS clients, 3 Hono routes, one UI chat/memory panel, one-time EAS schema registration script.

## Open questions / follow-ups (documented, not blocking the POC)

- Replay protection beyond a freshness window (nonce store) — deferred.
- Who pays EAS gas long-term (server attester is fine for POC).
- Whether "vacant" NFTs should still be chattable read-only (POC: no chat when vacant).
- Future facet types (`value`, `belief`) and how they weight the system prompt — seam is in place, not built.

## Rough milestones

1. `verifyOccupant` + `/message` returning a plain OpenAI reply through Mastra (gate proven).
2. `FacetStore` + `saveFacet` tool (agent remembers, offchain only).
3. IPFS ingest + EAS attestation wired into the pipeline (onchain proof).
4. `/memory` + `/secure-pinset` + UI panel (visible loop).
