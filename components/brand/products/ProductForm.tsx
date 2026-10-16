"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AppWindow, MapPin, MessageCircleQuestionMark, MessageCircleReply, Package, Plus, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createProduct, updateProduct, type BrandFormState } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError, Input, RequiredMark, Select, Textarea } from "@/components/ui/Form";
import { PhotosInput } from "@/components/ui/PhotosInput";
import { AppPlatformLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import { createFormatters } from "@/lib/i18n/format";
import { describePrice } from "@/lib/pricing";
import { venueEmoji } from "@/lib/data/emojis";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import {
  APP_PLATFORMS,
  CURRENCIES,
  CURRENCY_FLAGS,
  PRICE_MODELS_BY_TYPE,
  PRICE_PERIODS,
  PRICE_UNITS,
  PRODUCT_TYPES,
  SERVICE_DELIVERIES,
  VENUE_KINDS,
  type Currency,
  type PriceModel,
  type PricePeriod,
  type PriceUnit,
  type Pricing,
  type ProductType,
} from "@/lib/data/types";

const typeIcon: Record<ProductType, LucideIcon> = { physical: Package, app: AppWindow, service: Sparkles, venue: MapPin };

/** Starting values; lists stay lists. */
export type ProductValues = {
  type?: ProductType;
  name?: string;
  photo?: string[];
  description?: string;
  currency?: string;
  priceModel?: string;
  price?: string;
  priceMax?: string;
  pricePeriod?: string;
  priceUnit?: string;
  trialDays?: string;
  benefit?: string[];
  concernQ?: string[];
  concernA?: string[];
  size?: string;
  downloadLink?: string;
  platforms?: string[];
  delivery?: string[];
  venueKind?: string;
  location?: string;
  hours?: string;
  mapUrl?: string;
};

function asList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : [];
}

type FieldsProps = {
  v: ProductValues;
  err: (name: string) => string | undefined;
  /** Product type is optional here (the brand wizard lets you skip the product). */
  optional?: boolean;
  /** Already inside a card: no cards of its own. */
  flat?: boolean;
};

type GroupProps = { className: string; first?: boolean; children: React.ReactNode };

function PaddedCard({ className, children }: GroupProps) {
  return <Card className={cn(className, "p-5 md:p-6")}>{children}</Card>;
}

function FlatGroup({ className, first, children }: GroupProps) {
  return <div className={cn(className, !first && "mt-5 border-t border-border pt-5")}>{children}</div>;
}

/**
 * Every product field, without a form around it, so the same fields serve the standalone product form
 * and the last step of the brand wizard. Remount it (key) after a server response to restart from `v`.
 */
