"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

import { EventsTable } from "./components/events-table";
import { ModulesTable } from "./components/modules-table";
import { RecipientsTable } from "./components/recipients-table";
import { SlotsTable } from "./components/slots-table";
import { StatsBar } from "./components/stats-bar";

export default function ExplorerPage() {
  return (
    <div className="min-h-screen">
      <PageHeader>
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
      </PageHeader>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "recipients",
              label: "Recipients",
              content: () => <RecipientsTable />,
            },
            {
              id: "slots",
              label: "Slots",
              content: () => <SlotsTable />,
            },
            {
              id: "modules",
              label: "Modules",
              content: () => <ModulesTable />,
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
