/**
 * The road trip: where they drive from, the route, and how it splits into
 * days. The `route` code step (steps/route.ts) builds a Trip for each
 * person and publishes it as its public data; the map and the drive plan
 * read it from there.
 *
 * Plain data and functions, no fetches: shared by the start page, the
 * intake, the step and the outcome. The routing call lives in the step.
 */
import { f } from "@core/catalogue/fields";

export type Point = { lat: number; lng: number };

/** A city they can pick on the intake, with its drive to the festival. */
export type Origin = { name: string; point: string; drive: string; note: string };

/** The Origin Picker's fields: the cities on offer. */
export const originFields = {
  options: f.list({
    label: "Cities",
    itemLabel: "City",
    max: 12,
    fields: {
      name: f.text({ label: "City", placeholder: "Portland, OR" }),
      point: f.text({ label: "Point", placeholder: "45.5231, -122.6765", help: "Latitude, longitude." }),
      drive: f.text({ label: "Drive", placeholder: "16 hrs · 3 days" }),
      note: f.text({ label: "Note", placeholder: "I-5 the whole way" }),
    },
  }),
};

export type StopRole = "start" | "break" | "overnight" | "arrive";

export type TripStop = {
  /** Unique in the trip, e.g. "ashland-or". */
  id: string;
  town: string;
  lat: number;
  lng: number;
  role: StopRole;
  /** Qloo place ids found there, best first. */
  places: string[];
};

export type TripLeg = {
  /** "Wednesday". */
  day: string;
  /** "April 14". */
  date: string;
  from: string;
  to: string;
  km: number;
  hours: number;
  /** The coffee or lunch stop on the way, then where they sleep (or arrive). */
  stops: TripStop[];
};

export type Trip = {
  origin: TripStop;
  destination: TripStop;
  km: number;
  hours: number;
  /** The road as [lat, lng] pairs, thinned for the page. */
  line: [number, number][];
  legs: TripLeg[];
  /** Hours a day they said they'd drive. */
  perDay: number;
  /** "osrm": a real road route. "estimate": a straight line, when routing failed. */
  source: "osrm" | "estimate";
};

export function isTrip(value: unknown): value is Trip {
  return Boolean(value && typeof value === "object" && Array.isArray((value as Trip).legs) && Array.isArray((value as Trip).line));
}

// Geometry, in km on a sphere: plenty for planning a drive.

const R = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function haversine(a: Point, b: Point) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance along the line at each of its points. */
export function cumulative(line: Point[]) {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + haversine(line[i - 1], line[i]));
  return out;
}

/** The point `km` along the line. */
export function pointAt(line: Point[], along: number[], km: number): Point {
  if (km <= 0) return line[0];
  for (let i = 1; i < line.length; i++) {
    if (along[i] < km) continue;
    const t = (km - along[i - 1]) / Math.max(along[i] - along[i - 1], 1e-9);
    return { lat: line[i - 1].lat + (line[i].lat - line[i - 1].lat) * t, lng: line[i - 1].lng + (line[i].lng - line[i - 1].lng) * t };
  }
  return line[line.length - 1];
}

