"use client";

import { useActionState, useState } from "react";
import { createCampaign, type FormState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContentRules } from "@/components/ui/ContentRules";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { NICHES } from "@/lib/data/creatorFilters";
import { createFormatters } from "@/lib/i18n/format";

export function CampaignForm() {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(createCampaign, null);
  const [clips, setClips] = useState("");
  const [budget, setBudget] = useState("");
  const perClip = Number(budget) / Number(clips);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const described = (name: string) => (err(name) ? `${name}-error` : undefined);

  return (
    <form action={action} noValidate>
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <Field label={t("newCampaign.titleLabel")} htmlFor="title" error={err("title")}>
          <Input id="title" name="title" defaultValue={state?.values.title} placeholder={t("newCampaign.titlePlaceholder")} aria-invalid={!!err("title")} aria-describedby={described("title")} />
        </Field>
        <Field label={t("newCampaign.briefLabel")} htmlFor="brief" error={err("brief")}>
          <Textarea id="brief" name="brief" defaultValue={state?.values.brief} placeholder={t("newCampaign.briefPlaceholder")} aria-invalid={!!err("brief")} aria-describedby={described("brief")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("newCampaign.nicheLabel")} htmlFor="niche" error={err("niche")}>
            <Select id="niche" name="niche" defaultValue={state?.values.niche ?? ""} aria-invalid={!!err("niche")} aria-describedby={described("niche")}>
              <option value="" disabled>
                {t("newCampaign.nichePlaceholder")}
              </option>
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {t(`niches.${n}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("newCampaign.clipsLabel")} htmlFor="clipsCount" error={err("clipsCount")}>
            <Input
              id="clipsCount"
              name="clipsCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              placeholder="6"
              value={clips}
              onChange={(e) => setClips(e.target.value)}
              aria-invalid={!!err("clipsCount")}
              aria-describedby={described("clipsCount")}
            />
          </Field>
          <Field
            label={t("newCampaign.budgetLabel")}
            htmlFor="budget"
            error={err("budget")}
            hint={Number.isFinite(perClip) && perClip > 0 ? t("newCampaign.perClipHint", { price: f.money(Math.round(perClip * 1000) / 1000) }) : undefined}
          >
            <Input
              id="budget"
              name="budget"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.001"
              placeholder={t("newCampaign.budgetPlaceholder")}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-invalid={!!err("budget")}
              aria-describedby={described("budget")}
            />
          </Field>
        </div>
        <ContentRules t={t} error={err("rules")} defaultChecked={state?.values.rules === "on"} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" name="intent" value="draft" variant="secondary" aria-busy={pending}>
            {t("newCampaign.saveDraft")}
          </Button>
          <Button type="submit" name="intent" value="publish" variant="primary" aria-busy={pending}>
            {t("newCampaign.publish")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
