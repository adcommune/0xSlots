"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className="border-2 border-black bg-black text-white px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-white hover:text-black"
              >
                Connect
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                className="border-2 border-red-600 bg-red-600 text-white px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-white hover:text-red-600"
              >
                Wrong Network
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                type="button"
                className="border-2 border-black px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-black hover:text-white"
              >
                {account.displayName}
              </button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
