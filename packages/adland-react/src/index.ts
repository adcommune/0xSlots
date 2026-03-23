// Compound Ad components
export {
  Ad,
  AdBadge,
  AdDescription,
  AdEmpty,
  AdError,
  AdImage,
  AdLabel,
  AdLoaded,
  AdLoading,
  AdTitle,
} from "./components/Ad";

export type {
  AdBadgeProps,
  AdDescriptionProps,
  AdImageProps,
  AdLabelProps,
  AdStatusProps,
  AdTitleProps,
} from "./components/Ad";

// Context hook
export { useAd } from "./hooks/useAdContext";
export type { AdContextValue } from "./hooks/useAdContext";

// Field helpers
export { getAdDescription, getAdImage, getAdTitle, getAdType } from "./utils/ad-fields";

// Types
export type { AdProps, AdDataQueryError } from "./types";

// Constants
export { adCardIcon, adCardLabel } from "./utils/constants";
