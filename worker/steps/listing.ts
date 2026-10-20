/**
 * A code step: reads a home for sale from its link, before Taste.
 *
 * 1. Fetch the page. Sites that turn away a plain fetch (Zillow,
 *    Realtor.com) go through Cloudflare Browser Rendering when
 *    CF_ACCOUNT_ID and CF_API_TOKEN are set (the token needs Browser
 *    Rendering: Edit).
 * 2. Pull out what listing sites publish for search engines and link
 *    previews: schema.org JSON-LD, Open Graph and Twitter tags, the
 *    page's photos and its text.
 * 3. The outcome model turns that into the listing: address, price,
 *    rooms, what the listing says about the home, and which photos are
 *    the home's own.
 * 4. The address becomes a point on the map (OpenStreetMap), saved as an
 *    answer, so lookups set to "Near an answer" search around the house.
 *
 * The facts go into the profile as a note, so every section writes from
 * the real listing. The photos and numbers are the step's public data:
 * the Listing component on the outcome page draws them.
 */
import { HouseIcon } from "lucide-react";
import { Output, generateText } from "ai";
import { z } from "zod";

import { type StepContext, defineStep } from "@core/catalogue/workflow";
import { f } from "@core/catalogue/fields";

/** What the outcome page gets. Public: nothing here is private to the buyer. */
export type ListingData = {
  url: string;
  host: string;
  address: string;
  area: string;
  status: string;
  price: string;
  beds: string;
  baths: string;
  size: string;
  kind: string;
  summary: string;
  features: string[];
  photos: string[];
  point: { lat: number; lng: number } | null;
};

/** A listing read once is kept this long, so running the same link again doesn't ask the site twice. */
const CACHE_SECONDS = 6 * 60 * 60;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const decode = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