/** How far a place is from the road, and how far along the road its nearest point is. */
export function nearestOnLine(line: Point[], along: number[], p: Point) {
  let best = { off: Number.POSITIVE_INFINITY, at: 0 };
  // Flat projection around the place: fine at the scale of one segment.
  const kx = Math.cos(rad(p.lat)) * 111.32;
  const ky = 110.57;
  for (let i = 1; i < line.length; i++) {
    const ax = (line[i - 1].lng - p.lng) * kx;
    const ay = (line[i - 1].lat - p.lat) * ky;
    const bx = (line[i].lng - p.lng) * kx;
    const by = (line[i].lat - p.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.min(1, Math.max(0, -(ax * dx + ay * dy) / Math.max(dx * dx + dy * dy, 1e-9)));
    const off = Math.hypot(ax + dx * t, ay + dy * t);
    if (off < best.off) best = { off, at: along[i - 1] + (along[i] - along[i - 1]) * t };
  }
  return best;
}

/** Every `n`th point, keeping the ends, so a long route stays small on the page. */
export function thin(line: Point[], max = 160): [number, number][] {
  const step = Math.max(1, Math.ceil(line.length / max));
  const kept = line.filter((_, i) => i % step === 0);
  if (kept[kept.length - 1] !== line[line.length - 1]) kept.push(line[line.length - 1]);
  return kept.map((p) => [Math.round(p.lat * 1000) / 1000, Math.round(p.lng * 1000) / 1000]);
}

/** Towns worth a night or a coffee on the main roads into the desert, so stops land somewhere good, not at a truck stop. */
export const towns: { name: string; lat: number; lng: number }[] = [
  ["Bellingham, WA", 48.7519, -122.4787],
  ["Seattle, WA", 47.6062, -122.3321],
  ["Tacoma, WA", 47.2529, -122.4443],
  ["Olympia, WA", 47.0379, -122.9007],
  ["Centralia, WA", 46.7162, -122.9543],
  ["Portland, OR", 45.5152, -122.6784],
  ["Salem, OR", 44.9429, -123.0351],
  ["Eugene, OR", 44.0521, -123.0868],
  ["Roseburg, OR", 43.2165, -123.3417],
  ["Grants Pass, OR", 42.439, -123.3284],
  ["Ashland, OR", 42.1946, -122.7095],
  ["Bend, OR", 44.0582, -121.3153],
  ["Klamath Falls, OR", 42.2249, -121.7817],
  ["Mount Shasta, CA", 41.3099, -122.3106],
  ["Redding, CA", 40.5865, -122.3917],
  ["Red Bluff, CA", 40.1785, -122.2358],
  ["Chico, CA", 39.7285, -121.8375],
  ["Davis, CA", 38.5449, -121.7405],
  ["Sacramento, CA", 38.5816, -121.4944],
  ["Lodi, CA", 38.1302, -121.2724],
  ["San Francisco, CA", 37.7749, -122.4194],
  ["Oakland, CA", 37.8044, -122.2712],
  ["San Jose, CA", 37.3382, -121.8863],
  ["Santa Cruz, CA", 36.9741, -122.0308],
  ["Monterey, CA", 36.6002, -121.8947],
  ["Los Banos, CA", 37.0583, -120.8499],
  ["Fresno, CA", 36.7378, -119.7871],
  ["Visalia, CA", 36.3302, -119.2921],
  ["Paso Robles, CA", 35.6266, -120.691],
  ["San Luis Obispo, CA", 35.2828, -120.6596],
  ["Bakersfield, CA", 35.3733, -119.0187],
  ["Santa Barbara, CA", 34.4208, -119.6982],
  ["Ojai, CA", 34.448, -119.2429],
  ["Santa Clarita, CA", 34.3917, -118.5426],
  ["Los Angeles, CA", 34.0522, -118.2437],
  ["Pasadena, CA", 34.1478, -118.1445],
  ["Claremont, CA", 34.0967, -117.7198],
  ["Riverside, CA", 33.9806, -117.3755],
  ["Redlands, CA", 34.0556, -117.1825],
  ["Temecula, CA", 33.4936, -117.1484],
  ["San Diego, CA", 32.7157, -117.1611],
  ["Palm Springs, CA", 33.8303, -116.5453],
  ["Joshua Tree, CA", 34.1347, -116.3131],
  ["Barstow, CA", 34.8958, -117.0173],
  ["Las Vegas, NV", 36.1699, -115.1398],
  ["Reno, NV", 39.5296, -119.8138],
  ["Boise, ID", 43.615, -116.2023],
  ["Salt Lake City, UT", 40.7608, -111.891],
  ["St. George, UT", 37.0965, -113.5684],
  ["Flagstaff, AZ", 35.1983, -111.6513],
  ["Phoenix, AZ", 33.4484, -112.074],
  ["Tucson, AZ", 32.2226, -110.9747],
].map(([name, lat, lng]) => ({ name: name as string, lat: lat as number, lng: lng as number }));

export const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The day `offset` days from an ISO date, as "Wednesday" and "April 14". */
export function dayOf(iso: string, offset: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return {
    day: weekdays[date.getUTCDay()],
    date: date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }),
  };
}

