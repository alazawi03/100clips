"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { FileInput } from "@/components/ui/FileInput";
import { ImageInput } from "@/components/ui/ImageInput";
import { NotInCountry } from "./NotInCountry";
import { countryFlag, industryEmoji } from "@/lib/data/emojis";
import { brandCountries } from "@/lib/data/markets";
import { INDUSTRIES, type Country } from "@/lib/data/types";

/** Starting values for every brand field, as plain strings. */
export type BrandValues = Partial<Record<"nameAr" | "nameEn" | "logo" | "industry" | "about" | "website" | "instagram" | "tiktok", string>> & {
  countries?: string | string[];
  /** Per country: cr_bh, vat_bh, … */
  [field: string]: string | string[] | undefined;
};

type SectionProps = {
  v: BrandValues;
  err: (name: string) => string | undefined;
};

function described(err: SectionProps["err"], name: string) {
  return err(name) ? `${name}-error` : undefined;
}

/** Required: name (Arabic or English) and industry. The logo is optional. Every brand is in Bahrain for now. */
export function BasicsFields({ v, err }: SectionProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("brandForm.nameAr")} htmlFor="nameAr" error={err("nameAr")} hint={t("brandForm.nameHint")} required>
          <Input id="nameAr" name="nameAr" aria-required lang="ar" dir="rtl" defaultValue={v.nameAr} placeholder={t("brandForm.nameArPlaceholder")} aria-invalid={!!err("nameAr")} aria-describedby={described(err, "nameAr")} />
        </Field>
        <Field label={t("brandForm.nameEn")} htmlFor="nameEn">
          <Input id="nameEn" name="nameEn" lang="en" dir="ltr" defaultValue={v.nameEn} placeholder={t("brandForm.nameEnPlaceholder")} />
        </Field>
      </div>
      <ImageInput name="logo" label={t("brandForm.logo")} hint={t("brandForm.logoHint")} defaultValue={v.logo} shape="square" error={err("logo")} />
      <Field label={t("brandForm.industry")} htmlFor="industry" error={err("industry")} required>
        <Select id="industry" name="industry" aria-required defaultValue={v.industry ?? ""} aria-invalid={!!err("industry")} aria-describedby={described(err, "industry")}>
          <option value="" disabled>
            {t("brandForm.industryPlaceholder")}
          </option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {industryEmoji[i]} {t(`industries.${i}`)}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** The links are left out while creating a brand; they can be added later from its edit page. */
export function AboutFields({ v, err, links = true }: SectionProps & { links?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <Field label={t("brandForm.about")} htmlFor="about" error={err("about")} hint={t("brandForm.aboutHint")}>
        <Textarea id="about" name="about" rows={3} maxLength={300} defaultValue={v.about} placeholder={t("brandForm.aboutPlaceholder")} aria-invalid={!!err("about")} aria-describedby={described(err, "about")} />
      </Field>
      {links && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-medium">{t("brandForm.links")}</legend>
          <Field label={t("brandForm.website")} htmlFor="website" error={err("website")}>
            <Input id="website" name="website" type="url" inputMode="url" dir="ltr" defaultValue={v.website} placeholder={t("brandForm.websitePlaceholder")} aria-invalid={!!err("website")} aria-describedby={described(err, "website")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("brandForm.instagram")} htmlFor="instagram" error={err("instagram")}>
              <Input id="instagram" name="instagram" dir="ltr" autoCapitalize="none" defaultValue={v.instagram} placeholder="@" aria-invalid={!!err("instagram")} aria-describedby={described(err, "instagram")} />
            </Field>
            <Field label={t("brandForm.tiktok")} htmlFor="tiktok" error={err("tiktok")}>
              <Input id="tiktok" name="tiktok" dir="ltr" autoCapitalize="none" defaultValue={v.tiktok} placeholder="@" aria-invalid={!!err("tiktok")} aria-describedby={described(err, "tiktok")} />
            </Field>
          </div>
        </fieldset>
      )}
    </div>
  );
}

/**
 * All optional: the countries the brand works in, then for each one ticked, its CR number and
 * VAT certificate (fields cr_bh, vat_bh, …). Only the active markets are offered; with just one
 * (Bahrain for the MVP) there's nothing to pick, so its registration shows straight away.
 */
export function ExtrasFields({ v, err }: SectionProps) {
  const { t } = useI18n();
  const offered = brandCountries();
  const only = offered.length === 1 ? offered[0] : undefined;
  const [chosen, setChosen] = useState<Set<Country>>(() => (only ? new Set([only]) : new Set((Array.isArray(v.countries) ? v.countries : v.countries ? [v.countries] : []).filter((c): c is Country => offered.includes(c as Country)))));
  const toggle = (c: Country) =>
    setChosen((set) => {
      const next = new Set(set);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  const field = (name: string) => (typeof v[name] === "string" ? (v[name] as string) : undefined);

  return (
    <div className="flex flex-col gap-5">
      {only ? (
        <>
          <input type="hidden" name="countries" value={only} />
          <NotInCountry country={t(`countries.${only}`)}>
            <p className="text-small text-text-muted">{t("brandForm.onlyCountryHint", { country: t(`countries.${only}`) })}</p>
          </NotInCountry>
        </>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">
            {t("brandForm.countries")}
          </legend>
          <p className="-mt-1 text-small text-text-muted">{t("brandForm.countriesHint")}</p>
          <div className="flex flex-wrap gap-2">
            {offered.map((c) => (
              <label
                key={c}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-small font-medium transition-colors duration-[120ms] hover:bg-surface has-[:checked]:border-brand-soft has-[:checked]:bg-brand-soft has-[:checked]:text-brand-on-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
              >
                <input type="checkbox" name="countries" value={c} checked={chosen.has(c)} onChange={() => toggle(c)} className="sr-only" />
                <span aria-hidden className="text-base leading-none">
                  {countryFlag[c]}
                </span>
                {t(`countries.${c}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* One card per chosen country, in the list's order. */}
      {offered
        .filter((c) => chosen.has(c))
        .map((c) => (
          <section key={c} aria-labelledby={`reg-${c}`} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border p-4">
            <h3 id={`reg-${c}`} className="flex items-center gap-2 font-medium">
              <span aria-hidden className="text-lg leading-none">
                {countryFlag[c]}
              </span>
              {t("brandForm.registrationIn", { country: t(`countries.${c}`) })}
            </h3>
            <Field label={t("brandForm.crNumber")} htmlFor={`cr_${c}`}>
              <Input id={`cr_${c}`} name={`cr_${c}`} dir="ltr" inputMode="numeric" defaultValue={field(`cr_${c}`)} placeholder={t("brandForm.crPlaceholder")} />
            </Field>
            <FileInput name={`vat_${c}`} label={t("brandForm.vatCertificate")} hint={t("brandForm.vatHint")} defaultName={field(`vat_${c}`)} error={err(`vat_${c}`)} />
          </section>
        ))}
      {chosen.size === 0 && <p className="text-small text-text-muted">{t("brandForm.registrationsHint")}</p>}
    </div>
  );
}
