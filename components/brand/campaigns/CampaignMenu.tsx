"use client";

import { MoreHorizontal, XCircle } from "lucide-react";
import { cancelCampaign } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

/** ⋯ on the campaign header: cancel, while nobody has accepted yet. */
export function CampaignMenu({ campaignId, canCancel }: { campaignId: string; canCancel: boolean }) {
  const { t } = useI18n();
  return (
    <Dropdown
      align="end"
      panelClassName="w-72"
      triggerLabel={t("campaignDetail.more")}
      triggerClassName="grid size-10 place-items-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface hover:text-text"
      trigger={<MoreHorizontal aria-hidden className="size-5" />}
    >
      {(close) => (
        <button
          type="button"
          disabled={!canCancel}
          onClick={async () => {
            if (!window.confirm(t("campaignDetail.cancelConfirm"))) return;
            close();
            await cancelCampaign(campaignId);
          }}
          className={cn(menuItemClass, "text-error disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent")}
        >
          <XCircle aria-hidden className="size-4" />
          <span className="flex flex-col">
            {t("campaignDetail.cancel")}
            {!canCancel && <span className="text-caption text-text-muted">{t("campaignDetail.cancelBlocked")}</span>}
          </span>
        </button>
      )}
    </Dropdown>
  );
}
