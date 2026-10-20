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

export const metadata: Metadata = {
  title: "Loro",
  description:
    "Loro turns what your customers love into branded experiences around the thing you sell: road trips to your festival, weekends at your hotel, a life at your listing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${cal.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
