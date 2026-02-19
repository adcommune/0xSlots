"use client";

export function HarbergerExplainer() {
  return (
    <div className="border-2 border-black">
      <div className="border-b-2 border-black bg-gray-50 px-6 py-4">
        <h2 className="font-black text-lg uppercase tracking-tight">
          HOW HARBERGER TAX WORKS
        </h2>
        <p className="font-mono text-xs text-gray-500 mt-1">
          PARTIAL COMMON OWNERSHIP · DEPOSIT-BASED · ESCROW MODEL
        </p>
      </div>

      <div className="p-6 space-y-12">
        {/* Diagram 1: Self-Assessment Cycle */}
        <div>
          <h3 className="font-black text-sm uppercase mb-4">1. THE SELF-ASSESSMENT CYCLE</h3>
          <svg viewBox="0 0 800 200" className="w-full border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* Boxes */}
            <rect x="20" y="60" width="160" height="80" fill="none" stroke="black" strokeWidth="3" />
            <text x="100" y="95" textAnchor="middle" fontSize="11" fontWeight="bold">SET YOUR PRICE</text>
            <text x="100" y="115" textAnchor="middle" fontSize="9" fill="#666">(self-assess)</text>

            <rect x="240" y="60" width="160" height="80" fill="none" stroke="black" strokeWidth="3" />
            <text x="320" y="95" textAnchor="middle" fontSize="11" fontWeight="bold">PAY TAX ON</text>
            <text x="320" y="115" textAnchor="middle" fontSize="9" fill="#666">YOUR STATED PRICE</text>

            <rect x="460" y="60" width="160" height="80" fill="none" stroke="black" strokeWidth="3" />
            <text x="540" y="90" textAnchor="middle" fontSize="11" fontWeight="bold">ANYONE CAN BUY</text>
            <text x="540" y="110" textAnchor="middle" fontSize="9" fill="#666">AT YOUR PRICE</text>
            <text x="540" y="125" textAnchor="middle" fontSize="9" fill="#666">(no negotiation)</text>

            {/* Arrows */}
            <line x1="180" y1="100" x2="240" y2="100" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="400" y1="100" x2="460" y2="100" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Feedback loop */}
            <path d="M 540 140 L 540 170 L 100 170 L 100 140" fill="none" stroke="black" strokeWidth="2" strokeDasharray="6,4" markerEnd="url(#arrowhead)" />
            <text x="320" y="185" textAnchor="middle" fontSize="9" fill="#666">CYCLE REPEATS · PRICE TOO HIGH = MORE TAX · PRICE TOO LOW = YOU LOSE IT</text>

            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="black" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Diagram 2: Deposit & Escrow Flow */}
        <div>
          <h3 className="font-black text-sm uppercase mb-4">2. DEPOSIT & ESCROW MODEL</h3>
          <svg viewBox="0 0 800 260" className="w-full border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* User */}
            <rect x="20" y="40" width="140" height="60" fill="black" stroke="black" strokeWidth="3" />
            <text x="90" y="75" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">OCCUPANT</text>

            {/* Deposit arrow */}
            <line x1="160" y1="70" x2="260" y2="70" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <text x="210" y="60" textAnchor="middle" fontSize="9" fill="#666">DEPOSIT ERC-20</text>

            {/* Escrow */}
            <rect x="260" y="30" width="200" height="80" fill="none" stroke="black" strokeWidth="3" />
            <text x="360" y="60" textAnchor="middle" fontSize="12" fontWeight="bold">ESCROW</text>
            <text x="360" y="80" textAnchor="middle" fontSize="9" fill="#666">BALANCE DECREASES OVER TIME</text>
            <text x="360" y="95" textAnchor="middle" fontSize="9" fill="#666">TAX = PRICE × RATE × TIME</text>

            {/* Tax drain */}
            <line x1="460" y1="70" x2="560" y2="70" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <text x="510" y="60" textAnchor="middle" fontSize="9" fill="#666">TAX ACCRUES</text>

            {/* Land owner */}
            <rect x="560" y="40" width="140" height="60" fill="none" stroke="black" strokeWidth="3" />
            <text x="630" y="65" textAnchor="middle" fontSize="12" fontWeight="bold">LAND OWNER</text>
            <text x="630" y="82" textAnchor="middle" fontSize="9" fill="#666">COLLECTS TAX</text>

            {/* Liquidation path */}
            <rect x="260" y="160" width="200" height="60" fill="none" stroke="black" strokeWidth="3" strokeDasharray="6,4" />
            <text x="360" y="185" textAnchor="middle" fontSize="11" fontWeight="bold">DEPOSIT = 0</text>
            <text x="360" y="202" textAnchor="middle" fontSize="9" fill="#666">SLOT LIQUIDATABLE</text>

            <line x1="360" y1="110" x2="360" y2="160" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <text x="380" y="140" fontSize="9" fill="#666">DRAINS TO ZERO</text>

            {/* Liquidator */}
            <line x1="460" y1="190" x2="560" y2="190" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <rect x="560" y="160" width="140" height="60" fill="none" stroke="black" strokeWidth="3" />
            <text x="630" y="185" textAnchor="middle" fontSize="11" fontWeight="bold">LIQUIDATOR</text>
            <text x="630" y="202" textAnchor="middle" fontSize="9" fill="#666">EARNS 5% BOUNTY</text>
          </svg>
        </div>

        {/* Diagram 3: Buy/Sell Flow */}
        <div>
          <h3 className="font-black text-sm uppercase mb-4">3. BUY/SELL FLOW</h3>
          <svg viewBox="0 0 800 180" className="w-full border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* Buyer */}
            <rect x="20" y="50" width="120" height="60" fill="black" stroke="black" strokeWidth="3" />
            <text x="80" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">BUYER</text>

            {/* Arrow: pays price */}
            <line x1="140" y1="80" x2="230" y2="80" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <text x="185" y="70" textAnchor="middle" fontSize="9" fill="#666">PAYS PRICE</text>

            {/* Slot */}
            <rect x="230" y="50" width="140" height="60" fill="none" stroke="black" strokeWidth="3" />
            <text x="300" y="78" textAnchor="middle" fontSize="12" fontWeight="bold">SLOT</text>
            <text x="300" y="95" textAnchor="middle" fontSize="9" fill="#666">OWNERSHIP TRANSFERS</text>

            {/* Arrow: previous gets refund */}
            <line x1="370" y1="80" x2="460" y2="80" stroke="black" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <text x="415" y="70" textAnchor="middle" fontSize="9" fill="#666">REFUNDED</text>

            {/* Previous occupant */}
            <rect x="460" y="50" width="140" height="60" fill="none" stroke="black" strokeWidth="3" />
            <text x="530" y="75" textAnchor="middle" fontSize="11" fontWeight="bold">PREV OCCUPANT</text>
            <text x="530" y="92" textAnchor="middle" fontSize="9" fill="#666">GETS DEPOSIT BACK</text>

            {/* Protocol fee */}
            <rect x="650" y="50" width="120" height="60" fill="none" stroke="black" strokeWidth="3" strokeDasharray="6,4" />
            <text x="710" y="78" textAnchor="middle" fontSize="10" fontWeight="bold">PROTOCOL</text>
            <text x="710" y="95" textAnchor="middle" fontSize="9" fill="#666">2% FEE</text>

            <line x1="300" y1="110" x2="300" y2="140" stroke="black" strokeWidth="1" />
            <line x1="300" y1="140" x2="710" y2="140" stroke="black" strokeWidth="1" />
            <line x1="710" y1="140" x2="710" y2="110" stroke="black" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <text x="505" y="155" textAnchor="middle" fontSize="9" fill="#666">FEE DEDUCTED</text>
          </svg>
        </div>

        {/* Diagram 4: Tax Collection */}
        <div>
          <h3 className="font-black text-sm uppercase mb-4">4. TAX COLLECTION TIMELINE</h3>
          <svg viewBox="0 0 800 160" className="w-full border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* Timeline */}
            <line x1="40" y1="80" x2="760" y2="80" stroke="black" strokeWidth="3" />

            {/* Deposit */}
            <circle cx="100" cy="80" r="6" fill="black" />
            <text x="100" y="60" textAnchor="middle" fontSize="10" fontWeight="bold">DEPOSIT</text>
            <text x="100" y="110" textAnchor="middle" fontSize="9" fill="#666">T=0</text>
            <rect x="60" y="120" width="80" height="20" fill="black" />
            <text x="100" y="134" textAnchor="middle" fontSize="8" fill="white">FULL</text>

            {/* Tax accrues */}
            <circle cx="280" cy="80" r="6" fill="black" />
            <text x="280" y="60" textAnchor="middle" fontSize="10" fontWeight="bold">TAX ACCRUES</text>
            <text x="280" y="110" textAnchor="middle" fontSize="9" fill="#666">ONGOING</text>
            <rect x="240" y="120" width="80" height="20" fill="none" stroke="black" strokeWidth="2" />
            <rect x="240" y="120" width="50" height="20" fill="black" />
            <text x="280" y="134" textAnchor="middle" fontSize="8" fill="#666">▼▼▼</text>

            {/* Settle */}
            <circle cx="460" cy="80" r="6" fill="black" />
            <text x="460" y="60" textAnchor="middle" fontSize="10" fontWeight="bold">SETTLE</text>
            <text x="460" y="110" textAnchor="middle" fontSize="9" fill="#666">ON-CHAIN</text>
            <rect x="420" y="120" width="80" height="20" fill="none" stroke="black" strokeWidth="2" />
            <rect x="420" y="120" width="25" height="20" fill="black" />
            <text x="460" y="134" textAnchor="middle" fontSize="8" fill="#666">LOW</text>

            {/* Liquidation */}
            <circle cx="640" cy="80" r="6" fill="none" stroke="black" strokeWidth="3" />
            <text x="640" y="60" textAnchor="middle" fontSize="10" fontWeight="bold">LIQUIDATION</text>
            <text x="640" y="110" textAnchor="middle" fontSize="9" fill="#666">DEPOSIT = 0</text>
            <rect x="600" y="120" width="80" height="20" fill="none" stroke="black" strokeWidth="2" strokeDasharray="4,4" />
            <text x="640" y="134" textAnchor="middle" fontSize="8" fill="#666">EMPTY</text>
          </svg>
        </div>

        {/* Text Explainer */}
        <div className="border-t-2 border-black pt-6 space-y-4 font-mono text-xs leading-relaxed">
          <p>
            <strong>HARBERGER TAX</strong> is a mechanism for partial common ownership.
            You own a slot, but you must always declare a price at which anyone can buy it from you.
            You pay a continuous tax proportional to your self-assessed price.
          </p>
          <p>
            <strong>THE TRADEOFF:</strong> Set your price high → you pay more tax but are harder to displace.
            Set it low → cheap to hold but anyone can snipe it. The market finds the efficient price.
          </p>
          <p>
            <strong>DEPOSITS:</strong> Instead of streaming payments, 0xSlots uses an escrow model.
            You deposit tokens upfront. Tax is calculated as <code>PRICE × RATE × TIME_ELAPSED</code> and
            deducted from your deposit when settlement occurs. When your deposit hits zero, anyone can
            liquidate your slot and earn a 5% bounty.
          </p>
          <p>
            <strong>FOR LAND OWNERS:</strong> You earn the tax revenue from all slots on your land.
            Call <code>collectRange()</code> to withdraw accrued tax at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
