/**
 * Lookups: the Qloo searches the Taste step runs, set on the experience.
 * Each one finds things of one type for this person (bars near their
 * hotel, music they'd like), ranked by their weighted favourites. Sections
 * pick the lookups they recommend from, so everything on the page is a
 * real entity Qloo found for them.
 *
 * Code steps can add their own candidates too (a step that `provides` a
 * type): sections pick those the same way, by the step's id.
 *
 * Shared by the admin and the workflow: no server imports.
 */
import { type FieldValues, f } from "../catalogue/fields";
import { signalTypes } from "../profiles";
import type { EntityType } from "./state";

/**
 * Kinds of place a lookup can look for, as Qloo category tags. With none
 * picked, the Taste step picks the ones that fit the person.
 */
export const placeCategories = {
  restaurant: { label: "Restaurants", tags: ["urn:tag:category:place:restaurant"] },
  brunch: {
    label: "Breakfast and brunch",
    tags: ["urn:tag:category:place:brunch_restaurant", "urn:tag:category:place:bakery"],
  },
  coffee: { label: "Coffee", tags: ["urn:tag:category:place:coffee_shop", "urn:tag:category:place:cafe"] },
  bar: {
    label: "Bars",
    tags: ["urn:tag:category:place:bar", "urn:tag:category:place:cocktail_bar", "urn:tag:category:place:wine_bar"],
  },
  music: {
    label: "Live music",
    tags: ["urn:tag:category:place:live_music_venue", "urn:tag:category:place:live_music_bar"],
  },
  culture: {
    label: "Museums and galleries",
    tags: ["urn:tag:category:place:museum", "urn:tag:category:place:art_gallery"],
  },
  outdoors: { label: "Parks and outdoors", tags: ["urn:tag:category:place:park"] },
  shopping: {
    label: "Shops",
    tags: [
      "urn:tag:category:place:record_store",
      "urn:tag:category:place:vintage_clothing_store",
      "urn:tag:category:place:book_store",
    ],
  },
} as const;

export type PlaceCategory = keyof typeof placeCategories;
export const placeCategoryIds = Object.keys(placeCategories) as PlaceCategory[];

/** How much a group of favourites counts, as Qloo weights. Off leaves it out. */
export const weights = { off: 0, low: 1, medium: 3, high: 9 } as const;
export type Weight = keyof typeof weights;

const weightOptions = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

/** Popularity percentiles for each setting. Tried against Austin: these keep real, open places. */
export const popularityRanges = {
  any: {},
  known: { min: 0.85 },
  lesser: { max: 0.75 },
} as const;

export const lookupFields = {
  name: f.text({ label: "Name", placeholder: "Bars near their hotel", help: "Sections pick lookups by this name." }),
  type: f.select({
    label: "Find",
    options: (Object.keys(signalTypes) as EntityType[]).map((type) => ({
      value: type,
      label: `${signalTypes[type]}s`,
    })),
  }),
  near: f.segmented({
    label: "Where",
    options: [
      { value: "city", label: "In a city" },
      { value: "place", label: "Near a place" },
      { value: "answer", label: "Near an answer" },
    ],
  }),
  answer: f.text({ label: "Answer", help: "The question whose answer names the place, like their hotel." }),
  /** A city for "city", a venue, hotel or address for "place". */
  place: f.text({
    label: "Place",
    placeholder: "Moody Center, Austin",
    help: "A venue, hotel or address Qloo knows, or a point as lat, lng.",
  }),
  radius: f.number({ label: "Within (km)", default: 2, min: 0.5, max: 50, step: 0.5 }),
  kinds: f.multi({
    label: "Kinds of place",
    help: "None picked: whatever fits them.",
    options: placeCategoryIds.map((id) => ({ value: id, label: placeCategories[id].label })),
  }),
  popularity: f.segmented({
    label: "Popularity",
    options: [
      { value: "any", label: "Any" },
      { value: "known", label: "Well known" },
      { value: "lesser", label: "Lesser known" },
    ],
  }),
  price: f.segmented({
    label: "Price",
    options: [
      { value: "any", label: "Any" },
      { value: "1", label: "Up to $" },
      { value: "2", label: "Up to $$" },
      { value: "3", label: "Up to $$$" },
    ],
  }),
  day: f.select({
    label: "Open on",
    options: [
      { value: "any", label: "Any day" },
      ...["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => ({
        value: day,
        label: day[0].toUpperCase() + day.slice(1),
      })),
    ],
  }),
  take: f.number({ label: "How many to find", default: 10, min: 3, max: 20 }),
  person: f.segmented({ label: "Their favourites", default: "high", options: weightOptions }),
  segment: f.segmented({ label: "Their segment's favourites", default: "low", options: weightOptions }),
  steer: f.text({
    label: "Also steer by",
    placeholder: "Khruangbin",
    help: "Names Qloo treats as a favourite for everyone, like the band that's playing. Separate with commas.",
  }),
  steerWeight: f.segmented({ label: "How much", default: "medium", options: weightOptions }),
};

/** "49.2704, -123.1869" as a point, for places Qloo doesn't know, like a house for sale. */
export function parsePoint(text: string) {
  const match = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(text);
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

/** A city to search when nothing else says: the first lookup's city. */
export function defaultCity(lookups: LookupConfig[]) {
  return lookups.find((lookup) => lookup.props.near === "city" && lookup.props.place.trim())?.props.place.trim() ?? "";
}

export type LookupProps = FieldValues<typeof lookupFields>;
export type LookupConfig = { id: string; props: LookupProps };

/** What a section can pick from: the workflow's lookups and code steps that provide candidates. */
export type LookupOption = { id: string; name: string; type: EntityType };
