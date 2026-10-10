"use client";

import { useId, useState, useTransition } from "react";
import { CircleCheck, Flag } from "lucide-react";
import { reportConversation } from "@/app/actions/messages";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Textarea } from "@/components/ui/Form";
import { REPORT_REASONS } from "@/lib/reportReasons";

/** Flag icon in the chat header: pick a reason, add a note if you like, and the admin reviews it. */
export function ReportButton({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  return (
    <Dropdown
      align="end"
      panelClassName="w-80"
      triggerLabel={t("chat.report")}
      triggerClassName="grid size-10 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
      trigger={<Flag aria-hidden className="size-[18px]" strokeWidth={1.75} />}
    >
      {(close) => <ReportForm conversationId={conversationId} onDone={close} />}
    </Dropdown>
  );
}

function ReportForm({ conversationId, onDone }: { conversationId: string; onDone: () => void }) {
  const { t } = useI18n();
  const groupId = useId();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        <CircleCheck aria-hidden className="size-8 text-success" />
        <p className="font-medium">{t("chat.reportSent")}</p>
        <p className="text-small text-text-muted">{t("chat.reportSentHint")}</p>
        <Button variant="secondary" onClick={onDone} className="w-full">
          {t("chat.reportClose")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason) return;
        startTransition(async () => {
          await reportConversation(conversationId, reason, details);
          setSent(true);
        });
      }}
      className="flex flex-col gap-3 p-2"
    >
      <p id={groupId} className="font-medium">
        {t("chat.reportTitle")}
      </p>
      <div role="radiogroup" aria-labelledby={groupId} className="flex flex-col gap-1.5">
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-small has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-[var(--primary)]" />
            {t(`chat.reportReasons.${r}`)}
          </label>
        ))}
      </div>
      <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} aria-label={t("chat.reportDetails")} placeholder={t("chat.reportDetails")} className="min-h-16" />
      <Button type="submit" variant="primary" disabled={!reason} aria-busy={pending} className="w-full disabled:opacity-50">
        {t("chat.reportSend")}
      </Button>
    </form>
  );
}
