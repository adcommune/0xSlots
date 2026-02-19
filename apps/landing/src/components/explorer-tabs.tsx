"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function ExplorerTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex border-b-2 border-black mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`font-mono text-xs uppercase tracking-widest px-6 py-3 border-b-4 -mb-[2px] transition-colors ${
              active === tab.id
                ? "border-black font-bold"
                : "border-transparent text-gray-400 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.id === active)?.content}
    </div>
  );
}
