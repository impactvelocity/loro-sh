import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site: `next build` writes plain files to out/, which any static host (Cloudflare included) can serve.
  // Export mode can't use Cache Components or Partial Prefetching, so the scaffold's flags are gone.
  output: "export",
  images: { unoptimized: true },
  // The Devpost graphics (app/devpost/page.dev.tsx) are only served by `next dev`, never exported.
  pageExtensions: process.env.NODE_ENV === "development" ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
