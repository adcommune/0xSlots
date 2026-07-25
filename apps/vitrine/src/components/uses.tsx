import { Cell } from "@/components/mark";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

const USES = [
  {
    title: "Ad space",
    status: "live" as const,
    body: "A banner on your site becomes a slot. Whoever values the attention most holds it, and the rent lands in your split instead of an ad network's.",
    detail: "Running on Base today via Adland.",
  },
  {
    title: "Names and handles",
    status: "open" as const,
    body: "Squatting stops paying the moment holding costs money. A name nobody is using drifts to somebody who will.",
    detail: "No module written yet.",
  },
  {
    title: "Seats and listings",
    status: "open" as const,
    body: "Curator seats, directory placements, a spot on a leaderboard — any scarce position that currently gets handed out and then forgotten.",
    detail: "No module written yet.",
  },
];

export function Uses() {
  return (
    <section id="uses" className="border-b-2 border-ink">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow="Where this is worth doing"
          title="Anything scarce and neglected"
          lede="A slot earns its keep wherever a position is limited, valuable, and currently held by whoever got there first."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {USES.map((use) => (
            <article
              key={use.title}
              className={cn(
                "flex flex-col border-2 border-ink bg-chalk p-6",
                use.status === "live" && "offset-flow",
              )}
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-2 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  use.status === "live"
                    ? "border-flow bg-flow-soft text-flow"
                    : "border-rule text-slate",
                )}
              >
                <Cell occupied={use.status === "live"} />
                {use.status === "live" ? "Live" : "Unbuilt"}
              </span>

              <h3 className="mt-5 display text-2xl">{use.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-slate">
                {use.body}
              </p>
              <p className="mt-5 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                {use.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
