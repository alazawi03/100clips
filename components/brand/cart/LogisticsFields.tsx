"use client";

import Image from "next/image";
import { AppWindow, Gift, Handshake, ImageOff, MapPin, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DateInput } from "@/components/ui/DateInput";
import { Field, Input, Textarea } from "@/components/ui/Form";
import type { ProductType } from "@/lib/data/types";

export type LogisticsProduct = { id: string; name: string; type: ProductType; typeLabel: string; photo?: string; downloadLink?: string; mapUrl?: string };

const icon: Record<ProductType, LucideIcon> = { physical: Package, app: AppWindow, venue: MapPin, service: Handshake };

type Props = {
  products: LogisticsProduct[];
  /** Submitted value of a field, to show again after a failed submit. */
  v: (name: string) => string | undefined;
  err: (name: string) => string | undefined;
};

/**
 * How each selected product reaches the creator, depending on its type: one card per product.
 * Services have nothing to set up here; their card just points to the brief.
 * Field names are "log-<productId>-<field>"; the checkout action reads them back the same way.
 */
export function LogisticsFields({ products, v, err }: Props) {
  const { t } = useI18n();
  if (products.length === 0) return null;

  const field = (id: string, key: string) => `log-${id}-${key}`;
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);

  return (
    <section aria-labelledby="logistics-title" className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h3 id="logistics-title" className="font-medium">
          {t("checkout.logistics.title")}
        </h3>
        <p className="text-small text-text-muted">{t("checkout.logistics.hint")}</p>
      </div>

      {products.map((p) => {
        const Icon = icon[p.type];
        const name = (key: string) => field(p.id, key);
        return (
          <fieldset key={p.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-soft">
            <legend className="sr-only">{p.name}</legend>
            <div aria-hidden className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
              <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
                {p.photo ? <Image src={p.photo} alt="" fill unoptimized className="object-cover" /> : <ImageOff className="size-4 text-icon-inactive" strokeWidth={1.5} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block truncate text-small text-text-muted">{p.typeLabel}</span>
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
            </div>
            <div className="flex flex-col gap-4 p-4">
              {p.type === "physical" && (
                <>
                  <p className="text-small text-text-muted">{t("checkout.logistics.physicalShip")}</p>
                  <div role="radiogroup" aria-label={t("checkout.logistics.afterFilming")} className="grid gap-2 sm:grid-cols-2">
                    {(["keep", "return"] as const).map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40"
                      >
                        <input
                          type="radio"
                          name={name("after")}
                          value={option}
                          defaultChecked={(v(name("after")) ?? "keep") === option}
                          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                        />
                        <span>
                          <span className="block text-small font-medium">{t(`checkout.logistics.${option}`)}</span>
                          <span className="flex items-center gap-1 text-caption text-text-muted">
                            {option === "keep" && <Gift aria-hidden className="size-3.5 shrink-0" />}
                            {t(`checkout.logistics.${option}Hint`)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {p.type === "app" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("checkout.logistics.appLink")} htmlFor={name("link")} error={err(name("link"))}>
                    <Input
                      id={name("link")}
                      name={name("link")}
                      dir="ltr"
                      type="url"
                      placeholder="https://"
                      defaultValue={v(name("link")) ?? p.downloadLink}
                      aria-invalid={!!err(name("link"))}
                      aria-describedby={described(name("link"))}
                    />
                  </Field>
                  <Field label={`${t("checkout.logistics.promoCode")} (${t("brandForm.optional")})`} htmlFor={name("promo")}>
                    <Input id={name("promo")} name={name("promo")} dir="ltr" autoCapitalize="characters" placeholder={t("checkout.logistics.promoPlaceholder")} defaultValue={v(name("promo"))} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={`${t("checkout.logistics.testAccount")} (${t("brandForm.optional")})`} htmlFor={name("account")} hint={t("checkout.logistics.testAccountHint")}>
                      <Textarea id={name("account")} name={name("account")} dir="ltr" className="min-h-16" placeholder={t("checkout.logistics.testAccountPlaceholder")} defaultValue={v(name("account"))} />
                    </Field>
                  </div>
                </div>
              )}

              {p.type === "venue" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {p.mapUrl && (
                    <a href={p.mapUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-small font-medium text-primary hover:underline sm:col-span-2">
                      <MapPin aria-hidden className="size-4" />
                      {t("productDrawer.openMap")}
                    </a>
                  )}
                  <Field label={`${t("checkout.logistics.visitFrom")} (${t("brandForm.optional")})`} htmlFor={name("from")} error={err(name("from"))}>
                    <DateInput id={name("from")} name={name("from")} defaultValue={v(name("from"))} aria-invalid={!!err(name("from"))} aria-describedby={described(name("from"))} />
                  </Field>
                  <Field label={`${t("checkout.logistics.visitTo")} (${t("brandForm.optional")})`} htmlFor={name("to")} error={err(name("to"))}>
                    <DateInput id={name("to")} name={name("to")} defaultValue={v(name("to"))} aria-invalid={!!err(name("to"))} aria-describedby={described(name("to"))} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t("checkout.logistics.included")} htmlFor={name("included")}>
                      <Textarea id={name("included")} name={name("included")} className="min-h-16" placeholder={t("checkout.logistics.includedPlaceholder")} defaultValue={v(name("included"))} />
                    </Field>
                  </div>
                </div>
              )}

              {p.type === "service" && <p className="text-small text-text-muted">{t("checkout.logistics.serviceNote")}</p>}
            </div>
          </fieldset>
        );
      })}
    </section>
  );
}
