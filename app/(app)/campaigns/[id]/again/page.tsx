import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { payCampaignAgain } from "@/app/actions/brand";
import { AgainForm } from "@/components/brand/campaigns/AgainForm";
import { inviteView, pickerLists, productOf } from "@/components/brand/campaigns/campaignView";
import { NICHES } from "@/lib/data/creatorFilters";
import { cardOnline, workspace } from "@/lib/data/live";
import type { ContentFormat } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";
import { daysUntil } from "@/lib/orderFlow";
import { isActiveOrder } from "@/lib/statuses";
import { nextDay, today } from "@/lib/today";

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * "Run again": a new campaign from this one, without the cart. This campaign's creators start ticked
 * with last time's platform, more can come from a list, and the brief and details are the same unless
 * edited. The deadline is as far from today as it was last time.
 */
export default async function RunAgainPage({ params }: PageProps<"/campaigns/[id]/again">) {
  const { id } = await params;
  const [ws, online] = await Promise.all([workspace(), cardOnline()]);
  const campaign = ws.campaign(id);
  if (!campaign || campaign.status === "draft") notFound();
  const i18n = await getI18n();
  const { t, f } = i18n;
  const { product } = productOf(campaign, ws);

  // The creators who worked on it (not the ones who declined or were withdrawn), with the format they made.
  const before = ws.orders
    .filter((o) => o.campaignId === id && isActiveOrder(o))
    .map((o) => ({ creatorId: o.creatorId, format: o.items[0].format }))
    .filter((p, i, all) => all.findIndex((q) => q.creatorId === p.creatorId) === i);
  // Only creators who can be booked now come again.
  const same = before.flatMap(({ creatorId }) => {
    const c = ws.isBookable(creatorId) ? ws.creator(creatorId) : undefined;
    return c ? [inviteView(c, i18n)] : [];
  });
  // Last time's platform, if the creator still offers it.
  const defaultFormats: Record<string, ContentFormat> = Object.fromEntries(
    before.filter((b) => ws.creator(b.creatorId)?.formats.some((o) => o.format === b.format)).map((b) => [b.creatorId, b.format]),
  );
  const lists = [{ id: "same", name: t("again.sameCreators"), creators: same }, ...(await pickerLists(ws, i18n))];

  const day = today();
  const span = campaign.deadline && campaign.createdAt ? Math.max(1, daysUntil(campaign.deadline, campaign.createdAt)) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href={`/campaigns/${id}`} className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] text-small text-text-muted hover:text-text">
          <ChevronRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" />
          {f.pick(campaign.title)}
        </Link>
        <h1 className="text-h1 font-medium text-balance">{t("again.title", { campaign: f.pick(campaign.title) })}</h1>
        <p className="text-text-muted">{t("again.subtitle")}</p>
      </header>
      <AgainForm
        action={payCampaignAgain.bind(null, id)}
        lists={lists}
        explore={{ creators: ws.bookable.map((c) => inviteView(c, i18n)), niches: NICHES.map((n) => ({ id: n, label: t(`niches.${n}`) })) }}
        defaultFormats={defaultFormats}
        defaults={{
          title: f.pick(campaign.title),
          brief: f.pick(campaign.brief),
          deadline: span ? addDays(day, span) : undefined,
          keyMessage: campaign.keyMessage,
          references: campaign.references ?? [],
          mustInclude: campaign.mustInclude,
          avoid: campaign.avoid,
          product: product ? f.pick(product.name) : undefined,
          videoStyle: campaign.videoStyle ? t(`checkout.videoStyles.${campaign.videoStyle}`) : undefined,
        }}
        minDeadline={nextDay(day)}
        balance={ws.balance}
        cardOnline={online}
      />
    </div>
  );
}
