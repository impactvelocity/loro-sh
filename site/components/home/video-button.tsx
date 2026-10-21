"use client";

import { useRef } from "react";

/** A thumbnail button that opens a video in a modal. With no src it says so. */
export function VideoButton({ src, poster, label }: { src: string | null; poster: string; label: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-hairline bg-raised p-2 pr-4 text-left transition-colors hover:border-[#cfcac5]"
      >
        <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-deep">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export; images are pre-sized */}
          <img src={poster} alt="" className="size-full object-cover object-top opacity-80" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-deep shadow">
              <Play />
            </span>
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-ink">Watch the demo</span>
          <span className="block truncate text-[13px] text-quiet">{label}</span>
        </span>
      </button>

      <dialog
        ref={dialog}
        onClose={() => video.current?.pause()}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(960px,calc(100vw-2rem))] overflow-hidden rounded-[24px] bg-deep p-0 text-white backdrop:bg-deep/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-white/70">{label}</p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-full px-3 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="aspect-video bg-black">
          {src ? (
            <video ref={video} src={src} poster={poster} controls playsInline className="size-full" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-white/60">Video coming soon</div>
          )}
        </div>
      </dialog>
    </>
  );
}

function Play() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="ml-0.5 size-3.5">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}
