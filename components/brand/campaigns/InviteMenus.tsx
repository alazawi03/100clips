"use client";

import Link from "next/link";
import { ChevronDown, Compass, ListChecks, Megaphone, UserPlus } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";

/** "Add creator" on a campaign: invite from one of your lists, or browse creators and invite from a profile. */
export function AddCreatorMenu({ campaignId }: { campaignId: string }) {
  const { t } = useI18n();
  return (
    <Dropdown
      align="start"
      panelClassName="w-72"
      triggerClassName={buttonClass("secondary")}
      trigger={
        <>
          <UserPlus aria-hidden />
          {t("campaignDetail.addCreator")}
          <ChevronDown aria-hidden className="size-4" />
        </>
      }
    >
      {(close) => (
        <ul>
          <li>
            <Link href={`/campaigns/${campaignId}/invite`} onClick={close} className={menuItemClass}>
              <ListChecks aria-hidden className="size-5 shrink-0 text-text-muted" />
              <span>
                <span className="block font-medium">{t("invite.fromList")}</span>
                <span className="block text-small text-text-muted">{t("invite.fromListHint")}</span>
              </span>
            </Link>
          </li>
          <li>
            <Link href="/explore" onClick={close} className={menuItemClass}>
              <Compass aria-hidden className="size-5 shrink-0 text-text-muted" />
              <span>
                <span className="block font-medium">{t("invite.browse")}</span>
                <span className="block text-small text-text-muted">{t("invite.browseHint")}</span>
              </span>
            </Link>
          </li>
        </ul>
      )}
    </Dropdown>
  );
}

/** "Invite to campaign" on a creator profile: pick one of your active campaigns, then the package and payment. */
export function InviteToCampaignMenu({ creatorId, campaigns }: { creatorId: string; campaigns: Array<{ id: string; title: string }> }) {
  const { t } = useI18n();
  if (campaigns.length === 0) return null;
  return (
    <Dropdown
      align="end"
      panelClassName="w-72"
      triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-small font-medium transition-colors hover:bg-surface"
      trigger={
        <>
          <Megaphone aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t("invite.toCampaign")}</span>
        </>
      }
      triggerLabel={t("invite.toCampaign")}
    >
      {(close) => (
        <div className="flex flex-col">
          <p className="px-3 pt-1.5 pb-1 text-small font-medium text-text-muted">{t("invite.chooseCampaign")}</p>
          <ul>
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}/invite?creator=${creatorId}`} onClick={close} className={menuItemClass}>
                  <Megaphone aria-hidden className="size-4 shrink-0 text-text-muted" />
                  <span className="truncate">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dropdown>
  );
}
