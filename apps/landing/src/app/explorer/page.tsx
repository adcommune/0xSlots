"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { Button } from "@/components/ui/button";

import { EventsTable } from "./components/events-table";
import { SlotsTable } from "./components/slots-table";
import { StatsBar } from "./components/stats-bar";

export default function ExplorerPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-tight">
                  Explorer
                </h1>
                <p className="text-muted-foreground text-xs">
                  Base Sepolia · v3
                </p>
              </div>
              <div className="w-px h-6 bg-border" />
              <StatsBar />
            </div>
            <div className="flex items-center gap-3">
              <ConnectButton />
              <Button size="sm" asChild>
                <Link href="/explorer/create">+ Create Slot</Link>
              </Button>
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

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Powered by 0xSlots · The Graph
        </div>
      </div>
    </div>
  );
}
