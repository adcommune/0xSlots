import { Wordmark } from "@/components/mark";
import { links } from "@/lib/links";
import { studio } from "@/lib/site";

// Everything here leaves the site, so every one of them is a plain anchor
// with the ↗ the site uses for that. /blog is deliberately absent — the
// route still builds and still sits in the sitemap, it just is not sold.
const destinations = [
  { label: "Explorer", href: links.explorer },
  { label: "Docs", href: links.docs },
  { label: "Source", href: links.github },
  { label: "Telegram", href: links.telegram },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <Wordmark />

        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {destinations.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-claim"
            >
              {item.label}
              <span
                aria-hidden="true"
                className="text-[9px] leading-none text-vacant"
              >
                ↗
              </span>
            </a>
          ))}
        </nav>

        {/* The studio that builds this — same credit, less furniture. */}
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          Made by{" "}
          <a
            href={studio.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink transition-colors hover:text-claim"
          >
            {studio.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
