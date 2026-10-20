# Loro

Loro turns what your customers love into branded experiences around the thing you sell: road trips to your festival, weekends at your hotel, a life at your listing.

Each experience runs on a Cloudflare Worker and draws on taste data from [Qloo](https://www.qloo.com).

## What's here

```
worker/    The product: admin, public experience pages, REST API and MCP server, in one Cloudflare Worker
site/      loro.sh, the public site (Next.js static export)
.claude/   Claude Code launch configs and the loro-copy skill
```

Each folder has its own README with the details: [worker](worker/README.md), [site](site/README.md).

## Run it locally

You need Node 22+ and pnpm. Each app installs on its own; there is no root workspace.

```sh
cd worker
pnpm install
pnpm dev        # applies D1 migrations, then http://localhost:5173/admin
```

```sh
cd site
pnpm install
pnpm dev        # http://localhost:3000
```

The worker reads secrets from `worker/.dev.vars`, which git ignores. All of them are optional:

```sh
QLOO_API_KEY=...       # without it, Qloo calls return nothing
ADMIN_PASSWORD=...     # puts the admin behind a sign-in (not in local dev)
CF_ACCOUNT_ID=...      # Analytics Engine queries and Browser Rendering
CF_API_TOKEN=...
```

Models, Images and Stream go through your Cloudflare account even in local dev, so run `wrangler login` first.

## Deploy

```sh
cd worker
pnpm deploy     # builds, deploys and applies D1 migrations remotely
```

The hosted demo uses two custom domains: `app.loro.sh` for the admin, API and MCP server, and `demo.loro.sh` for the public pages. Both are set in `worker/wrangler.jsonc`. Clear `APP_HOST` and `PAGES_HOST` to serve everything from one host.
