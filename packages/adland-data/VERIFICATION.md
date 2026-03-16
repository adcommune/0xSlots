# Ad Verification System

The `@adland/data` package includes an optional verification system that allows you to add custom async validation logic for ad data before it's uploaded.

## Overview

- **Base schemas**: Synchronous validation (required fields, URL format, etc.)
- **Verification functions**: Optional async validation (custom checks like verifying a URL is actually a miniapp)

## Usage

### 1. Add a Verifier

```typescript
import { adVerifiers } from "@adland/data";

// Example: Verify a URL is actually a miniapp
// Just directly assign to the adVerifiers object
adVerifiers.miniapp = async (data) => {
  try {
    const response = await fetch(data.url, { method: "HEAD" });
    
    // Check if URL is accessible
    if (!response.ok) {
      return { success: false, error: "URL is not accessible" };
    }
    
    // Check for miniapp-specific headers or content
    const contentType = response.headers.get("content-type");
    const isMiniapp = contentType?.includes("text/html") || 
                      response.url.includes("farcaster.xyz");
    
    if (!isMiniapp) {
      return { success: false, error: "URL does not appear to be a miniapp" };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to verify URL" 
    };
  }
};
```

### 2. Use in Forms

```typescript
import { verifyAdData, adVerifiers } from "@adland/data";
import { useForm } from "react-hook-form";

// Add verifier (do this once, e.g., in app initialization)
adVerifiers.miniapp = async (data) => {
  // Your verification logic
  return { success: true };
};

function MyForm() {
  const form = useForm();
  
  const onSubmit = async (data) => {
    // First validate synchronously
    const validation = validateAdData(data);
    if (!validation.success) {
      // Handle sync validation errors
      return;
    }
    
    // Then verify asynchronously (optional)
    const verification = await verifyAdData(validation.data);
    if (!verification.success) {
      // Handle async verification errors
      form.setError("url", { message: verification.error });
      return;
    }
    
    // Both validations passed, proceed with upload
    await uploadAd(validation.data);
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### 3. Manual Verification

```typescript
import { adVerifiers } from "@adland/data";

// Get verifier for a specific type
const miniappVerifier = adVerifiers.miniapp;

if (miniappVerifier) {
  const result = await miniappVerifier({ url: "https://example.com" });
  if (!result.success) {
    console.error(result.error);
  }
}
```

## API Reference

### `adVerifiers`

The verifiers object where you can directly assign verification functions.

**Usage:**
```typescript
adVerifiers.miniapp = async (data) => {
  // Your verification logic
  return { success: true };
};
```

### `verifyAdData(adData: AdData): Promise<{ success: boolean, error?: string }>`

Verify ad data using registered verifiers.

**Returns:**
- `{ success: true }` if no verifier is registered or verification passes
- `{ success: false, error: string }` if verification fails

### `getAdVerifier<T>(type: T): AdVerifier<T> | undefined`

Get the verifier for an ad type (convenience function, or access `adVerifiers[type]` directly).

## Examples

### Verify Miniapp URL

```typescript
adVerifiers.miniapp = async (data) => {
  try {
    // Check if URL has Farcaster miniapp metadata
    const response = await fetch(data.url);
    const html = await response.text();
    
    // Check for Farcaster frame metadata
    const hasFrameMeta = html.includes('property="fc:frame"') || 
                        html.includes('name="fc:frame"');
    
    return {
      success: hasFrameMeta,
      error: hasFrameMeta ? undefined : "URL does not contain Farcaster frame metadata"
    };
  } catch {
    return { success: false, error: "Failed to fetch URL" };
  }
});
```

### Verify Cast URL

```typescript
adVerifiers.cast = async (data) => {
  // Verify it's a valid Warpcast URL
  const isValidWarpcast = data.url.includes("warpcast.com") || 
                          data.url.includes("farcaster.xyz");
  
  return {
    success: isValidWarpcast,
    error: isValidWarpcast ? undefined : "Must be a valid Farcaster cast URL"
  };
});
```

### Verify Token Address

```typescript
adVerifiers.token = async (data) => {
  // Verify token address format
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(data.token);
  
  return {
    success: isValidAddress,
    error: isValidAddress ? undefined : "Invalid token address format"
  };
});
```

