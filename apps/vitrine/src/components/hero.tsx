import { ParcelField } from "@/components/parcel-field";
import { SlotInstrument } from "@/components/slot-instrument";
import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

const HEADLINE = ["Property", "you cannot", "hoard"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b-2 border-ink"
    >
      <ParcelField className="absolute inset-0 h-full w-full" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.05fr_minmax(0,380px)] lg:gap-20">
        <div>
          <p
            className="eyebrow animate-raise"
            style={{ animationDelay: "40ms" }}
          >
            Partial common ownership · Base
          </p>

          <h1 className="mt-5 display text-[clamp(2.9rem,9vw,5.6rem)]">
            {HEADLINE.map((line, i) => (
              <span
                key={line}
                className="block animate-raise"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="mt-7 max-w-md animate-raise text-lg leading-relaxed text-ink/80"
            style={{ animationDelay: "420ms" }}
          >
            Name your price. Pay tax on it. Anyone can buy it from you at that
            price, any time.
          </p>

          <p
            className="mt-3 max-w-md animate-raise leading-relaxed text-slate"
            style={{ animationDelay: "500ms" }}
          >
            That is the entire protocol. No auctions to win, no renewals to
            miss, no seat held by someone who stopped caring.
          </p>

          <div
            className="mt-9 flex animate-raise flex-wrap gap-3"
            style={{ animationDelay: "580ms" }}
          >
            <ButtonLink
              href={links.explorer}
              target="_blank"
              rel="noreferrer"
              size="lg"
            >
              Open explorer
            </ButtonLink>
            <ButtonLink
              href={links.docs}
              target="_blank"
              rel="noreferrer"
              size="lg"
              variant="outline"
            >
              Read the docs
            </ButtonLink>
          </div>
        </div>

        <div
          className="animate-register lg:pr-2"
          style={{ animationDelay: "300ms" }}
        >
          <SlotInstrument />
        </div>
      </div>
    </section>
  );
}
