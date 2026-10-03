"use client";

import { useActionState } from "react";
import { updateBrand, type BrandFormState } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSubmissionKey } from "@/lib/useSubmissionKey";
import { AboutFields, BasicsFields, ExtrasFields, type BrandValues } from "./BrandFields";

/** All brand fields on one page, grouped like the creation steps. */
export function BrandEditForm({ brandId, initial }: { brandId: string; initial: BrandValues }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<BrandFormState, FormData>(updateBrand.bind(null, brandId), null);
  const fieldsKey = useSubmissionKey(state);
  const err = (name: string) => (state?.errors[name] ? t(state.errors[name]!) : undefined);
  const v = (state?.values as BrandValues | undefined) ?? initial;

  const sections = [
    { title: t("brandForm.stepBasics"), body: <BasicsFields v={v} err={err} /> },
    { title: t("brandForm.stepAbout"), body: <AboutFields v={v} err={err} /> },
    { title: t("brandForm.stepExtras"), body: <ExtrasFields v={v} err={err} /> },
  ];

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {sections.map((s) => (
        <Card key={`${s.title}-${fieldsKey}`} className="flex flex-col gap-5 p-5 md:p-6">
          <h2 className="text-h2 font-medium">{s.title}</h2>
          {s.body}
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" aria-busy={pending}>
          {t("brandForm.save")}
        </Button>
      </div>
    </form>
  );
}
