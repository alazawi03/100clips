"use client";

import { useActionState, useRef, useState } from "react";
import { createBrand, type BrandFormState } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepHeader } from "@/components/ui/StepHeader";
import { Stepper } from "@/components/ui/Stepper";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import type { MessageKey } from "@/lib/i18n/messages";
import { ProductFields, type ProductValues } from "@/components/brand/products/ProductForm";
import { AboutFields, BasicsFields, ExtrasFields, type BrandValues } from "./BrandFields";

const STEP_FIELDS = [["nameAr", "logo", "industry"], ["about"], ["countries"]];
/** Per-country fields (cr_bh, vat_bh, …) belong to the business details step. */
const stepOfField = (field: string) => (/^(cr|vat)_/.test(field) ? 2 : STEP_FIELDS.findIndex((fields) => fields.includes(field)));
const PRODUCT_STEP = STEP_FIELDS.length;

/**
 * Create a brand in three steps (basics, about and links, business details), then its first product, which can be skipped.
 * Every step lives in one form so a single submit sends it all. Required: name and industry (step 1).
 */
export function BrandWizard({ mode, then }: { mode: "onboarding" | "add"; /** Where to carry on once saved: New campaign, or the cart's checkout. */ then?: "campaign" | "checkout" }) {
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<BrandFormState, FormData>(createBrand.bind(null, mode), null);
  const [step, setStep] = useState(0);
  const [clientErrors, setClientErrors] = useState<Record<string, MessageKey>>({});

  // A server error sends you back to the step that holds the field (adjusted during render, once per result).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    const keys = Object.keys(state?.errors ?? {});
    if (keys.length > 0) {
      // Anything that isn't a brand field belongs to the product.
      setStep(Math.min(...keys.map((k) => (stepOfField(k) >= 0 ? stepOfField(k) : PRODUCT_STEP))));
    }
  }

  const fieldsKey = useSubmissionKey(state);
  const errors = { ...state?.errors, ...clientErrors };
  const err = (name: string) => (errors[name] ? t(errors[name]!) : undefined);
  const v = (state?.values ?? {}) as BrandValues;

  function checkBasics() {
    const data = new FormData(form.current!);
    const found: Record<string, MessageKey> = {};
    if (!String(data.get("nameAr")).trim() && !String(data.get("nameEn")).trim()) found.nameAr = "forms.errors.brandNameRequired";
    if (!data.get("industry")) found.industry = "forms.errors.industryRequired";
    setClientErrors(found);
    return Object.keys(found).length === 0;
  }

  function next() {
    if (step === 0 && !checkBasics()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  }

  const titles = [t("brandForm.stepBasics"), t("brandForm.stepAbout"), t("brandForm.stepExtras"), t("brandForm.stepProduct")];

  return (
    <div className="flex flex-col gap-6">
      <Stepper label={t("brandForm.stepper")} current={step} steps={titles} onStep={setStep} />
      <form ref={form} action={action} noValidate>
        {then && <input type="hidden" name="then" value={then} />}
        <Card className="flex flex-col gap-6 p-5 md:p-6">
          <StepHeader
            count={t("brandForm.stepOf", { n: step + 1, total: titles.length })}
            title={titles[step]}
            back={step > 0 ? { label: t("brandForm.back"), onClick: () => setStep((s) => s - 1) } : undefined}
          />
          <div key={fieldsKey} className="contents">
            <div hidden={step !== 0}>
              <BasicsFields v={v} err={err} />
            </div>
            <div hidden={step !== 1}>
              <AboutFields v={v} err={err} links={false} />
            </div>
            <div hidden={step !== 2}>
              <ExtrasFields v={v} err={err} />
            </div>
            <div hidden={step !== PRODUCT_STEP}>
              <ProductFields optional flat v={(state?.values ?? {}) as ProductValues} err={err} />
            </div>
          </div>
          {/* Only the way forward down here; back is at the top of the step. */}
          <div className="flex border-t border-border pt-5 sm:justify-end">
            {step < titles.length - 1 ? (
              <Button variant="primary" onClick={next} className="w-full sm:w-auto">
                {t("brandForm.next")}
              </Button>
            ) : (
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button type="submit" name="intent" value="skipProduct" variant="ghost">
                  {t("brandForm.skipProduct")}
                </Button>
                <Button type="submit" variant="primary" aria-busy={pending}>
                  {t("brandForm.create")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
