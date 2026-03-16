# @adland/data

TypeScript types and Zod schemas for AdLand ad types. Perfect for building forms with react-hook-form, validating data, and type-safe ad handling.

## Installation

```bash
npm install @adland/data
# or
pnpm add @adland/data
# or
yarn add @adland/data
```

## Usage

### TypeScript Types

Types are automatically derived from Zod schemas, ensuring type safety:

```tsx
import type { AdData, LinkAd, SwapAd } from "@adland/data";

// Use the types
const linkAd: LinkAd = {
  type: "link",
  url: "https://example.com",
};

const swapAd: SwapAd = {
  type: "swap",
  fromToken: "USDC",
  toToken: "ETH",
  amount: "100",
};
```

### Zod Schemas

Use Zod schemas for validation and form integration:

```tsx
import { linkAdSchema, swapAdSchema, validateAdData } from "@adland/data";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// With react-hook-form
function MyForm() {
  const form = useForm({
    resolver: zodResolver(swapAdSchema),
  });
  
  // ... rest of form
}

// Direct validation
const result = validateAdData(someData);
if (result.success) {
  console.log("Valid ad data:", result.data);
} else {
  console.error("Validation errors:", result.error);
}
```

### Combining Schemas

Zod makes it easy to extend and combine schemas:

```tsx
import { linkAdSchema } from "@adland/data";
import { z } from "zod";

// Extend a schema
const customLinkSchema = linkAdSchema.extend({
  title: z.string(),
  description: z.string().optional(),
});

// Combine schemas
const adWithMetadata = z.intersection(
  linkAdSchema,
  z.object({ metadata: z.record(z.unknown()) })
);
```

## Ad Types

### Link Ad
Basic link ad type.

```typescript
type LinkAd = {
  type: "link";
  url: string;
}
```

### Cast Ad
Farcaster cast link ad type.

```typescript
type CastAd = {
  type: "cast";
  url: string;
}
```

### MiniApp Ad
Farcaster mini app link ad type.

```typescript
type MiniAppAd = {
  type: "miniapp";
  url: string;
}
```

### Token Ad
Token information ad type.

```typescript
type TokenAd = {
  type: "token";
  token: string; // Token address or symbol
}
```

### Swap Ad
Token swap ad type.

```typescript
type SwapAd = {
  type: "swap";
  fromToken: string; // Token address or symbol
  toToken: string; // Token address or symbol
  amount?: string; // Optional amount
}
```

## API

### Types

- `AdType` - Union type of all ad type strings
- `AdData` - Union type of all ad data objects (discriminated union)
- `LinkAd` - Link ad type
- `CastAd` - Cast ad type
- `MiniAppAd` - MiniApp ad type
- `TokenAd` - Token ad type
- `SwapAd` - Swap ad type

### Schemas

- `linkAdSchema` - Zod schema for link ads
- `castAdSchema` - Zod schema for cast ads
- `miniappAdSchema` - Zod schema for mini app ads
- `tokenAdSchema` - Zod schema for token ads
- `swapAdSchema` - Zod schema for swap ads
- `adDataSchema` - Discriminated union schema for all ad types
- `adSchemas` - Object containing all schemas
- `getAdSchema(type)` - Get schema for a specific ad type
- `getAllAdSchemas()` - Get all ad schemas
- `validateAdData(data)` - Validate ad data and return result

## Integration Examples

### React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { swapAdSchema, type SwapAd } from "@adland/data";

function SwapForm() {
  const form = useForm<SwapAd>({
    resolver: zodResolver(swapAdSchema),
    defaultValues: {
      type: "swap",
      fromToken: "",
      toToken: "",
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### Formik

```tsx
import { Formik } from "formik";
import { swapAdSchema } from "@adland/data";
import { toFormikValidationSchema } from "zod-formik-adapter";

function SwapForm() {
  return (
    <Formik
      validationSchema={toFormikValidationSchema(swapAdSchema)}
      initialValues={{
        type: "swap" as const,
        fromToken: "",
        toToken: "",
      }}
      onSubmit={handleSubmit}
    >
      {/* form */}
    </Formik>
  );
}
```

## License

MIT
