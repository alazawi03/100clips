"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, CircleX, Ellipsis, ImageOff, ListChecks, ListPlus, LoaderCircle, Megaphone, MessageSquare, PackageOpen, Pencil, Plus, RotateCcw, Star, Sun, X, type LucideIcon } from "lucide-react";
import { checkout, type CheckoutState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { PaymentSuccess } from "@/components/brand/campaigns/PaymentSuccess";
import { ProductForm } from "@/components/brand/products/ProductForm";
import { Button, buttonClass } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Drawer } from "@/components/ui/Drawer";
import { Dropdown } from "@/components/ui/Dropdown";
import { Card } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { Field, FieldError, Input, Textarea } from "@/components/ui/Form";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import { VIDEO_STYLES, type ProductType, type VideoStyle } from "@/lib/data/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import { LogisticsFields } from "./LogisticsFields";
import { PaymentFields } from "./PaymentFields";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  creators: Array<{
    id: string;
    name: string;
    subtotal: number;
    summary: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    logo?: string;
    products: Array<{
      id: string;
      name: string;
      typeLabel: string;
      photo?: string;
      price?: string;
      type: ProductType;
      downloadLink?: string;
      mapUrl?: string;
    }>;
  }>;
  /** Brand and product to start with, e.g. after "Find creators for this product". */
  initial?: { brandId: string; productId: string };
  /** Brief copied from another campaign ("Duplicate"), shown until the form is first submitted. */
  prefill?: { values: Record<string, string>; references: string[] };
  /** Earliest delivery date allowed (tomorrow), yyyy-mm-dd. */
  minDeadline: string;
  total: number;
  balance: number;
};

const LAST = 2;
/** How long the payment success screen stays before opening the campaign. */
const REDIRECT_MS = 3000;

const styleIcon: Record<VideoStyle, LucideIcon> = { ad: Megaphone, review: Star, routine: Sun, unboxing: PackageOpen, howto: ListChecks, other: Ellipsis };

/** Which step holds a field, so a server error can send you back to it. */
const stepOf = (name: string) =>
  name.startsWith("card") ? 2 : name.startsWith("reference-") || ["title", "brief", "videoStyle", "deadline", "keyMessage", "mustInclude", "avoid"].includes(name) ? 1 : 0;

