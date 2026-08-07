# Single-Frame Create Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-step slot creation wizard with one scrollable frame of six icon-headed sections, add WETH alongside USDC on Base and Base Sepolia, and render real token logos in the currency select.

**Architecture:** Section metadata (id, title, description, icon, tint) is centralised in one module so three consumers agree on it: the section headers, the summary card's jump links, and the validation error summary. The wizard's `step` state disappears from `page.tsx`; the existing step components are renamed and one is split into three, each keeping its form logic untouched. Token logos are vendored SVGs addressed by a slug carried on `TokenInfo`.

**Tech Stack:** Next.js 16, React 19, react-hook-form 7 + zod 3, Radix `Select` via `components/ui/select.tsx`, Tailwind 4, lucide-react, Biome 2.

**Design spec:** `docs/superpowers/specs/2026-08-07-create-form-single-frame-design.md`

## Global Constraints

- **No test framework exists** in `apps/landing` or `packages/sdk` — no vitest, no jest, no test files. Do not introduce one; it is out of scope. Verification is: a path-scoped `npx biome check` (see below), a typecheck/build, a runtime assertion against built SDK output where applicable, and browser verification via the preview tools against the `landing` dev server (`.claude/launch.json`, port 3200).
- **The submitted transaction must not change.** `onSubmit` in `page.tsx` keeps calling the same four SDK helpers with the same arguments. No edits to `apps/landing/src/app/create/schema.ts` — field names, validation rules and default values are frozen.
- **WETH address is `0x4200000000000000000000000000000000000006`** on both Base (8453) and Base Sepolia (84532). Verified by `eth_call`: `symbol()` → `WETH`, `decimals()` → `18`, `name()` → `Wrapped Ether`.
- **WETH goes last** in each chain's token array. `getDefaultToken` returns index `[0]`, so an untouched form must still create exactly the slot it creates today.
- **Plain `<img>` for logos**, following the repo's existing convention in `apps/landing/src/components/ens-identity.tsx:44` — including the `// eslint-disable-next-line @next/next/no-img-element` comment above it.
- **Never run `pnpm check:fix` or `pnpm check` at the repo root.** Biome's config includes `**`, so a root run descends into the `apps/contracts/lib/openzeppelin-*` submodules (and their nested `forge-std`) and reformats vendored code, along with generated deployment JSON and `pages.gen.ts`. The root check is also *already red* on that vendored code, so it can never be used as a pass/fail gate. Format and check only the paths you touched:

  ```bash
  npx biome check --write <the files this task changed>
  ```

  Confirm with `git status --short` after every such run that nothing outside your task's file list was modified.
- Commit after every task. Use conventional commit prefixes as the repo does (`feat(create):`, `refactor(create):`, `feat(sdk):`).

---

## File Structure

**Created**

| Path | Responsibility |
| --- | --- |
| `apps/landing/public/tokens/usdc.svg` | USDC mark, vendored |
| `apps/landing/public/tokens/weth.svg` | WETH mark (ETH diamond), vendored |
| `apps/landing/src/components/token-logo.tsx` | Slug → logo `<img>`, with monogram fallback |
| `apps/landing/src/app/create/sections.ts` | Section metadata, field→section map, scroll helper |
| `apps/landing/src/app/create/components/form-section.tsx` | Icon-headed `<section>` wrapper |
| `apps/landing/src/app/create/components/section-currency.tsx` | Currency select + custom ERC-20 |
| `apps/landing/src/app/create/components/section-economics.tsx` | Tax rate slider + min deposit time |
| `apps/landing/src/app/create/components/section-module.tsx` | Module select + custom module |
| `apps/landing/src/app/create/components/section-recipient.tsx` | Account/group recipient (renamed) |
| `apps/landing/src/app/create/components/section-permissions.tsx` | Mutability, manager, bounty (renamed) |
| `apps/landing/src/app/create/components/error-summary.tsx` | "N sections need attention", section-linked |

**Modified**

| Path | Change |
| --- | --- |
| `packages/sdk/src/tokens.ts` | `logo?: string` on `TokenInfo`; WETH entries; slugs on existing entries |
| `apps/landing/src/app/create/page.tsx` | Wizard removed, six sections rendered |
| `apps/landing/src/app/create/components/occupancy-section.tsx` | Own heading removed — `FormSection` carries it |
| `apps/landing/src/app/create/components/summary-card.tsx` | Rows become jump links; hosts `ErrorSummary` |
| `apps/landing/src/app/create/components/mobile-bottom-bar.tsx` | `step` prop dropped; rows jump and close the drawer |

**Deleted (Task 6)**

`step-recipient.tsx`, `step-parameters.tsx`, `step-extra.tsx`

---

### Task 1: WETH and logo slugs in the SDK

**Files:**
- Modify: `packages/sdk/src/tokens.ts`
- Create: `.changeset/weth-and-token-logos.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `TokenInfo.logo?: string` — a slug, not a URL and not a path. Consumed by `TokenLogo` in Task 2 and `SectionCurrency` in Task 4. `getChainTokens(8453)` returns `[USDC, WETH]`; `getChainTokens(84532)` returns `[USDCf, USDC, WETH]`.

- [ ] **Step 1: Add the `logo` field to `TokenInfo`**

In `packages/sdk/src/tokens.ts`, add to the `TokenInfo` interface, after `faucet`:

```ts
  /**
   * Slug naming this token's logo asset — `"usdc"`, `"weth"`.
   *
   * Deliberately not a URL or a path. This package is published and has more
   * than one consumer; a `/tokens/usdc.svg` would encode one app's `public/`
   * layout into shared data, and a CDN URL would put a third-party host in
   * every consumer's render path. The slug names the asset and lets each
   * consumer decide where it lives.
   */
  logo?: string;
