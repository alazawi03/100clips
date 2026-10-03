"use client";

import { useActionState, useState } from "react";
import { AppWindow, MapPin, Package, Plus, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createProduct, updateProduct, type BrandFormState } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/Form";
import { PhotosInput } from "@/components/ui/PhotosInput";
import { cn } from "@/lib/cn";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import { APP_PLATFORMS, PRODUCT_TYPES, SERVICE_DELIVERIES, VENUE_KINDS, type ProductType } from "@/lib/data/types";

const typeIcon: Record<ProductType, LucideIcon> = { physical: Package, app: AppWindow, service: Sparkles, venue: MapPin };

/** Starting values; lists stay lists. */
export type ProductValues = {
  type?: ProductType;
  name?: string;
  photo?: string[];
  description?: string;
  price?: string;
  benefit?: string[];
  concernQ?: string[];
  concernA?: string[];
  value?: string;
  size?: string;
  downloadLink?: string;
  platforms?: string[];
  delivery?: string[];
  venueKind?: string;
  location?: string;
  hours?: string;
};

function asList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : [];
}

type FieldsProps = {
  v: ProductValues;
  err: (name: string) => string | undefined;
  /** Product type is optional here (the brand wizard lets you skip the product). */
  optional?: boolean;
};

/**
 * Every product field, without a form around it, so the same fields serve the standalone product form
 * and the last step of the brand wizard. Remount it (key) after a server response to restart from `v`.
 */
