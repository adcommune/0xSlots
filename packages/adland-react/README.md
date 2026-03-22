# @adland/react

A simple React component library for tracking ad views and clicks with built-in support for Farcaster MiniApp SDK & AdLand ads

## Installation

```bash
npm install @adland/react
# or
pnpm add @adland/react
# or
yarn add @adland/react
```

## Usage

```tsx
import { Ad } from "@adland/react";

function App() {
  return (
    <Ad owner="0x123..." adId="ad-1" network="testnet">
      <img src="ad.jpg" alt="Advertisement" />
    </Ad>
  );
}

// network defaults to "testnet" if omitted
<Ad owner="0x123..." adId="ad-1">
  <img src="ad.jpg" alt="Advertisement" />
</Ad>
```

## Features

- 🎯 **Simple API**: Minimal configuration required
- 📊 **View & Click Tracking**: Automatic view tracking with IntersectionObserver and click tracking
- 🔐 **Farcaster SDK Integration**: Built-in support for Farcaster MiniApp SDK's `quickAuth` for authenticated requests
- 🛡️ **Session-based Deduplication**: Prevents duplicate view tracking within the same browser session
- 📦 **TypeScript Support**: Full TypeScript definitions included

## API

### `<Ad />` Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `owner` | `string` | **required** | The owner/creator address of the ad |
| `adId` | `string` | **required** | Unique identifier for the ad |
| `children` | `ReactNode` | **required** | The content to display in the ad |
| `network` | `"testnet"` | `"testnet"` | Network to use for tracking requests. Currently only testnet is supported. Maps to `testnet.adland.space` |

## License

MIT

