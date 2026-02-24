import { SlotsDemo } from "@/components/slots-demo";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-10 pb-8 min-h-[85vh] flex flex-col lg:flex-row gap-10 lg:gap-16 justify-center items-center">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.3em] mb-3">
            ONCHAIN REAL ESTATE
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            0xSlots grants every Ethereum address productive onchain real
            estate.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed">
            Powered by partial common ownership and deposit-based Harberger tax,
            slots are never locked, never stagnant. Control is earned, defended,
            and reallocated through open competition — using any ERC-20 token as
            collateral.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            No permanent monopolies. No idle assets.
            <br />
            Only recurring market selection.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed">
            As AI agents begin transacting, optimizing, and competing
            autonomously, static property models break down. 0xSlots introduces
            infrastructure built for machine-speed markets — fair, contestable,
            and capital-efficient.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-bold">
            The next property primitive is here.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="https://github.com/adcommune/0xSlots"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-black bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
            >
              Source Code →
            </a>
          </div>
        </div>
        <div className=" flex-1 w-full md:w-auto min-w-0 flex items-center justify-center h-full">
          <SlotsDemo />
        </div>
      </section>
    </>
  );
}
