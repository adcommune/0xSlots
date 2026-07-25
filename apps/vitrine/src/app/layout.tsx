import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Public_Sans } from "next/font/google";
import { title as siteTitle, siteUrl, tagline } from "@/lib/site";
import "@/app/globals.css";

// Archivo carries a width axis, and the `display` utility drives it to
// wdth 118 — without declaring the axis here the face falls back to a
// normal width and the display type loses its signage weight.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  weight: "variable",
  variable: "--font-archivo",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#E9E9E4",
};

export const metadata: Metadata = {
  // Lets every page declare relative canonical/OG urls and have Next
  // resolve them against the live origin.
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteTitle} — ${tagline}`,
    // Articles set a bare title; the brand is appended exactly once here.
    template: `%s — ${siteTitle}`,
  },
  description:
    "Name your price. Pay tax on it. Anyone can buy it from you at that price, any time. Immutable, modular collective-ownership slots on Base, denominated in any ERC-20.",
  alternates: { canonical: "/" },
  icons: { icon: "/mark.svg" },
  openGraph: {
    type: "website",
    siteName: siteTitle,
    url: "/",
    title: `${siteTitle} — ${tagline}`,
    description:
      "Name your price. Pay tax on it. Anyone can buy it from you at that price, any time.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} — ${tagline}`,
    description:
      "Name your price. Pay tax on it. Anyone can buy it from you at that price, any time.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
