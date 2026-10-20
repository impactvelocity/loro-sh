# loro.sh

The public site for Loro. A Next.js 16 static export: `next build` writes plain files to `out/`, which any static host, Cloudflare included, can serve.

## Develop

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # static files in out/
pnpm lint
```

This Next.js has breaking changes from older versions; read `AGENTS.md` before changing code.

## Layout

```
app/              The page, layout, icons and fonts. `page.tsx` shows only the hero for now
components/       Page sections (hero, examples, how it works, framework) and shared UI
lib/links.ts      Every outbound link: the demo pages, the admin, the repo
public/examples/  Screenshots of real outcomes
```

## Links

`lib/links.ts` points at the hackathon hosts (`APP_HOST` and `PAGES_HOST` in `worker/wrangler.jsonc`); each demo workspace has to exist in the production database for its link to work. `repo` is empty until the repo is public, and the repo and Deploy to Cloudflare buttons stay hidden until it's set.
