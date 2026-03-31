# @adland/react

React components for displaying and tracking ads from [0xSlots](https://0xslots.org) — the on-chain advertising protocol.

## Install

```bash
npm install @adland/react
```

**Peer dependencies:** `react` ^18 || ^19, `react-dom` ^18 || ^19

## Quick Start

```tsx
import { Ad, AdImage, AdTitle, AdDescription, AdBadge } from "@adland/react";

function AdSlot() {
  return (
    <Ad slot="0x123..." auth="farcaster" context="sidebar">
      <AdImage className="h-20 w-20 rounded" />
      <AdTitle className="font-semibold" />
      <AdDescription className="text-sm text-gray-600" />
      <AdBadge />
    </Ad>
  );
}
```

## Components

Uses the **compound component** pattern — nest sub-components inside `<Ad>`.

### `<Ad>` (Root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slot` | `string` | — | Slot contract address (on-chain fetch) |
| `data` | `AdData` | — | Static ad data (skips on-chain fetch) |
| `chainId` | `number` | `8453` | BASE or BASE Sepolia |
| `rpcUrl` | `string` | — | Custom RPC URL |
| `auth` | `"farcaster" \| "none"` | `"none"` | Auth method for verified tracking |
| `context` | `string` | — | Placement context (e.g. `"sidebar"`) |

### Sub-components

| Component | Description |
|-----------|-------------|
| `<AdImage>` | Ad image with fallback |
| `<AdTitle>` | Ad title |
| `<AdDescription>` | Ad description |
| `<AdBadge>` | Ad type badge with icon |
| `<AdLabel>` | "AD" label |

### State components

Conditionally render based on ad state:

```tsx
<Ad slot="0x123...">
  <AdLoading>Loading...</AdLoading>
  <AdError>Failed to load</AdError>
  <AdEmpty>Your ad here</AdEmpty>
  <AdLoaded>
    <AdImage />
    <AdTitle />
  </AdLoaded>
</Ad>
```

## Hook

Access ad context from any child component:

```tsx
import { useAd } from "@adland/react";

function Custom() {
  const { data, isLoading, error, isEmpty } = useAd();
  if (!data) return null;
  return <p>{data.data.title}</p>;
}
```

## Utilities

```ts
import {
  getAdImage,
  getAdTitle,
  getAdDescription,
  getAdType,
  adCardIcon,
  adCardLabel,
} from "@adland/react";
```

## Ad Types

Supports 5 ad types: **link**, **cast**, **miniapp**, **token**, **farcasterProfile**.

## Tracking

Impressions and clicks are tracked automatically:

- **Impressions** — triggered via `IntersectionObserver` (50%+ visibility)
- **Clicks** — tracked on ad interaction
- **Deduplication** — one impression per slot per session
- **Farcaster auth** — verified identity when `auth="farcaster"`

## License

MIT
