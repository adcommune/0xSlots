"use client";

import type { LucideIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: () => ReactNode;
}

export function ExplorerTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex border-b mb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "text-sm px-2 md:px-6 py-3 border-b-2 -mb-px transition-colors flex items-center gap-1.5",
                active === tab.id
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.find((t) => t.id === active)?.content()}
    </div>
  );
}
