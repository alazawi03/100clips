import { notFound } from "next/navigation";
import { publishCampaign } from "@/app/actions/brand";
import { ApplicantRow } from "@/components/brand/campaigns/ApplicantRow";
import { OrderRow } from "@/components/brand/orders/OrderRow";
import { Badge, campaignTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { products } from "@/lib/data/account";
import { getCampaign } from "@/lib/data/campaigns";
import { orders } from "@/lib/data/orders";
import type { ApplicationStatus } from "@/lib/data/types";
import { getI18n } from "@/lib/i18n/server";

const TABS: Array<{
  status: ApplicationStatus;
  label:
    | "campaignDetail.tabPending"
    | "campaignDetail.tabAccepted"
    | "campaignDetail.tabRejected";
  empty:
    | "campaignDetail.noPending"
    | "campaignDetail.noAccepted"
    | "campaignDetail.noRejected";
}> = [
  {
    status: "pending",
    label: "campaignDetail.tabPending",
    empty: "campaignDetail.noPending",
  },
  {
    status: "accepted",
    label: "campaignDetail.tabAccepted",
    empty: "campaignDetail.noAccepted",
  },
  {
    status: "rejected",
    label: "campaignDetail.tabRejected",
    empty: "campaignDetail.noRejected",
  },
];

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign || campaign.brandId !== (await getCurrentBrand()).id)
    notFound();
  const i18n = await getI18n();
  const { t, tp, f } = i18n;
  const query = await searchParams;
  const tab = TABS.find((x) => x.status === query.tab) ?? TABS[0];
  const done = query.done;

  const accepted = campaign.applications.filter(
    (a) => a.status === "accepted",
  ).length;
  const full = accepted >= campaign.clipsCount;
  const shown = campaign.applications.filter((a) => a.status === tab.status);
  const orderFor = (creatorId: string) =>
    orders.find(
      (o) => o.campaignId === campaign.id && o.creatorId === creatorId,
    )?.id;
  const hired = orders.filter((o) => o.campaignId === campaign.id);
  const product = products.find((p) => p.id === campaign.productId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={f.pick(campaign.title)}
        back={{ href: "/campaigns", label: t("campaignsPage.title") }}
      >
        <Badge tone={campaignTone[campaign.status]}>
          {t(`status.campaign.${campaign.status}`)}
        </Badge>
      </PageHeader>

      {done === "paid" && <Notice>{t("campaignDetail.donePaid")}</Notice>}
      {done === "published" && (
        <Notice>{t("campaignDetail.donePublished")}</Notice>
      )}
      {done === "draftSaved" && (
        <Notice>{t("campaignDetail.doneDraftSaved")}</Notice>
      )}
      {campaign.status === "draft" && (
        <Notice
          tone="info"
          action={
            <form action={publishCampaign.bind(null, campaign.id)}>
              <Button type="submit" variant="primary">
                {t("campaignDetail.publish")}
              </Button>
            </form>
          }
        >
          {t("campaignDetail.draftNote")}
        </Notice>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="font-medium">{t("campaignDetail.brief")}</h2>
            <p className="max-w-prose text-text-muted">
              {f.pick(campaign.brief)}
            </p>
          </Card>

          {hired.length > 0 && (
            <section aria-labelledby="creators-title">
              <SectionHeader
                id="creators-title"
                title={t("campaignDetail.creatorsTitle")}
              />
              <Card>
                <ul className="divide-y divide-border">
                  {hired.map((order) => (
                    <OrderRow key={order.id} order={order} i18n={i18n} lead="creator" />
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {campaign.applications.length > 0 && (
            <section
              aria-labelledby="applicants-title"
              className="flex flex-col gap-4"
            >
              <SectionHeader
                id="applicants-title"
                title={t("campaignDetail.applicantsTitle")}
              />
              <>
                <FilterTabs
                  label={t("campaignDetail.applicantsTitle")}
                  tabs={TABS.map((x) => ({
                    href: `/campaigns/${campaign.id}?tab=${x.status}`,
                    label: t(x.label),
                    count: f.number(
                      campaign.applications.filter((a) => a.status === x.status)
                        .length,
                    ),
                    active: x.status === tab.status,
                  }))}
                />
                {tab.status === "pending" && full && shown.length > 0 && (
                  <Notice tone="info">{t("campaignDetail.slotsFull")}</Notice>
                )}
                {shown.length > 0 ? (
                  <Card>
                    <ul className="divide-y divide-border">
                      {shown.map((application) => (
                        <ApplicantRow
                          key={application.creatorId}
                          campaignId={campaign.id}
                          application={application}
                          canAccept={!full}
                          orderId={orderFor(application.creatorId)}
                          i18n={i18n}
                        />
                      ))}
                    </ul>
                  </Card>
                ) : (
                  <Card className="p-5 text-text-muted">{t(tab.empty)}</Card>
                )}
              </>
            </section>
          )}
        </div>

        <Card className="flex flex-col gap-4 p-5 md:sticky md:top-24">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <div>
              <dt className="text-small text-text-muted">
                {t("campaignDetail.budget")}
              </dt>
              <dd className="text-h3 font-medium tabular-nums">
                {f.money(campaign.budget)}
              </dd>
            </div>
            {product && (
              <div>
                <dt className="text-small text-text-muted">
                  {t("campaignDetail.product")}
                </dt>
                <dd className="font-medium">{f.pick(product.name)}</dd>
              </div>
            )}
            <div>
              <dt className="text-small text-text-muted">
                {t("campaignDetail.creatorsTitle")}
              </dt>
              <dd className="font-medium">
                {tp("campaignDetail.creators", hired.length)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-1.5 border-t border-border pt-4">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-surface"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, (campaign.deliveredClips / campaign.clipsCount) * 100)}%`,
                }}
              />
            </div>
            <p className="text-small text-text-muted">
              {t("brandHome.clipsProgress", {
                done: f.number(campaign.deliveredClips),
                total: f.number(campaign.clipsCount),
              })}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
