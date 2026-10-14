import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { Translator } from "@/lib/i18n/messages";

/** Circle circumference (r = 26) and check path length, for the stroke-drawing animation. */
const CIRCLE = 164;
const CHECK = 36;

/**
 * The moment after paying, shown in place on checkout: a check that draws itself, "Payment done",
 * then the hired creators popping in one by one. Pure CSS animation (keyframes in globals.css).
 * `children` goes at the bottom (what happens next).
 */
export function PaymentSuccess({
  creators,
  pending,
  t,
  tp,
  children,
}: {
  creators: Array<{ id: string; name: string }>;
  /** Part was paid by card and waits for it to be confirmed: the offers go out then. */
  pending?: boolean;
  t: Translator["t"];
  tp: Translator["tp"];
  children?: ReactNode;
}) {
  const draw = (length: number, delay: number): CSSProperties => ({ "--dash": length, strokeDasharray: length, animationDelay: `${delay}ms` }) as CSSProperties;
  const drawClass = "motion-safe:animate-[draw_450ms_cubic-bezier(0.65,0,0.35,1)_both]";
  const last = 1000 + creators.length * 120;

  return (
    <Card role="status" className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <svg viewBox="0 0 64 64" aria-hidden className="size-16 text-success">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(-90 32 32)" className={drawClass} style={draw(CIRCLE, 0)} />
        <path d="M21 33.5l7.5 7.5L44 25.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className={drawClass} style={draw(CHECK, 380)} />
      </svg>

      <div className="flex flex-col gap-1 motion-safe:animate-[fade-up_400ms_ease-out_650ms_both]">
        <h2 className="text-h2 font-medium">{pending ? t("campaignDetail.cardPendingTitle") : t("campaignDetail.paidTitle")}</h2>
        <p className="text-text-muted">{pending ? t("campaignDetail.cardPendingBody") : tp("campaignDetail.paidSentTo", creators.length)}</p>
      </div>

      {creators.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-y-2 ps-2">
          {creators.map((c, i) => (
            <li
              key={c.id}
              title={c.name}
              className="-ms-2 rounded-full ring-2 ring-card motion-safe:animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
              style={{ animationDelay: `${900 + i * 120}ms` }}
            >
              <Avatar id={c.id} name={c.name} size="md" />
            </li>
          ))}
        </ul>
      )}

      {!pending && (
        <p className="text-small text-text-muted motion-safe:animate-[fade-up_400ms_ease-out_both]" style={{ animationDelay: `${last}ms` }}>
          {t("campaignDetail.paidNext")}
        </p>
      )}

      {children && (
        <div className="mt-2 flex flex-col items-center gap-3 motion-safe:animate-[fade-up_400ms_ease-out_both]" style={{ animationDelay: `${last + 100}ms` }}>
          {children}
        </div>
      )}
    </Card>
  );
}
