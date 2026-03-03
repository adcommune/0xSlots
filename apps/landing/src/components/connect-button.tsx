"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <Button onClick={openConnectModal} size="sm">
                Connect
              </Button>
            ) : chain.unsupported ? (
              <Button onClick={openChainModal} variant="destructive" size="sm">
                Wrong Network
              </Button>
            ) : (
              <Button onClick={openAccountModal} variant="outline" size="sm">
                {account.displayName}
              </Button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
