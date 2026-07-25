import { SectionHeading } from "@/components/section-heading";

/* Numbered because this genuinely is a sequence, and it genuinely
   returns to its first step. The numbers carry information. */
const STAGES = [
  {
    n: "01",
    title: "Claim",
    body: "Pay the occupant their asking price and post a deposit. The slot is yours in the same transaction.",
  },
  {
    n: "02",
    title: "Assess",
    body: "Declare what the slot is worth to you. The number is public, and it is binding.",
  },
  {
    n: "03",
    title: "Pay",
    body: "Tax streams out of your deposit continuously, straight to the slot's recipient. Nobody sends an invoice.",
  },
  {
    n: "04",
    title: "Release",
    body: "Someone meets your price, or your deposit empties and anyone can liquidate you for a bounty.",
  },
];

export function TheLoop() {
  return (
    <section id="loop" className="border-b-2 border-ink">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow="How a slot changes hands"
          title="It never stops"
          lede="Every slot runs the same four steps, forever, with no administrator and nobody to appeal to."
        />

        <ol className="mt-14 grid gap-px border-2 border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.n} className="relative bg-paper p-6">
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-claim">
                {stage.n}
              </span>
              <h3 className="mt-3 display text-2xl">{stage.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate">
                {stage.body}
              </p>
            </li>
          ))}
        </ol>

        {/* The return edge — what makes it a loop rather than a funnel */}
        <div className="flex items-stretch">
          <span className="flex items-center gap-2.5 border-2 border-t-0 border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-chalk">
            <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
              <path
                d="M20 11a8 8 0 1 0-2.3 5.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M21 4v7h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
            Step 04 is step 01 for somebody else
          </span>
        </div>
      </div>
    </section>
  );
}
