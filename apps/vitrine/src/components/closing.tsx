import { ButtonLink } from "@/components/ui/button";
import { links } from "@/lib/links";

export function Closing() {
  return (
    <section className="border-b-2 border-ink bg-ink text-chalk">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-chalk/50">
          Deploy one in a single transaction
        </p>

        <h2 className="mt-5 max-w-3xl display text-[clamp(2.3rem,6.5vw,4.25rem)]">
          Put something up for
          <span className="text-claim"> permanent auction</span>
        </h2>

        <p className="mt-6 max-w-lg leading-relaxed text-chalk/70">
          Pick a currency, name a tax rate, point the revenue at an address. The
          slot handles the rest, forever, without you.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink
            href={links.create}
            target="_blank"
            rel="noreferrer"
            size="lg"
            variant="claim"
          >
            Create a slot
          </ButtonLink>
          <ButtonLink
            href={links.explorer}
            target="_blank"
            rel="noreferrer"
            size="lg"
            className="border-chalk bg-transparent text-chalk hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-chalk)]"
          >
            Browse what exists
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
