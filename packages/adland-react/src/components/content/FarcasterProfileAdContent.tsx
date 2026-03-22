import { FarcasterProfileAd } from "@adland/data";
import sdk from "@farcaster/miniapp-sdk";
import BasicAdBody from "../BasicAdBody";
import { adCardIcon } from "../../utils/constants";

// Farcaster Profile Ad Component
const FarcasterProfileAdContent = ({ data }: { data: FarcasterProfileAd }) => {
  const Icon = adCardIcon["farcasterProfile"];
  const { data: profileData, metadata: profileMetadata } = data;
  const fid = profileData.fid;

  return (
    <BasicAdBody
      name={"PROFILE"}
      onClick={() => {
        sdk.actions.viewProfile({ fid: parseInt(fid) });
      }}
    >
      <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
        {profileMetadata?.pfpUrl ? (
          <img
            src={profileMetadata.pfpUrl}
            alt={profileMetadata.username || "Profile picture"}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <Icon className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0" />
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {!Boolean(profileMetadata) && (
            <div className="flex flex-row items-center gap-2">
              <Icon className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0" />
              <p className="font-bold text-primary">PROFILE</p>
            </div>
          )}
          <div className="flex flex-row items-center gap-1">
            <p className="text-sm text-primary truncate">
              <span className="font-bold">{profileMetadata?.displayName} </span>
              <span className="text-xs font-light text-muted-foreground/80">
                @{profileMetadata?.username}
              </span>
            </p>
            {profileMetadata?.pro && (
              <span className="text-xs bg-primary text-primary-foreground px-1 rounded">
                PRO
              </span>
            )}
          </div>
          {profileMetadata?.bio ? (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">
              {profileMetadata.bio}
            </p>
          ) : (
            (profileMetadata?.followers !== undefined ||
              profileMetadata?.following !== undefined) && (
              <p className="text-xs text-muted-foreground/80">
                {profileMetadata.followers !== undefined && (
                  <span>
                    {profileMetadata.followers.toLocaleString()} followers
                  </span>
                )}
                {profileMetadata.followers !== undefined &&
                  profileMetadata.following !== undefined &&
                  " • "}
                {profileMetadata.following !== undefined && (
                  <span>
                    {profileMetadata.following.toLocaleString()} following
                  </span>
                )}
              </p>
            )
          )}
        </div>
      </div>
    </BasicAdBody>
  );
};

export default FarcasterProfileAdContent;