export function ProductFields({ v, err, optional }: FieldsProps) {
  const { t } = useI18n();
  const [type, setType] = useState<ProductType | undefined>(v.type);
  const [benefits, setBenefits] = useState<string[]>(() => {
    const list = asList(v.benefit);
    return list.length >= 3 ? list : [...list, ...Array(3 - list.length).fill("")];
  });
  const [concerns, setConcerns] = useState<Array<{ q: string; a: string }>>(() => {
    const qs = asList(v.concernQ);
    const as = asList(v.concernA);
    return qs.map((q, i) => ({ q, a: as[i] ?? "" }));
  });
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);
  const checked = (list: string[] | undefined, value: string) => asList(list).includes(value);

  return (
    <>
      {/* The submitted type lives in a hidden field: React's post-action form reset would uncheck the radios. */}
      <input type="hidden" name="type" value={type ?? ""} />
      <Card className="flex flex-col gap-3 p-5 md:p-6">
        <fieldset>
          <legend className="mb-3 text-h3 font-medium">{t("productForm.typeLabel")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRODUCT_TYPES.map((pt) => {
              const Icon = typeIcon[pt];
              const selected = type === pt;
              return (
                <label
                  key={pt}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors duration-[120ms] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                    selected ? "border-primary bg-primary-soft" : "border-border hover:bg-surface",
                  )}
                >
                  <input type="radio" name="typeChoice" value={pt} checked={selected} onChange={() => setType(pt)} className="sr-only" />
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", selected ? "bg-card text-primary" : "bg-surface text-text-muted")}>
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block font-medium", selected && "text-primary-on-soft")}>{t(`productForm.types.${pt}`)}</span>
                    <span className="block text-small text-text-muted">{t(`productForm.typeHints.${pt}`)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {err("type") && <FieldError>{err("type")}</FieldError>}
        {!type && !err("type") && !optional && <p className="text-small text-text-muted">{t("productForm.pickTypeFirst")}</p>}
      </Card>

      {type && (
        <>
          <Card className="flex flex-col gap-5 p-5 md:p-6">
            <Field label={t("productForm.name")} htmlFor="name" error={err("name")}>
              <Input id="name" name="name" defaultValue={v.name} placeholder={t("productForm.namePlaceholder")} aria-invalid={!!err("name")} aria-describedby={described("name")} />
            </Field>
            <PhotosInput name="photo" label={t("productForm.photos")} hint={t("productForm.photosHint")} defaultValue={asList(v.photo)} />
            <Field label={t("productForm.description")} htmlFor="description">
              <Textarea id="description" name="description" rows={3} defaultValue={v.description} placeholder={t("productForm.descriptionPlaceholder")} />
            </Field>
            {type !== "venue" && (
              <Field label={t("productForm.price")} htmlFor="price" error={err("price")}>
                <Input id="price" name="price" type="number" inputMode="decimal" min={0} step="0.001" dir="ltr" defaultValue={v.price} placeholder={t("productForm.pricePlaceholder")} aria-invalid={!!err("price")} aria-describedby={described("price")} className="sm:max-w-60" />
              </Field>
            )}
          </Card>

          <Card className="flex flex-col gap-4 p-5 md:p-6">
            <div>
              <h2 className="font-medium">{t("productForm.benefits")}</h2>
              <p className="text-small text-text-muted">{t("productForm.benefitsHint")}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input
                    name="benefit"
                    value={b}
                    onChange={(e) => setBenefits((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={i === 0 ? t("productForm.benefitPlaceholder") : undefined}
                    aria-label={t("productForm.benefitLabel", { n: i + 1 })}
                  />
                  {benefits.length > 3 && (
                    <button type="button" onClick={() => setBenefits((list) => list.filter((_, j) => j !== i))} aria-label={t("productForm.removeBenefit", { n: i + 1 })} className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface">
                      <X aria-hidden className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {benefits.length < 5 && (
              <button type="button" onClick={() => setBenefits((list) => [...list, ""])} className={buttonClass("ghost", "self-start")}>
                <Plus aria-hidden />
                {t("productForm.addBenefit")}
              </button>
            )}
          </Card>

          <Card className="flex flex-col gap-4 p-5 md:p-6">
            <div>
              <h2 className="font-medium">
                {t("productForm.concerns")} <span className="font-normal text-text-muted">({t("brandForm.optional")})</span>
              </h2>
              <p className="text-small text-text-muted">{t("productForm.concernsHint")}</p>
            </div>
            {concerns.length > 0 && (
              <ul className="flex flex-col gap-3">
                {concerns.map((c, i) => (
                  <li key={i} className="flex gap-2 rounded-[var(--radius-lg)] bg-surface p-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Input
                        name="concernQ"
                        value={c.q}
                        onChange={(e) => setConcerns((list) => list.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                        placeholder={t("productForm.concernPlaceholder")}
                        aria-label={t("productForm.concernLabel", { n: i + 1 })}
                        className="bg-card"
                      />
                      <Textarea
                        name="concernA"
                        rows={2}
                        value={c.a}
                        onChange={(e) => setConcerns((list) => list.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                        placeholder={t("productForm.answerPlaceholder")}
                        aria-label={t("productForm.answerLabel", { n: i + 1 })}
                        className="min-h-16 bg-card"
                      />
                    </div>
                    <button type="button" onClick={() => setConcerns((list) => list.filter((_, j) => j !== i))} aria-label={t("productForm.removeConcern", { n: i + 1 })} className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted hover:bg-card">
                      <X aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setConcerns((list) => [...list, { q: "", a: "" }])} className={buttonClass("ghost", "self-start")}>
              <Plus aria-hidden />
              {t("productForm.addConcern")}
            </button>
          </Card>

          <Card className="flex flex-col gap-5 p-5 md:p-6">
            <h2 className="font-medium">{t("productForm.detailsTitle")}</h2>
            {type === "physical" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("productForm.value")} htmlFor="value" error={err("value")} hint={t("productForm.valueHint")}>
                  <Input id="value" name="value" type="number" inputMode="decimal" min={0} step="0.001" dir="ltr" defaultValue={v.value} aria-invalid={!!err("value")} aria-describedby={described("value")} />
                </Field>
                <Field label={t("productForm.size")} htmlFor="size">
                  <Input id="size" name="size" defaultValue={v.size} placeholder={t("productForm.sizePlaceholder")} />
                </Field>
              </div>
            )}
            {type === "app" && (
              <>
                <Field label={t("productForm.downloadLink")} htmlFor="downloadLink" error={err("downloadLink")}>
                  <Input id="downloadLink" name="downloadLink" type="url" inputMode="url" dir="ltr" defaultValue={v.downloadLink} placeholder={t("productForm.downloadPlaceholder")} aria-invalid={!!err("downloadLink")} aria-describedby={described("downloadLink")} />
                </Field>
                <CheckGroup legend={t("productForm.platforms")} name="platforms" options={APP_PLATFORMS.map((p) => ({ value: p, label: t(`productForm.appPlatforms.${p}`) }))} isChecked={(p) => checked(v.platforms, p)} />
              </>
            )}
            {type === "service" && (
              <CheckGroup legend={t("productForm.delivery")} name="delivery" options={SERVICE_DELIVERIES.map((d) => ({ value: d, label: t(`productForm.deliveries.${d}`) }))} isChecked={(d) => checked(v.delivery, d)} />
            )}
            {type === "venue" && (
              <>
                <Field label={t("productForm.venueKind")} htmlFor="venueKind">
                  <Select id="venueKind" name="venueKind" defaultValue={v.venueKind ?? "cafe"}>
                    {VENUE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {t(`productForm.venueKinds.${k}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("productForm.location")} htmlFor="location">
                    <Input id="location" name="location" defaultValue={v.location} placeholder={t("productForm.locationPlaceholder")} />
                  </Field>
                  <Field label={t("productForm.hours")} htmlFor="hours">
                    <Input id="hours" name="hours" defaultValue={v.hours} placeholder={t("productForm.hoursPlaceholder")} />
                  </Field>
                </div>
              </>
            )}
          </Card>

        </>
      )}
    </>
  );
}

type Props =
  | { mode: "create"; initial?: undefined; productId?: undefined }
  | { mode: "edit"; productId: string; initial: ProductValues };

/** Add a product to the selected brand, or edit one. The type comes first because it decides which details we ask for. */
export function ProductForm(props: Props) {
  const { t } = useI18n();
  const bound = props.mode === "edit" ? updateProduct.bind(null, props.productId) : createProduct;
  const [state, action, pending] = useActionState<BrandFormState, FormData>(bound, null);
  const fieldsKey = useSubmissionKey(state);
  const v: ProductValues = { ...props.initial, ...(state?.values as ProductValues | undefined) };
  const err = (name: string) => (state?.errors[name] ? t(state.errors[name]!) : undefined);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <ProductFields key={fieldsKey} v={v} err={err} />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" aria-busy={pending}>
          {props.mode === "edit" ? t("productForm.save") : t("productForm.add")}
        </Button>
      </div>
    </form>
  );
}

function CheckGroup({ legend, name, options, isChecked }: { legend: string; name: string; options: Array<{ value: string; label: string }>; isChecked: (value: string) => boolean }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 has-[:checked]:border-primary-soft has-[:checked]:bg-primary-soft has-[:checked]:text-primary-on-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <input type="checkbox" name={name} value={o.value} defaultChecked={isChecked(o.value)} className="size-4 accent-[var(--primary)]" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
