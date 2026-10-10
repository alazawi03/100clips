import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";

/** Check path length, for the stroke-drawing animation (same technique as PaymentSuccess). */
const CHECK = 36;

/** Confetti colours: the brand gradient, the accent tint, warm gold and the ink colour. Tokens, so they follow the theme. */
const COLORS = ["var(--gradient-start)", "var(--gradient-end)", "var(--accent-soft)", "var(--warning)", "var(--primary)"];

/** Fixed pseudo-random pieces, so server and client render the same burst. */
function pieces(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    const angle = -Math.PI / 2 + (r(1) - 0.5) * Math.PI * 1.7;
    const distance = 70 + r(2) * 110;
    return {
      x: Math.round(Math.cos(angle) * distance),
      y: Math.round(Math.sin(angle) * distance),
      rotate: Math.round((r(3) - 0.5) * 720),
      round: r(4) > 0.6,
      color: COLORS[i % COLORS.length],
      delay: Math.round(r(5) * 120),
    };
  });
}

/**
 * The moment after approving a clip, shared with the creator app: the play triangle from the 100clips
 * logo turns into a check, with a short burst of confetti. When the approval completes the campaign,
 * `complete` makes it bigger and shows every clip. Pure CSS (keyframes in globals.css); with reduced
 * motion everything simply shows.
 */
export function ApprovalMoment({
  title,
  subtitle,
  closeHref,
  closeLabel,
  complete,
  children,
}: {
  title: string;
  subtitle: string;
  /** The same page without `?done=approved`. */
  closeHref: string;
  closeLabel: string;
  /** Shown in place of the subtitle's follow-up when the whole campaign is done: the clips, popping in. */
  complete?: ReactNode;
  /** Next steps, at the bottom. */
  children?: ReactNode;
}) {
  const burst = pieces(complete ? 40 : 26);
  const after = complete ? 1250 : 1050;

  return (
    <Card role="status" className="relative flex flex-col items-center gap-4 px-5 pb-8 pt-10 text-center sm:px-8">
      <Link href={closeHref} scroll={false} aria-label={closeLabel} className="absolute end-3 top-3 grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text">
        <X aria-hidden className="size-5" />
      </Link>

      <div className="relative size-20">
        {/* Confetti, from behind the mark once the check lands. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center motion-reduce:hidden">
          {burst.map((p, i) => (
            <span
              key={i}
              className="absolute opacity-0 motion-safe:animate-[burst_1100ms_cubic-bezier(0.15,0.7,0.3,1)_both]"
              style={
                {
                  "--tx": `${p.x}px`,
                  "--ty": `${p.y}px`,
                  "--rot": `${p.rotate}deg`,
                  width: p.round ? 7 : 9,
                  height: p.round ? 7 : 4,
                  borderRadius: p.round ? 999 : 1,
                  background: p.color,
                  animationDelay: `${700 + p.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <svg viewBox="0 0 64 64" aria-hidden className="relative size-20 motion-safe:animate-[pop_480ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <defs>
            <linearGradient id="approval-disc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--gradient-start)" />
              <stop offset="1" stopColor="var(--gradient-end)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#approval-disc)" />
          {/* The logo's play triangle… */}
          <path
            d="M26 21 L26 43 L45 32 Z"
            fill="white"
            stroke="white"
            strokeWidth="4"
            strokeLinejoin="round"
            className="origin-center opacity-0 motion-safe:animate-[tri-out_420ms_ease-in_220ms_both]"
          />
          {/* …becomes the check. */}
          <path
            d="M21 33.5l7.5 7.5L44 25.5"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="motion-safe:animate-[draw_400ms_cubic-bezier(0.65,0,0.35,1)_420ms_both]"
            style={{ "--dash": CHECK, strokeDasharray: CHECK } as CSSProperties}
          />
        </svg>
      </div>

      <div className="flex flex-col gap-1 motion-safe:animate-[fade-up_400ms_ease-out_750ms_both]">
        <h2 className="text-h2 font-medium">{title}</h2>
        <p className="text-text-muted">{subtitle}</p>
      </div>

      {complete}

      {children && (
        <div className="mt-2 flex w-full flex-col items-center gap-4 motion-safe:animate-[fade-up_400ms_ease-out_both]" style={{ animationDelay: `${after}ms` }}>
          {children}
        </div>
      )}
    </Card>
  );
}
