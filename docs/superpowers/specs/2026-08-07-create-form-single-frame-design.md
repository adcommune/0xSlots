# Slot creation form: single scrollable frame, WETH, token logos

**Date:** 2026-08-07
**Status:** Approved, ready for planning
**Scope:** `apps/landing/src/app/create/*`, `packages/sdk/src/tokens.ts`, `apps/landing/public/tokens/*`

## Problem

The create form is a three-step wizard. `step` state in
`apps/landing/src/app/create/page.tsx` swaps between `StepRecipient`,
`StepParameters` and `StepExtra`, with a numbered indicator and Back/Next
buttons. Two thirds of the form is hidden at any moment, and nothing about
slot creation is actually sequential — no step depends on a previous step's
answer, and the whole thing submits in one transaction.

Separately, the currency select offers only USDC (plus a testnet faucet
token on Base Sepolia), and renders tokens as bare text.

## Goals

1. One frame, scrolled top to bottom, divided into clearly-headed sections
   with an icon each.
2. WETH available alongside USDC on Base and Base Sepolia.
3. Real token logos in the currency select.

## Non-goals

- No change to what gets submitted on chain. The same
  `createSlot` / `createSlotWithTenure` / `createSlotWithPriceFloor` /
  `createSlots` calls with the same arguments.
- No change to the zod schema in `schema.ts`. Field names, validation rules
  and defaults are untouched.
- No new currencies beyond WETH. No token search, no arbitrary token list.

---

## 1. Tokens

### WETH addresses

`WETH` on both target chains is the OP-stack predeploy at
**`0x4200000000000000000000000000000000000006`** — the same address on Base
and Base Sepolia. Verified by `eth_call` against `https://mainnet.base.org`
and `https://sepolia.base.org`:

| selector | returns |
| --- | --- |
| `symbol()` `0x95d89b41` | `WETH` |
| `decimals()` `0x313ce567` | `18` |
| `name()` `0x06fdde03` | `Wrapped Ether` |

### Resulting `CHAIN_TOKENS`

WETH is appended last on each chain, so `getDefaultToken` — which returns
`[0]` — keeps returning what it returns today. An untouched form still
creates exactly the slot it creates today.

| chain | order | name | symbol | address | decimals |
| --- | --- | --- | --- | --- | --- |
| Base | 1 | USD Coin | USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| Base | 2 | Wrapped Ether | WETH | `0x4200000000000000000000000000000000000006` | 18 |
| Base Sepolia | 1 | Feed USDC (faucet) | USDCf | `0xFA28A416810e39a7142C7557e6e43407d765f627` | 6 |
| Base Sepolia | 2 | USD Coin | USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6 |
| Base Sepolia | 3 | Wrapped Ether | WETH | `0x4200000000000000000000000000000000000006` | 18 |

WETH on Base Sepolia is deliberately included despite having no faucet: it
is the canonical predeploy, and wrapping testnet ETH at it is a one-call
operation. Leaving it out would make the two chains' currency lists differ
for no structural reason.

### Decimals are already handled

WETH is the first 18-decimal currency the form has offered, which makes the
existing decimals plumbing load-bearing rather than theoretical. It is
already correct: `page.tsx` derives `currencyDecimals` from the selected
preset token (or from `useErc20Check` for a custom address) and feeds it to
`toRawUnits` for the price floor. `MinimumPricePolicy` lives at a CREATE2
address derived from `(currency, minPrice)` and reverts `WrongCurrency` on a
mismatched pairing, so an error here would surface as a failed transaction,
not a silently wrong slot. No change needed — but this path must be
exercised during verification.

### `TokenInfo.logo`

Add an optional `logo?: string` to `TokenInfo`. It holds a **slug**
(`"usdc"`, `"weth"`), not a URL and not a path.

