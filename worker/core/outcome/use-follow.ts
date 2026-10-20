/**
 * Follows a run on the page while it's being made, so the person watches
 * it arrive instead of scrolling around a half-built page:
 *
 * - While it runs, the page doesn't scroll for them: no scrollbar, and
 *   wheel, touch and scroll keys do nothing.
 * - The section being written is scrolled into view and kept there as it
 *   streams: its top under `offset`, or, once it's taller than the view,
 *   its newest line just above the footer.
 * - When the run settles, the phase turns "leaving" (for the footer to
 *   animate away), the page scrolls back to the top and lets go.
 *
 *   const footer = useRef<HTMLDivElement>(null);
 *   const phase = useFollowRun(ctx.outcome, footer);
 *
 * On the page, <html> has `data-following` meanwhile, so anything floating
 * (the feedback button) can step aside with `[[data-following]_&]:hidden`.
 *
 * `footer` is an element on the page (a progress footer): its height is
 * kept clear, and the scroller it sits in is the one followed, so it works
 * on the page and inside the editor's preview alike. Headless: no styles.
 */
import { type RefObject, useEffect, useRef, useState } from "react";

import type { OutcomeView } from "./state";

export type FollowPhase = "idle" | "following" | "leaving";

const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);

/** The nearest scrolling ancestor, or null for the page itself. */
function scrollerOf(node: HTMLElement | null): HTMLElement | null {
  for (let parent = node?.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
  }
  return null;
}

export function useFollowRun(
  outcome: OutcomeView | null,
  footer: RefObject<HTMLElement | null>,
  { enabled = true, offset = 24, leaveMs = 700, errorMs = 2500 } = {},
): FollowPhase {
  const live = enabled && outcome?.status === "running";
  const [phase, setPhase] = useState<FollowPhase>(live ? "following" : "idle");
  const latest = useRef(outcome);
  latest.current = outcome;
  const failed = outcome?.status === "error";

  // Start following when a run is live; when it settles, leave, then stop.
  useEffect(() => {
    if (live) return setPhase("following");
    if (phase !== "following") return;
    const leave = setTimeout(
      () => {
        setPhase("leaving");
        const scroller = scrollerOf(footer.current);
        (scroller ?? window).scrollTo({ top: 0, behavior: "smooth" });
      },
      failed ? errorMs : 0,
    );
    return () => clearTimeout(leave);
  }, [live]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const done = setTimeout(() => setPhase("idle"), leaveMs);
    return () => clearTimeout(done);
  }, [phase]);

  // While following: no scrolling by hand, and the page tracks the section being written.
  useEffect(() => {
    if (phase !== "following") return;
    const scroller = scrollerOf(footer.current);
    const locked = scroller ?? document.documentElement;
    const before = locked.style.overflow;
    locked.style.overflow = "hidden";
    if (!scroller) document.documentElement.dataset.following = "";
    const target: HTMLElement | Window = scroller ?? window;
    const stop = (event: Event) => event.preventDefault();
    const keys = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]");
      if (SCROLL_KEYS.has(event.key) && !typing) event.preventDefault();
    };
    target.addEventListener("wheel", stop, { passive: false });
    target.addEventListener("touchmove", stop, { passive: false });
    window.addEventListener("keydown", keys);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const current = latest.current?.current;
      if (current?.kind !== "section") return;
      const root: HTMLElement | Document = scroller ?? document;
      const section = root.querySelector<HTMLElement>(`[data-block="${CSS.escape(current.id)}"]`);
      if (!section) return;
      const box = section.getBoundingClientRect();
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const at = scroller ? scroller.scrollTop : window.scrollY;
      const view = scroller ? scroller.clientHeight : window.innerHeight;
      const max = (scroller ?? document.documentElement).scrollHeight - view;
      const clear = view - (footer.current?.offsetHeight ?? 0);
      const start = box.top - top + at;
      const end = start + box.height;
      // Its top in view; once it outgrows the view, its newest line.
      const goal = Math.min(max, Math.max(0, Math.max(start - offset, end - clear + offset)));
      const step = (goal - at) * 0.12;
      if (Math.abs(goal - at) < 1) return;
      target.scrollTo({ top: Math.abs(step) < 1 ? goal : at + step, behavior: "instant" });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      locked.style.overflow = before;
      if (!scroller) delete document.documentElement.dataset.following;
      target.removeEventListener("wheel", stop);
      target.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", keys);
    };
  }, [phase]);

  return phase;
}
