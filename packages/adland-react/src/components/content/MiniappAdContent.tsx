import { MiniAppAd } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";
import BasicAdBody from "../BasicAdBody";
import { adCardIcon } from "../../utils/constants";

const MiniappAdContent = ({ data }: { data: MiniAppAd }) => {
  const Icon = adCardIcon["miniapp"];
  const { data: miniappData, metadata: miniappMetadata } = data;
  console.log({ miniappMetadata });
  return (
    <BasicAdBody
      name={"MINIAPP"}
      onClick={() => {
        sdk.actions.openMiniApp({
          url: miniappData.url,
        });
      }}
    >
      <div className="flex flex-row items-center gap-2">
        {miniappMetadata?.icon ? (
          <img
            src={miniappMetadata.icon}
            alt="Miniapp icon"
            className="w-10 h-10 rounded-md"
          />
        ) : (
          <Icon className="w-5 h-5 md:w-7 md:h-7" />
        )}
        <div className="flex flex-col gap-0">
          {miniappMetadata?.title ? (
            <p className="font-bold text-primary">{miniappMetadata.title}</p>
          ) : (
            <p className="font-bold text-primary">MINIAPP</p>
          )}
          {miniappMetadata?.description ? (
            <p className="text-xs text-muted-foreground/80">
              {miniappMetadata.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80">miniapp</p>
          )}
        </div>
      </div>
    </BasicAdBody>
  );
};

export default MiniappAdContent;
