"use client";

import { type CSSProperties, useState } from "react";

import { Cell } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* The slot's terms are fixed at deployment — only the occupant's
   self-assessed price moves, which is exactly what the reader drags. */
const TAX_RATE_MONTHLY = 0.04;
const DEPOSIT = 0.25;
const CURRENCY = "WETH";

/* What the market currently thinks the slot is worth. Price below
   this and you are handing a buyer a discount. */
const MARKET = 2.4;
const PRICE_MIN = 0.1;
const PRICE_MAX = 8;

const OCCUPANTS = [
  "0x5678…Ef01",
  "0xA31c…9b7D",
  "0xf0Ba…2C44",
  "0x1d9E…77Aa",
  "0xc4b2…30F1",
];

function eth(n: number, dp = 3) {
  return n.toFixed(dp);
}

function runwayLabel(days: number) {
  if (days >= 365) return `${(days / 365).toFixed(1)} yr`;
  if (days >= 60) return `${Math.round(days / 30)} mo`;
  return `${Math.round(days)} d`;
}

function solventUntil(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(days));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The whole protocol in one control.
 *
 * Raise the price and you are harder to buy out, but the tax on it
 * drains your deposit faster. Lower it and you last forever, but you
 * are advertising a discount. There is no setting that wins both.
 */
export function SlotInstrument() {
  const [price, setPrice] = useState(1.5);
  const [occupantIndex, setOccupantIndex] = useState(0);
  const [transferred, setTransferred] = useState(false);

  const pricePct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const marketPct = ((MARKET - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const taxPerMonth = price * TAX_RATE_MONTHLY;
  const runwayDays = DEPOSIT / (taxPerMonth / 30);
  const discount = Math.max(0, MARKET - price);
  const exposure = Math.min(1, discount / MARKET);
  const runwayFill = Math.min(1, runwayDays / 180);
  const atRisk = runwayDays < 21;

  function handleBuy() {
    setTransferred(true);
    window.setTimeout(() => {
      setOccupantIndex((i) => (i + 1) % OCCUPANTS.length);
      setPrice((p) => Math.min(8, Math.round(p * 1.15 * 100) / 100));
      setTransferred(false);
    }, 850);
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "relative border-2 border-ink bg-chalk transition-shadow duration-300",
          atRisk ? "offset-claim" : "offset-ink",
        )}
      >
        {/* Header: which parcel, and who holds it */}
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
          <span className="flex items-center gap-2">
            <Cell occupied className="text-ink" />
            <span className="display-tight text-[13px]">Slot 04</span>
          </span>
          <span className="font-mono text-[11px] text-slate tnum">
            {transferred ? (
              <span className="text-claim">transferring…</span>
            ) : (
              OCCUPANTS[occupantIndex]
            )}
          </span>
        </div>

        <div className="space-y-5 px-4 py-5">
          {/* The one number the occupant controls */}
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="assessed-price"
                className="eyebrow text-[10px] tracking-[0.16em]"
              >
                Your price
              </label>
              <span className="font-mono text-[10px] text-slate">
                anyone can buy at this
              </span>
            </div>

            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="display text-[2.75rem] text-claim tnum leading-none">
                {eth(price, 2)}
              </span>
              <span className="font-mono text-xs text-slate">{CURRENCY}</span>
            </p>

            <input
              id="assessed-price"
              type="range"
              min={0.1}
              max={8}
              step={0.05}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              aria-valuetext={`${eth(price, 2)} ${CURRENCY}`}
              style={{ "--pct": `${pricePct}%` } as CSSProperties}
              className="mt-3 h-6 w-full cursor-ew-resize appearance-none bg-transparent
                [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-ink [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-claim)_var(--pct),var(--color-paper)_var(--pct))]
                [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-chalk
                [&::-moz-range-track]:h-2 [&::-moz-range-track]:border [&::-moz-range-track]:border-ink [&::-moz-range-track]:bg-[linear-gradient(to_right,var(--color-claim)_var(--pct),var(--color-paper)_var(--pct))]
                [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-chalk"
            />

            {/* Where the market sits, so the drag has a reference point */}
            <div className="relative -mt-0.5 h-4">
              <span
                className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5"
                style={{ left: `${marketPct}%` }}
              >
                <span className="h-1.5 w-px bg-slate" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate">
                  market
                </span>
              </span>
            </div>
          </div>

          {/* The two consequences, pulling in opposite directions */}
          <dl className="grid grid-cols-2 border-2 border-rule">
            <div className="border-r-2 border-rule p-3">
              <dt className="eyebrow text-[10px] tracking-[0.14em] text-flow">
                Tax / month
              </dt>
              <dd className="mt-0.5 font-mono text-lg font-bold text-flow tnum">
                {eth(taxPerMonth, 4)}
              </dd>
              <dd className="font-mono text-[10px] text-slate">
                to the recipient
              </dd>
            </div>
            <div className="p-3">
              <dt className="eyebrow text-[10px] tracking-[0.14em]">
                Deposit lasts
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-mono text-lg font-bold tnum",
                  atRisk ? "text-claim" : "text-ink",
                )}
              >
                {runwayLabel(runwayDays)}
              </dd>
              <dd className="font-mono text-[10px] text-slate">
                {atRisk
                  ? "top up or lose it"
                  : `until ${solventUntil(runwayDays)}`}
              </dd>
            </div>
          </dl>

          {/* Runway drains as the price climbs */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow text-[10px] tracking-[0.14em]">
                Solvency
              </span>
              <span className="font-mono text-[10px] text-slate tnum">
                {eth(DEPOSIT, 2)} {CURRENCY} deposited
              </span>
            </div>
            <div className="h-2.5 w-full border-2 border-ink bg-paper">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  atRisk ? "bg-claim" : "bg-ink",
                )}
                style={{ width: `${Math.max(2, runwayFill * 100)}%` }}
              />
            </div>
          </div>

          {/* And the counter-pressure: underprice it and you are prey */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow text-[10px] tracking-[0.14em]">
                Buyer's discount
              </span>
              <span className="font-mono text-[10px] text-slate tnum">
                market ≈ {eth(MARKET, 2)}
              </span>
            </div>
            <div className="h-2.5 w-full border-2 border-ink bg-paper">
              <div
                className="h-full bg-claim transition-all duration-300"
                style={{ width: `${exposure * 100}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-slate">
              {discount > 0.01 ? (
                <>
                  Priced{" "}
                  <span className="font-bold text-claim tnum">
                    {eth(discount, 2)} {CURRENCY}
                  </span>{" "}
                  under market. Someone will take it.
                </>
              ) : (
                <>Priced at or above market. Expensive to hold, hard to lose.</>
              )}
            </p>
          </div>
        </div>

        {/* Any reader can end this occupancy, which is the point */}
        <div className="border-t-2 border-ink p-3">
          <Button
            variant="claim"
            className="w-full"
            onClick={handleBuy}
            disabled={transferred}
          >
            {transferred
              ? "Slot reassigned"
              : `Buy it for ${eth(price, 2)} ${CURRENCY}`}
          </Button>
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate">
        Illustrative figures. Drag the price, then take the slot from its
        occupant.
      </p>
    </div>
  );
}
