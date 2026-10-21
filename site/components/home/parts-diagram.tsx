"use client";

import { type ComponentProps, type ComponentType, type PointerEvent, type ReactNode, useState } from "react";
import { HeartIcon, PersonIcon, StoreIcon, ZapIcon } from "@/components/home/icons";
import { cx } from "@/components/ui";

type Key = "brand" | "person" | "taste" | "experience";

type Part = {
  key: Key;
  title: string;
  body: string;
  icon: ComponentType<ComponentProps<"svg">>;
  /** Icon colour on a white badge. */
  tone: string;
  /** Icon colour straight on its circle in the diagram. */
  deep: string;
  /** The legend badge while its part is highlighted. */
  lit: string;
};

/** Circle centres in the diagram's 520 × 470 box; every circle has a radius of 150. */
const circles: Record<"brand" | "person" | "taste", { cx: number; cy: number; icon: { x: number; y: number } }> = {
  brand: { cx: 190, cy: 170, icon: { x: 21, y: 26 } },
  person: { cx: 330, cy: 170, icon: { x: 79, y: 26 } },
  taste: { cx: 260, cy: 290, icon: { x: 50, y: 82 } },
};

const parts: Part[] = [
  {
    key: "brand",
    title: "The Brand",
    body: "What it sells and the facts around it: the festival bill, the cottage, the listing.",
    icon: StoreIcon,
    tone: "text-accent-hover",
    deep: "text-[#5b5ba6]",
    lit: "bg-[#e9e9f7] ring-2 ring-[#9d9dd4]",
  },
  {
    key: "person",
    title: "The Person",
    body: "Their answers: where they’re coming from, who’s with them, when they arrive.",
    icon: PersonIcon,
    tone: "text-[#d0608f]",
    deep: "text-[#ad4673]",
    lit: "bg-[#fbe4ee] ring-2 ring-[#eb94b8]",
  },
  {
    key: "taste",
    title: "Their Taste",
    body: "Their favourites, matched by Qloo to places, artists and brands near what the brand sells. Qloo gets the favourites, never a name or an email.",
    icon: HeartIcon,
    tone: "text-[#c98a2b]",
    deep: "text-[#9a6418]",
    lit: "bg-[#fcefd9] ring-2 ring-[#efbd6c]",
  },
];

const experience: Part = {
  key: "experience",
  title: "The Experience",
  body: "Where all three meet: one page about the brand’s thing, made for one person.",
  icon: ZapIcon,
  tone: "text-white",
  deep: "text-white",
  lit: "ring-2 ring-[#e8679e] ring-offset-2 ring-offset-ground",
};

const circleFill: Record<"brand" | "person" | "taste", string> = {
  brand: "top-[4.3%] left-[7.7%] bg-[radial-gradient(circle_at_30%_30%,#d9d9f2,#9d9dd4)]",
  person: "top-[4.3%] left-[34.6%] bg-[radial-gradient(circle_at_70%_30%,#f9d3e2,#eb94b8)]",
  taste: "top-[29.8%] left-[21.2%] bg-[radial-gradient(circle_at_50%_75%,#fae6c3,#efbd6c)]",
};

/**
 * The Venn diagram and its legend share one highlight: hovering a circle (or
 * an overlap) lights up those parts in the legend, and hovering a legend item
 * lights up its circle. Inside all three circles is the experience.
 */
