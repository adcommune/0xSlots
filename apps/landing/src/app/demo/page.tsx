"use client";

import { useState } from "react";
import {
  Armchair,
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  PartyPopper,
  Shield,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

// ─── Mock Data ───

const MOCK_SEATS = [
  {
    id: "0x87e6...Bfb5",
    holder: null,
    price: 0,
    monthlyRent: 0,
    currency: "USDC",
    module: "Metadata",
    taxPct: 1,
  },
  {
    id: "0x5A5A...535d",
    holder: { name: "K", avatar: "🔺" },
    price: 10,
    monthlyRent: 0.6,
    currency: "USDC",
    module: "Metadata",
    taxPct: 6,
  },
  {
    id: "0xA9a2...D7ef",
    holder: { name: "vitalik.eth", avatar: "🦄" },
    price: 50,
    monthlyRent: 0.5,
    currency: "USDC",
    module: null,
    taxPct: 1,
  },
  {
    id: "0x6854...4A32",
    holder: { name: "nezzar.eth", avatar: "🟣" },
    price: 1,
    monthlyRent: 0.01,
    currency: "USDC",
    module: "Metadata",
    taxPct: 1,
  },
];

// ─── Browse Screen ───

function BrowseSeats({ onSelect }: { onSelect: (seat: (typeof MOCK_SEATS)[0]) => void }) {
  return (
    <div className="space-y-3">
      {MOCK_SEATS.map((seat) => (
        <button
          key={seat.id}
          onClick={() => onSelect(seat)}
          className="w-full text-left rounded-lg border p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                {seat.holder ? seat.holder.avatar : <Armchair className="size-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="font-medium text-sm">
                  {seat.holder ? seat.holder.name : "Empty seat"}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {seat.id}
                </div>
              </div>
            </div>
            <div className="text-right">
              {seat.holder ? (
                <>
                  <div className="text-sm font-semibold">
                    {seat.price} {seat.currency}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {seat.monthlyRent} {seat.currency}/mo
                  </div>
                </>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Free — claim it
                </Badge>
              )}
            </div>
          </div>
          {seat.module && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-[10px]">
                {seat.module}
              </Badge>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Claim / Take Screen ───

function ClaimSeat({
  seat,
  onBack,
}: {
  seat: (typeof MOCK_SEATS)[0];
  onBack: () => void;
}) {
  const [price, setPrice] = useState(seat.holder ? "" : "");
  const [months, setMonths] = useState(3);
  const priceNum = parseFloat(price) || 0;
  const monthlyRent = (priceNum * seat.taxPct) / 100;
  const totalDeposit = monthlyRent * months;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← Back to seats
      </button>

      <div className="rounded-lg border">
        {/* Header */}
        <div className="bg-muted/50 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl">
              {seat.holder ? seat.holder.avatar : <Armchair className="size-6 text-muted-foreground" />}
            </div>
            <div>
              <h2 className="font-semibold">
                {seat.holder
                  ? `Take this seat from ${seat.holder.name}`
                  : "Claim this seat"}
              </h2>
              <p className="text-sm text-muted-foreground font-mono">{seat.id}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Cost to take (occupied only) */}
          {seat.holder && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Cost to take this seat</span>
                <span className="text-lg font-bold text-blue-900">
                  {seat.price} {seat.currency}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Paid to {seat.holder.name} — they set this price
              </p>
            </div>
          )}

          {/* Your price */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="size-4" /> Your asking price
            </label>
            <p className="text-xs text-muted-foreground">
              If someone wants your seat, they pay you this amount
            </p>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="10.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{seat.currency}</span>
            </div>
          </div>

          {/* Tradeoff bar */}
          {priceNum > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-600 font-medium">Protection</span>
                <span className="text-amber-600 font-medium">Holding cost</span>
              </div>
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-200 via-yellow-100 to-amber-200 relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-foreground border-2 border-background shadow"
                  style={{ left: `${Math.min(95, Math.max(5, (priceNum / 100) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Easier to take</span>
                <span>Harder to take, costs more</span>
              </div>
            </div>
          )}

          {/* Prepay duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="size-4" /> How long do you want to hold it?
            </label>
            <input
              type="range"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full h-2 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 month</span>
              <span className="font-semibold text-foreground">
                ~{months < 12 ? `${months} month${months > 1 ? "s" : ""}` : `${Math.floor(months / 12)}y ${months % 12}mo`}
              </span>
              <span>2 years</span>
            </div>
          </div>

          {/* Summary */}
          {priceNum > 0 && (
            <div className="rounded-lg border divide-y">
              <div className="flex justify-between p-3 text-sm">
                <span className="text-muted-foreground">Monthly rent</span>
                <span className="font-mono">{monthlyRent.toFixed(2)} {seat.currency}/mo</span>
              </div>
              <div className="flex justify-between p-3 text-sm">
                <span className="text-muted-foreground">Prepaid balance</span>
                <span className="font-mono">{totalDeposit.toFixed(2)} {seat.currency}</span>
              </div>
              {seat.holder && (
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">Seat cost</span>
                  <span className="font-mono">{seat.price} {seat.currency}</span>
                </div>
              )}
              <div className="flex justify-between p-3 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono">
                  {(totalDeposit + (seat.holder ? seat.price : 0)).toFixed(2)} {seat.currency}
                </span>
              </div>
            </div>
          )}

          <Button className="w-full text-base py-5" disabled={priceNum === 0}>
            {seat.holder ? (
              <>Take seat for {(totalDeposit + seat.price).toFixed(2)} {seat.currency}</>
            ) : (
              <>Claim seat</>
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            One transaction — approve &amp; {seat.holder ? "take" : "claim"} via multicall
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Your Seat Screen ───

function YourSeat({ seat, onBack }: { seat: (typeof MOCK_SEATS)[0]; onBack: () => void }) {
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const prepaidMonths = 19;
  const prepaidUntil = "Aug 2027";
  const balance = 0.19;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← Back to seats
      </button>

      <div className="rounded-lg border">
        <div className="bg-muted/50 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl">
                {seat.holder?.avatar}
              </div>
              <div>
                <h2 className="font-semibold">Your seat</h2>
                <p className="text-sm text-muted-foreground font-mono">{seat.id}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Holder
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="size-3" /> Your price
              </div>
              <div className="text-lg font-bold mt-1">{seat.price} {seat.currency}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="size-3" /> Monthly rent
              </div>
              <div className="text-lg font-bold mt-1">{seat.monthlyRent} {seat.currency}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" /> Prepaid until
              </div>
              <div className="text-lg font-bold mt-1">{prepaidUntil}</div>
              <div className="text-xs text-muted-foreground">~{prepaidMonths} months</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Balance
              </div>
              <div className="text-lg font-bold mt-1">{balance} {seat.currency}</div>
            </div>
          </div>

          {/* Change price */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowPriceEdit(!showPriceEdit)}
          >
            Change price <ChevronDown className={`size-4 ml-1 transition-transform ${showPriceEdit ? "rotate-180" : ""}`} />
          </Button>

          {showPriceEdit && (
            <div className="rounded-lg border p-4 space-y-3">
              <Input type="number" placeholder="New price" className="font-mono" />
              <div className="flex gap-2 text-xs text-muted-foreground">
                <div className="flex-1 rounded bg-emerald-50 p-2 text-center">
                  <ArrowRight className="size-3 inline mr-1" />
                  Lower → cheaper to hold, easier to take
                </div>
                <div className="flex-1 rounded bg-amber-50 p-2 text-center">
                  <ArrowRight className="size-3 inline mr-1" />
                  Higher → more protection, costs more
                </div>
              </div>
              <Button className="w-full">Update price &amp; rebalance</Button>
              <p className="text-[10px] text-center text-muted-foreground">
                One transaction — adjusts price and deposit atomically
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              <Sparkles className="size-4 mr-1.5" /> Add more time
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Leave seat
            </Button>
          </div>
        </div>
      </div>

      {/* Takeover notification mock */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <PartyPopper className="size-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Your seat was taken — you earned 10 USDC! 🎉
            </p>
            <p className="text-xs text-green-600 mt-1">
              vitalik.eth took your seat and paid your asking price. Your remaining deposit was refunded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───

type Screen = "browse" | "claim" | "your-seat";

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>("browse");
  const [selectedSeat, setSelectedSeat] = useState<(typeof MOCK_SEATS)[0] | null>(null);

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div>
          <p className="text-xs text-muted-foreground">UX Concept</p>
          <h1 className="text-xl font-bold tracking-tight">The Seat Model</h1>
          <p className="text-xs text-muted-foreground">
            Same Harberger mechanics. Human words.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={screen === "browse" ? "default" : "outline"}
            onClick={() => setScreen("browse")}
          >
            Browse
          </Button>
          <Button
            size="sm"
            variant={screen === "claim" ? "default" : "outline"}
            onClick={() => {
              setSelectedSeat(MOCK_SEATS[0]);
              setScreen("claim");
            }}
          >
            Claim (empty)
          </Button>
          <Button
            size="sm"
            variant={screen === "your-seat" ? "default" : "outline"}
            onClick={() => {
              setSelectedSeat(MOCK_SEATS[3]);
              setScreen("your-seat");
            }}
          >
            Your Seat
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {screen === "browse" && (
          <BrowseSeats
            onSelect={(seat) => {
              setSelectedSeat(seat);
              if (seat.holder?.name === "nezzar.eth") {
                setScreen("your-seat");
              } else {
                setScreen("claim");
              }
            }}
          />
        )}
        {screen === "claim" && selectedSeat && (
          <ClaimSeat seat={selectedSeat} onBack={() => setScreen("browse")} />
        )}
        {screen === "your-seat" && selectedSeat && (
          <YourSeat seat={selectedSeat} onBack={() => setScreen("browse")} />
        )}
      </div>
    </div>
  );
}
