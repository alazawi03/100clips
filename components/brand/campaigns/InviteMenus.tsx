"use client";

import Link from "next/link";
import { Megaphone, UserPlus } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";

/** "Add creator" on a campaign: the invite page, to pick from your lists or from Explore. */
export function AddCreatorMenu({ campaignId }: { campaignId: string }) {
  const { t } = useI18n();
  return (
    <Link href={`/campaigns/${campaignId}/invite`} className={buttonClass("secondary")}>
      <UserPlus aria-hidden />
      {t("campaignDetail.addCreator")}
    </Link>
  );
}

/**
 * "Invite to campaign": pick one of your active campaigns, then the invite page opens with these creators
 * ticked (`creatorIds`) or a whole list ticked (`listId`), for packages and payment.
 * "icon" sits on creator cards, "button" on list headers, "pill" on a creator profile.
 */
export function InviteToCampaignMenu({
  campaigns,
  creatorIds,
  listId,
  variant = "pill",
  label,
}: {
  campaigns: Array<{ id: string; title: string }>;
  creatorIds?: string[];
  listId?: string;
  variant?: "icon" | "button" | "pill";
  /** Accessible name, e.g. "Invite Noura to a campaign". */
  label?: string;
}) {
  const { t } = useI18n();
  if (campaigns.length === 0) return null;
  const query = listId ? `list=${listId}` : `creators=${(creatorIds ?? []).join(",")}`;
  const text = listId ? t("invite.listToCampaign") : t("invite.toCampaign");
  return (
    <Dropdown
      align="end"
      panelClassName="w-72"
      triggerLabel={label ?? text}
      triggerClassName={
        variant === "icon"
          ? "grid size-9 place-items-center rounded-full border border-border bg-card text-text transition-colors hover:bg-surface"
          : variant === "button"
            ? buttonClass("secondary", "h-9 md:h-9")
            : "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-small font-medium transition-colors hover:bg-surface"
      }
      trigger={
        <>
          <Megaphone aria-hidden className="size-4" />
          {variant === "button" && text}
          {variant === "pill" && <span className="hidden sm:inline">{text}</span>}
        </>
      }
    >
      {(close) => (
        <div className="flex flex-col">
          <p className="px-3 pt-1.5 pb-1 text-small font-medium text-text-muted">{t("invite.chooseCampaign")}</p>
          <ul>
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}/invite?${query}`} onClick={close} className={menuItemClass}>
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
