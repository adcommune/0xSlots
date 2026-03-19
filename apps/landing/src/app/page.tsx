"use client";

import { FileBox, LandPlot, List, PlusIcon, User } from "lucide-react";
import { useAccount } from "wagmi";

import { EventsTable } from "@/components/explorer/events-table";
import { ModulesTable } from "@/components/explorer/modules-table";
import { RecipientsTable } from "@/components/explorer/recipients-table";
import { SlotsTable } from "@/components/explorer/slots-table";
import { StatsBar } from "@/components/explorer/stats-bar";
import { ExplorerTabs } from "@/components/explorer-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/context/navigation";

export default function Home() {
  const { chain } = useAccount();
  return (
    <div className="min-h-screen">
      <PageHeader>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              Explorer
            </h1>
            <p className="text-muted-foreground text-xs">
              {chain && `${chain?.name} •`} v3
            </p>
          </div>
          <div className="hidden md:flex w-px h-6 bg-border" />
          <StatsBar />
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild>
            <div>
              <PlusIcon className="w-5 h-5" />
              <NavLink href="/create">Create Slot</NavLink>
            </div>
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-2 md:px-6 py-1 md:py-4">
        <ExplorerTabs
          tabs={[
            {
              id: "slots",
              label: "Slots",
              icon: LandPlot,
              content: () => <SlotsTable />,
            },
            {
              id: "recipients",
              label: "Recipients",
              icon: User,
              content: () => <RecipientsTable />,
            },
            {
              id: "events",
              label: "Events",
              icon: List,
              content: () => <EventsTable />,
            },
            {
              id: "modules",
              label: "Modules",
              icon: FileBox,
              content: () => <ModulesTable />,
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
