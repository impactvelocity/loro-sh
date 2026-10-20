/**
 * A small poster map of the West Coast, drawn as SVG with no tiles: the
 * Pacific, the coast, the road and where it stops. Nothing else, so the
 * drive reads at a glance. It fits itself to whatever it's given, from a
 * two-hour hop to three days of I-5.
 * Shared by the start page (every city's arc to the festival) and the
 * outcome (their real route).
 */
import { useId } from "react";

import { cn } from "@/lib/utils";
import type { Point, StopRole } from "./trip";

type LatLng = [number, number];

/** The coast from Vancouver Island to Baja, simplified. Puget Sound is left out. */
const coast: LatLng[] = [
  [51, -128.5], [50, -127.5], [49, -125.9], [48.4, -124.7], [47.9, -124.6], [47.3, -124.3], [46.9, -124.1], [46.3, -124.05],
  [45.9, -123.95], [45.3, -123.97], [44.8, -124.06], [44, -124.12], [43.4, -124.3], [42.8, -124.55], [42, -124.21],
  [41.5, -124.08], [40.8, -124.2], [40.44, -124.41], [40, -124.05], [39.5, -123.8], [38.95, -123.73], [38.5, -123.25],
  [38, -122.95], [37.8, -122.52], [37.5, -122.5], [37.1, -122.33], [36.95, -122.03], [36.8, -121.8], [36.6, -121.92],
  [36.3, -121.9], [35.9, -121.48], [35.6, -121.15], [35.3, -120.9], [34.9, -120.65], [34.55, -120.6], [34.45, -120.45],
  [34.4, -119.85], [34.25, -119.25], [34.05, -118.85], [34, -118.5], [33.75, -118.4], [33.72, -118.1], [33.45, -117.7],
  [33.2, -117.38], [32.85, -117.27], [32.53, -117.12], [32, -116.85], [31.5, -116.6], [30.5, -116], [29.5, -115.2],
];

export type MapMark = Point & { label?: string; role: StopRole; side?: "left" | "right" };
export type MapArc = { from: Point; to: Point };

const W = 480;

function frame(points: Point[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let [south, north] = [Math.min(...lats), Math.max(...lats)];
  let [west, east] = [Math.min(...lngs), Math.max(...lngs)];
  const mid = (south + north) / 2;
  const k = Math.cos((mid * Math.PI) / 180);
  // Room for labels, then keep it between landscape and a little taller than square.
  const padLat = Math.max(0.35, (north - south) * 0.14);
  const padLng = Math.max(0.5, (east - west) * 0.18);
  [south, north, west, east] = [south - padLat, north + padLat, west - padLng, east + padLng];
  const w = (east - west) * k;
  const h = north - south;
  if (h / w > 1.2) {
    const grow = (h / 1.2 / k - (east - west)) / 2;
    [west, east] = [west - grow, east + grow];
  } else if (h / w < 0.62) {
    const grow = (w * 0.62 - h) / 2;
    [south, north] = [south - grow, north + grow];
  }
  const scale = W / ((east - west) * k);
  const H = Math.round((north - south) * scale);
  const project = ([lat, lng]: LatLng) => [(lng - west) * k * scale, (north - lat) * scale] as const;
  return { H, project, scale };
}

const path = (points: LatLng[], project: (p: LatLng) => readonly [number, number]) =>
  points.map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(1)).join(" ")}`).join("");

export function RoadMap({
  route = [],
  arcs = [],
  marks = [],
  className,
  title,
}: {
  route?: LatLng[];
  arcs?: MapArc[];
  marks?: MapMark[];
  className?: string;
  title: string;
}) {
  const id = useId().replace(/:/g, "");
  const all: Point[] = [
    ...route.map(([lat, lng]) => ({ lat, lng })),
    ...arcs.flatMap((arc) => [arc.from, arc.to]),
    ...marks,
  ];
  if (all.length === 0) return null;
  const { H, project } = frame(all);
  const xy = (p: Point) => project([p.lat, p.lng]);
  // The ocean: the coast, closed off far out to sea.
  const ocean = `${path([[60, -170], ...coast, [20, -170]], project)}Z`;
  const font = Math.max(12, Math.min(15, W / 34));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className={cn("block w-full", className)}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="14" />
        </clipPath>
        {/* The sea as engraved lines, in the map's own ink. */}
        <pattern id={`${id}-sea`} width="6" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 2.5H6" stroke="var(--foreground)" strokeOpacity="0.14" strokeWidth="0.8" />
        </pattern>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width={W} height={H} fill="var(--card)" />
        <path d={ocean} fill={`url(#${id}-sea)`} />
        <path d={path(coast, project)} fill="none" stroke="var(--foreground)" strokeOpacity="0.35" strokeWidth="1" />
        {arcs.map((arc, i) => {
          const [x1, y1] = xy(arc.from);
          const [x2, y2] = xy(arc.to);
          // Bow each arc a little, all the same way, like flight paths on a poster.
          const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
          const [dx, dy] = [x2 - x1, y2 - y1];
          const bow = 0.18;
          const d = `M${x1} ${y1} Q${mx - dy * bow} ${my + dx * bow} ${x2} ${y2}`;
          return <path key={i} d={d} fill="none" stroke="var(--brand, var(--primary))" strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />;
        })}
        {route.length > 1 && (
          <>
            <path d={path(route, project)} fill="none" stroke="var(--card)" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
            <path
              d={path(route, project)}
              fill="none"
              stroke="var(--brand, var(--primary))"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        {marks.map((mark, i) => {
          const [x, y] = xy(mark);
          const big = mark.role !== "break";
          const left = mark.side ? mark.side === "left" : x > W * 0.62;
          return (
            <g key={i}>
              {mark.role === "arrive" ? (
                <>
                  <circle cx={x} cy={y} r="11" fill="oklch(0.8 0.17 62)" opacity="0.35" />
                  <circle cx={x} cy={y} r="7" fill="oklch(0.72 0.19 45)" stroke="var(--card)" strokeWidth="2" />
                </>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={big ? 5.5 : 3.5}
                  fill={mark.role === "overnight" || mark.role === "start" ? "var(--foreground)" : "var(--card)"}
                  stroke={mark.role === "break" ? "var(--foreground)" : "var(--card)"}
                  strokeWidth="2"
                />
              )}
              {mark.label && (
                <text
                  x={x + (left ? -11 : 11)}
                  y={y + font * 0.35}
                  textAnchor={left ? "end" : "start"}
                  fontSize={big ? font : font * 0.85}
                  fontWeight={big ? 600 : 400}
                  fill="var(--foreground)"
                  stroke="var(--card)"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="font-heading"
                >
                  {mark.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
