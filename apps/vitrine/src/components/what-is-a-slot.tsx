import { Cell } from "@/components/mark";
import { SectionHeading } from "@/components/section-heading";

/* "Slot" is not a metaphor this project reached for — it is the word
   four unrelated industries already use for the same object. Listing
   them is what earns the name, so the copy never has to argue for it. */
const PRIOR_ART = [
  {
    where: "Heathrow",
    what: "A landing slot",
    note: "Worth enough that airlines have flown empty planes rather than give one up.",
  },
  {
    where: "Television",
    what: "The eight o'clock slot",
    note: "Sold to whoever can draw the most people to it.",
  },
  {
    where: "Supermarkets",
    what: "A shelf slot",
    note: "Eye level goes to the brand that pays for eye level.",
  },
  {
    where: "Motherboards",
    what: "An expansion slot",
    note: "A standard opening — anything built to the spec drops straight in.",
  },
];

export function WhatIsASlot() {
  return (
    <section id="slot" className="border-b-2 border-ink bg-chalk">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow="The name is not a metaphor"
          title="You already know what a slot is"
          lede="Four industries that share nothing else reached for the same word, because underneath it is the same object: one scarce position, and a queue of people who want it."
        />

        <dl className="mt-14 border-t-2 border-ink">
          {PRIOR_ART.map((row) => (
            <div
              key={row.where}
              className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[minmax(0,150px)_minmax(0,270px)_1fr] sm:items-baseline sm:gap-8 sm:py-5"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
                {row.where}
              </dt>
              <dd className="display-tight text-base">{row.what}</dd>
              <dd className="leading-relaxed text-slate">{row.note}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <p className="leading-relaxed text-slate">
              Every one of them is held by whoever was chosen last, and usually
              kept long after the choosing stopped making sense. Someone has to
              review it, renew it, or take it away — a committee, a landlord, a
              sales team.
            </p>
            <p className="mt-4 leading-relaxed text-slate">
              0xSlots makes the position a contract instead, so the choosing
              never stops and nobody has to run it.
            </p>
          </div>

          {/* The pull quote does the analogy work: the noun stays put and
              the product name turns into the verb. */}
          <blockquote className="border-2 border-ink bg-ink p-7 text-chalk offset-claim">
            <p className="display text-[clamp(1.5rem,3.2vw,2.1rem)]">
              An empty slot already works.
              <span className="mt-1.5 block text-claim">
                The module is what you slot in.
              </span>
            </p>
          </blockquote>
        </div>

        <div className="mt-14 grid gap-10 border-t-2 border-ink pt-10 lg:grid-cols-2 lg:gap-16">
          {/* Two lists, deliberately: the protocol earns its keep before a
              single line of module code is written. */}
          <div>
            <h3 className="display-tight text-base">
              Every slot, out of the box
            </h3>
            <p className="mt-2 leading-relaxed text-slate">
              Deploy one with no module at all and it still does the work.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Prices itself, continuously and honestly",
                "Streams its tax to a recipient you choose",
                "Names a current holder anyone can verify",
                "Cannot be captured for good, by anyone",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 border-b border-rule pb-3"
                >
                  <Cell occupied className="text-flow" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 leading-relaxed text-slate">
              That alone is enough for sponsorship, patronage, or any title
              somebody has to keep paying to keep.
            </p>
          </div>

          <div>
            <h3 className="display-tight text-base">What a module adds</h3>
            <p className="mt-2 leading-relaxed text-slate">
              Bolt one on and holding the slot starts granting something too.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { label: "Ad space", built: true },
                { label: "A live feed", built: true },
                { label: "Access to something gated", built: false },
                { label: "A vote, a cut, a name", built: false },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 border-b border-rule pb-3"
                >
                  <Cell
                    occupied={item.built}
                    className={item.built ? "text-flow" : "text-vacant"}
                  />
                  <span className={item.built ? undefined : "text-slate"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 leading-relaxed text-slate">
              Filled cells ship today. The interface is open, so the interesting
              ones are the ones nobody has written yet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
