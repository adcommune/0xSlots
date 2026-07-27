import Link from "next/link";
import { Wordmark } from "@/components/mark";
import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

// Two registers of link, split by a rule so the reader can tell them apart
// before clicking: these scroll the home page...
//
// Root-relative anchors, not bare "#slot": the header is shared with /blog,
// where a bare fragment would jump within the article instead of going home.
const sections = [
  { label: "What it is", href: "/#slot" },
  { label: "The loop", href: "/#loop" },
  { label: "Spec", href: "/#spec" },
  { label: "Uses", href: "/#uses" },
];

// ...and these leave it. Ink instead of slate carries the weight of an actual
// destination; the arrow marks the one that also leaves the site.
const destinations = [
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: links.docs },
];

const sectionClass =
  "font-mono text-[11px] uppercase tracking-[0.14em] text-slate transition-colors hover:text-ink";

const destinationClass =
  "font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-claim";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-7">
            {sections.map((item) => (
              <Link key={item.label} href={item.href} className={sectionClass}>
                {item.label}
              </Link>
            ))}
          </div>

          <span aria-hidden="true" className="h-3.5 w-px bg-rule" />

          <div className="flex items-center gap-6">
            {destinations.map((item) =>
              item.href.startsWith("http") ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${destinationClass} inline-flex items-center gap-1`}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-[9px] leading-none">
                    ↗
                  </span>
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={destinationClass}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </nav>

        <ButtonLink
          href={links.explorer}
          target="_blank"
          rel="noreferrer"
          size="sm"
        >
          Open explorer
        </ButtonLink>
      </div>
    </header>
  );
}
