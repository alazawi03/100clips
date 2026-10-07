"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { FileInput } from "@/components/ui/FileInput";
import { ImageInput } from "@/components/ui/ImageInput";
import { countryFlag, industryEmoji } from "@/lib/data/emojis";
import { COUNTRIES, INDUSTRIES } from "@/lib/data/types";

/** Starting values for every brand field, as plain strings. */
export type BrandValues = Partial<
  Record<"nameAr" | "nameEn" | "logo" | "industry" | "city" | "about" | "website" | "instagram" | "tiktok" | "crNumber" | "vatCertificate", string>
> & { countries?: string | string[] };

type SectionProps = { v: BrandValues; err: (name: string) => string | undefined };

function described(err: SectionProps["err"], name: string) {
  return err(name) ? `${name}-error` : undefined;
}

/** Required: name (Arabic or English) and industry. The logo is optional. Every brand is in Bahrain for now. */
export function BasicsFields({ v, err }: SectionProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("brandForm.nameAr")} htmlFor="nameAr" error={err("nameAr")} hint={t("brandForm.nameHint")}>
          <Input id="nameAr" name="nameAr" lang="ar" dir="rtl" defaultValue={v.nameAr} placeholder={t("brandForm.nameArPlaceholder")} aria-invalid={!!err("nameAr")} aria-describedby={described(err, "nameAr")} />
        </Field>
        <Field label={t("brandForm.nameEn")} htmlFor="nameEn">
          <Input id="nameEn" name="nameEn" lang="en" dir="ltr" defaultValue={v.nameEn} placeholder={t("brandForm.nameEnPlaceholder")} />
        </Field>
      </div>
      <ImageInput name="logo" label={`${t("brandForm.logo")} (${t("brandForm.optional")})`} hint={t("brandForm.logoHint")} defaultValue={v.logo} shape="square" error={err("logo")} />
      <Field label={t("brandForm.industry")} htmlFor="industry" error={err("industry")}>
        <Select id="industry" name="industry" defaultValue={v.industry ?? ""} aria-invalid={!!err("industry")} aria-describedby={described(err, "industry")}>
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
      <Field label={`${t("brandForm.city")} (${t("brandForm.optional")})`} htmlFor="city">
        <Input id="city" name="city" defaultValue={v.city} placeholder={t("brandForm.cityPlaceholder")} />
      </Field>
    </div>
  );
}

export function AboutFields({ v, err }: SectionProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <Field label={`${t("brandForm.about")} (${t("brandForm.optional")})`} htmlFor="about" error={err("about")} hint={t("brandForm.aboutHint")}>
        <Textarea id="about" name="about" rows={3} maxLength={300} defaultValue={v.about} placeholder={t("brandForm.aboutPlaceholder")} aria-invalid={!!err("about")} aria-describedby={described(err, "about")} />
      </Field>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-medium">
          {t("brandForm.links")}
        </legend>
        <Field label={`${t("brandForm.website")} (${t("brandForm.optional")})`} htmlFor="website" error={err("website")}>
          <Input id="website" name="website" type="url" inputMode="url" dir="ltr" defaultValue={v.website} placeholder={t("brandForm.websitePlaceholder")} aria-invalid={!!err("website")} aria-describedby={described(err, "website")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t("brandForm.instagram")} (${t("brandForm.optional")})`} htmlFor="instagram" error={err("instagram")}>
            <Input id="instagram" name="instagram" dir="ltr" autoCapitalize="none" defaultValue={v.instagram} placeholder="@" aria-invalid={!!err("instagram")} aria-describedby={described(err, "instagram")} />
          </Field>
          <Field label={`${t("brandForm.tiktok")} (${t("brandForm.optional")})`} htmlFor="tiktok" error={err("tiktok")}>
            <Input id="tiktok" name="tiktok" dir="ltr" autoCapitalize="none" defaultValue={v.tiktok} placeholder="@" aria-invalid={!!err("tiktok")} aria-describedby={described(err, "tiktok")} />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}

/** All optional: the countries the brand works in, its CR number and its VAT certificate. */
export function ExtrasFields({ v, err }: SectionProps) {
  const { t } = useI18n();
  const countries = new Set(Array.isArray(v.countries) ? v.countries : v.countries ? [v.countries] : []);
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">
          {t("brandForm.countries")} <span className="font-normal text-text-muted">({t("brandForm.optional")})</span>
        </legend>
        <p className="-mt-1 text-small text-text-muted">{t("brandForm.countriesHint")}</p>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <label
              key={c}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-small font-medium transition-colors duration-[120ms] hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-on-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input type="checkbox" name="countries" value={c} defaultChecked={countries.has(c)} className="sr-only" />
              <span aria-hidden className="text-base leading-none">
                {countryFlag[c]}
              </span>
              {t(`countries.${c}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={`${t("brandForm.crNumber")} (${t("brandForm.optional")})`} htmlFor="crNumber">
        <Input id="crNumber" name="crNumber" dir="ltr" inputMode="numeric" defaultValue={v.crNumber} placeholder={t("brandForm.crPlaceholder")} />
      </Field>
      <FileInput
        name="vatCertificate"
        label={`${t("brandForm.vatCertificate")} (${t("brandForm.optional")})`}
        hint={t("brandForm.vatHint")}
        defaultName={v.vatCertificate}
        error={err("vatCertificate")}
      />
    </div>
  );
}
