/**
 * Context is what the brand gives Loro beyond profiles and Qloo.
 *
 * - Skill: an instruction the generation workflow can pick up. The title
 *   names it; the description says what to do and when, so the workflow
 *   can decide whether it applies.
 * - Image and media: files an experience can place, like a venue photo or
 *   a welcome voice note. Images go to Cloudflare Images, video to Stream
 *   and audio to R2 (see files.server.ts).
 *
 * Stored in D1 per workspace (context.server.ts). The fixtures below seed
 * a new database. They match the Itinerary experience's anchor: a
 * Khruangbin show at Moody Center, Austin.
 */

export type Skill = {
  id: string;
  title: string;
  description: string;
  updated: string;
};

export type ImageAsset = {
  id: string;
  name: string;
  url: string;
  /** Read aloud by screen readers and given to the workflow as a caption. */
  alt: string;
  width: number;
  height: number;
  bytes: number;
  addedDaysAgo: number;
};

export type MediaKind = "video" | "audio";

export type MediaAsset = {
  id: string;
  name: string;
  kind: MediaKind;
  /** Fixtures have no file behind them, and video has none until Stream is done. */
  url: string | null;
  /** Stream's player page, since its HLS URL only plays natively in Safari. */
  embed: string | null;
  poster: string | null;
  status: "uploading" | "processing" | "ready" | "error";
  seconds: number;
  bytes: number;
  addedDaysAgo: number;
};

type MediaFixture = Omit<MediaAsset, "embed" | "poster" | "status">;

export const mediaKinds: Record<MediaKind, string> = { video: "Video", audio: "Audio" };

const skills: Skill[] = [
  {
    id: "brand-voice",
    title: "Brand Voice",
    description:
      "Warm, unhurried and specific, like a friend who has seen a dozen shows in Austin. Name the dish, the street, the time. Use for any copy a guest will read.",
    updated: "Oct 14",
  },
  {
    id: "pre-show-dinner",
    title: "Pre-Show Dinner",
    description:
      "Pick one restaurant within 15 minutes of Moody Center that can seat a table before 6:30pm. Use when the itinerary covers the evening before doors open.",
    updated: "Oct 12",
  },
  {
    id: "partner-venues",
    title: "Partner Venues",
    description:
      "Prefer places we partner with: Waterloo Records, Cosmic Coffee and Hotel San José. Use when choosing where to send someone and two options are close.",
    updated: "Oct 9",
  },
  {
    id: "getting-there",
    title: "Getting There",
    description:
      "Moody Center has no general parking. Suggest rideshare drop-off on Red River Street, or the MetroRail to Downtown Station. Use whenever the plan includes travel to the venue.",
    updated: "Oct 9",
  },
  {
    id: "steer-clear",
    title: "Steer Clear",
    description:
      "Never recommend Sixth Street bars, chains or anywhere with a cover charge. Use when filtering Qloo results before they reach the itinerary.",
    updated: "Oct 3",
  },
];

/** Seeded placeholder photos. Uploads replace them in Cloudflare Images. */
const photo = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/loro-${seed}/${width}/${height}`;

const images: ImageAsset[] = [
  {
    id: "moody-center",
    name: "moody-center-exterior.jpg",
    url: photo("moody-center", 1600, 1067),
    alt: "Moody Center at dusk with the marquee lit",
    width: 1600,
    height: 1067,
    bytes: 412_000,
    addedDaysAgo: 2,
  },
  {
    id: "tour-poster",
    name: "khruangbin-tour-poster.png",
    url: photo("tour-poster", 1200, 1500),
    alt: "Khruangbin tour poster with Austin date",
    width: 1200,
    height: 1500,
    bytes: 1_840_000,
    addedDaysAgo: 2,
  },
  {
    id: "south-congress",
    name: "south-congress-dusk.jpg",
    url: photo("south-congress", 1600, 1067),
    alt: "South Congress Avenue looking towards the Capitol",
    width: 1600,
    height: 1067,
    bytes: 388_000,
    addedDaysAgo: 5,
  },
  {
    id: "barton-springs",
    name: "barton-springs.jpg",
    url: photo("barton-springs", 1600, 1067),
    alt: "Swimmers at Barton Springs Pool in the afternoon",
    width: 1600,
    height: 1067,
    bytes: 455_000,
    addedDaysAgo: 5,
  },
  {
    id: "waterloo",
    name: "waterloo-records-wall.jpg",
    url: photo("waterloo", 1200, 1500),
    alt: "",
    width: 1200,
    height: 1500,
    bytes: 502_000,
    addedDaysAgo: 8,
  },
  {
    id: "hotel-san-jose",
    name: "hotel-san-jose-courtyard.jpg",
    url: photo("san-jose", 1600, 1067),
    alt: "Hotel San José courtyard with string lights",
    width: 1600,
    height: 1067,
    bytes: 397_000,
    addedDaysAgo: 12,
  },
];

const media: MediaFixture[] = [
  {
    id: "venue-walkthrough",
    name: "venue-walkthrough.mp4",
    kind: "video",
    url: null,
    seconds: 102,
    bytes: 48_200_000,
    addedDaysAgo: 3,
  },
  {
    id: "live-teaser",
    name: "khruangbin-live-teaser.mp4",
    kind: "video",
    url: null,
    seconds: 30,
    bytes: 14_600_000,
    addedDaysAgo: 3,
  },
  {
    id: "welcome-note",
    name: "welcome-voice-note.m4a",
    kind: "audio",
    url: null,
    seconds: 48,
    bytes: 760_000,
    addedDaysAgo: 6,
  },
  {
    id: "playlist-intro",
    name: "pre-show-playlist-intro.mp3",
    kind: "audio",
    url: null,
    seconds: 135,
    bytes: 3_240_000,
    addedDaysAgo: 10,
  },
];

export function listSkills() {
  return skills;
}

export function listImages() {
  return images;
}

export function listMedia() {
  return media;
}
