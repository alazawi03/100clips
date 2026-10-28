"use client";

import { useId, useMemo, useState, useTransition, type ReactNode } from "react";
import { Check, Search } from "lucide-react";
import { joinWaitlist } from "@/app/actions/waitlist";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { controlClass, Field, Select } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { ARAB_COUNTRIES, COUNTRIES as ALL_COUNTRIES, GULF_COUNTRIES, QUICK_COUNTRIES, countryByCode, flag, searchKey, type Country } from "@/lib/data/countries";
import { isActiveMarket } from "@/lib/data/markets";

const NOT_LISTED = "OTHER";

/**
 * Under "laqta is in Bahrain for now": a brand from elsewhere says where they are, and goes on the
 * waitlist for that country. It never blocks creating the brand.
 * The country is picked as on the landing page's creator waitlist: Kuwait with its flag at once, or "My country isn't
 * listed", which opens a search over every country (lib/data/countries.ts), grouped Gulf, Arab countries, then the
 * rest. Countries laqta already runs in (Bahrain) aren't offered.
 */
export function NotInCountry({ country, children }: {
  /** The one market laqta is in; none when there are several to pick from. */
  country?: string;
  /** The "in Bahrain for now" line, on the same row. */
  children?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const lang = locale === "ar" ? "ar" : "en";
  const id = useId();
  const [open, setOpen] = useState(false);
  const quick = QUICK_COUNTRIES.filter((c) => !isActiveMarket(c));
  const [choice, setChoice] = useState(quick[0] ?? NOT_LISTED);
  const [other, setOther] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const code = choice === NOT_LISTED ? other : choice;

  function send() {
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
          {country ? t("brandForm.notInCountry.toggle", { country }) : t("brandForm.notInCountry.toggleOther")}
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
              <div className="flex flex-col gap-2">
                {/* Only with a country to offer first (Kuwait while it isn't open): otherwise the search alone. */}
                {quick.length > 0 && (
                <Select
                  id={`${id}-country`}
                  value={choice}
                  onChange={(e) => {
                    setChoice(e.target.value);
                    setError(undefined);
                  }}
                >
                  {quick.map((c) => (
                    <option key={c} value={c}>
                      {flag(c)} {countryByCode(c)?.[lang] ?? c}
                    </option>
                  ))}
                  <option value={NOT_LISTED}>{t("brandForm.notInCountry.notListed")}</option>
                </Select>
                )}
                {choice === NOT_LISTED && (
                  <CountrySearch
                    value={other}
                    onChange={(c) => {
                      setOther(c);
                      setError(undefined);
                    }}
                    onEnter={send}
                    exclude={quick}
                    invalid={!!error}
                    describedBy={error ? `${id}-country-error` : undefined}
                  />
                )}
                <Button variant="secondary" onClick={send} aria-busy={pending} disabled={pending} className="self-start">
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

/**
 * Every country but the ones offered above and those laqta runs in, in three groups: the rest of the Gulf, the Arab
 * countries, then all the others, each by name in the page's language. Filtered as you type: Arabic or English names,
 * short vowels and hamza forms ignored. The arrow keys move through the matches, Enter picks one. Picked, the box shows
 * the flag and name; typing again searches anew. The landing page's creator waitlist has the same list.
 */
function CountrySearch({
  value,
  onChange,
  onEnter,
  exclude,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (code: string) => void;
  /** Enter with a country picked sends, not the brand form around it. */
  onEnter: () => void;
  exclude: string[];
  invalid: boolean;
  describedBy?: string;
}) {
  const { t, locale } = useI18n();
  const lang = locale === "ar" ? "ar" : "en";
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const groups = useMemo(() => {
    const offered = (c: Country) => !exclude.includes(c.code) && !isActiveMarket(c.code);
    const byName = (list: Country[]) => list.filter(offered).sort((a, b) => a[lang].localeCompare(b[lang], lang));
    const inGroup = (codes: string[]) => byName(ALL_COUNTRIES.filter((c) => codes.includes(c.code)));
    const grouped = [...GULF_COUNTRIES, ...ARAB_COUNTRIES];
    return [
      { key: "gulf" as const, list: inGroup(GULF_COUNTRIES) },
      { key: "arab" as const, list: inGroup(ARAB_COUNTRIES) },
      { key: "rest" as const, list: byName(ALL_COUNTRIES.filter((c) => !grouped.includes(c.code))) },
    ];
  }, [lang, exclude]);
  const shown = useMemo(() => {
    const q = searchKey(query);
    const hit = (c: Country) => !q || searchKey(c.ar).includes(q) || searchKey(c.en).includes(q) || c.code.toLowerCase() === q;
    return groups.map((g) => ({ ...g, list: g.list.filter(hit) })).filter((g) => g.list.length > 0);
  }, [groups, query]);
  // One run through every shown country, for the arrow keys.
  const matches = shown.flatMap((g) => g.list);

  const picked = value ? countryByCode(value) : undefined;
  const pick = (code: string) => {
    onChange(code);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      <input
        role="combobox"
        aria-label={t("brandForm.notInCountry.placeholder")}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].code}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={t("brandForm.notInCountry.placeholder")}
        value={open || !picked ? query : `${flag(picked.code)} ${picked[lang]}`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.max(0, Math.min(matches.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))));
          } else if (e.key === "Enter") {
            // Never the brand form around it.
            e.preventDefault();
            if (open && matches[active]) pick(matches[active].code);
            else if (value) onEnter();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(controlClass, "h-11 ps-9")}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("brandForm.notInCountry.placeholder")}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-card p-1 shadow-lg"
        >
          {matches.length === 0 && <li className="px-3 py-2.5 text-small text-text-muted">{t("brandForm.notInCountry.noCountry")}</li>}
          {shown.map((g) => (
            <li key={g.key} role="presentation">
              <ul role="group" aria-labelledby={`${listId}-${g.key}`}>
                <li id={`${listId}-${g.key}`} role="presentation" className="px-3 pb-1 pt-2.5 text-caption font-bold text-text-muted">
                  {t(`brandForm.notInCountry.groups.${g.key}`)}
                </li>
                {g.list.map((c) => {
                  const i = matches.indexOf(c);
                  return (
                    <li
                      key={c.code}
                      id={`${listId}-${c.code}`}
                      role="option"
                      aria-selected={c.code === value}
                      // Picked on mousedown, before the box loses focus and closes the list.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(c.code);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex min-h-10 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3 text-text", i === active && "bg-surface")}
                    >
                      <span aria-hidden>{flag(c.code)}</span>
                      {c[lang]}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