`@0xslots/sdk` is published to npm and consumed by more than the landing
app. A `logoURI` pointing at `/tokens/usdc.svg` would encode one consumer's
Next.js `public/` layout into shared data; pointing it at a CDN would put a
network dependency and a third-party host into the SDK. A slug names the
asset and lets each consumer decide where that asset lives.

---

## 2. Logo assets

`apps/landing/public/tokens/usdc.svg` and `weth.svg`, committed to the repo.

**Source:** the `cryptocurrency-icons` set (CC0). Chosen over Trust Wallet's
per-address PNGs on two grounds:

- **Size and sharpness.** ~2 KB of SVG total against ~30 KB of 256×256 PNG,
  and vectors stay crisp at the ~20 px a select row gives them.
- **The WETH mark specifically.** Trust Wallet's Base WETH asset is the
  weth.io pink-and-black wordmark, which is illegible at 20 px and clashes
  with a flat circular USDC mark beside it. The ETH diamond is what DEX
  interfaces conventionally show for WETH and reads correctly at that size.

Assets are vendored rather than hotlinked: no runtime request, no external
host in the render path, works offline in development.

### `components/token-logo.tsx`

```
<TokenLogo slug={token.logo} symbol={token.symbol} className="size-5" />
```

Renders `/tokens/${slug}.svg` when `slug` is set. Otherwise — custom ERC-20
addresses, and any future token added without an asset — renders a monogram
fallback: a muted circle carrying the first letter of the symbol, or a
neutral glyph when even the symbol is unknown. The select must never render
a broken image or a blank gap where a logo should be.

Uses a plain `<img>` rather than `next/image`. These are fixed-size local
SVGs; the optimizer has nothing to do, and `ens-identity.tsx` already made
the same call for avatars.

### Rendering in the select

`SelectItem` already ships `[&_svg:not([class*='size-'])]:size-4` and
`*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`, and
`SelectTrigger` ships `*:data-[slot=select-value]:flex ... gap-2` — the
layout for an icon beside a label exists. Radix clones the selected item's
`ItemText` into the trigger, so the logo appears in the closed trigger and
the open list from one definition.

Row content: logo, then `USD Coin (USDC)`, then the truncated address in
muted small text. The `Custom address` row uses the monogram fallback so
every row has a consistent left edge.

---

## 3. Form structure

### Removed

From `page.tsx`: the `STEPS` constant, `step` state, the step-number card
header, the numbered step indicator, and the Back/Next navigation block.

### Sections

One card containing six sections in fixed order, each separated by a top
border rather than the current mix of `<Separator />` elements and bare
`<div>`s.

| # | Section | Icon | Anchor | Content |
| --- | --- | --- | --- | --- |
| 1 | Recipient | `Users` | `#recipient` | account vs group, split recipients, distributor fee |
| 2 | Currency | `Coins` | `#currency` | preset select with logos, custom ERC-20 address |
| 3 | Tax & deposit | `HandCoins` | `#economics` | tax rate slider + hint, min deposit time |
| 4 | Module | `Puzzle` | `#module` | none / verified / custom module |
| 5 | Occupancy | `ShieldCheck` | `#occupancy` | policy mode, tenure, price floor |
| 6 | Permissions & bounty | `KeyRound` | `#permissions` | mutability flags, manager, liquidation bounty |

Grouping rationale: sections 3 and 6 each bundle two fields that answer one
question. Tax rate and min deposit are both *what the occupant pays*.
Mutability and liquidation bounty are both *what can happen after
creation*. Eight one-field sections would put more header chrome on the page
than content.

Icon colour follows the convention the form already uses — `ShieldCheck` in
violet (`occupancy-section.tsx`), `Sparkles` in amber (`step-extra.tsx`) —
extended so all six sections carry a distinct tint.

### `components/form-section.tsx`

```
<FormSection id icon title description>{children}</FormSection>
```

Renders a `<section>` with `scroll-mt` for anchored jumps, a header with the
icon in a tinted rounded square beside the title, a one-line muted
description, and the fields below. Presentational only — no form state.

