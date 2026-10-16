"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, VideoOff, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { PortfolioClip } from "@/lib/data/types";

/**
 * A creator card's three sample slots. A sample opens in a player right here (without leaving
 * Explore); a slot the creator hasn't filled says so.
 */
export function PortfolioStrip({ samples, name }: { samples: PortfolioClip[]; name: string }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number>();
  const shown = samples.slice(0, 3);

  const show = (i: number) => {
    setOpen(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    setOpen(undefined);
  };
  const current = open === undefined ? undefined : shown[open];
  const label = (i: number) => t("profile.play", { title: t("profile.sample", { n: i + 1 }) });

  return (
    <>
      <ul className="pointer-events-auto relative z-10 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => {
          const clip = shown[i];
          return (
            <li key={clip?.id ?? `empty-${i}`}>
              {clip ? (
                <button type="button" onClick={() => show(i)} aria-label={`${label(i)} · ${name}`} className="group/clip relative block w-full overflow-hidden rounded-[var(--radius-md)]">
                  {/* A still from the video; it only plays in the player. */}
                  <video src={`${clip.videoSrc}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden className="aspect-[9/16] w-full bg-black object-cover" />
                  <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover/clip:bg-black/25">
                    <span className="grid size-9 place-items-center rounded-full bg-black/55 text-white">
                      <Play className="size-4 translate-x-px fill-current" />
                    </span>
                  </span>
                </button>
              ) : (
                <div className="flex aspect-[9/16] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border bg-surface/60 px-1 text-center text-text-muted">
                  <VideoOff aria-hidden className="size-5" strokeWidth={1.75} />
                  <span className="text-caption leading-tight">{t("explore.noSample")}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current ? `${label(open!)} · ${name}` : undefined}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === dialog.current && close()}
        className="pointer-events-auto m-auto w-[min(24rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-black/80"
      >
        {current && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 text-white">
              <p className="min-w-0 truncate font-medium">
                {name} · {t("profile.sample", { n: open! + 1 })}
              </p>
              <button type="button" onClick={close} aria-label={t("nav.close")} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {/* key: a new sample starts from the beginning. Video controls stay left-to-right. */}
            <video key={current.id} dir="ltr" src={current.videoSrc} autoPlay controls playsInline className="aspect-[9/16] max-h-[75vh] w-full rounded-[var(--radius-lg)] bg-black object-contain" />
            {shown.length > 1 && (
              <div className="flex items-center justify-center gap-3 text-white">
                <button type="button" onClick={() => setOpen((open! + shown.length - 1) % shown.length)} aria-label={t("explore.previousSample")} className="grid size-10 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                  <ChevronLeft aria-hidden className="size-5 rtl:rotate-180" />
                </button>
                <span className="text-small tabular-nums" dir="ltr">
                  {open! + 1} / {shown.length}
                </span>
                <button type="button" onClick={() => setOpen((open! + 1) % shown.length)} aria-label={t("explore.nextSample")} className="grid size-10 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                  <ChevronRight aria-hidden className="size-5 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