```

- [ ] **Step 2: Add WETH to both chains and slugs to every entry**

Replace the whole `CHAIN_TOKENS` object with:

```ts
export const CHAIN_TOKENS: Record<SlotsChain, TokenInfo[]> = {
  [SlotsChain.BASE_SEPOLIA]: [
    // Default: mintable, so a new testnet user can create AND buy a slot
    // without leaving the app. Shared with the Feed app, so balances carry
    // across both rather than fragmenting across two test tokens.
    {
      address: "0xFA28A416810e39a7142C7557e6e43407d765f627",
      name: "Feed USDC",
      symbol: "USDCf",
      decimals: 6,
      faucet: true,
      logo: "usdc",
    },
    {
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logo: "usdc",
    },
    // The OP-stack WETH predeploy — same address on every OP-stack chain.
    // No faucet, but wrapping testnet ETH at it is a single call.
    {
      address: "0x4200000000000000000000000000000000000006",
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logo: "weth",
    },
  ],
  [SlotsChain.BASE]: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      logo: "usdc",
    },
    // Appended, never first: `getDefaultToken` returns [0], so USDC stays the
    // default and an untouched create form produces the slot it always did.
    {
      address: "0x4200000000000000000000000000000000000006",
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
      logo: "weth",
    },
  ],
};
```

- [ ] **Step 3: Typecheck the SDK**

```bash
pnpm --filter @0xslots/sdk typecheck
```

Expected: no output, exit 0.

- [ ] **Step 4: Build the SDK and assert the token lists at runtime**

```bash
pnpm --filter @0xslots/sdk build
```

Then, from the repo root:

```bash
node -e "
import('./packages/sdk/dist/index.js').then(m => {
  const base = m.getChainTokens(8453);
  const sep = m.getChainTokens(84532);
  const eq = (a, b, msg) => {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(msg + ' — got ' + JSON.stringify(a));
  };
  eq(base.map(t => t.symbol), ['USDC', 'WETH'], 'Base order wrong');
  eq(sep.map(t => t.symbol), ['USDCf', 'USDC', 'WETH'], 'Base Sepolia order wrong');
  eq(m.getDefaultToken(8453).symbol, 'USDC', 'Base default changed');
  eq(m.getDefaultToken(84532).symbol, 'USDCf', 'Base Sepolia default changed');
  const weth = base[1];
  eq(weth.address, '0x4200000000000000000000000000000000000006', 'WETH address wrong');
  eq(weth.decimals, 18, 'WETH decimals wrong');
  eq(sep[2].address, weth.address, 'Sepolia WETH should share the predeploy address');
  eq(base.every(t => t.logo), true, 'every Base token needs a logo slug');
  eq(sep.every(t => t.logo), true, 'every Sepolia token needs a logo slug');
  console.log('OK — token lists correct');
});
"
```

Expected: `OK — token lists correct`. Any thrown error names the specific assertion that failed.

- [ ] **Step 5: Write the changeset**

Create `.changeset/weth-and-token-logos.md`:

```markdown
---
"@0xslots/sdk": minor
---

Offer WETH as a slot currency on Base and Base Sepolia, and name each token's logo.

`WETH` is the OP-stack predeploy at `0x4200000000000000000000000000000000000006` — the same address on both chains. It is appended last on each chain rather than inserted first, so `getDefaultToken` keeps returning USDC (and Feed USDC on testnet) and an untouched create form still produces exactly the slot it did before.

It is also the first 18-decimal currency the protocol has offered. Nothing needed changing for that — a price floor already converts with the selected token's own decimals, and `MinimumPricePolicy` reverts `WrongCurrency` on a mismatched pairing — but the path now actually gets exercised rather than only ever seeing 6-decimal USDC.

`TokenInfo` gains an optional `logo` holding a slug (`"usdc"`, `"weth"`) rather than a URL or a path. This package is published and has more than one consumer: a path would encode one app's asset layout into shared data, and a URL would put a third-party host into every consumer's render path.
```

- [ ] **Step 6: Format, check and commit**

```bash
npx biome check --write packages/sdk/src/tokens.ts .changeset/weth-and-token-logos.md
git add packages/sdk/src/tokens.ts .changeset/weth-and-token-logos.md
git commit -m "feat(sdk): offer WETH on Base and Base Sepolia, name token logos"
```

---

### Task 2: Logo assets and the `TokenLogo` component

**Files:**
- Create: `apps/landing/public/tokens/usdc.svg`, `apps/landing/public/tokens/weth.svg`
- Create: `apps/landing/src/components/token-logo.tsx`

**Interfaces:**
- Consumes: `TokenInfo.logo` from Task 1.
- Produces: `<TokenLogo slug={string | undefined} symbol={string | undefined} className={string?} />`. Consumed by `SectionCurrency` in Task 4. Defaults to `className="size-5"`. Never renders a broken image: with no `slug` it renders a monogram disc.

- [ ] **Step 1: Download the two logo assets**

From the repo root:

```bash
mkdir -p apps/landing/public/tokens
curl -sL -o apps/landing/public/tokens/usdc.svg \
  https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg
curl -sL -o apps/landing/public/tokens/weth.svg \
  https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg
```

`weth.svg` is sourced from that set's `eth.svg` — the ETH diamond — on purpose. Trust Wallet's per-address Base WETH asset is the weth.io pink-and-black wordmark, which is illegible at the ~20 px a select row gives it; the diamond is what DEX interfaces conventionally show for WETH and reads correctly at that size. The set is CC0.

- [ ] **Step 2: Verify both files downloaded and are real SVGs**

```bash
ls -la apps/landing/public/tokens/
head -c 60 apps/landing/public/tokens/usdc.svg; echo
head -c 60 apps/landing/public/tokens/weth.svg; echo
```

Expected: two files, roughly 1.4 KB and 525 B, each starting with `<svg`. `usdc.svg` contains `fill="#3E73C4"` (the blue disc); `weth.svg` contains `fill="#627EEA"` (the ETH violet-blue disc). If either file is HTML or a 404 page, stop and re-fetch — do not proceed with a broken asset.

- [ ] **Step 3: Write `TokenLogo`**

Create `apps/landing/src/components/token-logo.tsx`:

```tsx
interface TokenLogoProps {
  /** Logo slug from `TokenInfo.logo`. Absent for custom/unknown tokens. */
  slug?: string;
  /** Falls back to this symbol's first letter when there is no slug. */
  symbol?: string;
  className?: string;
}

