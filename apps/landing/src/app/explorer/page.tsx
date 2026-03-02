"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";
import { ExplorerTabs } from "@/components/explorer-tabs";

import { EventsTable } from "./components/events-table";
import { SlotsTable } from "./components/slots-table";
import { StatsBar } from "./components/stats-bar";

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black bg-linear-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-tight">
                  Explorer
                </h1>
                <p className="text-gray-400 font-mono text-[10px]">
                  Base Sepolia · v3
                </p>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <StatsBar />
            </div>
            <div className="flex items-center gap-3">
              <ConnectButton />
              <Link
                href="/explorer/create"
                className="border-2 border-black bg-black text-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors"
              >
                + Create Slot
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "slots",
              label: "Slots",
              content: () => <SlotsTable />,
            },
            {
              id: "events",
              label: "Events",
              content: () => <EventsTable />,
            },
          ]}
        />

        <div className="mt-8 text-center text-xs text-gray-400 font-mono">
          Powered by 0xSlots v3 · The Graph
        </div>
      </div>
    </div>
  );
}
