# Ad Models

The `@adland/data` package now includes a class-based model system that encapsulates schema validation, verification, and metadata.

## Overview

Each ad type has a corresponding model class that extends `DataModel`:
- `LinkAdModel` - for link ads
- `CastAdModel` - for cast ads
- `MiniAppAdModel` - for miniapp ads
- `TokenAdModel` - for token ads

## Basic Usage

### Using Pre-configured Models

```typescript
import { adModels, getAdModel } from "@adland/data";

// Use the pre-configured model
const miniappModel = adModels.miniapp;

// Or get by type
const linkModel = getAdModel("link");
```

### Validate Data

```typescript
import { LinkAdModel } from "@adland/data";

const model = new LinkAdModel();

// Validate (throws on error)
try {
  const validData = await model.validate({
    type: "link",
    data: { url: "https://example.com" }
  });
} catch (error) {
  // Handle validation error
}

// Safe validate (returns result)
const result = await model.safeValidate({
  type: "link",
  data: { url: "invalid" }
});

if (!result.success) {
  console.error(result.error);
}
```

### Verify Data

```typescript
import { MiniAppAdModel } from "@adland/data";

// Create a custom model with verification
class MyMiniAppModel extends MiniAppAdModel {
  async verify(data: MiniAppAd): Promise<void> {
    // Custom verification logic
    const response = await fetch(data.data.url, { method: "HEAD" });
    if (!response.ok) {
      throw new Error("URL is not accessible");
    }
    
    // Check for Farcaster frame metadata
    const html = await fetch(data.data.url).then(r => r.text());
    if (!html.includes('property="fc:frame"')) {
      throw new Error("URL does not contain Farcaster frame metadata");
    }
  }
}

const model = new MyMiniAppModel();

// Prepare = validate + verify
try {
  const prepared = await model.prepare({
    type: "miniapp",
    data: { url: "https://my-miniapp.com" }
  });
} catch (error) {
  // Handle validation or verification error
}

// Safe prepare
const result = await model.safePrepare({
  type: "miniapp",
  data: { url: "https://my-miniapp.com" }
});
```

### Custom Metadata

```typescript
import { LinkAdModel } from "@adland/data";

const model = new LinkAdModel({
  displayName: "External Link",
  description: "Promote any external website",
  icon: "🔗"
});

console.log(model.metadata.displayName); // "External Link"
```

## Full Pipeline Example

```typescript
import { MiniAppAdModel } from "@adland/data";

// Create custom model with verification
class VerifiedMiniAppModel extends MiniAppAdModel {
  async verify(data: MiniAppAd): Promise<void> {
    // Verify URL is accessible
    const response = await fetch(data.data.url, { method: "HEAD" });
    if (!response.ok) {
      throw new Error(`URL returned ${response.status}`);
    }
    
    // Verify it's actually a miniapp
    const html = await fetch(data.data.url).then(r => r.text());
    const hasFrameMeta = html.includes('property="fc:frame"') || 
                        html.includes('name="fc:frame"');
    
    if (!hasFrameMeta) {
      throw new Error("URL does not appear to be a Farcaster miniapp");
    }
  }
}

// Use in form submission
async function handleSubmit(formData: unknown) {
  const model = new VerifiedMiniAppModel();
  
  try {
    // Full pipeline: validate → verify
    const prepared = await model.prepare(formData);
    
    // Data is validated and verified, safe to upload
    await uploadAd(prepared);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      console.error("Validation failed:", error.errors);
    } else {
      // Handle verification errors
      console.error("Verification failed:", error.message);
    }
  }
}
```

## Model Registry

```typescript
import { adModels, getAdModel } from "@adland/data";

// Access all models
const allModels = {
  link: adModels.link,
  cast: adModels.cast,
  miniapp: adModels.miniapp,
  token: adModels.token,
};

// Get model by type
const model = getAdModel("miniapp");

// Access metadata
console.log(adModels.miniapp.metadata.displayName);
console.log(adModels.miniapp.metadata.description);
```

## API Reference

### `DataModel<S, Meta>`

Base class for all data models.

**Methods:**
- `validate(input: unknown): Promise<z.infer<S>>` - Validate input against schema (throws on error)
- `safeValidate(input: unknown): Promise<{ success: boolean; data?: z.infer<S>; error?: z.ZodError }>` - Safe validation
- `verify(data: z.infer<S>): Promise<void>` - Custom verification (override in subclasses)
- `prepare(input: unknown): Promise<z.infer<S>>` - Full pipeline: validate → verify (throws on error)
- `safePrepare(input: unknown): Promise<{ success: boolean; data?: z.infer<S>; error?: string | z.ZodError }>` - Safe prepare

**Properties:**
- `schema: S` - The Zod schema
- `metadata: Meta` - Model metadata

### `AdModel<T>`

Abstract base class for ad models.

**Properties:**
- `type: T["type"]` - The ad type

### Model Classes

- `LinkAdModel` - Link ad model
- `CastAdModel` - Cast ad model
- `MiniAppAdModel` - MiniApp ad model
- `TokenAdModel` - Token ad model

### Registry

- `adModels` - Object containing all pre-configured models
- `getAdModel(type)` - Get model by type

## Benefits

1. **Encapsulation**: Schema, verification, and metadata in one place
2. **Type Safety**: Full TypeScript support
3. **Extensibility**: Easy to extend with custom verification
4. **Consistency**: Same API for all ad types
5. **Metadata**: Built-in support for display names, descriptions, icons
6. **Pipeline**: `prepare()` method handles validate → verify flow

