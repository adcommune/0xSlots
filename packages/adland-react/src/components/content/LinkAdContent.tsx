import sdk from "@farcaster/miniapp-sdk";
import BasicAdBody from "../BasicAdBody";
import { adCardIcon } from "../../utils/constants";
import { LinkAd } from "@adland/data";

// Link Ad Component
const LinkAdContent = ({ data }: { data: LinkAd }) => {
  const Icon = adCardIcon["link"];
  const { data: linkData, metadata: linkMetadata } = data;

  return (
    <BasicAdBody
      name={"LINK"}
      onClick={() => {
        sdk.actions.openUrl(linkData.url);
      }}
    >
      <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
        {linkMetadata?.image && (
          <img
            src={linkMetadata.image}
            alt={linkMetadata.title || "Link preview"}
            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {!Boolean(linkMetadata) && (
            <div className="flex flex-row items-center gap-2">
              <Icon className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0" />
              <p className="font-bold text-primary">LINK</p>
            </div>
          )}
          {linkMetadata?.title && (
            <p className="text-sm text-muted-foreground truncate">
              {linkMetadata.title}
            </p>
          )}
          {linkMetadata?.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">
              {linkMetadata.description}
            </p>
          )}
        </div>
      </div>
    </BasicAdBody>
  );
};

export default LinkAdContent;
