import { cn } from "@/lib/cn";

export type MonthValue = { /** "2026-10" */ month: string; value: number };

/** The last `count` calendar months up to `today` ("2026-10-16"), oldest first, as "YYYY-MM". */
export function lastMonths(today: string, count: number): string[] {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** A round top for the axis: 1, 2, 2.5 or 5 × a power of ten. */
function niceMax(n: number) {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  return ([1, 2, 2.5, 5, 10].find((s) => s * p >= n) ?? 10) * p;
}

/**
 * One amount per month as columns: thin bars from one baseline, the latest month's value at its tip,
 * each month's value on hover. Screen readers get the same numbers as a table.
 */
export function MonthlyChart({
  data,
  caption,
  locale,
  format,
  tick,
  emptyText,
}: {
  data: MonthValue[];
  /** What the numbers are, for the table read to screen readers. */
  caption: string;
  locale: string;
  /** Full amount, e.g. "BHD 12.500". */
  format: (n: number) => string;
  /** Short axis label, e.g. "1.5K". */
  tick: (n: number) => string;
  emptyText: string;
}) {
  if (data.every((d) => d.value <= 0)) return <p className="py-6 text-center text-small text-text-muted">{emptyText}</p>;

  const tag = locale === "ar" ? "ar-BH-u-nu-latn" : "en-BH";
  const short = new Intl.DateTimeFormat(tag, { month: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" });
  const at = (month: string) => new Date(`${month}-15T12:00:00Z`);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  const last = data.length - 1;

  return (
    <figure>
      <div aria-hidden className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
        <div className="flex h-44 flex-col justify-between text-end text-caption tabular-nums text-text-muted">
          {ticks.map((v) => (
            <span key={v} className="-my-2 leading-4">
              {tick(v)}
            </span>
          ))}
        </div>
        <div className="relative h-44">
          <div className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((v) => (
              <span key={v} className="h-px bg-border" />
            ))}
          </div>
          <ul className="relative flex h-full items-end">
            {data.map((d, i) => {
              const height = (d.value / max) * 100;
              return (
                <li key={d.month} className="group relative flex h-full flex-1 items-end justify-center">
                  {d.value > 0 && <span className="w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80" style={{ height: `${height}%` }} />}
                  {/* The latest month is the one to read at a glance; the rest on hover. */}
                  {i === last && d.value > 0 && (
                    <span className="absolute whitespace-nowrap text-caption font-medium tabular-nums group-hover:hidden" style={{ bottom: `calc(${height}% + 4px)` }}>
                      {format(d.value)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "pointer-events-none absolute z-10 hidden flex-col whitespace-nowrap rounded-[var(--radius-md)] border border-border bg-card px-2.5 py-1.5 shadow-sm group-hover:flex",
                      i === 0 ? "start-0" : i === last ? "end-0" : "left-1/2 -translate-x-1/2",
                    )}
                    style={{ bottom: `min(calc(${height}% + 6px), calc(100% - 44px))` }}
                  >
                    <span className="text-caption text-text-muted">{long.format(at(d.month))}</span>
                    <span className="text-small font-medium tabular-nums">{format(d.value)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <span />
        <ul className="flex">
          {data.map((d) => (
            <li key={d.month} className="flex-1 text-center text-caption text-text-muted">
              {short.format(at(d.month))}
            </li>
          ))}
        </ul>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{long.format(at(d.month))}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
