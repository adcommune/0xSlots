import { AdType } from "@adland/data";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import {
  Link,
  MessageCircle,
  LayoutGrid,
  LucideProps,
  Coins,
  User,
} from "lucide-react";

export const adCardIcon: Record<
  AdType,
  ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >
> = {
  link: Link,
  cast: MessageCircle,
  miniapp: LayoutGrid,
  token: Coins,
  farcasterProfile: User,
};

export const adCardLabel: Record<AdType, string> = {
  link: "Link",
  cast: "Cast",
  miniapp: "Miniapp",
  token: "Token",
  farcasterProfile: "Profile",
};

export const adlandApiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3069"
    : "https://api.adland.space";
