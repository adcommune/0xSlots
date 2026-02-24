"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const CONNECTOR_LABELS: Record<string, string> = {
  metaMask: "MetaMask",
  walletConnect: "WalletConnect",
};

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`border-2 border-black px-4 py-2 font-mono text-xs uppercase tracking-wider ${
          isConnected
            ? "hover:bg-black hover:text-white"
            : "bg-black text-white hover:bg-white hover:text-black"
        }`}
      >
        {isConnected && address ? shorten(address) : "Connect"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={modalRef}
            className="border-4 border-black bg-white w-full max-w-sm mx-4"
          >
            <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
              <h2 className="font-black text-sm uppercase tracking-tight">
                {isConnected ? "Wallet" : "Connect Wallet"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="font-mono text-lg leading-none hover:opacity-60"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              {isConnected && address ? (
                <>
                  <div className="border-2 border-black px-6 py-4 font-mono text-xs break-all">
                    {address}
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      setOpen(false);
                    }}
                    className="w-full border-2 border-black px-6 py-4 font-mono text-sm uppercase tracking-wider text-left hover:bg-black hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => {
                      connect({ connector });
                      setOpen(false);
                    }}
                    className="w-full border-2 border-black px-6 py-4 font-mono text-sm uppercase tracking-wider text-left hover:bg-black hover:text-white transition-colors"
                  >
                    {CONNECTOR_LABELS[connector.id] ?? connector.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
