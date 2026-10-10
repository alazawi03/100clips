"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { decideApplication, type AdminFormState } from "@/app/actions/admin";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { FieldError, Textarea } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { CONTENT_RULES } from "@/lib/admin/rules";
import type { MessageKey } from "@/lib/i18n/messages";

const DECISIONS = ["approve", "changes", "reject"] as const;

/**
 * Check the samples against the content rules, then approve, request changes or reject. The note goes to
 * the creator; it's required unless approving. Approving needs every rule ticked.
 */
export function DecisionForm({ id }: { id: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminFormState, FormData>(decideApplication.bind(null, id), null);
  // Controlled, so an error from the server doesn't wipe what was ticked and written.
  const [decision, setDecision] = useState<(typeof DECISIONS)[number] | "">("");
  const [rules, setRules] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const err = (name: string) => {
    const key = state?.errors?.[name];
    return key ? t(key as MessageKey) : undefined;
  };
  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">{t("admin.approvals.rulesTitle")}</legend>
        {CONTENT_RULES.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] bg-surface px-3">
            <input
              type="checkbox"
              name={`rule-${r}`}
              checked={rules.includes(r)}
              onChange={(e) => setRules((all) => (e.target.checked ? [...all, r] : all.filter((x) => x !== r)))}
              className="size-5 accent-[var(--primary)]"
            />
            <span>{t(`admin.approvals.rules.${r}`)}</span>
          </label>
        ))}
        {err("rules") && <FieldError>{err("rules")}</FieldError>}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">{t("admin.approvals.decision")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {DECISIONS.map((d) => (
            <label
              key={d}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border px-2 text-center text-small font-medium has-focus-visible:outline-2 has-focus-visible:outline-primary",
                decision === d ? "border-primary bg-primary-soft text-primary-on-soft" : "border-border text-text-muted hover:text-text",
              )}
            >
              <input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} className="sr-only" />
              {t(`admin.approvals.decisions.${d}`)}
            </label>
          ))}
        </div>
        {err("decision") && <FieldError>{err("decision")}</FieldError>}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="font-medium">
          {t(decision === "approve" || decision === "" ? "admin.approvals.noteOptional" : "admin.approvals.note")}
        </label>
        <Textarea id="note" name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} aria-invalid={!!err("note")} placeholder={t("admin.approvals.notePlaceholder")} />
        {err("note") ? <FieldError>{err("note")}</FieldError> : <p className="text-small text-text-muted">{t("admin.approvals.noteHint")}</p>}
      </div>

      <Button type="submit" variant={decision === "reject" ? "secondary" : "primary"} disabled={pending || !decision} aria-busy={pending}>
        {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : <Check aria-hidden />}
        {t(decision ? `admin.approvals.submit.${decision}` : "admin.approvals.submit.none")}
      </Button>
    </form>
  );
}
