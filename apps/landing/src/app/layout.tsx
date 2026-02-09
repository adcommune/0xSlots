import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCO Protocol — Partial Common Ownership",
  description:
    "A coordination primitive for autonomous agent economies. Harberger tax mechanics on-chain with Superfluid streaming.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
