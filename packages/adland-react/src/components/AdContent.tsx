import type { AdData } from "@adland/data";

import BasicAdBody from "./BasicAdBody";
import CastAdContent from "./content/CastAdContent";
import FarcasterProfileAdContent from "./content/FarcasterProfileAdContent";
import LinkAdContent from "./content/LinkAdContent";
import MiniappAdContent from "./content/MiniappAdContent";
import TokenAdContent from "./content/TokenAdContent";

export interface AdContentProps extends React.HTMLAttributes<HTMLDivElement> {
  data: AdData;
}

/**
 * Renders ad content from static AdData (no on-chain fetching).
 * Use this when you already have the ad data (e.g. from history/subgraph).
 */
export function AdContent({ data, ...props }: AdContentProps) {
  return (
    <div {...props}>
      {data.type === "link" && <LinkAdContent data={data} />}
      {data.type === "cast" && <CastAdContent data={data} />}
      {data.type === "miniapp" && <MiniappAdContent data={data} />}
      {data.type === "token" && <TokenAdContent data={data} />}
      {data.type === "farcasterProfile" && (
        <FarcasterProfileAdContent data={data} />
      )}
    </div>
  );
}
