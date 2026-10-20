import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ],
  // Preview tooling hands out a free port via PORT.
  server: { port: Number(process.env.PORT) || undefined },
  resolve: {
    tsconfigPaths: true,
  },
  // Crawl every route and experience up front. Otherwise Vite finds deps
  // lazily, reloads mid-page and can briefly load two copies of React.
  optimizeDeps: {
    entries: ["app/**/*.tsx", "experiences/**/*.tsx", "catalogues/**/*.tsx"],
  },
});
