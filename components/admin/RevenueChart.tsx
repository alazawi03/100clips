import { cn } from "@/lib/cn";

export type ChartBar = { key: string; label: string; value: number; valueLabel: string; detail: string };

/** Up to five clean ticks from 0 to just above the highest value. */
function ticks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

/**
 * Revenue per period as columns: one series, so no legend (the section title names it). Each column
 * shows its value on hover or focus; the table under the chart has every number.
 */
export function RevenueChart({ bars, label, formatTick }: { bars: ChartBar[]; label: string; formatTick: (n: number) => string }) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  const scale = ticks(max);
  const top = scale[scale.length - 1] || 1;
  return (
    <figure aria-label={label} className="flex gap-3">
      {/* Y axis: clean ticks, recessive. */}
      <div aria-hidden className="relative h-48 w-14 shrink-0 text-end text-caption text-text-muted tabular-nums">
        {scale.map((v) => (
          <span key={v} className="absolute end-0 translate-y-1/2" style={{ bottom: `${(v / top) * 100}%` }}>
            {formatTick(v)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-48">
          {scale.map((v) => (
            <span key={v} aria-hidden className={cn("absolute inset-x-0 h-px", v === 0 ? "bg-text-muted/40" : "bg-border")} style={{ bottom: `${(v / top) * 100}%` }} />
          ))}
          <ol className="absolute inset-0 flex items-end gap-0.5">
            {bars.map((b) => (
              <li key={b.key} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={`${b.label}: ${b.valueLabel}, ${b.detail}`}>
                {/* The bar, with its tooltip just above it. */}
                <span className="relative flex w-full max-w-6 justify-center" style={{ height: b.value > 0 ? `max(2px, ${(b.value / top) * 100}%)` : 0 }}>
                  <span className="absolute inset-0 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80" />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-48 -translate-x-1/2 flex-col rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 text-small shadow-soft group-hover:flex group-focus-visible:flex"
                  >
                    <span className="text-text-muted">{b.label}</span>
                    <span className="font-medium tabular-nums">{b.valueLabel}</span>
                    <span className="text-text-muted">{b.detail}</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        {/* X axis: first, middle and last labels so they never collide. */}
        <div aria-hidden className="mt-2 flex justify-between text-caption text-text-muted">
          <span>{bars[0]?.label}</span>
          {bars.length > 2 && <span>{bars[Math.floor(bars.length / 2)].label}</span>}
          <span>{bars.at(-1)?.label}</span>
        </div>
      </div>
    </figure>
  );
}
