import { Wordmark } from "@/components/mark";
import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

const nav = [
  { label: "What it is", href: "#slot" },
  { label: "The loop", href: "#loop" },
  { label: "Spec", href: "#spec" },
  { label: "Uses", href: "#uses" },
  { label: "Docs", href: links.docs },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <a href="#top" className="text-ink">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate transition-colors hover:text-ink"
              {...(item.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {item.label}
            </a>
          ))}
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
