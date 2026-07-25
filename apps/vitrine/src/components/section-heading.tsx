import { Cell } from "@/components/mark";

export function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow flex items-center gap-2.5">
        <Cell occupied className="text-claim" />
        {eyebrow}
      </p>
      <h2 className="mt-4 display text-[clamp(2.1rem,5.5vw,3.5rem)]">
        {title}
      </h2>
      {lede && (
        <p className="mt-4 text-lg leading-relaxed text-slate">{lede}</p>
      )}
    </div>
  );
}
