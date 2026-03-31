# @adland/data

Type-safe data schemas, validation, and metadata enrichment for [0xSlots](https://0xslots.org) ad types.

## Install

```bash
npm install @adland/data
```

## Ad Types

| Type | Data | Metadata |
|------|------|----------|
| `link` | `{ url }` | title, description, image, icon |
| `cast` | `{ hash }` | username, pfpUrl, text, timestamp |
| `miniapp` | `{ url }` | icon, title, description, imageUrl |
| `token` | `{ address, chainId }` | name, symbol, decimals, logoURI |
| `farcasterProfile` | `{ fid }` | username, displayName, bio, pfpUrl |

## Usage

### Types

```ts
import type { AdData, AdType, LinkAd, CastAd } from "@adland/data";
```

### Form Validation

Each ad definition exposes a Zod schema — works directly with form libraries:

```ts
import { zodResolver } from "@hookform/resolvers/zod";
import { linkAd } from "@adland/data";

const form = useForm({
  resolver: zodResolver(linkAd.data),
});
```

### Processing Pipeline

Validate, verify against external sources, and enrich with metadata in one call:

```ts
import { linkAd } from "@adland/data";

const result = await linkAd.safeProcess({ url: "https://example.com" });

if (result.success) {
  console.log(result.data);     // validated input
  console.log(result.metadata); // { title, description, image, icon }
}
```

### Registry

```ts
import { ads, getAd, validateAdData } from "@adland/data";

const castDef = getAd("cast");
const result = validateAdData({ type: "cast", data: { hash: "0x..." } });
```

### Farcaster Utilities

```ts
import { parseAccountAssociation, FarcasterAPI } from "@adland/data";

const parsed = parseAccountAssociation(accountAssociation);
// => { fid, address, type, domain }
```

## How It Works

Each ad definition created with `defineAd()` provides:

1. **Zod schema** — runtime data validation
2. **`verify(data)`** — checks validity against external sources (API, blockchain)
3. **`getMetadata(data)`** — fetches rich metadata (titles, images, etc.)
4. **`process(data)` / `safeProcess(data)`** — runs the full pipeline

## License

MIT
