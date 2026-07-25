import Link from "next/link";
import { Wordmark } from "@/components/mark";
import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

// Root-relative anchors, not bare "#slot": the header is shared with /blog,
// where a bare fragment would jump within the article instead of going home.
const nav = [
  { label: "What it is", href: "/#slot" },
  { label: "The loop", href: "/#loop" },
  { label: "Spec", href: "/#spec" },
  { label: "Uses", href: "/#uses" },
  { label: "Writing", href: "/blog" },
  { label: "Docs", href: links.docs },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => {
            const className =
              "font-mono text-[11px] uppercase tracking-[0.14em] text-slate transition-colors hover:text-ink";
            return item.href.startsWith("http") ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
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
