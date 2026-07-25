# vitrine

The 0xSlots marketing site. *Vitrine* — shop window.

Deliberately separate from [`apps/landing`](../landing), which despite its name
is the dApp (explorer, slot pages, create flow, Farcaster miniapp) and ships to
`app.0xslots.org`. This app is static, has no wallet, no wagmi and no subgraph,
so it can be built and deployed without touching that pipeline.

```bash
pnpm dev:vitrine     # http://localhost:3300
pnpm build:vitrine   # → dist/
```

Vite + React + Tailwind v4. shadcn/ui is configured (`components.json`) and its
tokens are bridged onto this palette in `src/index.css`, so `shadcn add <x>`
drops components in already wearing the right colours.

## Design notes

Everything derives from the 0xSlots mark: a parcel rotated onto its corner and
subdivided into cells that are either **occupied** (solid) or **vacant**
(hollow). That grammar recurs in the logo, the list markers, and the ambient
field behind the hero, whose cells turn over on a timer because the register
never settles.

Two accents carry meaning and should not be swapped:

| Token   | Means                                                |
| ------- | ---------------------------------------------------- |
| `claim` | price, contest, buyout, liquidation                  |
| `flow`  | tax leaving an occupant, revenue reaching a recipient |

`SlotInstrument` is the one interactive piece. Dragging the self-assessed price
recomputes tax and runway live, so the Harberger squeeze — priced low you get
sniped, priced high you burn your deposit — is something the reader feels
rather than reads. Its figures are illustrative, not onchain.