export function PartsDiagram() {
  const [active, setActive] = useState<Key[]>([]);
  const isOn = (key: Key) => active.includes(key);
  const anyOn = active.length > 0;

  function track(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 520;
    const y = ((e.clientY - box.top) / box.height) * 470;
    const inside = (Object.keys(circles) as (keyof typeof circles)[]).filter(
      (key) => Math.hypot(x - circles[key].cx, y - circles[key].cy) <= 150,
    );
    const next: Key[] = inside.length === 3 ? ["experience"] : inside;
    if (next.join() !== active.join()) setActive(next);
  }

  return (
    <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <div
          role="img"
          aria-label="Three overlapping circles, the brand, the person and their taste, with the experience where all three meet"
          onPointerMove={track}
          onPointerLeave={() => setActive([])}
          className="relative mx-auto aspect-[520/470] w-full max-w-[560px]"
        >
          {parts.map((part) => {
            const key = part.key as keyof typeof circles;
            return (
              <div
                key={part.key}
                className={cx(
                  "absolute aspect-square w-[57.7%] rounded-full mix-blend-multiply transition-[opacity,scale] duration-300",
                  circleFill[key],
                  isOn(key) ? "scale-[1.03] opacity-90" : anyOn && !isOn("experience") ? "opacity-30" : "opacity-60",
                )}
              />
            );
          })}

          {parts.map((part) => {
            const Icon = part.icon;
            const at = circles[part.key as keyof typeof circles].icon;
            return (
              <Placed key={part.key} x={at.x} y={at.y}>
                <Icon
                  strokeWidth={1.5}
                  className={cx(
                    "size-8 transition-[opacity,scale] duration-300 sm:size-10",
                    part.deep,
                    isOn(part.key) ? "scale-125" : anyOn && !isOn("experience") ? "opacity-40" : "",
                  )}
                />
              </Placed>
            );
          })}

          <Placed x={50} y={45}>
            <Experience on={isOn("experience")} />
          </Placed>
        </div>
      </div>

      <ul className="space-y-7 lg:col-span-5">
        {[...parts, experience].map((part) => (
          <li
            key={part.key}
            tabIndex={0}
            onPointerEnter={() => setActive([part.key])}
            onPointerLeave={() => setActive([])}
            onFocus={() => setActive([part.key])}
            onBlur={() => setActive([])}
            className={cx(
              "flex gap-4 rounded-2xl transition-opacity duration-300 outline-offset-4",
              anyOn && !isOn(part.key) ? "opacity-45" : "",
            )}
          >
            <Badge part={part} dark={part === experience} on={isOn(part.key)} />
            <div className="min-w-0 pt-1">
              <h3 className="font-display text-xl">{part.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{part.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ part, dark, on }: { part: Part; dark?: boolean; on: boolean }) {
  const Icon = part.icon;
  return (
    <span
      className={cx(
        "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-[0_1px_2px_rgb(40_50_60/0.08),0_8px_24px_-8px_rgb(40_50_60/0.25)] transition-[background-color,box-shadow,scale] duration-300",
        dark ? "bg-accent-deep" : "bg-white",
        part.tone,
        on && cx(part.lit, "scale-110"),
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

const spectrum = "bg-[conic-gradient(from_0deg,#7d7dd0,#e8679e,#eea53f,#7d7dd0)]";

/**
 * The centre of the diagram: a bolt on a dark disc ringed in all three parts'
 * colours. The glow behind it turns slowly, and swells while the experience is
 * highlighted.
 */
function Experience({ on }: { on: boolean }) {
  return (
    <div className={cx("relative size-24 transition-[scale] duration-300 sm:size-32", on && "scale-110")}>
      <span
        aria-hidden
        className={cx(
          "absolute rounded-full blur-2xl transition-all duration-300 motion-safe:animate-[spin_18s_linear_infinite]",
          spectrum,
          on ? "-inset-8 opacity-100" : "-inset-5 opacity-90",
        )}
      />
      <span
        aria-hidden
        className={cx(
          "absolute inset-0 rounded-full p-1 shadow-[0_12px_32px_-8px_rgb(34_32_63/0.5)] motion-safe:animate-[spin_18s_linear_infinite]",
          spectrum,
        )}
      >
        <span className="block size-full rounded-full border-2 border-white/80 bg-accent-deep" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-white">
        <ZapIcon
          strokeWidth={1.25}
          className={cx(
            "size-10 fill-white drop-shadow-[0_0_10px_rgb(232_103_158/0.7)] transition-[scale,rotate] duration-300 sm:size-12",
            on && "scale-115 -rotate-6",
          )}
        />
      </span>
    </div>
  );
}

function Placed({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      {children}
    </div>
  );
}
