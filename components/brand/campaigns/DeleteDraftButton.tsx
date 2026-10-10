"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCampaignDraft } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

/** Deletes a draft from its card on Campaigns, after asking. */
export function DeleteDraftButton({ id, className }: { id: string; className?: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("newCampaign.deleteDraft")}
      title={t("newCampaign.deleteDraft")}
      onClick={() => {
        if (window.confirm(t("newCampaign.deleteDraftConfirm"))) start(() => deleteCampaignDraft(id));
      }}
      className={cn("grid size-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-error-soft hover:text-error disabled:opacity-50", className)}
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
}