/** What DateInput sends for a full, real date. */
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function isUrl(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Checkout in three steps: what to promote, the brief, then payment.
 * Every step lives in one form so a single submit sends it all; Next checks the current step
 * with the same rules as the server, and the server's answer is the final word.
 */
export function CheckoutForm({ creators, brands, initial, prefill, minDeadline, total, balance }: Props) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkout, null);
  const paid = state?.paid;
  // After paying: wait on the success screen, then open the campaign. replace() keeps checkout out of history,
  // and the full load refreshes the cart, balance and counts in the header.
  useEffect(() => {
    if (!paid) return;
    window.scrollTo({ top: 0 });
    const timer = setTimeout(() => window.location.replace(`/campaigns/${paid.campaignId}`), REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [paid]);
  const [step, setStep] = useState(0);
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, MessageKey>>>({});
  const [cleared, setCleared] = useState<string[]>([]);

  // A server error sends you back to the earliest step with a problem (adjusted during render, once per result).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    setClientErrors({});
    setCleared([]);
    const steps = Object.keys(state?.errors ?? {}).map(stepOf);
    if (steps.length) setStep(Math.min(...steps));
  }
  const fieldsKey = useSubmissionKey(state);

  // With a single brand there is nothing to choose: it is always that brand, and the picker is hidden.
  const [brandId, setBrandId] = useState(brands.length === 1 ? brands[0].id : (state?.values.brandId ?? initial?.brandId ?? ""));
  // One product per campaign.
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const pickProduct = (id: string) => {
    setProductId(id);
    clear("productId");
  };
  const [adding, setAdding] = useState(false);
  const brand = brands.find((b) => b.id === brandId);
  const selected = brand?.products.filter((p) => p.id === productId) ?? [];
  // Unboxing needs a box: only offered for physical products.
  const styles = VIDEO_STYLES.filter((s) => s !== "unboxing" || selected[0]?.type === "physical");
  const [useBalance, setUseBalance] = useState(balance > 0 && (state ? state.values.useBalance === "on" : true));
  const fromBalance = useBalance ? Math.min(balance, total) : 0;
  const byCard = total - fromBalance;

  /** Hide a field's error once it has been changed; Next or the server checks it again. */
  const clear = (name: string) => setCleared((names) => (names.includes(name) ? names : [...names, name]));
  const errors = Object.fromEntries(Object.entries({ ...state?.errors, ...clientErrors }).filter(([name]) => !cleared.includes(name)));
  const err = (name: string) => {
    const key = errors[name];
    return key ? t(key) : undefined;
  };
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);
  const v = (name: string) => (state ? state.values[name] : prefill?.values[name]);
  const hasNotes = creators.some((c) => v(`note-${c.id}`));
  // FormState keeps one value per name, so the submitted references are re-read from the errors' fields.
  const sentRefs: string[] = [];
  for (let i = 0; state?.values[`reference-${i}`] !== undefined; i++) sentRefs.push(String(state!.values[`reference-${i}`]));
  const refs = state ? sentRefs : (prefill?.references ?? []);
  // One reference field to start; "Add another" adds more, no limit. Comes back with as many as were sent.
  const [refList, setRefList] = useState<string[]>(() => (refs.length ? refs : [""]));
  const hasMore = ["keyMessage", "mustInclude", "avoid"].some((k) => v(k)) || refs.some(Boolean) || Object.keys(state?.errors ?? {}).some((k) => k.startsWith("reference-"));

  /** The server's rules for one step, run before moving on. */
  function check(current: number) {
    const data = new FormData(form.current!);
    const get = (name: string) => String(data.get(name) ?? "").trim();
    const found: Partial<Record<string, MessageKey>> = {};
    if (current === 0) {
      if (!brand) found.brandId = "forms.errors.pickBrand";
      else if (selected.length === 0) found.productId = "forms.errors.pickProduct";
      for (const p of selected) {
        const name = (key: string) => `log-${p.id}-${key}`;
        if (p.type === "app" && get(name("link")) && !isUrl(get(name("link")))) found[name("link")] = "forms.errors.urlInvalid";
        if (p.type === "venue") {
          for (const key of ["from", "to"]) if (get(name(key)) && !isIsoDate(get(name(key)))) found[name(key)] = "forms.errors.dateInvalid";
          if (isIsoDate(get(name("from"))) && isIsoDate(get(name("to"))) && get(name("to")) < get(name("from"))) found[name("to")] = "forms.errors.visitOrder";
        }
      }
    } else if (current === 1) {
      if (!get("title")) found.title = "forms.errors.titleRequired";
      if (get("brief").length < 20) found.brief = "forms.errors.briefTooShort";
      if (!get("videoStyle")) found.videoStyle = "forms.errors.pickVideoStyle";
      if (get("deadline") && !isIsoDate(get("deadline"))) found.deadline = "forms.errors.dateInvalid";
      else if (get("deadline") && get("deadline") < minDeadline) found.deadline = "forms.errors.deadlineFuture";
      data.getAll("reference").forEach((r, i) => {
        if (String(r).trim() && !isUrl(String(r).trim())) found[`reference-${i}`] = "forms.errors.urlInvalid";
      });
    }
    setClientErrors(found);
    setCleared([]);
    return Object.keys(found).length === 0;
  }

  function go(to: number) {
    setStep(to);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }

  const titles = [t("checkout.stepWhat"), t("checkout.stepBrief"), t("checkout.payment")];

  // Paid: the success screen replaces the form, then the campaign opens after a few seconds.
  if (paid) {
    const href = `/campaigns/${paid.campaignId}`;
    return (
      <PaymentSuccess t={t} tp={tp} creators={paid.creators.map((c) => ({ id: c.id, name: f.pick(c.name) }))}>
        <p className="text-small text-text-muted">{t("checkout.redirecting")}</p>
        <span aria-hidden className="block h-1 w-40 overflow-hidden rounded-full bg-surface">
          <span className="block h-full origin-left bg-primary motion-safe:animate-[fill_3s_linear_both] rtl:origin-right" />
        </span>
        <Link href={href} replace className={buttonClass("secondary")}>
          {t("checkout.viewCampaign")}
        </Link>
      </PaymentSuccess>
    );
  }

  return (
    <>
      <form
        ref={form}
        action={action}
        noValidate
        onChange={(e) => {
          const input = e.target as unknown as HTMLInputElement;
          const name = input.dataset.field || input.name;
          if (name) clear(name);
        }}
        // Enter in a field moves to the next step instead of submitting early.
        onSubmit={(e) => {
          if (step < LAST) {
            e.preventDefault();
            if (check(step)) go(step + 1);
          }
        }}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <Stepper label={t("checkout.stepper")} current={step} steps={titles} />

          {/* Locked while paying, so nothing changes under the request. */}
          <Card inert={pending} className="flex flex-col gap-6 p-5 md:p-6">
            <div>
              <p className="text-small text-text-muted">{t("brandForm.stepOf", { n: step + 1, total: LAST + 1 })}</p>
              <h2 ref={heading} tabIndex={-1} className="text-h2 font-medium outline-none">
                {titles[step]}
              </h2>
            </div>

            <input type="hidden" name="brandId" value={brandId} />
            {productId && <input type="hidden" name="productId" value={productId} />}

            <div key={fieldsKey} className="contents">
              {/* Step 1: what the campaign promotes */}
              <div hidden={step !== 0}>
                <div className="flex flex-col gap-6">
                  {brands.length > 1 && (
                    <fieldset className="flex flex-col gap-2" aria-describedby={described("brandId")}>
                      <legend className="mb-2 font-medium">{t("checkout.brandLabel")}</legend>
                      <div className="flex flex-wrap gap-2">
                        {brands.map((b) => (
                          <label
                            key={b.id}
                            className="flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border ps-1.5 pe-4 transition-colors hover:bg-surface/60 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-on-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
                          >
                            <input
                              type="radio"
                              name="brandPick"
                              value={b.id}
                              checked={b.id === brandId}
                              onChange={() => {
                                setBrandId(b.id);
                                setProductId("");
                                clear("brandId");
                              }}
                              className="sr-only"
                            />
                            <BrandLogo id={b.id} name={b.name} src={b.logo} size="sm" />
                            {b.name}
                          </label>
                        ))}
                      </div>
                      {err("brandId") && <FieldError id="brandId-error">{err("brandId")}</FieldError>}
                    </fieldset>
                  )}

                  {brand && (
                    <fieldset role="radiogroup" className="flex flex-col gap-2" aria-describedby={described("productId")}>
                      <legend className="mb-2 font-medium">{t("checkout.productLabel")}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {brand.products.map((p) => {
                          const on = p.id === productId;
                          return (
                            <label
                              key={p.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                                on ? "border-primary bg-primary-soft/40" : "border-border hover:bg-surface/60",
                              )}
                            >
                              <input type="radio" name="productPick" value={p.id} checked={on} onChange={() => pickProduct(p.id)} className="sr-only" />
                              <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
                                {p.photo ? <Image src={p.photo} alt="" fill unoptimized className="object-cover" /> : <ImageOff aria-hidden className="size-4 text-icon-inactive" strokeWidth={1.5} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{p.name}</span>
                                <span className="block truncate text-small text-text-muted">
                                  {p.typeLabel}
                                  {p.price && (
                                    <>
                                      {t("common.separator")}
                                      <span className="tabular-nums">{p.price}</span>
                                    </>
                                  )}
                                </span>
                              </span>
                              <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-primary" : "border-border")}>
                                {on && <span className="size-3 rounded-full bg-primary" />}
                              </span>
                            </label>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setAdding(true)}
                          className="flex min-h-[74px] items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-primary/40 p-3 font-medium text-primary transition-colors hover:bg-primary-soft/60"
                        >
                          <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-soft">
                            <Plus aria-hidden className="size-5" />
                          </span>
                          {t("checkout.addProduct")}
                        </button>
                      </div>
                      {brand.products.length === 0 && <p className="text-small text-text-muted">{t("checkout.noProducts", { brand: brand.name })}</p>}
                      {err("productId") && <FieldError id="productId-error">{err("productId")}</FieldError>}
                    </fieldset>
                  )}

                  {brand && (
                    <LogisticsFields
                      products={selected}
                      v={(name) => {
                        const value = v(name);
                        return typeof value === "string" ? value : undefined;
                      }}
                      err={err}
                    />
                  )}
                </div>
              </div>

              {/* Step 2: the brief every creator gets */}
              <div hidden={step !== 1}>
                <div className="flex flex-col gap-5">
                  <fieldset className="flex flex-col gap-2" aria-describedby={described("videoStyle")}>
                    <legend className="mb-2 flex items-center gap-1.5 font-medium">
                      {t("checkout.videoStyle")}
                      <Dropdown
                        openOnHover
                        panelClassName="w-80"
                        triggerLabel={t("checkout.videoStyleGuideLabel")}
                        triggerClassName="grid size-6 place-items-center rounded-full text-text-muted transition-colors hover:text-text"
                        trigger={<CircleAlert aria-hidden className="size-[18px]" strokeWidth={1.75} />}
                      >
                        {() => (
                          <div className="flex flex-col gap-3 p-2 font-normal">
                            <p className="font-medium">{t("checkout.videoStyleGuideTitle")}</p>
                            <dl className="flex flex-col gap-2.5 text-small">
                              {styles.map((style) => {
                                const Icon = styleIcon[style];
                                return (
                                  <div key={style} className="flex gap-2.5">
                                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                                    <div>
                                      <dt className="font-medium">{t(`checkout.videoStyles.${style}`)}</dt>
                                      <dd className="text-text-muted">{t(`checkout.videoStyleHints.${style}`)}</dd>
                                    </div>
                                  </div>
                                );
                              })}
                            </dl>
                          </div>
                        )}
                      </Dropdown>
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {styles.map((style) => {
                        const Icon = styleIcon[style];
                        return (
                          <label
                            key={style}
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-border px-3 py-4 text-center text-small font-medium transition-colors hover:bg-surface/60 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
                          >
                            <input type="radio" name="videoStyle" value={style} defaultChecked={v("videoStyle") === style} className="sr-only" />
                            <Icon aria-hidden className="size-6" strokeWidth={1.75} />
                            {t(`checkout.videoStyles.${style}`)}
                          </label>
                        );
                      })}
                    </div>
                    {err("videoStyle") && <FieldError id="videoStyle-error">{err("videoStyle")}</FieldError>}
                  </fieldset>
                  <Field label={t("checkout.titleLabel")} htmlFor="title" error={err("title")}>
                    <Input id="title" name="title" defaultValue={v("title")} placeholder={t("checkout.titlePlaceholder")} aria-invalid={!!err("title")} aria-describedby={described("title")} />
                  </Field>
                  <Field label={t("checkout.briefLabel")} htmlFor="brief" error={err("brief")}>
                    <Textarea id="brief" name="brief" defaultValue={v("brief")} placeholder={t("checkout.briefPlaceholder")} aria-invalid={!!err("brief")} aria-describedby={described("brief")} />
                  </Field>
                  <Field label={`${t("checkout.deadline")} (${t("brandForm.optional")})`} htmlFor="deadline" error={err("deadline")} hint={t("checkout.deadlineHint")}>
                    <DateInput id="deadline" name="deadline" min={minDeadline} defaultValue={v("deadline")} aria-invalid={!!err("deadline")} aria-describedby={described("deadline")} className="sm:max-w-72" />
                  </Field>
                  {/* What creators see with the request; optional, so folded away. Closed fields still submit. */}
                  <details open={hasMore || undefined} className="group/more rounded-[var(--radius-lg)] border border-border">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-lg)] p-4 [&::-webkit-details-marker]:hidden">
                      <ListPlus aria-hidden className="size-5 text-text-muted" />
                      <span className="flex-1">
                        <span className="block font-medium">{t("checkout.moreDetails")}</span>
                        <span className="block text-small text-text-muted">{t("checkout.moreDetailsHint")}</span>
                      </span>
                      <ChevronDown aria-hidden className="size-5 shrink-0 text-text-muted transition-transform group-open/more:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-5 px-4 pb-4">
                      <Field label={t("checkout.keyMessage")} htmlFor="keyMessage" hint={t("checkout.keyMessageHint")}>
                        <Input id="keyMessage" name="keyMessage" maxLength={200} defaultValue={v("keyMessage")} placeholder={t("checkout.keyMessagePlaceholder")} />
                      </Field>
                      <fieldset className="flex flex-col gap-2">
                        {/* Title on one side, "+ Add another" on the other. */}
                        <legend className="mb-2 flex w-full items-center justify-between gap-3 font-medium">
                          {t("checkout.references")}
                          {refList.length < 5 && (
                            <button
                              type="button"
                              onClick={() => setRefList((list) => [...list, ""])}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface"
                            >
                              <Plus aria-hidden className="size-4" />
                              {t("checkout.addReference")}
                            </button>
                          )}
                        </legend>
                        {refList.map((ref, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <div className="group relative">
                              <Input
                                id={`reference-${i}`}
                                name="reference"
                                data-field={`reference-${i}`}
                                type="url"
                                inputMode="url"
                                dir="ltr"
                                aria-label={`${t("checkout.references")} ${i + 1}`}
                                value={ref}
                                onChange={(e) => setRefList((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                                placeholder={t("checkout.referencePlaceholder")}
                                aria-invalid={!!err(`reference-${i}`)}
                                aria-describedby={described(`reference-${i}`)}
                                className={refList.length > 1 ? "pe-12" : undefined}
                              />
                              {refList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setRefList((list) => list.filter((_, j) => j !== i))}
                                  aria-label={`${t("checkout.removeReference")} ${i + 1}`}
                                  className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-text-muted transition-opacity hover:bg-surface focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                                >
                                  <X aria-hidden className="size-4" />
                                </button>
                              )}
                            </div>
                            {err(`reference-${i}`) && <FieldError id={`reference-${i}-error`}>{err(`reference-${i}`)}</FieldError>}
                          </div>
                        ))}
                      </fieldset>
                      <Field
                        label={
                          <>
                            <CircleCheck aria-hidden className="size-4 text-success" />
                            {t("checkout.mustInclude")}
                          </>
                        }
                        htmlFor="mustInclude"
                      >
                        <Textarea id="mustInclude" name="mustInclude" maxLength={500} className="min-h-16" defaultValue={v("mustInclude")} placeholder={t("checkout.mustIncludePlaceholder")} />
                      </Field>
                      <Field
                        label={
                          <>
                            <CircleX aria-hidden className="size-4 text-error" />
                            {t("checkout.avoid")}
                          </>
                        }
                        htmlFor="avoid"
                      >
                        <Textarea id="avoid" name="avoid" maxLength={500} className="min-h-16" defaultValue={v("avoid")} placeholder={t("checkout.avoidPlaceholder")} />
                      </Field>
                    </div>
                  </details>
                  {/* Optional, so folded away. Closed fields still submit with the form. */}
                  <details open={hasNotes || undefined} className="group rounded-[var(--radius-lg)] border border-border">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-lg)] p-4 font-medium [&::-webkit-details-marker]:hidden">
                      <MessageSquare aria-hidden className="size-5 text-text-muted" />
                      {t("checkout.notes")}
                      <ChevronDown aria-hidden className="ms-auto size-5 text-text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      {creators.map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <Avatar id={c.id} name={c.name} size="sm" className="mt-1.5" />
                          <Textarea
                            name={`note-${c.id}`}
                            aria-label={`${t("checkout.notes")}: ${c.name}`}
                            defaultValue={v(`note-${c.id}`)}
                            placeholder={t("checkout.notePlaceholder")}
                            className="min-h-16"
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 3: payment */}
              <div hidden={step !== 2}>
                <div className="flex flex-col gap-5">
                  <PaymentFields balance={balance} useBalance={useBalance} onUseBalance={setUseBalance} byCard={byCard} err={err} v={v} />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => go(step - 1)}>
                  {t("brandForm.back")}
                </Button>
              ) : (
                <span />
              )}
              {step < LAST ? (
                <Button type="submit" variant="primary">
                  {t("brandForm.next")}
                </Button>
              ) : (
                <Button type="submit" variant="hero" aria-busy={pending} disabled={pending} className="disabled:opacity-80">
                  {pending ? (
                    <>
                      <LoaderCircle aria-hidden className="animate-spin" />
                      {t("checkout.paying")}
                    </>
                  ) : byCard > 0 ? (
                    t("checkout.pay", { amount: f.money(byCard) })
                  ) : (
                    t("checkout.payBalance")
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t("checkout.summary")}</p>
            {/* The way back to the cart: here rather than at the top, so it doesn't compete with the steps. */}
            <Link href="/cart" className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-small font-medium text-text-muted hover:text-text">
              <Pencil aria-hidden className="size-3.5" />
              {t("checkout.editCart")}
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {creators.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-small">
                <Avatar id={c.id} name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-text-muted">{c.summary}</span>
                </span>
                <span className="tabular-nums">{f.money(c.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-border pt-3 text-small">
            <div className="flex justify-between gap-2 text-body">
              <dt className="font-medium">{t("cart.total")}</dt>
              <dd className="font-medium tabular-nums">{f.money(total)}</dd>
            </div>
            {fromBalance > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("checkout.fromBalance")}</dt>
                <dd className="tabular-nums">{f.signedMoney(-fromBalance)}</dd>
              </div>
            )}
            {fromBalance > 0 && byCard > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t("checkout.byCard")}</dt>
                <dd className="tabular-nums">{f.money(byCard)}</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface p-3 text-small text-text-muted">
            <p className="flex gap-2">
              <RotateCcw aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("checkout.revisionNote")}
            </p>
          </div>
        </Card>
      </form>
      {brand && (
        <Drawer open={adding} onClose={() => setAdding(false)} title={t("checkout.addProductTitle", { brand: brand.name })}>
          <ProductForm
            mode="create"
            brandId={brand.id}
            onCreated={(id) => {
              setProductId(id);
              setAdding(false);
            }}
          />
        </Drawer>
      )}
    </>
  );
}
