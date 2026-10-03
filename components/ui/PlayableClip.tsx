"use client";

import { useState } from "react";
import type { Clip } from "@/lib/data/types";
import { ClipPoster } from "./ClipPoster";

/** Poster that swaps to the video when tapped. Video and controls stay left-to-right. */
export function PlayableClip({ clip, views, duration, label }: { clip: Clip; views: string; duration: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <video
        dir="ltr"
        src={clip.videoSrc}
        autoPlay
        controls
        playsInline
        className="aspect-[9/16] w-full rounded-[var(--radius-md)] bg-black object-cover"
        aria-label={label}
      />
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={label} className="block w-full rounded-[var(--radius-md)]">
      <ClipPoster clip={clip} views={views} duration={duration} />
    </button>
  );
}
