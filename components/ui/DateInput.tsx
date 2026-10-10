"use client";

import { useRef, useState, type ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { controlClass, FieldError } from "./Form";

type Props = Omit<ComponentProps<"input">, "type" | "value" | "onChange" | "defaultValue" | "name"> & {
  name: string;
  /** yyyy-mm-dd */
  defaultValue?: string;
};

/** "20102026" → "20/10/2026". `adding` puts the slash right after the day and the month as they're typed. */
function mask(raw: string, adding: boolean) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2 || (adding && d.length === 2)) out += "/";
  out += d.slice(2, 4);
  if (d.length > 4 || (adding && d.length === 4)) out += "/";
  return out + d.slice(4);
}

/** "20/10/2026" → "2026-10-20", or "" when it isn't a full, real date. */
function toIso(text: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
  return date.getUTCDate() === +dd && date.getUTCMonth() === +mm - 1 ? `${yyyy}-${mm}-${dd}` : "";
}

const fromIso = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "");

/**
 * A date typed as DD/MM/YYYY: only digits are needed, the slashes come by themselves.
 * The calendar button opens the browser's date picker. The form gets yyyy-mm-dd, or what was typed when
 * it isn't a full date, so validation can say so. Day/month/year in both languages; the field follows the
 * page direction, so in Arabic it types right-to-left with the calendar button on the left.
 */
export function DateInput({ name, defaultValue, min, className, ...props }: Props) {
  const { t } = useI18n();
  const picker = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(fromIso(defaultValue ?? ""));
  const iso = toIso(text);

  // Days before `min` are greyed out in the picker; a typed one is flagged as soon as it's complete.
  // Skipped when the form already shows an error for this field, so it isn't said twice.
  const tooEarly = !!iso && typeof min === "string" && iso < min && !props["aria-invalid"];
  const earlyId = `${props.id ?? name}-early`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder={t("forms.datePlaceholder")}
          // The submitted value is the hidden input; this tells form-level handlers which field changed.
          data-field={name}
          value={text}
          onChange={(e) => setText((prev) => mask(e.target.value, e.target.value.length > prev.length))}
          className={cn(controlClass, "h-11 pe-11 tabular-nums")}
          {...props}
          aria-invalid={tooEarly || props["aria-invalid"]}
          aria-describedby={tooEarly ? earlyId : props["aria-describedby"]}
        />
        <input type="hidden" name={name} value={iso || text} />
        <button
          type="button"
          aria-label={t("forms.openCalendar")}
          onClick={() => picker.current?.showPicker?.()}
          className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-[var(--radius-sm)] text-text-muted hover:text-text"
        >
          <CalendarDays aria-hidden className="size-5" strokeWidth={1.75} />
        </button>
        {/* The browser's picker, opened by the button; picking a day fills the text field. */}
        <input
          ref={picker}
          type="date"
          tabIndex={-1}
          aria-hidden
          min={min}
          value={iso}
          onChange={(e) => setText(fromIso(e.target.value))}
          className="pointer-events-none absolute bottom-0 end-0 size-px opacity-0"
        />
      </div>
      {tooEarly && <FieldError id={earlyId}>{t("forms.errors.dateTooEarly", { date: fromIso(min) })}</FieldError>}
    </div>
  );
}
