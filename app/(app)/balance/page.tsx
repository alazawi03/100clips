import { ArrowDownLeft, ArrowUpRight, Hourglass, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { account, walletTopUps } from "@/lib/data/account";
import { heldAmount } from "@/lib/data/store";
import { getCreator } from "@/lib/data/creators";
import { orders } from "@/lib/data/orders";
import { getI18n } from "@/lib/i18n/server";

type Entry = { id: string; date: string; label: string; type: "topUp" | "hold" | "payment"; amount: number; creatorId?: string };

const typeTone: Record<Entry["type"], BadgeTone> = { topUp: "brand", hold: "warning", payment: "success" };
const typeLabel = { topUp: "walletPage.typeTopUp", hold: "walletPage.typeHold", payment: "walletPage.typePayment" } as const;

export default async function WalletPage() {
  const { t, f } = await getI18n();
  const netSpent = orders.filter((o) => o.status === "approved").reduce((sum, o) => sum + o.amount, 0);
  const netCharged = walletTopUps.reduce((sum, top) => sum + top.amount, 0);

  const entries: Entry[] = [
    ...walletTopUps.map((top) => ({ id: top.id, date: top.date, label: t("walletPage.topUpLabel"), type: "topUp" as const, amount: top.amount })),
    ...orders.map((o) => {
      const creator = getCreator(o.creatorId)!;
      return o.status === "approved"
        ? { id: o.id, date: o.createdAt, label: t("walletPage.paymentLabel", { name: f.pick(creator.name) }), type: "payment" as const, amount: -o.amount, creatorId: o.creatorId }
        : { id: o.id, date: o.createdAt, label: t("walletPage.holdLabel", { title: f.pick(o.title) }), type: "hold" as const, amount: -o.amount, creatorId: o.creatorId };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const typeIcon = { topUp: ArrowDownLeft, hold: Hourglass, payment: ArrowUpRight };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("nav.balance")} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5 md:col-span-1">
          <span className="text-small text-text-muted">{t("walletPage.available")}</span>
          <span className="text-display font-medium tabular-nums">{f.money(account.balance)}</span>
          <Button variant="primary" className="mt-auto w-full">
            <Plus aria-hidden />
            {t("walletPage.topUp")}
          </Button>
        </Card>
        <Card className="flex flex-col gap-2 p-5">
          <span className="text-small text-text-muted">{t("walletPage.reserved")}</span>
          <span className="text-h1 font-medium tabular-nums">{f.money(heldAmount())}</span>
          <p className="text-small text-text-muted">{t("walletPage.reservedHint")}</p>
        </Card>
        <Card className="grid grid-cols-2 divide-x divide-border p-0 rtl:divide-x-reverse md:grid-cols-1 md:divide-x-0 md:divide-y">
          <div className="flex flex-col gap-2 p-5">
            <span className="text-small text-text-muted">{t("walletPage.netCharged")}</span>
            <span className="text-h1 font-medium tabular-nums">{f.money(netCharged)}</span>
          </div>
          <div className="flex flex-col gap-2 p-5">
            <span className="text-small text-text-muted">{t("walletPage.netSpent")}</span>
            <span className="text-h1 font-medium tabular-nums">{f.money(netSpent)}</span>
          </div>
        </Card>
      </div>

      <section aria-labelledby="transactions-title">
        <SectionHeader id="transactions-title" title={t("walletPage.transactions")} />
        <Card>
          <ul className="divide-y divide-border">
            {entries.map((entry) => {
              const Icon = typeIcon[entry.type];
              const creator = entry.creatorId ? getCreator(entry.creatorId) : undefined;
              return (
                <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-4 p-4 sm:px-5">
                  {creator ? (
                    <Avatar id={creator.id} name={f.pick(creator.name)} size="md" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.label}</p>
                    <p className="text-small text-text-muted">{f.date(entry.date)}</p>
                  </div>
                  <Badge tone={typeTone[entry.type]} className="hidden sm:inline-flex">
                    {t(typeLabel[entry.type])}
                  </Badge>
                  <span className="min-w-24 text-end font-medium tabular-nums">{f.signedMoney(entry.amount)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