/** The page's HTML: a plain fetch first, Browser Rendering if the site turns that away. */
async function fetchPage(url: string, env: Cloudflare.Env, report: (message: string) => Promise<void>) {
  const response = await fetch(url, {
    headers: { "user-agent": BROWSER_UA, accept: "text/html,application/xhtml+xml", "accept-language": "en" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  // Bot checks answer 202, 403 or 429, or a 200 with a page too small to be a listing.
  const html = response?.status === 200 ? await response.text() : "";
  if (html.length > 5_000) return html;

  const host = new URL(url).host.replace(/^www\./, "");
  const status = !response ? "didn't answer" : `turned the request away (${response.status}${html ? ", a bot check" : ""})`;
  if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
    throw new Error(`${host} ${status}. Try again in a few minutes, or add CF_ACCOUNT_ID and CF_API_TOKEN to read it with a browser.`);
  }
  await report(`${host} ${status}, opening it in a browser`);
  const rendered = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/content`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ url, userAgent: BROWSER_UA, gotoOptions: { waitUntil: "networkidle2", timeout: 30_000 } }),
      signal: AbortSignal.timeout(45_000),
    },
  );
  const body = await rendered.json<{ success: boolean; result?: string; errors?: { message: string }[] }>();
  if (!body.success || !body.result) {
    throw new Error(`Couldn't open the listing in a browser: ${body.errors?.[0]?.message ?? rendered.status}`);
  }
  return body.result;
}

/**
 * Which photo a URL is, whatever its size: ".../264207b/full.webp" and
 * ".../264207b/pds23tp.webp" are one photo, and so are "genMid.2518336_1.jpg"
 * and "bigphoto/.../2518336_1.jpg".
 */
function photoKey(src: string) {
  // Not the host: m.cbhomes.com and m1.cbhomes.com serve the same photo.
  const parts = new URL(src).pathname.split("/").filter(Boolean);
  const file = (parts.at(-1) ?? "").replace(/\.\w+$/, "");
  if (file.length <= 12 && !/\d{4,}/.test(file)) return parts.slice(0, -1).join("/");
  return file.replace(/^[a-z]+(?:[A-Z][a-z]+)*\./, "").replace(/[-_](?:\d+x\d+|small|medium|large|thumb)$/i, "");
}

/** How big a URL's photo probably is, from words and numbers in it. */
function sizeScore(src: string) {
  let score = 0;
  if (/full|original|large|big|hd|xl|2048|1920|1600|1280/i.test(src)) score += 3;
  if (/thumb|small|mini|tiny|pds|\bs\d|_s\.|150|200x|300x/i.test(src)) score -= 3;
  const width = Math.max(0, ...[...src.matchAll(/(?:w=|width=|\/)(\d{3,4})(?:\D|$)/g)].map((m) => Number(m[1])));
  return score + Math.min(width, 2400) / 1000;
}

/** What a listing page says about itself, cut down to what the model needs. */
function readPage(html: string, url: string) {
  const title = decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "");

  const meta: string[] = [];
  const metaImages: string[] = [];
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const value = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (!key || !value || !/^(og:|twitter:|description$|geo\.|place:|product:)/i.test(key)) continue;
    if (/image/i.test(key) && /^https?:/.test(value)) metaImages.push(decode(value));
    else meta.push(`${key}: ${decode(value).slice(0, 400)}`);
  }

  // JSON-LD, minus the site's own organisation and breadcrumbs.
  const jsonLd: string[] = [];
  for (const match of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const text = match[1].trim();
    if (/"@type"\s*:\s*"(Organization|BreadcrumbList|WebSite|SearchAction)"/.test(text) && text.length < 600) continue;
    jsonLd.push(text);
  }

  // Photos: anything that looks like an image, in page order, without icons and logos.
  // Sites list each photo in several sizes; keep the largest-looking one, where it first appeared.
  const base = new URL(url);
  const best = new Map<string, { src: string; score: number }>();
  const add = (raw: string) => {
    let src: string;
    try {
      src = new URL(decode(raw).replace(/\\u002F/gi, "/").replace(/\\\//g, "/"), base).toString();
    } catch {
      return;
    }
    if (!/^https?:/.test(src) || /\.(svg|gif|ico)(\?|$)/i.test(src)) return;
    if (/logo|icon|sprite|avatar|badge|favicon|placeholder|pixel|tracking|agent|headshot/i.test(src)) return;
    const key = photoKey(src);
    const score = sizeScore(src);
    const found = best.get(key);
    if (!found) best.set(key, { src, score });
    else if (score > found.score) Object.assign(found, { src, score });
  };
  for (const src of metaImages) add(src);
  for (const match of html.matchAll(/<img\s[^>]*?(?:data-src|src)\s*=\s*["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/https?:(?:\/|\\\/|\\u002F){2}[^"'\s<>()]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>()]*)?/gi)) {
    add(match[0]);
  }
  const photos = [...best.values()].map((photo) => photo.src);

  const text = decode(
    html
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();

  return {
    title,
    meta: meta.slice(0, 60).join("\n"),
    jsonLd: jsonLd.join("\n").slice(0, 8000),
    photos: photos.slice(0, 60),
    text: text.slice(0, 8000),
  };
}

/** An address as a point, from OpenStreetMap. Falls back to the area. */
async function geocode(queries: string[]) {
  for (const query of queries.filter(Boolean)) {
    const results = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "user-agent": "Loro (https://github.com/loro-sh)", "accept-language": "en" }, signal: AbortSignal.timeout(8_000) },
    )
      .then((r) => (r.ok ? r.json<{ lat: string; lon: string }[]>() : []))
      .catch(() => []);
    if (results[0]) return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  }
  return null;
}

const listingSchema = z.object({
  isListing: z.boolean().describe("True if the page is one home for sale or rent. False for a search page, an error or a blocked page."),
  address: z.string().describe("Street address, as the listing writes it, e.g. 14445 5th Ave S. Unit number included."),
  area: z.string().describe("Neighbourhood and city, e.g. Burien, WA. With the postcode only if there's no neighbourhood."),
  status: z.string().describe("For sale, For rent, Pending, Sold. Empty if not said."),
  price: z.string().describe("The asking price or rent as written, with currency symbol, e.g. $699,950 or $3,200/mo. Empty if not said."),
  beds: z.string().describe("Number of bedrooms, e.g. 4 or 3 + den. Empty if not said."),
  baths: z.string().describe("Number of bathrooms, e.g. 3 or 2.5. Empty if not said."),
  size: z.string().describe("Interior size with its unit, e.g. 2,600 sq ft. Empty if not said."),
  kind: z.string().describe("Kind of home, e.g. Detached house, Townhouse, Condo. Empty if not said."),
  summary: z
    .string()
    .describe("Two plain sentences on the home itself, in your own words from the listing's facts. No marketing words, nothing it doesn't say."),
  features: z
    .array(z.string())
    .describe("Up to eight facts from the listing a buyer would weigh, each a few words: outdoor space, views, parking, updates, the street. Not the price, rooms, size or area: those have their own fields."),
  photos: z
    .array(z.number())
    .describe("Indexes of the home's own photos in the list given, best first, starting with the front or the best room. Leave out maps, agents, logos and other homes."),
  lat: z.number().nullable().describe("Latitude, only if the page gives it. Null otherwise."),
  lng: z.number().nullable().describe("Longitude, only if the page gives it. Null otherwise."),
});

/** Reads one listing: its page, then the model, then the map. */
async function readListing(url: URL, host: string, keep: number, ctx: StepContext): Promise<ListingData> {
  await ctx.report(`Opening the listing on ${host}`);
  const page = readPage(await fetchPage(url.toString(), ctx.env, ctx.report), url.toString());

  await ctx.report("Reading the listing");
  const { output } = await generateText({
    model: ctx.model,
    providerOptions: { "workers-ai": { reasoning_effort: "low" } },
    output: Output.object({ schema: listingSchema }),
    instructions:
      "You read a real estate listing page and write down what it says about the home. Copy facts, never guess them: " +
      "leave a field empty when the page doesn't say. Ignore other homes on the page (similar listings, nearby sales).",
    prompt: [
      `Link: ${url}`,
      `Title: ${page.title}`,
      page.meta && `Meta tags:\n${page.meta}`,
      page.jsonLd && `Structured data:\n${page.jsonLd}`,
      `Photos:\n${page.photos.map((src, i) => `${i}: ${src}`).join("\n") || "none"}`,
      `Page text:\n${page.text}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  if (!output.isListing || !output.address) throw new Error(`${host} didn't show a listing at that link.`);

  const chosen = [...new Set(output.photos)].flatMap((i) => page.photos[i] ?? []);
  const photos = (chosen.length ? chosen : page.photos.slice(0, 1)).slice(0, keep);

  await ctx.report(`Finding ${output.address} on the map`);
  const given = output.lat !== null && output.lng !== null && Math.abs(output.lat) <= 90 && Math.abs(output.lng) <= 180;
  const point = given
    ? { lat: output.lat as number, lng: output.lng as number }
    : await geocode([`${output.address}, ${output.area}`, output.area]);

  const data: ListingData = {
    url: url.toString(),
    host,
    address: output.address,
    area: output.area,
    status: output.status,
    price: output.price,
    beds: output.beds,
    baths: output.baths,
    size: output.size,
    kind: output.kind,
    summary: output.summary,
    features: output.features.slice(0, 8),
    photos,
    point,
  };
  return data;
}

export default defineStep({
  type: "listing",
  name: "Listing",
  description: "Reads a home for sale from its link: photos, price, rooms and where it is.",
  icon: HouseIcon,
  at: "before",
  // Without the listing there's nothing true to say about the house.
  required: true,
  fields: {
    answer: f.text({
      label: "Link answer",
      default: "link",
      help: "The question whose answer is the listing's link.",
    }),
    saveAs: f.text({
      label: "Save location as",
      default: "listing_location",
      help: "The answer its point is saved under. Lookups set to Near an answer use this name.",
    }),
    photos: f.number({ label: "Photos to keep", default: 8, min: 1, max: 20 }),
  },
  async run(props, ctx) {
    const raw = ctx.answers[props.answer];
    const link = (typeof raw === "string" ? raw : "").trim();
    if (!link) return { skipped: true, message: "No listing link" };
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    } catch {
      throw new Error(`"${link}" isn't a link.`);
    }
    const host = url.host.replace(/^www\./, "");

    const key = `listing:v3:${url}`;
    const cached = await ctx.env.CACHE.get<ListingData>(key, "json").catch(() => null);
    const data = cached ?? (await readListing(url, host, props.photos, ctx));
    if (!cached) await ctx.env.CACHE.put(key, JSON.stringify(data), { expirationTtl: CACHE_SECONDS }).catch(() => {});
    const { point, photos } = data;
    const rooms = [data.beds && `${data.beds} bed`, data.baths && `${data.baths} bath`, data.size, data.kind]
      .filter(Boolean)
      .join(", ");
    return {
      output: data,
      data,
      answers: point ? { [props.saveAs]: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` } : {},
      notes: [
        `The home they're being matched with (listed on ${host}): ${data.address}, ${data.area}. ` +
          [data.status, data.price && `at ${data.price}`].filter(Boolean).join(" ") +
          (rooms ? `. ${rooms}` : "") +
          `. ${data.summary}` +
          (data.features.length ? ` Features: ${data.features.join("; ")}.` : "") +
          " These are the only facts known about the home: don't add others.",
      ],
      message: [data.address, data.price, `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`, !point && "not on the map"]
        .filter(Boolean)
        .join(" · "),
    };
  },
  // The example: a home on Phinney Ridge, as this step read it from Coldwell Banker on 2026-10-20.
  sample: (): ListingData => ({
    url: "https://www.coldwellbankerhomes.com/wa/seattle/6710-3rd-ave-nw/pid_74327012/",
    host: "coldwellbankerhomes.com",
    address: "6710 3rd Ave NW",
    area: "Phinney Ridge, Seattle, WA 98117",
    status: "For sale",
    price: "$929,000",
    beds: "3",
    baths: "2",
    size: "1,401 sq ft",
    kind: "Single family",
    summary:
      "A 1985 house on Phinney Ridge with an updated kitchen and vaulted ceilings. A west-facing balcony looks out over the neighbourhood, and the fenced backyard has a patio.",
    features: ["Fenced backyard with patio", "West-facing balcony", "Territorial view", "Updated kitchen", "Vaulted ceilings", "Attached garage"],
    photos: [
      "https://m.cbhomes.com/p/277/2595704/76d31B932a71438/original.webp",
      "https://m1.cbhomes.com/p/277/2595704/9AC8945edc8E420/full.webp",
      "https://m.cbhomes.com/p/277/2595704/a925403ead65483/full.webp",
      "https://m1.cbhomes.com/p/277/2595704/7c89B1819cFF4c9/full.webp",
      "https://m.cbhomes.com/p/277/2595704/06981a4e4b82406/full.webp",
      "https://m1.cbhomes.com/p/277/2595704/2EB3F55Eb85d464/full.webp",
    ],
    point: { lat: 47.67816, lng: -122.36018 },
  }),
});
