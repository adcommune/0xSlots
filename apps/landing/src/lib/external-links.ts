import sdk from "@farcaster/miniapp-sdk";
import { BookOpen, Github, type LucideIcon, Send } from "lucide-react";

export interface ExternalLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const EXTERNAL_LINKS: ExternalLink[] = [
  { label: "Docs", href: "https://docs.0xslots.org", icon: BookOpen },
  {
    label: "GitHub",
    href: "https://github.com/adcommune/0xSlots",
    icon: Github,
  },
  { label: "Telegram", href: "https://t.me/+AQ3SdkC0SCM4NTdk", icon: Send },
];

/**
 * Open an off-app URL. Inside a miniapp `window.open` is a no-op, so the host
 * SDK has to do it.
 */
export function openExternal(href: string, isMiniApp: boolean) {
  if (isMiniApp) {
    sdk.actions.openUrl(href);
  } else {
    window.open(href, "_blank");
  }
}
