import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Cal Sans v2, the worker's own face: one variable file covers display, text and micro sizes.
const cal = localFont({
  variable: "--font-cal",
  src: "./fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const description =
  "An agentic framework for brand experiences. A brand asks its customers what they love, and Loro’s agent builds each of them a page about what it sells: the road trip to a festival, the weekend at a rental, the week in a home for sale.";

// The share image is public/og.png: a 1200 × 630 dev-only frame (app/devpost/og/page.dev.tsx) exported at 2×.
const image = {
  url: "/og.png",
  width: 2400,
  height: 1260,
  alt: "Loro is an Agentic Framework for Brand Experiences, beside three brands’ pages made by its agent.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://loro.sh"),
  title: "Loro",
  description,
  openGraph: { type: "website", url: "/", siteName: "Loro", title: "Loro", description, images: [image] },
  twitter: { card: "summary_large_image", title: "Loro", description, images: [image] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${cal.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