export type Snap = (target: number, from: number, to: number, maxOff: number) => { name: string; lat: number; lng: number; at: number } | null;

/** The best listed town near the road between `from` and `to` km along it, closest to `target`. */
export function snapper(line: Point[], along: number[]): Snap {
  const placed = towns.map((town) => ({ ...town, ...nearestOnLine(line, along, town) }));
  return (target, from, to, maxOff) => {
    const fits = placed.filter((town) => town.off <= maxOff && town.at >= from && town.at <= to);
    // A town a little off the road beats a truck stop on it: 1 km off costs like 2 km along.
    const best = fits.toSorted((a, b) => Math.abs(a.at - target) + a.off * 2 - (Math.abs(b.at - target) + b.off * 2))[0];
    return best ? { name: best.name, lat: best.lat, lng: best.lng, at: best.at } : null;
  };
}

export type Plan = {
  legs: { from: number; to: number; break: { name: string; lat: number; lng: number } | null; end: { name: string; lat: number; lng: number } | null }[];
};

/**
 * Splits the road into driving days of about the same length, each at
 * most `perDay` hours (a little over when no town fits), ending in a
 * listed town where it can. Legs over 90 minutes get a break halfway.
 * An end of null means the step has to name the place itself.
 */
export function splitRoute(line: Point[], hours: number, perDay: number): Plan {
  const along = cumulative(line);
  const total = along[along.length - 1];
  const kmPerHour = total / Math.max(hours, 0.1);
  const days = Math.max(1, Math.ceil(hours / perDay - 0.08));
  const snap = snapper(line, along);
  const legs: Plan["legs"] = [];
  let at = 0;
  for (let d = 0; d < days; d++) {
    const last = d === days - 1;
    const target = last ? total : at + (total - at) / (days - d);
    const leg = target - at;
    const end = last
      ? null
      : (snap(target, at + leg * 0.7, Math.min(at + perDay * kmPerHour * 1.12, at + leg * 1.25), 40) ?? {
          name: "",
          ...pointAt(line, along, target),
          at: target,
        });
    const to = end?.at ?? total;
    const span = to - at;
    const brk = span / kmPerHour >= 1.5 ? snap(at + span / 2, at + span * 0.25, at + span * 0.8, 25) : null;
    legs.push({
      from: at,
      to,
      break: brk && { name: brk.name, lat: brk.lat, lng: brk.lng },
      end: end && { name: end.name, lat: end.lat, lng: end.lng },
    });
    at = to;
  }
  return { legs };
}

/** "16 hrs 30" from hours. */
export function duration(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60 / 5) * 5;
  if (h === 0) return `${m} min`;
  return m === 0 || m === 60 ? `${m === 60 ? h + 1 : h} hr${h === 1 && m !== 60 ? "" : "s"}` : `${h} hr${h === 1 ? "" : "s"} ${m}`;
}

export const miles = (km: number) => Math.round(km * 0.621371);