/**
 * A token's mark, or a monogram disc standing in for one.
 *
 * The fallback is not decoration: the currency select accepts an arbitrary
 * ERC-20 address, so most tokens it can show will never have an asset. A
 * broken image or a blank gap at the left edge of one row would break the
 * alignment of every other row.
 */
export function TokenLogo({
  slug,
  symbol,
  className = "size-5",
}: TokenLogoProps) {
  if (slug) {
    return (
      // Plain <img>: fixed-size local SVGs, so next/image has nothing to
      // optimise. Same call ens-identity.tsx makes for avatars.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/tokens/${slug}.svg`}
        alt=""
        aria-hidden="true"
        className={`${className} shrink-0 rounded-full`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-semibold uppercase`}
    >
      {symbol?.trim()?.[0] ?? "?"}
    </span>
  );
}
```

- [ ] **Step 4: Verify it compiles**

```bash
pnpm build:landing
```

Expected: build succeeds. `TokenLogo` has no consumers yet, so this only proves it typechecks.

- [ ] **Step 5: Format, check and commit**

```bash
npx biome check --write apps/landing/public/tokens apps/landing/src/components/token-logo.tsx
git add apps/landing/public/tokens apps/landing/src/components/token-logo.tsx
git commit -m "feat(create): vendor USDC and WETH logos, add TokenLogo"
```

---

### Task 3: Section metadata and the `FormSection` wrapper

**Files:**
- Create: `apps/landing/src/app/create/sections.ts`
- Create: `apps/landing/src/app/create/components/form-section.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces, all consumed by Tasks 4–7:
  - `SectionId` — `"recipient" | "currency" | "economics" | "module" | "occupancy" | "permissions"`
  - `SectionMeta` — `{ id: SectionId; title: string; description: string; icon: LucideIcon; tint: string }`
  - `SECTIONS: SectionMeta[]` — page order
  - `SECTION: Record<SectionId, SectionMeta>` — lookup by id
  - `scrollToSection(id: SectionId): void`
  - `sectionsWithErrors(errors: Record<string, unknown>): SectionMeta[]`
  - `<FormSection meta={SectionMeta}>{children}</FormSection>` — renders `<section id={`section-${meta.id}`}>`

This module is the single source of truth for section identity. Three consumers depend on the ids matching: the DOM anchors, the summary jump links, and the error summary. Nothing here holds form state.

- [ ] **Step 1: Write `sections.ts`**

Create `apps/landing/src/app/create/sections.ts`:

```ts
import {
  Coins,
  HandCoins,
  KeyRound,
  type LucideIcon,
  Puzzle,
  ShieldCheck,
  Users,
} from "lucide-react";

export type SectionId =
  | "recipient"
  | "currency"
  | "economics"
  | "module"
  | "occupancy"
  | "permissions";

export interface SectionMeta {
  id: SectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile — foreground colour plus a tint. */
  tint: string;
}

/**
 * The form's sections, in page order.
 *
 * Single source of truth: the section headers, the summary card's jump links
 * and the validation error summary all read from here, so an id can never
 * drift between the anchor and the thing linking to it.
 */
export const SECTIONS: SectionMeta[] = [
  {
    id: "recipient",
    title: "Recipient",
    description: "Who collects the tax this slot charges its occupant.",
    icon: Users,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    id: "currency",
    title: "Currency",
    description: "The ERC-20 this slot is priced and taxed in.",
    icon: Coins,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "economics",
    title: "Tax & deposit",
    description: "What the occupant pays, and how far ahead they must fund it.",
    icon: HandCoins,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "module",
    title: "Module",
    description: "Optional contract giving the slot its behaviour.",
    icon: Puzzle,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "occupancy",
    title: "Occupancy",
    description: "When the slot can be taken from whoever holds it.",
    icon: ShieldCheck,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    id: "permissions",
    title: "Permissions & bounty",
    description: "What can change after creation, and who may change it.",
    icon: KeyRound,
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

export const SECTION = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<SectionId, SectionMeta>;

/**
 * Every schema field, mapped to the section that renders it.
 *
 * Exhaustive over `createSlotSchema`. A field missing from here would make its
 * validation error invisible in the error summary — the one thing the removed
 * wizard used to guarantee by forcing you through every step.
 */
const FIELD_SECTION: Record<string, SectionId> = {
  recipientMode: "recipient",
  recipient: "recipient",
  splitRecipients: "recipient",
  distributorFeePercent: "recipient",
  currencyMode: "currency",
  presetCurrency: "currency",
  customCurrency: "currency",
  taxPercentage: "economics",
  minDepositValue: "economics",
  minDepositUnit: "economics",
  moduleMode: "module",
  module: "module",
  occupancyPolicyMode: "occupancy",
  occupancyPolicy: "occupancy",
  tenureValue: "occupancy",
  tenureUnit: "occupancy",
  minPriceValue: "occupancy",
  mutableTax: "permissions",
  mutableModule: "permissions",
  mutablePolicy: "permissions",
  manager: "permissions",
  liquidationBountyPercent: "permissions",
};

export function scrollToSection(id: SectionId) {
  document
    .getElementById(`section-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** The distinct sections currently holding a validation error, in page order. */
export function sectionsWithErrors(
  errors: Record<string, unknown>,
): SectionMeta[] {
  const hit = new Set<SectionId>();
  for (const field of Object.keys(errors)) {
    const id = FIELD_SECTION[field];
    if (id) hit.add(id);
  }
  return SECTIONS.filter((s) => hit.has(s.id));
}
```

- [ ] **Step 2: Write `FormSection`**

Create `apps/landing/src/app/create/components/form-section.tsx`:

```tsx
import type { ReactNode } from "react";
import type { SectionMeta } from "../sections";

/**
 * One titled block of the create form.
 *
 * `scroll-mt-20` clears the app shell's sticky top nav, so a jump from the
 * summary card lands on the heading rather than under it.
 */
export function FormSection({
  meta,
  children,
}: {
  meta: SectionMeta;
  children: ReactNode;
}) {
  const Icon = meta.icon;

  return (
    <section
      id={`section-${meta.id}`}
      aria-labelledby={`section-${meta.id}-title`}
      className="scroll-mt-20 border-t first:border-t-0 px-3 md:px-6 py-5 md:py-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id={`section-${meta.id}-title`}
            className="text-sm font-semibold leading-tight"
          >
            {meta.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meta.description}
          </p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm build:landing
```

Expected: build succeeds. No consumers yet.

- [ ] **Step 4: Format, check and commit**

```bash
npx biome check --write apps/landing/src/app/create/sections.ts apps/landing/src/app/create/components/form-section.tsx
git add apps/landing/src/app/create/sections.ts apps/landing/src/app/create/components/form-section.tsx
git commit -m "feat(create): section metadata and the FormSection wrapper"
```

---

### Task 4: Split `step-parameters` into currency, economics and module

**Files:**
- Create: `apps/landing/src/app/create/components/section-currency.tsx`
- Create: `apps/landing/src/app/create/components/section-economics.tsx`
- Create: `apps/landing/src/app/create/components/section-module.tsx`
- Leave `step-parameters.tsx` in place — Task 6 deletes it once `page.tsx` stops importing it.

**Interfaces:**
- Consumes: `TokenLogo` (Task 2), `TokenInfo.logo` (Task 1).
- Produces: `<SectionCurrency />`, `<SectionEconomics />`, `<SectionModule />` — all zero-prop, all reading state from `useFormContext<CreateSlotFormValues>()`. Consumed by `page.tsx` in Task 6.

These three concerns shared a file only because they shared a wizard step. Each one's form logic is carried over unchanged apart from the currency select's rows.

- [ ] **Step 1: Write `section-currency.tsx`**

```tsx
import { getChainTokens } from "@0xslots/sdk";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { TokenLogo } from "@/components/token-logo";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChain } from "@/context/chain";
import { truncateAddress } from "@/utils";
import { AddressInput } from "../address-input";
import { useErc20Check } from "../hooks/use-erc20-check";
import type { CreateSlotFormValues } from "../schema";

export function SectionCurrency() {
  const form = useFormContext<CreateSlotFormValues>();
  const { chainId } = useChain();
  const currencyMode = form.watch("currencyMode");
  const presetCurrency = form.watch("presetCurrency");
  const customCurrency = form.watch("customCurrency");
  const chainTokens = getChainTokens(chainId);
  const erc20 = useErc20Check(currencyMode === "custom" ? customCurrency : "");

  return (
    <>
      <FormField
        control={form.control}
        name="currencyMode"
        render={({ field }) => {
          const selectValue =
            field.value === "custom"
              ? "custom"
              : (presetCurrency ?? chainTokens[0]?.address ?? "");

          return (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  if (v === "custom") {
                    field.onChange("custom");
                  } else {
                    field.onChange("preset");
                    form.setValue("presetCurrency", v as `0x${string}`);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {chainTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <TokenLogo slug={token.logo} symbol={token.symbol} />
                      <span>
                        {token.name} ({token.symbol})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {truncateAddress(token.address)}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <TokenLogo />
                    <span>Custom address</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          );
        }}
      />

      {currencyMode === "custom" && (
        <FormField
          control={form.control}
          name="customCurrency"
          render={({ field, fieldState }) => (
            <FormItem>
              <AddressInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0x… ERC-20 address or ENS"
                error={fieldState.error?.message}
              />
              {erc20.isLoading && (
                <p className="flex items-center gap-1.5 text-[10px] text-blue-500">
                  <Loader2 className="size-3 animate-spin" />
                  Checking ERC-20 token...
                </p>
              )}
              {erc20.data && (
                <p className="flex items-center gap-1.5 text-[10px] text-green-600">
                  <Check className="size-3" />
                  {erc20.data.name} ({erc20.data.symbol}) ·{" "}
                  {erc20.data.decimals} decimals
                </p>
              )}
              {erc20.isError && erc20.isValidAddress && (
                <p className="flex items-center gap-1.5 text-[10px] text-destructive">
                  <AlertCircle className="size-3" />
                  Not a valid ERC-20 token on this chain
                </p>
              )}
            </FormItem>
          )}
        />
      )}
    </>
  );
}
```

The row shape is deliberately one flat row of three children — logo, name, address. `SelectItem` in `components/ui/select.tsx:112` already applies `flex items-center gap-2` to its last `<span>` child, and Radix clones the selected item's `ItemText` into the closed trigger, so a nested stacked layout would fight those utilities. One row renders correctly in both places from one definition.

- [ ] **Step 2: Write `section-economics.tsx`**

Carries the tax rate slider (and its hint) plus min deposit time, unchanged.

```tsx
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeDecimal } from "@/utils";
import { type CreateSlotFormValues, timeDenominations } from "../schema";

export function SectionEconomics() {
  const form = useFormContext<CreateSlotFormValues>();

  return (
    <>
      <FormField
        control={form.control}
        name="taxPercentage"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Tax Rate</FormLabel>
              <span className="text-sm font-semibold">
                {parseFloat(normalizeDecimal(field.value)).toFixed(1) || "0"}
                %/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={Number(field.value) || 0}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full h-2 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <TaxRateHint value={Number(field.value) || 0} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="minDepositValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Deposit Time</FormLabel>
            <div className="flex gap-0">
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                className="rounded-r-none"
              />
              <FormField
                control={form.control}
                name="minDepositUnit"
                render={({ field: selectField }) => (
                  <Select
                    value={selectField.value}
                    onValueChange={selectField.onChange}
                  >
                    <SelectTrigger className="w-25 rounded-l-none border-l-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeDenominations.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function TaxRateHint({ value }: { value: number }) {
  const isLow = value <= 20;
  const isHigh = value >= 30;

  return (
    <div className="flex justify-between mt-1.5 text-[9px] leading-tight gap-4">
      <span
        className={
          isLow ? "font-bold text-foreground" : "text-muted-foreground"
        }
      >
        Predictability · low churn · squat risk
      </span>
      <span
        className={`text-right ${isHigh ? "font-bold text-foreground" : "text-muted-foreground"}`}
      >
        Allocative efficiency · anti-squat · volatility
      </span>
    </div>
  );
}
```

The `HandCoins` icon that used to sit inside the "Tax Rate" label is dropped — the section header carries it now.

- [ ] **Step 3: Write `section-module.tsx`**

The module `FormField` from `step-parameters.tsx` lines 213–312, moved verbatim, with the label changed from `Module (optional)` to `Module` because the section description already says it is optional.

```tsx
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChain } from "@/context/chain";
import { useModules } from "@/hooks/use-v3";
import { truncateAddress } from "@/utils";
import { AddressInput } from "../address-input";
import { useModuleCheck } from "../hooks/use-module-check";
import type { CreateSlotFormValues } from "../schema";

export function SectionModule() {
  const form = useFormContext<CreateSlotFormValues>();
  const { chainId } = useChain();
  const moduleMode = form.watch("moduleMode");
  const customModule = form.watch("module");
  const { data: verifiedModules } = useModules();
  const moduleCheck = useModuleCheck(
    moduleMode === "custom" ? customModule : "",
    chainId,
  );

  return (
    <FormField
      control={form.control}
      name="module"
      render={({ field, fieldState }) => {
        const selectValue =
          moduleMode === "custom"
            ? "custom"
            : field.value === ""
              ? "none"
              : field.value;

        return (
          <FormItem>
            <FormLabel>Module</FormLabel>
            <Select
              value={selectValue}
              onValueChange={(v) => {
                if (v === "none") {
                  form.setValue("moduleMode", "none");
                  field.onChange("");
                } else if (v === "custom") {
                  form.setValue("moduleMode", "custom");
                  field.onChange("");
                } else {
                  form.setValue("moduleMode", "verified");
                  field.onChange(v);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {verifiedModules
                  ?.filter((m) => m.verified)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name || m.id.slice(0, 10)}{" "}
                      <span className="text-muted-foreground">
                        {truncateAddress(m.id)}
                      </span>
                    </SelectItem>
                  ))}
                <SelectItem value="custom">Custom address</SelectItem>
              </SelectContent>
            </Select>
            {moduleMode === "custom" && (
              <div className="mt-2">
                <AddressInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0x… or ENS"
                  error={fieldState.error?.message}
                />
                {moduleCheck.isLoading && (
                  <p className="flex items-center gap-1.5 text-[10px] text-blue-500 mt-1">
                    <Loader2 className="size-3 animate-spin" />
                    Checking module...
                  </p>
                )}
                {moduleCheck.data?.status === "verified" && (
                  <p className="flex items-center gap-1.5 text-[10px] text-green-600 mt-1">
                    <Check className="size-3" />
                    {moduleCheck.data.name ?? "Module"}
                    {moduleCheck.data.version && ` v${moduleCheck.data.version}`}
                    {" · ISlotsModule (ERC-165)"}
                  </p>
                )}
                {moduleCheck.data?.status === "probable" && (
                  <p className="flex items-center gap-1.5 text-[10px] text-amber-600 mt-1">
                    <AlertCircle className="size-3" />
                    Looks like a module ({moduleCheck.data.name}
                    {moduleCheck.data.version && ` v${moduleCheck.data.version}`}
                    ) but does not advertise ERC-165 support
                  </p>
                )}
                {moduleCheck.data?.status === "invalid" && (
                  <p className="flex items-center gap-1.5 text-[10px] text-destructive mt-1">
                    <AlertCircle className="size-3" />
                    Not a slots module — contract is missing the required
                    interface
                  </p>
                )}
                {moduleCheck.data?.status === "no-code" && (
                  <p className="flex items-center gap-1.5 text-[10px] text-destructive mt-1">
                    <AlertCircle className="size-3" />
                    No contract code at this address on the selected chain
                  </p>
                )}
              </div>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
```

- [ ] **Step 4: Verify all three compile**

```bash
pnpm build:landing
```

Expected: build succeeds. `step-parameters.tsx` still exists and is still what `page.tsx` renders, so the running app is unchanged at this point.

- [ ] **Step 5: Format, check and commit**

```bash
npx biome check --write apps/landing/src/app/create/components/section-currency.tsx apps/landing/src/app/create/components/section-economics.tsx apps/landing/src/app/create/components/section-module.tsx
git add apps/landing/src/app/create/components/section-currency.tsx apps/landing/src/app/create/components/section-economics.tsx apps/landing/src/app/create/components/section-module.tsx
git commit -m "feat(create): split parameters into currency, economics and module sections"
```

---

### Task 5: Rename the remaining step components, strip the occupancy heading

**Files:**
- Create: `apps/landing/src/app/create/components/section-recipient.tsx` (from `step-recipient.tsx`)
- Create: `apps/landing/src/app/create/components/section-permissions.tsx` (from `step-extra.tsx`)
- Modify: `apps/landing/src/app/create/components/occupancy-section.tsx`
- Leave `step-recipient.tsx` and `step-extra.tsx` in place — Task 6 deletes them.

**Interfaces:**
- Consumes: nothing new.
- Produces: `<SectionRecipient />` and `<SectionPermissions />`, both zero-prop, both reading `useFormContext<CreateSlotFormValues>()`. `<OccupancySection />` keeps its name and export but no longer renders its own heading. All three consumed by `page.tsx` in Task 6.

- [ ] **Step 1: Create `section-recipient.tsx`**

```bash
git show HEAD:apps/landing/src/app/create/components/step-recipient.tsx \
  > apps/landing/src/app/create/components/section-recipient.tsx
```

Then make exactly two edits to the new file:

1. Rename the exported component: `export function StepRecipient()` → `export function SectionRecipient()`.
2. Remove the outer `<div>` wrapper and the `<FormLabel>Recipient</FormLabel>` inside the `recipientMode` `FormItem` — the section header supplies both the container spacing and that label. The `FormItem` keeps its `<div className="grid grid-cols-2 gap-3">` of Account/Group buttons. Replace the outer `<div>` / `</div>` with a fragment `<>` / `</>`.

`SplitTotal` stays in this file. `Wallet` and `Users` imports stay — they are the Account and Group button icons, not section icons.

- [ ] **Step 2: Create `section-permissions.tsx`**

```bash
git show HEAD:apps/landing/src/app/create/components/step-extra.tsx \
  > apps/landing/src/app/create/components/section-permissions.tsx
```

Then edit the new file:

1. Rename `export function StepExtra()` → `export function SectionPermissions()`.
2. Delete the `<OccupancySection />` render and its surrounding `<Separator />` — `page.tsx` renders occupancy as its own section in Task 6. Remove the now-unused `import { OccupancySection } from "./occupancy-section";`.
3. Change `<p className="text-sm font-medium mb-4">Mutability & Manager</p>` to `<p className="text-sm font-medium mb-4">Mutability</p>` — "Manager" is now conditional detail below it, and the section header already names permissions.
4. Keep the liquidation bounty `FormField`, but drop the `<Sparkles className="size-3.5 text-amber-500" />` from its label — the section header carries the icon. The label becomes plain `<FormLabel>Liquidation Bounty</FormLabel>`. Remove the now-unused `Sparkles` import.
5. Keep the single remaining `<Separator />` between the mutability block and the bounty field.

- [ ] **Step 3: Strip `OccupancySection`'s own heading**

In `apps/landing/src/app/create/components/occupancy-section.tsx`, delete this block (currently lines 66–73):

```tsx
      <div>
        <p className="text-sm font-medium">Occupancy</p>
        <p className="text-xs text-muted-foreground mt-1">
          When this slot can be taken from whoever holds it. Leave the policy at
          None for instant buy — anyone can take it at its declared price, in
          the next block.
        </p>
      </div>
```

`FormSection` now supplies the title and description. The "leave it at None for instant buy" guidance is not lost: the `FormDescription` under the policy select already explains what a policy can and cannot do, and the select's own default reads `None`.

Then change the component's root element from `<div className="space-y-4">` to a fragment `<>` — `FormSection` supplies `space-y-4` to its children.

Also remove the `ShieldCheck` icon from the policy `FormLabel`, leaving `<FormLabel>Occupancy policy</FormLabel>`, and drop the now-unused `ShieldCheck` import.

- [ ] **Step 4: Verify the build**

```bash
pnpm build:landing
```

Expected: build succeeds. Note that the running wizard is briefly in a mixed state — `step-extra.tsx` still renders `OccupancySection`, which has just lost its heading. This is transient and resolved by Task 6. Do not "fix" it by restoring the heading.

- [ ] **Step 5: Format, check and commit**

```bash
npx biome check --write apps/landing/src/app/create/components/section-recipient.tsx apps/landing/src/app/create/components/section-permissions.tsx apps/landing/src/app/create/components/occupancy-section.tsx
git add apps/landing/src/app/create/components/section-recipient.tsx apps/landing/src/app/create/components/section-permissions.tsx apps/landing/src/app/create/components/occupancy-section.tsx
git commit -m "refactor(create): rename step components to sections, hoist occupancy heading"
```

---

### Task 6: Rewrite `page.tsx` as a single frame

**Files:**
- Modify: `apps/landing/src/app/create/page.tsx`
- Delete: `apps/landing/src/app/create/components/step-recipient.tsx`, `step-parameters.tsx`, `step-extra.tsx`

**Interfaces:**
- Consumes: `SECTION` and `FormSection` (Task 3); `SectionCurrency`, `SectionEconomics`, `SectionModule` (Task 4); `SectionRecipient`, `SectionPermissions`, `OccupancySection` (Task 5).
- Produces: `MobileBottomBar` is now called without a `step` prop — Task 7 removes it from that component's interface. Until Task 7 lands, leave the prop in the interface but stop passing it and give it a default; simpler to just do Task 7 immediately after.

- [ ] **Step 1: Replace the imports**

In `page.tsx`, delete these three imports:

```ts
import { StepExtra } from "./components/step-extra";
import { StepParameters } from "./components/step-parameters";
import { StepRecipient } from "./components/step-recipient";
```

and add:

```ts
import { FormSection } from "./components/form-section";
import { OccupancySection } from "./components/occupancy-section";
import { SectionCurrency } from "./components/section-currency";
import { SectionEconomics } from "./components/section-economics";
import { SectionModule } from "./components/section-module";
import { SectionPermissions } from "./components/section-permissions";
import { SectionRecipient } from "./components/section-recipient";
import { SECTION } from "./sections";
```

Also drop `Check`, `ChevronLeft` and `ChevronRight` from the `lucide-react` import — the step indicator and Back/Next buttons that used them are gone. If that leaves the import empty, delete the line. Drop the `Button` import from `@/components/ui/button` if nothing else in the file uses it.

- [ ] **Step 2: Delete the wizard state**

Remove the `STEPS` constant (lines 35–39) and this line from the component body:

```ts
  const [step, setStep] = useState(1);
```

`useState` is still needed for `slotCount` and `creatingSplit`, so keep the React import as-is.

- [ ] **Step 3: Replace the form's left column**

Replace the entire `{/* Left: Form */}` `<div>` — the card header, the step indicator, the step content and the navigation block — with:

```tsx
            {/* Left: Form */}
            <div className="flex-1 min-w-0 rounded-lg border">
              <FormSection meta={SECTION.recipient}>
                <SectionRecipient />
              </FormSection>

              <FormSection meta={SECTION.currency}>
                <SectionCurrency />
              </FormSection>

              <FormSection meta={SECTION.economics}>
                <SectionEconomics />
              </FormSection>

              <FormSection meta={SECTION.module}>
                <SectionModule />
              </FormSection>

              <FormSection meta={SECTION.occupancy}>
                <OccupancySection />
              </FormSection>

              <FormSection meta={SECTION.permissions}>
                <SectionPermissions />
              </FormSection>
            </div>
```

The wrapper deliberately has no `divide-y`: `FormSection` already carries `border-t first:border-t-0`, which draws the same dividers while letting the first section sit flush against the card's own top border.

- [ ] **Step 4: Stop passing `step` to `MobileBottomBar`**

```tsx
            <MobileBottomBar
              slotCount={slotCount}
              setSlotCount={setSlotCount}
              submitState={submitState}
              switchChain={switchChain}
              chainId={selectedChainId}
            />
```

TypeScript will now error that `step` is missing. That is expected and is fixed at the top of Task 7 — run Tasks 6 and 7 back to back, and treat the failing build at the end of Step 5 below as the signal to continue rather than as a defect.

- [ ] **Step 5: Delete the three step files**

```bash
git rm apps/landing/src/app/create/components/step-recipient.tsx \
       apps/landing/src/app/create/components/step-parameters.tsx \
       apps/landing/src/app/create/components/step-extra.tsx
```

- [ ] **Step 6: Confirm the only remaining error is the `step` prop**

```bash
pnpm build:landing
```

Expected: exactly one type error, on `MobileBottomBar` missing the required `step` prop. Any other error is a real problem — fix it before moving on. Do not commit yet; Task 7 completes this change.

---

### Task 7: Jump links, error summary, and the mobile bar

**Files:**
- Create: `apps/landing/src/app/create/components/error-summary.tsx`
- Modify: `apps/landing/src/app/create/components/summary-card.tsx`
- Modify: `apps/landing/src/app/create/components/mobile-bottom-bar.tsx`

**Interfaces:**
- Consumes: `scrollToSection`, `sectionsWithErrors`, `SectionId` (Task 3).
- Produces: `<ErrorSummary onJump={(id: SectionId) => void} />` — renders `null` when the form is valid. `SummaryRow` is local to each of the two consumers; it is not shared, because the desktop and drawer variants differ in what a click has to do.

- [ ] **Step 1: Fix `MobileBottomBar`'s interface**

Delete `step: number;` from `MobileBottomBarProps`, delete `step,` from the destructured parameters, and replace:

```ts
  const ready = step === 3;
```

with:

```ts
  // Nothing is sequential any more, so "ready" means the form actually
  // validates — not that you reached the last of three steps.
  const ready = submitState.isFormValid;
```

- [ ] **Step 2: Verify the build is green again**

```bash
pnpm build:landing
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Write `ErrorSummary`**

Create `apps/landing/src/app/create/components/error-summary.tsx`:

```tsx
import { AlertCircle } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { CreateSlotFormValues } from "../schema";
import { type SectionId, sectionsWithErrors } from "../sections";

/**
 * Which sections are blocking submission, and a way to get to them.
 *
 * The wizard used to guarantee this for free: you could not reach the last
 * step without passing through the others, so a disabled Create button was
 * self-explanatory. On one scroll you can walk straight past a broken field
 * and find the button dead with no stated reason.
 */
export function ErrorSummary({
  onJump,
}: {
  onJump: (id: SectionId) => void;
}) {
  const form = useFormContext<CreateSlotFormValues>();
  const { errors } = form.formState;
  const sections = sectionsWithErrors(errors);

  if (sections.length === 0) return null;

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        {sections.length === 1
          ? "1 section needs attention"
          : `${sections.length} sections need attention`}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(s.id)}
            className="rounded border border-destructive/30 px-1.5 py-0.5 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Make the summary card's rows jump**

In `summary-card.tsx`, add the imports:

```ts
import { ErrorSummary } from "./error-summary";
import { type SectionId, scrollToSection } from "../sections";
```

Add this local component at the bottom of the file:

```tsx
/** A summary line that scrolls the form to the section it describes. */
function SummaryRow({
  section,
  label,
  icon,
  children,
}: {
  section: SectionId;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(section)}
      className="flex w-full justify-between rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/60 transition-colors"
    >
      <span className="text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-xs text-right">{children}</span>
    </button>
  );
}
```

Then convert each existing row. The Recipient row keeps its wrapping `<div>` because the `SplitBar` sits below it — only its inner `flex justify-between` becomes a `SummaryRow`. Mapping:

| Row | `section` |
| --- | --- |
| Recipient | `"recipient"` |
| Currency | `"currency"` |
| Module | `"module"` |
| Tax Rate | `"economics"` |
| Min Deposit | `"economics"` |
| Liq. Bounty | `"permissions"` |
| Mutable | `"permissions"` |

Leave the Total row and the `OccupancySummaryRows` block as plain, non-clickable rows — Total describes no section, and `OccupancySummaryRows` is a separate component whose internals are out of scope for this task.

Finally, insert the error summary directly above the submit button, replacing the `<Separator />` + `<SubmitButton>` pair with:

```tsx
          <Separator />

          <ErrorSummary onJump={scrollToSection} />

          <SubmitButton
            state={submitState}
            switchChain={switchChain}
            chainId={chainId}
            className="w-full"
          />
```

- [ ] **Step 5: Make the drawer's rows jump and close**

In `mobile-bottom-bar.tsx`, add the same two imports. The drawer already owns `open` state via `const [open, setOpen] = useState(false)`.

Add this handler in the component body:

```tsx
  // The sheet covers the form, so it has to get out of the way before the
  // scroll — otherwise the jump lands behind it and looks like nothing
  // happened. One frame is enough for the close animation to start.
  const jumpTo = (id: SectionId) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToSection(id));
  };
```

Add the same local `SummaryRow` component as in Step 4, but taking an `onJump` prop instead of calling `scrollToSection` directly:

```tsx
function SummaryRow({
  section,
  label,
  icon,
  onJump,
  children,
}: {
  section: SectionId;
  label: string;
  icon?: React.ReactNode;
  onJump: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onJump(section)}
      className="flex w-full justify-between rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/60 transition-colors"
    >
      <span className="text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-xs text-right">{children}</span>
    </button>
  );
}
```

Convert the same rows using the same section mapping as Step 4, passing `onJump={jumpTo}`.

Add the error summary in the `DrawerFooter`, above the `SubmitButton`:

```tsx
          <DrawerFooter>
            <ErrorSummary onJump={jumpTo} />
            <SubmitButton
              state={submitState}
              switchChain={switchChain}
              chainId={chainId}
              className="w-full"
              formId="create-slot-form"
            />
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
```

- [ ] **Step 6: Build and commit the whole change**

```bash
npx biome check --write apps/landing/src/app/create
pnpm build:landing
```

Expected: both succeed. `git status --short` should show changes only under `apps/landing/src/app/create`.

```bash
git add -A apps/landing/src/app/create
git commit -m "feat(create): one scrollable frame of six sections

Replaces the three-step wizard. Nothing about slot creation was sequential —
no step read a previous step's answer, and it always submitted in one
transaction — so two thirds of the form was hidden for no reason.

The wizard did provide one thing for free: you could not reach the last step
without passing through the others, so a disabled Create button was always
self-explanatory. An error summary above the button replaces that, naming
the sections that are blocking submission and scrolling to them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Browser verification

**Files:** none — this task changes nothing unless it finds a defect.

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: a screenshot of the finished form, and either a green result or a list of defects to fix and re-verify.

Use the preview tools, not Bash, to run the dev server. `.claude/launch.json` already defines the `landing` configuration on port 3200.

- [ ] **Step 1: Start the dev server and open the form**

`preview_start` with `{name: "landing"}`, then `navigate` to `http://localhost:3200/create`.

- [ ] **Step 2: Check for errors**

`read_console_messages` with `onlyErrors: true`, and `preview_logs` with `level: "error"`. Expected: no errors from the create route. Wallet-connection warnings from an unconnected session are expected and not a defect.

- [ ] **Step 3: Verify the six sections render in order**

`read_page`. Expected: six `<section>` elements with ids `section-recipient`, `section-currency`, `section-economics`, `section-module`, `section-occupancy`, `section-permissions`, each with its heading. No "Step 1 of 3", no Back/Next buttons anywhere on the page.

- [ ] **Step 4: Verify the currency select — the core of this change**

Open the currency select and `read_page`. On Base Sepolia (the default chain) expect four rows: Feed USDC (USDCf), USD Coin (USDC), Wrapped Ether (WETH), Custom address.

`computer {action: "screenshot"}` with the select open. Confirm by eye:
- USDC rows show the blue disc, WETH shows the ETH diamond, Custom address shows the monogram disc.
- All four logos are the same size and share a left edge.
- The logo, name and truncated address sit on one line and do not wrap.

Then select WETH, close the dropdown, and screenshot the trigger. **Confirm the logo appears in the closed trigger too** — this is Radix cloning the item's `ItemText`, the one behaviour in this change that was reasoned about rather than observed. If the logo is missing from the trigger, or the row layout is wrong, fix `section-currency.tsx` and re-verify before continuing.

- [ ] **Step 5: Verify the WETH decimals path**

With WETH selected, open the Occupancy section, set the policy to **Minimum price**, and enter `0.5`. Expected: the description reads "Nobody may declare below 0.5 WETH on this slot" and the unit label beside the input reads `WETH`. This is the 18-decimal path — the one place the new token's decimals actually matter.

- [ ] **Step 6: Verify the custom-address fallback**

Set Currency to "Custom address" and paste `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. Expected: the ERC-20 check resolves to "USD Coin (USDC) · 6 decimals", and no broken image icon appears anywhere.

- [ ] **Step 7: Verify the error summary and jump links**

Set Currency back to a preset. In the Recipient section choose **Group** and clear one recipient address so the form is invalid.

Expected: the summary card shows "1 section needs attention" with a `Recipient` button, and the Create button is disabled. Click the `Recipient` button — the page scrolls to the Recipient section and its heading is fully visible, not tucked under the sticky top nav.

Fix the address so allocations total 100%. Expected: the error summary disappears and the Create button enables.

Then click the summary's "Tax Rate" row. Expected: the page scrolls to the Tax & deposit section.

- [ ] **Step 8: Verify mobile**

`resize_window` with `preset: "mobile"`, then reload so the device gates re-run.

Expected: sections stack in one column; the bottom bar's Finalize button is the filled emerald variant when the form is valid and the outline variant when it is not. Open the drawer and click a summary row — the drawer closes and the page scrolls to that section. `resize_window` back to `desktop` afterwards.

- [ ] **Step 9: Verify both themes**

`resize_window` with `colorScheme: "dark"`, screenshot, then `"light"`, screenshot. Expected: all six section icon tints are legible against both backgrounds, and both token logos read clearly (they carry their own coloured discs, so they should be unaffected).

- [ ] **Step 10: Report**

Send the final desktop screenshot to the user with `SendUserFile`. State plainly what was verified, and name anything that could not be verified — creating a real slot requires a connected wallet and testnet funds, so the actual transaction is out of scope for this pass unless the session has a funded wallet available.

---

## Self-Review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| §1 WETH addresses, `CHAIN_TOKENS` order | 1 |
| §1 `TokenInfo.logo` slug | 1 |
| §1 decimals already handled — must be exercised | 8 (Step 5) |
| §2 logo assets, source and substitution rationale | 2 |
| §2 `TokenLogo` with monogram fallback | 2 |
| §2 rendering in the select | 4 (Step 1), verified 8 (Step 4) |
| §3 wizard removal | 6 |
| §3 six sections, icons, anchors | 3, 6 |
| §3 `FormSection` | 3 |
| §3 file moves, occupancy header strip | 4, 5, 6 |
| §4 desktop summary unchanged | 6 (untouched) |
| §4 `MobileBottomBar` loses `step` | 7 (Step 1) |
| §4 summary rows as jump links, drawer close | 7 (Steps 4–5) |
| §4 validation surfacing | 7 (Step 3) |
| §5 risks | mitigations in 3 (`scroll-mt`), 4 (row shape), 7 (`requestAnimationFrame`), 8 (Radix trigger check) |
| §6 verification | 8 |

No gaps.

**Placeholder scan:** every code step carries the code to write. The two steps that say "edit the copied file" (Task 5, Steps 1–2) enumerate each edit specifically rather than saying "adjust as needed". No "TBD", no "handle edge cases", no "similar to Task N".

**Type consistency:** `SectionId`, `SectionMeta`, `SECTIONS`, `SECTION`, `scrollToSection`, `sectionsWithErrors` are defined in Task 3 and used under exactly those names in Tasks 6 and 7. `TokenLogo`'s props (`slug`, `symbol`, `className`) match its Task 4 call sites. `TokenInfo.logo` is defined in Task 1 and read in Task 4. `ErrorSummary`'s single `onJump` prop matches both call sites in Task 7.

**Known rough edge, deliberate:** Task 6 ends with the build failing on one specific, named type error, resolved by Task 7 Step 1. This is called out in both tasks. The alternative — threading a dead `step` prop through a component about to lose it — is worse.
