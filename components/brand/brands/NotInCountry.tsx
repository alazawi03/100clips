"use client";

import { useId, useMemo, useState, useTransition, type ReactNode } from "react";
import { Check } from "lucide-react";
import { joinWaitlist } from "@/app/actions/waitlist";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { COUNTRIES } from "@/lib/data/types";
import { isActiveMarket } from "@/lib/data/markets";

/** Region codes that aren't countries. */
const NOT_COUNTRIES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"]);

/** Every country by its name in Arabic and English, so whatever language they type in is understood. */
function countryNames(locale: string) {
  const shown = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  const lookups = ["ar", "en"].map((l) => new Intl.DisplayNames([l], { type: "region", fallback: "none" }));
  const list: Array<{ code: string; name: string; names: string[] }> = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      const name = shown.of(code);
      if (!name || NOT_COUNTRIES.has(code) || isActiveMarket(code)) continue;
      list.push({ code, name, names: [name, ...lookups.map((d) => d.of(code) ?? "")].map(normalize).filter(Boolean) });
    }
  }
  return list.sort((x, y) => x.name.localeCompare(y.name, locale));
}

/** Loose comparison: no case, diacritics, "ال" or alef/ta marbuta variants. */
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/^ال/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Under "laqta is in Bahrain for now": a brand from elsewhere says where they are, and goes on the
 * waitlist for that country. It never blocks creating the brand.
 */
export function NotInCountry({ country, children }: { country: string; /** The "in Bahrain for now" line, on the same row. */ children: ReactNode }) {
  const { t, locale } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const countries = useMemo(() => countryNames(locale), [locale]);

  function codeOf(text: string) {
    const q = normalize(text);
    if (!q) return undefined;
    // The Gulf's short names ("السعودية") beside the official ones ("المملكة العربية السعودية").
    const gulf = COUNTRIES.find((c) => normalize(t(`countries.${c}`)) === q);
    if (gulf) return gulf.toUpperCase();
    return (countries.find((c) => c.names.includes(q)) ?? (q.length >= 3 ? countries.find((c) => c.names.some((n) => n.includes(q))) : undefined))?.code;
  }

  function send() {
    const code = codeOf(typed);
    if (!code) return setError(t("brandForm.notInCountry.unknown"));
    setError(undefined);
    startTransition(async () => {
      const { ok } = await joinWaitlist(code);
      if (ok) setSent(true);
      else setError(t("brandForm.notInCountry.failed"));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {children}
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((o) => !o)} className="shrink-0 text-small font-medium text-primary underline-offset-4 hover:underline">
          {t("brandForm.notInCountry.toggle", { country })}
        </button>
      </div>
      {open && (
        <div id={`${id}-panel`} className="rounded-[var(--radius-lg)] border border-border p-4">
          {sent ? (
            <p role="status" className="flex items-center gap-2 text-small">
              <Check aria-hidden className="size-4 shrink-0 text-success" />
              {t("brandForm.notInCountry.thanks")}
            </p>
          ) : (
            <Field label={t("brandForm.notInCountry.label")} htmlFor={`${id}-country`} error={error} hint={t("brandForm.notInCountry.hint")}>
              <div className="flex gap-2">
                <Input
                  id={`${id}-country`}
                  list={`${id}-list`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  // Enter sends this, not the brand form around it.
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  autoComplete="off"
                  placeholder={t("brandForm.notInCountry.placeholder")}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-country-error` : undefined}
                />
                <datalist id={`${id}-list`}>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name} />
                  ))}
                </datalist>
                <Button variant="secondary" onClick={send} aria-busy={pending} disabled={pending} className="shrink-0">
                  {t("brandForm.notInCountry.send")}
                </Button>
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
