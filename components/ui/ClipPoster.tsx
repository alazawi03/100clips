import { Eye, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Clip } from "@/lib/data/types";
import { nicheIcon } from "./nicheIcons";


type ClipPosterProps = {
  clip: Clip;
  /** Pre-formatted on the server, e.g. "12.4K". */
  views: string;
  duration: string;
  /** Small tile: no stats overlay, smaller play mark. */
  compact?: boolean;
  className?: string;
};

/**
 * Stand-in for a real thumbnail. The colour belongs to the content, not the UI,
 * so each clip gets its own tones. Media stays left-to-right in both languages.
 */
export function ClipPoster({ clip, views, duration, compact, className }: ClipPosterProps) {
  const Icon = nicheIcon[clip.poster.niche];
  return (
    <div
      dir="ltr"
      className={cn("relative grid aspect-[9/16] place-items-center overflow-hidden rounded-[var(--radius-md)] bg-surface", className)}
      style={{
        backgroundImage: `linear-gradient(160deg, oklch(0.78 0.11 ${clip.poster.from}), oklch(0.42 0.12 ${clip.poster.to}))`,
      }}
    >
      <Icon aria-hidden className={cn("absolute text-white/15", compact ? "-bottom-2 -left-2 size-14" : "-bottom-4 -left-4 size-28")} strokeWidth={1.5} />
      <span className={cn("grid place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm", compact ? "size-7" : "size-11")}>
        <Play aria-hidden className={cn("translate-x-px fill-current", compact ? "size-3.5" : "size-5")} />
      </span>
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-6 text-caption text-white">
          <span className="inline-flex items-center gap-1">
            <Eye aria-hidden className="size-3.5" />
            <bdi>{views}</bdi>
          </span>
          <span>{duration}</span>
        </div>
      )}
    </div>
  );
}
