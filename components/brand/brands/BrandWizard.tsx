"use client";

import { useActionState, useRef, useState } from "react";
import { createBrand, type BrandFormState } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stepper } from "@/components/ui/Stepper";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import type { MessageKey } from "@/lib/i18n/messages";
import { AboutFields, BasicsFields, ExtrasFields, type BrandValues } from "./BrandFields";

const STEP_FIELDS = [["nameAr", "logo", "industry"], ["about", "website", "instagram", "tiktok"], ["crNumber"]];

/**
 * Create a brand in three steps (basics, about, extras); adding the first product is the fourth.
 * Every step lives in one form so a single submit sends it all. Required: name and industry (step 1).
 */
export function BrandWizard({ mode }: { mode: "onboarding" | "add" }) {
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<BrandFormState, FormData>(createBrand.bind(null, mode), null);
  const [step, setStep] = useState(0);
  const [clientErrors, setClientErrors] = useState<Record<string, MessageKey>>({});

  // A server error sends you back to the step that holds the field (adjusted during render, once per result).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    const first = state ? STEP_FIELDS.findIndex((fields) => fields.some((f) => state.errors[f])) : -1;
    if (first >= 0) setStep(first);
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

  const titles = [t("brandForm.stepBasics"), t("brandForm.stepAbout"), t("brandForm.stepExtras")];

  return (
    <div className="flex flex-col gap-6">
      <Stepper label={t("brandForm.stepper")} current={step} steps={[...titles, t("brandForm.stepProduct")]} />
      <form ref={form} action={action} noValidate>
        <Card className="flex flex-col gap-6 p-5 md:p-6">
          <div>
            <p className="text-small text-text-muted">{t("brandForm.stepOf", { n: step + 1, total: 4 })}</p>
            <h2 className="text-h2 font-medium">{titles[step]}</h2>
          </div>
          <div key={fieldsKey} className="contents">
            <div hidden={step !== 0}>
              <BasicsFields v={v} err={err} />
            </div>
            <div hidden={step !== 1}>
              <AboutFields v={v} err={err} />
            </div>
            <div hidden={step !== 2}>
              <ExtrasFields v={v} err={err} />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                {t("brandForm.back")}
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button variant="primary" onClick={next}>
                {t("brandForm.next")}
              </Button>
            ) : (
              <Button type="submit" variant="primary" aria-busy={pending}>
                {t("brandForm.create")}
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
