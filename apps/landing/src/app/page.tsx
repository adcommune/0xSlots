"use client";

import { FileBox, LandPlot, List, PlusIcon, User } from "lucide-react";
import Link from "next/link";

import { EventsTable } from "@/components/explorer/events-table";
import { ModulesTable } from "@/components/explorer/modules-table";
import { RecipientsTable } from "@/components/explorer/recipients-table";
import { SlotsTable } from "@/components/explorer/slots-table";
import { StatsBar } from "@/components/explorer/stats-bar";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PageHeader>
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              Explorer
            </h1>
            <p className="text-muted-foreground text-xs">Base Sepolia · v3</p>
          </div>
          <div className="w-px h-6 bg-border" />
          <StatsBar />
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild>
            <div>
              <PlusIcon className="w-5 h-5" />
              <Link href="/create">Create Slot</Link>
            </div>
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "recipients",
              label: "Recipients",
              icon: User,
              content: () => <RecipientsTable />,
            },
            {
              id: "slots",
              label: "Slots",
              icon: LandPlot,
              content: () => <SlotsTable />,
            },
            {
              id: "modules",
              label: "Modules",
              icon: FileBox,
              content: () => <ModulesTable />,
            },
            {
              id: "events",
              label: "Events",
              icon: List,
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