### File moves

| from | to |
| --- | --- |
| `components/step-recipient.tsx` | `components/section-recipient.tsx` |
| `components/step-parameters.tsx` | splits into `section-currency.tsx`, `section-economics.tsx`, `section-module.tsx` |
| `components/step-extra.tsx` | `components/section-permissions.tsx` |
| — | `components/form-section.tsx` (new) |

`occupancy-section.tsx` keeps its name and its logic; its internal
`<p>Occupancy</p>` heading and description paragraph are removed, because
`FormSection` now carries them. Its `<div className="space-y-4">` wrapper
goes with them.

`step-parameters.tsx` is the only real split — currency, economics and
module are three unrelated concerns that shared a file only because they
shared a wizard step. Each resulting file lands well under 150 lines.

`TaxRateHint` moves with the tax slider into `section-economics.tsx`.
`SplitTotal` moves with the split fields into `section-recipient.tsx`.

---

## 4. Submit path

**Desktop.** `SummaryCard` stays where it is: sticky, right-hand, holding
the Create button. Unchanged except for the jump links below.

**Mobile.** `MobileBottomBar` drops its `step` prop. Its `ready` flag —
today `step === 3`, which decided whether the Finalize trigger renders as a
filled emerald button or an outline — becomes `submitState.isFormValid`. The
prop is removed from the interface and from the call site in `page.tsx`.

### Summary rows as jump links

Each summary row (Recipient, Currency, Tax Rate, Min Deposit, occupancy
rows, Liq. Bounty) becomes a button that smooth-scrolls to its section
anchor. This gives the long page a table of contents without adding a third
column, reusing furniture already on screen. Rows keep their current
appearance; only a hover affordance is added.

Applies to `SummaryCard` on desktop. In `MobileBottomBar` the same rows sit
inside a drawer, so a jump must also close the drawer before scrolling —
otherwise the sheet covers the destination.

### Validation surfacing

The wizard implicitly gated attention: you could not reach step 3 without
passing through steps 1 and 2, so a disabled Create button was always
self-explanatory. On a single page a user can scroll past an invalid field,
reach the button, and find it dead with no indication why.

Above the disabled Create button, render the sections that currently hold
errors as a short list of clickable section names, under a count — e.g.
*"2 sections need attention"* followed by `Recipient` and `Currency` as
buttons. Clicking one scrolls to it via the same anchor mechanism as the
summary rows. Derived from `form.formState.errors` through a static map from
schema field name to owning section. Renders nothing when the form is valid.

This is the one behavioural addition in the change. It exists to replace a
guarantee the wizard was providing for free.

---

## 5. Risks

| Risk | Handling |
| --- | --- |
| WETH's 18 decimals mis-handled in the price floor | Path already exists and is correct; must be exercised in verification with WETH selected |
| Radix does not mirror the logo into the trigger | Verified by inspection of `select.tsx`; `ItemText` cloning is the documented behaviour. Confirm visually |
| A user scrolls past a broken field | Error summary above the submit button, section-linked |
| The drawer covers the destination of a jump on mobile | Close the drawer before scrolling |
| Section anchors land under the sticky page header | `scroll-mt` on each `<section>` |

## 6. Verification

- Create a slot on Base Sepolia with the default currency — unchanged
  behaviour, confirms nothing regressed.
- Select WETH and create with a **price floor** policy — the 18-decimal
  path, the one place decimals actually matter.
- Custom ERC-20 address — monogram fallback renders, no broken image.
- Group recipient with a split — the longest section, still complete.
- Invalid form — error summary appears, naming sections; clicking one
  scrolls there. Valid form — summary disappears, button enables.
- Mobile: drawer opens, jump link closes it and scrolls, Finalize highlights
  on validity rather than on reaching a step.
- Both light and dark themes for the icon tints and the logo marks.
- `pnpm check` and `pnpm lint` clean.
