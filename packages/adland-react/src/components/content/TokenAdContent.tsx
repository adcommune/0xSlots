import { TokenAd } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";
import BasicAdBody from "../BasicAdBody";
import { adCardIcon } from "../../utils/constants";

const TokenAdContent = ({ data }: { data: TokenAd }) => {
  const Icon = adCardIcon["token"];
  const { data: tokenData, metadata: tokenMetadata } = data;

  return (
    <BasicAdBody
      name={"TOKEN"}
      onClick={() => {
        sdk.actions.viewToken({ token: tokenData.address });
      }}
    >
      <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
        {tokenMetadata?.logoURI ? (
          <img
            src={tokenMetadata.logoURI}
            alt={tokenMetadata.name || "Token logo"}
            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
          />
        ) : (
          <Icon className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0" />
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {!Boolean(tokenMetadata) && (
            <div className="flex flex-row items-center gap-2">
              <Icon className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0" />
              <p className="font-bold text-primary">TOKEN</p>
            </div>
          )}
          {tokenMetadata?.symbol ? (
            <p className="text-sm font-bold text-primary truncate">
              ${tokenMetadata.symbol.toUpperCase()}
            </p>
          ) : (
            <p className="text-sm font-bold text-primary">TOKEN</p>
          )}
          {tokenMetadata?.name ? (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">
              {tokenMetadata.name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">
              {tokenData.address.slice(0, 6)}...{tokenData.address.slice(-4)}
            </p>
          )}
        </div>
      </div>
    </BasicAdBody>
  );
};

export default TokenAdContent;
