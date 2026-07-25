import { SectionHeading } from "@/components/section-heading";

const SPEC = [
  {
    key: "Ownership",
    value: "Harberger tax — partial common ownership. Always for sale.",
  },
  {
    key: "Currency",
    value: "Any ERC-20, chosen per slot. No wrapping, no protocol token.",
  },
  {
    key: "Tax goes to",
    value:
      "Any address you name — most often a 0xSplits split, so the revenue fans out to a group.",
  },
  {
    key: "Terms",
    value:
      "Tax rate and behaviour are set at deployment and immutable by default. Make them mutable only if you deliberately want a manager.",
  },
  {
    key: "Behaviour",
    value:
      "A slot prices itself and forwards its tax with no module at all. The module slotted in decides what else holding one grants — metadata and feeds today, anything you write next.",
  },
  {
    key: "Liquidation",
    value:
      "Permissionless. When a deposit runs dry, anyone can liquidate the occupant and keep the bounty.",
  },
  {
    key: "Deposits",
    value:
      "Each slot sets a minimum, denominated in seconds of tax coverage rather than a flat amount.",
  },
  { key: "Networks", value: "Base and Base Sepolia." },
];

export function SpecSheet() {
  return (
    <section id="spec" className="border-b-2 border-ink bg-chalk">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow="What you are deploying"
          title="No surprises in the contract"
          lede="A slot is a small, finished thing. Here is all of it."
        />

        <dl className="mt-14 border-t-2 border-ink">
          {SPEC.map((row) => (
            <div
              key={row.key}
              className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-8 sm:py-5"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate sm:pt-1">
                {row.key}
              </dt>
              <dd className="max-w-2xl leading-relaxed text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
