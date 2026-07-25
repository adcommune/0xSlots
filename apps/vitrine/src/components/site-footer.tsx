import { Wordmark } from "@/components/mark";
import { links } from "@/lib/links";

const columns = [
  {
    heading: "Build",
    items: [
      { label: "Explorer", href: links.explorer },
      { label: "Create a slot", href: links.create },
      { label: "Documentation", href: links.docs },
    ],
  },
  {
    heading: "Project",
    items: [
      { label: "Source", href: links.github },
      { label: "Telegram", href: links.telegram },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
            Immutable, modular collective-ownership slots. Held by whoever
            values them most, for exactly as long as that stays true.
          </p>
        </div>

        <div className="flex gap-14">
          {columns.map((column) => (
            <div key={column.heading}>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate">
                {column.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-ink transition-colors hover:text-claim"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t-2 border-ink pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          0xSlots · Base
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          Nothing here is permanent
        </p>
      </div>
    </footer>
  );
}