export function ProductFields({ v, err, optional, flat }: FieldsProps) {
  const { t } = useI18n();
  // Inside another card (the brand wizard) the groups are divided by lines instead of being cards themselves.
  const Box = flat ? FlatGroup : PaddedCard;
  const [type, setType] = useState<ProductType | undefined>(v.type);
  const [benefits, setBenefits] = useState<string[]>(() => {
    const list = asList(v.benefit);
    return list.length >= 1 ? list : [""];
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
      <Box first className="flex flex-col gap-3">
        <fieldset>
          <legend className="mb-3 flex items-center gap-1 text-h3 font-medium">
            {t("productForm.typeLabel")}
            <RequiredMark />
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRODUCT_TYPES.map((pt) => {
              const Icon = typeIcon[pt];
              const selected = type === pt;
              return (
                <label
                  key={pt}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors duration-[120ms] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                    selected ? "border-primary bg-surface" : "border-border hover:bg-surface",
                  )}
                >
                  <input type="radio" name="typeChoice" value={pt} checked={selected} onChange={() => setType(pt)} className="sr-only" />
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", selected ? "bg-card text-primary" : "bg-surface text-text-muted")}>
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block font-medium", selected && "text-text")}>{t(`productForm.types.${pt}`)}</span>
                    <span className="block text-small text-text-muted">{t(`productForm.typeHints.${pt}`)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {err("type") && <FieldError>{err("type")}</FieldError>}
        {!type && !err("type") && !optional && <p className="text-small text-text-muted">{t("productForm.pickTypeFirst")}</p>}
      </Box>

      {type && (
        <>
          <Box className="flex flex-col gap-5">
            <Field label={t("productForm.name")} htmlFor="name" error={err("name")} required>
              <Input id="name" name="name" aria-required defaultValue={v.name} placeholder={t("productForm.namePlaceholder")} aria-invalid={!!err("name")} aria-describedby={described("name")} />
            </Field>
            <PhotosInput name="photo" label={t("productForm.photos")} hint={t("productForm.photosHint")} defaultValue={asList(v.photo)} />
            <Field label={t("productForm.description")} htmlFor="description">
              <Textarea id="description" name="description" rows={3} defaultValue={v.description} placeholder={t("productForm.descriptionPlaceholder")} />
            </Field>
          </Box>

          <Box className="flex flex-col gap-5">
            <PriceFields type={type} v={v} err={err} />
          </Box>

          <Box className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{t("productForm.benefits")}</h2>
                <p className="text-small text-text-muted">{t("productForm.benefitsHint")}</p>
              </div>
              {benefits.length < 5 && (
                <button type="button" onClick={() => setBenefits((list) => [...list, ""])} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface">
                  <Plus aria-hidden className="size-4" />
                  {t("productForm.addBenefit")}
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {benefits.map((b, i) => (
                <li key={i} className="group relative">
                  <Input
                    name="benefit"
                    value={b}
                    onChange={(e) => setBenefits((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={i === 0 ? t("productForm.benefitPlaceholder") : undefined}
                    aria-label={t("productForm.benefitLabel", { n: i + 1 })}
                    className={benefits.length > 1 ? "pe-12" : undefined}
                  />
                  {benefits.length > 1 && (
                    <button type="button" onClick={() => setBenefits((list) => list.filter((_, j) => j !== i))} aria-label={t("productForm.removeBenefit", { n: i + 1 })} className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-text-muted transition-opacity hover:bg-surface focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                      <X aria-hidden className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Box>

          <Box className="flex flex-col gap-4">
            <div>
              <h2 className="font-medium">
                {t("productForm.concerns")}
              </h2>
              <p className="text-small text-text-muted">{t("productForm.concernsHint")}</p>
            </div>
            {concerns.length > 0 && (
              <ul className="flex flex-col gap-3">
                {concerns.map((c, i) => {
                  const q = `concernQ-${i}`;
                  const a = `concernA-${i}`;
                  return (
                    <li key={i} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor={q} className="flex items-center gap-1.5 font-medium">
                            <MessageCircleQuestionMark aria-hidden className="size-4 shrink-0 text-primary" />
                            {t("productForm.concernLabel", { n: i + 1 })}
                            <RequiredMark />
                          </label>
                          <button type="button" onClick={() => setConcerns((list) => list.filter((_, j) => j !== i))} aria-label={t("productForm.removeConcern", { n: i + 1 })} className="-my-2 -me-2 grid size-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface">
                            <X aria-hidden className="size-4" />
                          </button>
                        </div>
                        <Input
                          id={q}
                          name="concernQ"
                          aria-required
                          value={c.q}
                          onChange={(e) => setConcerns((list) => list.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                          placeholder={t("productForm.concernPlaceholder")}
                          aria-invalid={!!err(q)}
                          aria-describedby={described(q)}
                        />
                        {err(q) && <FieldError id={`${q}-error`}>{err(q)}</FieldError>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor={a} className="flex items-center gap-1.5 font-medium">
                          <MessageCircleReply aria-hidden className="size-4 shrink-0 text-primary" />
                          {t("productForm.answerLabel")}
                          <RequiredMark />
                        </label>
                        <Textarea
                          id={a}
                          name="concernA"
                          aria-required
                          rows={2}
                          value={c.a}
                          onChange={(e) => setConcerns((list) => list.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                          placeholder={t("productForm.answerPlaceholder")}
                          aria-invalid={!!err(a)}
                          aria-describedby={described(a)}
                          className="min-h-20"
                        />
                        {err(a) && <FieldError id={`${a}-error`}>{err(a)}</FieldError>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" onClick={() => setConcerns((list) => [...list, { q: "", a: "" }])} className={buttonClass("ghost", "self-start")}>
              <Plus aria-hidden />
              {t("productForm.addConcern")}
            </button>
          </Box>

          <Box className="flex flex-col gap-5">
            <h2 className="font-medium">{t("productForm.detailsTitle")}</h2>
            {type === "physical" && (
              <Field label={t("productForm.size")} htmlFor="size">
                <Input id="size" name="size" defaultValue={v.size} placeholder={t("productForm.sizePlaceholder")} className="sm:max-w-80" />
              </Field>
            )}
            {type === "app" && (
              <>
                <Field label={t("productForm.downloadLink")} htmlFor="downloadLink" error={err("downloadLink")}>
                  <Input id="downloadLink" name="downloadLink" type="url" inputMode="url" dir="ltr" defaultValue={v.downloadLink} placeholder={t("productForm.downloadPlaceholder")} aria-invalid={!!err("downloadLink")} aria-describedby={described("downloadLink")} />
                </Field>
                <CheckGroup legend={t("productForm.platforms")} name="platforms" options={APP_PLATFORMS.map((p) => ({ value: p, label: t(`productForm.appPlatforms.${p}`), icon: <AppPlatformLogo platform={p} /> }))} isChecked={(p) => checked(v.platforms, p)} />
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
                        {venueEmoji[k]} {t(`productForm.venueKinds.${k}`)}
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
                <Field label={t("productForm.mapUrl")} htmlFor="mapUrl" error={err("mapUrl")} hint={t("productForm.mapUrlHint")}>
                  <Input id="mapUrl" name="mapUrl" type="url" inputMode="url" dir="ltr" defaultValue={v.mapUrl} placeholder="https://maps.app.goo.gl/…" aria-invalid={!!err("mapUrl")} aria-describedby={described("mapUrl")} />
                </Field>
              </>
            )}
          </Box>

        </>
      )}
    </>
  );
}

type Props =
  | { mode: "create"; brandId: string; /** When set, the form stays in place after saving and reports the new product. */ onCreated?: (productId: string) => void; initial?: undefined; productId?: undefined }
  | { mode: "edit"; productId: string; initial: ProductValues };

/** Add a product to the selected brand, or edit one. The type comes first because it decides which details we ask for. */
export function ProductForm(props: Props) {
  const { t } = useI18n();
  const bound = props.mode === "edit" ? updateProduct.bind(null, props.productId) : createProduct.bind(null, props.brandId);
  const [state, action, pending] = useActionState<BrandFormState, FormData>(bound, null);
  const fieldsKey = useSubmissionKey(state);
  const onCreated = props.mode === "create" ? props.onCreated : undefined;
  const createdId = state?.createdId;
  useEffect(() => {
    if (createdId) onCreated?.(createdId);
  }, [createdId, onCreated]);
  const v: ProductValues = { ...props.initial, ...(state?.values as ProductValues | undefined) };
  const err = (name: string) => (state?.errors[name] ? t(state.errors[name]!) : undefined);

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {props.mode === "create" && props.onCreated && <input type="hidden" name="inline" value="1" />}
      <ProductFields key={fieldsKey} v={v} err={err} />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" aria-busy={pending}>
          {props.mode === "edit" ? t("productForm.save") : t("productForm.add")}
        </Button>
      </div>
    </form>
  );
}

/** An amount as typed: undefined when empty or not a price. */
function amountOf(text: string): number | undefined {
  const n = text.trim() === "" ? NaN : Number(text);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** The pricing the fields describe, or undefined while a needed amount is missing (for the preview only; the server checks). */
function pricingOf(model: PriceModel, f: { amount: string; max: string; period: PricePeriod | ""; unit: PriceUnit; trial: string }): Pricing | undefined {
  const amount = amountOf(f.amount);
  const trialDays = Number(f.trial);
  if (model === "hidden") return { model };
  if (model === "free") return amount === undefined ? { model } : { model, amount, ...(f.period && { period: f.period }) };
  if (amount === undefined) return undefined;
  if (model === "range") {
    const maxAmount = amountOf(f.max);
    return maxAmount !== undefined && maxAmount > amount ? { model, amount, maxAmount } : undefined;
  }
  if (model === "subscription") return { model, amount, period: f.period || "month", ...(Number.isInteger(trialDays) && trialDays >= 1 && trialDays <= 365 && { trialDays }) };
  if (model === "per_unit") return { model, amount, unit: f.unit };
  return { model, amount };
}

/**
 * How customers pay: a model (only the ones that fit the type), the currency, and the fields the model needs,
 * with the sentence a creator would say underneath.
 */
function PriceFields({ type, v, err }: { type: ProductType; v: ProductValues; err: (name: string) => string | undefined }) {
  const i18n = useI18n();
  const { t, locale } = i18n;
  const f = useMemo(() => createFormatters(locale), [locale]);
  const currencyName = useMemo(() => new Intl.DisplayNames([locale], { type: "currency" }), [locale]);
  const models = PRICE_MODELS_BY_TYPE[type];
  const [picked, setPicked] = useState(v.priceModel ?? "");
  // Switching type keeps the choice only when the new type offers it.
  const model = (models as string[]).includes(picked) ? (picked as PriceModel) : undefined;
  const [currency, setCurrency] = useState<Currency>((CURRENCIES as string[]).includes(v.currency ?? "") ? (v.currency as Currency) : "BHD");
  const [amount, setAmount] = useState(v.price ?? "");
  const [max, setMax] = useState(v.priceMax ?? "");
  const [period, setPeriod] = useState<PricePeriod | "">((PRICE_PERIODS as string[]).includes(v.pricePeriod ?? "") ? (v.pricePeriod as PricePeriod) : "");
  const [unit, setUnit] = useState<PriceUnit>((PRICE_UNITS as string[]).includes(v.priceUnit ?? "") ? (v.priceUnit as PriceUnit) : "person");
  const [trial, setTrial] = useState(v.trialDays ?? "");
  const pricing = model && pricingOf(model, { amount, max, period, unit, trial });
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);
  const amountInput = (name: string, value: string, onChange: (value: string) => void) => (
    <Input id={name} name={name} type="number" inputMode="decimal" min={0} step="0.001" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!err(name)} aria-describedby={described(name)} />
  );
  const amountLabel = model === "from" ? "fromAmount" : model === "range" ? "minAmount" : model === "free" ? "planAmount" : "amount";
  const showCurrency = model && model !== "hidden";

  return (
    <>
      <div>
        <h2 className="font-medium">{t("productForm.pricing.title")}</h2>
        <p className="text-small text-text-muted">{t("productForm.pricing.hint")}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("productForm.pricing.model")} htmlFor="priceModel">
          <Select id="priceModel" name="priceModel" value={model ?? ""} onChange={(e) => setPicked(e.target.value)}>
            <option value="">{t("productForm.pricing.modelNone")}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {t(`productForm.pricing.models.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        {showCurrency && (
          <Field label={t("productForm.pricing.currency")} htmlFor="currency">
            <Select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_FLAGS[c]} {currencyName.of(c)} ({c})
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      {/* Hidden when the select isn't shown, so switching to "no price" and back keeps the currency. */}
      {!showCurrency && <input type="hidden" name="currency" value={currency} />}

      {model && model !== "hidden" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t(`productForm.pricing.${amountLabel}`)} htmlFor="price" error={err("price")} required={model !== "free"}>
            {amountInput("price", amount, setAmount)}
          </Field>
          {model === "range" && (
            <Field label={t("productForm.pricing.maxAmount")} htmlFor="priceMax" error={err("priceMax")} required>
              {amountInput("priceMax", max, setMax)}
            </Field>
          )}
          {(model === "subscription" || (model === "free" && amount !== "")) && (
            <Field label={t(model === "free" ? "productForm.pricing.planPeriod" : "productForm.pricing.period")} htmlFor="pricePeriod">
              <Select id="pricePeriod" name="pricePeriod" value={period || (model === "subscription" ? "month" : "")} onChange={(e) => setPeriod(e.target.value as PricePeriod | "")}>
                {model === "free" && <option value="">{t("productForm.pricing.planOnce")}</option>}
                {PRICE_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {t(`productForm.pricing.periods.${p}`)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {model === "subscription" && (
            <Field label={t("productForm.pricing.trialDays")} htmlFor="trialDays" error={err("trialDays")}>
              <Input id="trialDays" name="trialDays" type="number" inputMode="numeric" min={1} max={365} step={1} dir="ltr" value={trial} onChange={(e) => setTrial(e.target.value)} aria-invalid={!!err("trialDays")} aria-describedby={described("trialDays")} />
            </Field>
          )}
          {model === "per_unit" && (
            <Field label={t("productForm.pricing.unit")} htmlFor="priceUnit">
              <Select id="priceUnit" name="priceUnit" value={unit} onChange={(e) => setUnit(e.target.value as PriceUnit)}>
                {PRICE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(`productForm.pricing.units.${u}`)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}

      {model === "hidden" ? (
        <p className="text-small text-text-muted">{t("productForm.pricing.hiddenHint")}</p>
      ) : (
        pricing && (
          <p className="rounded-[var(--radius-sm)] bg-surface px-3 py-2.5 text-small">
            {t("productForm.pricing.preview", { price: describePrice(pricing, currency, i18n, f) })}
          </p>
        )
      )}
    </>
  );
}

function CheckGroup({ legend, name, options, isChecked }: { legend: string; name: string; options: Array<{ value: string; label: string; icon?: React.ReactNode }>; isChecked: (value: string) => boolean }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 has-[:checked]:border-brand-soft has-[:checked]:bg-brand-soft has-[:checked]:text-brand-on-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <input type="checkbox" name={name} value={o.value} defaultChecked={isChecked(o.value)} className="size-4 accent-[var(--primary)]" />
            {o.icon}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