/** Google Maps directions through the trip's stops. */
export function directionsLink(stops: Point[]) {
  const [origin, ...rest] = stops;
  const destination = rest.pop() ?? origin;
  const p = (point: Point) => `${point.lat},${point.lng}`;
  const params = new URLSearchParams({ api: "1", origin: p(origin), destination: p(destination), travelmode: "driving" });
  if (rest.length) params.set("waypoints", rest.map(p).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

// The example: five cities, each a real route to the festival grounds outside Indio.

export const festivalGrounds = { name: "Mirage Valley", point: "33.6823, -116.2376" };

export const exampleOrigins: Origin[] = [
  { name: "San Diego, CA", point: "32.7157, -117.1611", drive: "2 hrs 20 · an afternoon", note: "Up I-15 past Temecula" },
  { name: "Los Angeles, CA", point: "34.0522, -118.2437", drive: "2 hrs · an afternoon", note: "East on I-10 the whole way" },
  { name: "San Francisco, CA", point: "37.7749, -122.4194", drive: "7 hrs 40 · one long day", note: "I-5 down the Central Valley" },
  { name: "Portland, OR", point: "45.5231, -122.6765", drive: "16 hrs 30 · three days", note: "I-5 over the Siskiyous" },
  { name: "Vancouver, BC", point: "49.2827, -123.1207", drive: "21 hrs 40 · three or four days", note: "Border, then I-5 south" },
];

/** Portland's real route (OSRM), thinned: the editor preview's trip. */
const portlandLine: [number, number][] = [
  [45.523, -122.677], [45.481, -122.679], [45.436, -122.744], [45.227, -122.814], [44.987, -122.996], [44.859, -123.012],
  [44.699, -123.052], [44.039, -123.049], [43.827, -123.033], [43.732, -123.199], [43.594, -123.245], [43.421, -123.322],
  [43.21, -123.356], [43.073, -123.357], [42.992, -123.326], [42.898, -123.249], [42.733, -123.371], [42.616, -123.379],
  [42.439, -123.296], [42.429, -123.095], [42.315, -122.854], [42.145, -122.639], [42.066, -122.601], [41.942, -122.587],
  [41.843, -122.575], [41.786, -122.585], [41.646, -122.535], [41.446, -122.437], [41.396, -122.381], [41.271, -122.28],
  [41.195, -122.284], [41.11, -122.327], [41.047, -122.389], [40.97, -122.434], [40.924, -122.41], [40.866, -122.363],
  [40.789, -122.323], [40.693, -122.345], [40.471, -122.31], [40.219, -122.252], [39.812, -122.2], [39.334, -122.195],
  [39.057, -122.086], [38.841, -121.933], [38.693, -121.758], [38.584, -121.503], [38.437, -121.49], [37.962, -121.334],
  [37.779, -121.315], [37.468, -121.185], [37.149, -121.045], [36.921, -120.831], [36.335, -120.305], [35.867, -119.845],
  [34.989, -118.946], [34.816, -118.883], [34.663, -118.759], [34.526, -118.643], [34.352, -118.546], [34.277, -118.391],
  [34.235, -118.291], [34.152, -118.157], [34.133, -117.953], [34.084, -117.819], [34.087, -117.644], [34.069, -117.372],
  [34.055, -117.164], [33.927, -116.98], [33.922, -116.651], [33.75, -116.271], [33.682, -116.244], [33.682, -116.238],
];

/**
 * A believable trip for previews: Portland, seven hours a day, rolling in
 * on Thursday. `ids` are the sample places, handed out to the stops.
 */
export function sampleTrip(ids: string[] = []): Trip {
  const line = portlandLine.map(([lat, lng]) => ({ lat, lng }));
  const hours = 16.5;
  const perDay = 7;
  const total = cumulative(line).at(-1) ?? 0;
  const { legs } = splitRoute(line, hours, perDay);
  const stop = (town: { name: string; lat: number; lng: number }, role: StopRole, places: string[] = []): TripStop => ({
    id: slug(town.name || role),
    town: town.name,
    lat: town.lat,
    lng: town.lng,
    role,
    places,
  });
  const origin = stop({ name: "Portland, OR", lat: 45.5231, lng: -122.6765 }, "start");
  const destination = stop({ name: "Mirage Valley", lat: 33.6823, lng: -116.2376 }, "arrive");
  let n = 0;
  const some = () => ids.slice(n, (n += 2));
  const out: TripLeg[] = legs.map((leg, i) => {
    const { day, date } = dayOf("2027-04-15", i - legs.length + 1);
    const brk = leg.break ? [stop(leg.break, "break", some())] : [];
    const end = leg.end ? stop(leg.end, "overnight", some()) : destination;
    const prev = i === 0 ? origin.town : (legs[i - 1].end?.name ?? "");
    return {
      day,
      date,
      from: prev,
      to: end.town,
      km: Math.round(leg.to - leg.from),
      hours: Math.round(((leg.to - leg.from) / total) * hours * 10) / 10,
      stops: [...brk, end],
    };
  });
  return { origin, destination, km: Math.round(total), hours, line: portlandLine, legs: out, perDay, source: "osrm" };
}
