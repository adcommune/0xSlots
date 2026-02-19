"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="border-2 border-black px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-black hover:text-white"
      >
        {shorten(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="border-2 border-black bg-black text-white px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-white hover:text-black"
    >
      Connect
    </button>
  );
}
