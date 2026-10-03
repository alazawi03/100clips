import { Check } from "lucide-react";
import type { Translator } from "@/lib/i18n/messages";
import { FieldError } from "./Form";

/** The platform rules a brand accepts before an offer or campaign. Values, not warnings: neutral surface, check icons. */
export function ContentRules({ t, error, defaultChecked }: { t: Translator["t"]; error?: string; defaultChecked?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-4">
      <legend className="sr-only">{t("forms.rulesTitle")}</legend>
      <p aria-hidden className="font-medium">
        {t("forms.rulesTitle")}
      </p>
      <ul className="flex flex-col gap-2">
        {(["forms.ruleNoMusic", "forms.ruleModest", "forms.ruleNoProhibited"] as const).map((key) => (
          <li key={key} className="flex items-start gap-2">
            <Check aria-hidden className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2.25} />
            {t(key)}
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2 border-t border-border pt-3 font-medium">
        <input type="checkbox" name="rules" defaultChecked={defaultChecked} className="size-5 accent-[var(--primary)]" aria-invalid={error ? true : undefined} />
        {t("forms.acceptRules")}
      </label>
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}
