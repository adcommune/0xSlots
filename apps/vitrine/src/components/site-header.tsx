import Link from "next/link";
import { Wordmark } from "@/components/mark";
import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

// No nav. The page is a hero and a footer, so there is nowhere on-site to
// send anyone — the two destinations that matter are the hero's own buttons,
// and this one is here because it is the action, not a link.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>

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
