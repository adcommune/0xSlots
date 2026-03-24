import { APP_URL } from "@/constants";

type GetFrameMetadataProps = {
  title: string;
  path?: string;
  previewPath?: string;
};

export function getFrameMetadata({
  title,
  path = "",
  previewPath,
}: GetFrameMetadataProps) {
  if (!previewPath) {
    previewPath = "/api/og";
  }

  const previewURL = `${APP_URL}${previewPath}`;

  const frame = {
    version: "next",
    imageUrl: previewURL,
    button: {
      title,
      action: {
        type: "launch_miniapp",
        name: "0xSlots",
        url: `${APP_URL}${path}`,
        splashImageUrl: `${APP_URL}/logo.png`,
        splashBackgroundColor: "#ffffff",
      },
    },
  };

  const metadata = {
    title: `0xSlots — ${title}`,
    description:
      "Immutable & modular collective ownership slots on Ethereum. Perpetual onchain real estate powered by partial common ownership.",
    openGraph: {
      title: `0xSlots — ${title}`,
      description:
        "Immutable & modular collective ownership slots on Ethereum.",
      images: [previewURL],
    },
    twitter: {
      title: `0xSlots — ${title}`,
      description:
        "Immutable & modular collective ownership slots on Ethereum.",
      card: "summary_large_image" as const,
      images: [previewURL],
    },
  };

  return { frame, metadata };
}
