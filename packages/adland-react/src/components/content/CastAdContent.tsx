import { adCardIcon } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/relativeTime";
import sdk from "@farcaster/miniapp-sdk";
import BasicAdBody from "../BasicAdBody";
import { CastAd } from "@adland/data";

// Cast Ad Component
const CastAdContent = ({ data }: { data: CastAd }) => {
  const { data: castData, metadata: castMetadata } = data;
  const Icon = adCardIcon["cast"];
  return (
    <BasicAdBody
      name={"CAST"}
      onClick={() => {
        sdk.actions.viewCast({
          hash: castData.hash,
        });
      }}
    >
      <div className="flex flex-row items-center gap-2">
        {castMetadata?.pfpUrl ? (
          <img
            src={castMetadata.pfpUrl}
            alt="Cast pfp"
            className="w-10 h-10 rounded-md"
          />
        ) : (
          <Icon className="w-5 h-5 md:w-7 md:h-7" />
        )}
        <div className="flex flex-col gap-0">
          {castMetadata?.username ? (
            <div className="flex flex-row items-center gap-1">
              <p className="font-bold text-primary">{castMetadata.username}</p>
              {castMetadata.timestamp && (
                <p className="text-xs text-muted-foreground/80">
                  {formatRelativeTime(
                    new Date(castMetadata.timestamp).getTime(),
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="font-bold text-primary">CAST</p>
          )}
          {castMetadata?.text ? (
            <p className="text-black">{castMetadata.text}</p>
          ) : (
            <p className="text-muted-foreground/80">cast</p>
          )}
        </div>
      </div>
    </BasicAdBody>
  );
};

export default CastAdContent;
