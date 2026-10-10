import Link from "next/link";
import { Landmark, TriangleAlert } from "lucide-react";
import { RejectWithdrawalButton, SendWithdrawalButton } from "@/components/admin/AdminForms";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { StatCard } from "@/components/admin/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { approvedOn, payouts } from "@/lib/admin/data";
import { owedToCreators } from "@/lib/admin/money";
import { account, brands as accountBrands, DEMO_TODAY } from "@/lib/data/account";
import { expectedArrival, withdrawals } from "@/lib/data/wallet";
import { getCreator } from "@/lib/data/creators";
import { getI18n } from "@/lib/i18n/server";

/** IBAN in groups of four, the way banks print it. */
const spaced = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

export default async function AdminPayoutsPage({ searchParams }: PageProps<"/admin/payouts">) {
  const { t, tp, f } = await getI18n();
  // Just marked paid (from the drawer): confirm it here, since that creator's row is gone.
  const { paid } = await searchParams;
  const justPaid = typeof paid === "string" ? payouts.find((p) => p.id === paid) : undefined;
  const justPaidCreator = justPaid ? getCreator(justPaid.creatorId) : undefined;
  const owed = owedToCreators(DEMO_TODAY);
  const owedAmount = owed.reduce((n, r) => n + r.amount, 0);
  const history = [...payouts].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const paidTotal = payouts.reduce((n, p) => n + p.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("admin.payouts.title")} subtitle={t("admin.payouts.subtitle")} />

      {justPaid && (
        <Notice>
          <span className="block font-medium">
            {t("admin.payouts.doneTitle", { amount: f.money(justPaid.amount), name: justPaidCreator ? f.pick(justPaidCreator.name) : justPaid.creatorId, ref: justPaid.bankRef })}
          </span>
          <span className="block text-small text-text-muted">{t("admin.payouts.doneHint")}</span>
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label={t("admin.stats.owed")} value={f.money(owedAmount)} hint={tp("admin.stats.owedHint", owed.length)} />
        <StatCard label={t("admin.payouts.paidSoFar")} value={f.money(paidTotal)} hint={tp("admin.payouts.transfers", payouts.length)} />
      </div>

      <section aria-labelledby="owed-title">
        <SectionHeader id="owed-title" title={t("admin.payouts.toTransfer")} hint={t("admin.payouts.toTransferHint")} />
        {owed.length === 0 ? (
          <EmptyState title={t("admin.payouts.allPaid")} hint={t("admin.payouts.allPaidHint")} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {owed.map((row) => {
                const creator = getCreator(row.creatorId)!;
                const name = f.pick(creator.name);
                return (
                  <li key={row.creatorId} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
                    <Avatar id={creator.id} name={name} size="md" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium">{name}</p>
                      {row.bank ? (
                        <p className="truncate text-small text-text-muted">
                          {row.bank.bank} · <bdi dir="ltr">{spaced(row.bank.iban)}</bdi>
                        </p>
                      ) : null}
                      {row.bank && row.bankChangedDays !== undefined && (
                        <p className="flex flex-wrap items-center gap-1 text-small font-medium text-warning">
                          <TriangleAlert aria-hidden className="size-4" strokeWidth={1.75} />
                          {t("admin.payouts.bankChangedShort", { days: f.number(row.bankChangedDays) })}
                          <Link href={`/admin/users/creators/${row.creatorId}/support`} className="text-primary hover:underline">
                            {t("admin.support.contact")}
                          </Link>
                        </p>
                      )}
                      {!row.bank && (
                        <p className="flex items-center gap-1 text-small text-warning">
                          <Landmark aria-hidden className="size-4" strokeWidth={1.75} />
                          {t("admin.payouts.noBank")}
                        </p>
                      )}
                    </div>
                    <div className="text-small text-text-muted">
                      <p>{tp("admin.payouts.orders", row.orders.length)}</p>
                      <p>{tp("admin.payouts.waiting", row.waitingDays)}</p>
                    </div>
                    <span className="min-w-24 text-end text-h3 font-medium tabular-nums">{f.money(row.amount)}</span>
                    {row.bank ? (
                      <MarkPaidButton
                        creatorId={row.creatorId}
                        creatorName={name}
                        amount={f.money(row.amount)}
                        bank={row.bank}
                        bankChangedDays={row.bankChangedDays}
                        orders={row.orders.map((o) => ({ id: o.id, title: f.pick(o.title), approvedOn: f.date(approvedOn(o) ?? o.createdAt), amount: f.money(o.amount) }))}
                      />
                    ) : (
                      <Badge tone="warning">{t("admin.payouts.waitingForBank")}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="withdrawals-title">
        <SectionHeader id="withdrawals-title" title={t("admin.withdrawals.title")} hint={t("admin.withdrawals.hint")} />
        {withdrawals.length === 0 ? (
          <EmptyState title={t("admin.withdrawals.empty")} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {withdrawals.map((w) => {
                const arrival = expectedArrival(w);
                // Read fresh: the IBAN is the account's as it is now, until the transfer is sent.
                const bank = w.status === "requested" ? account.bankAccount : undefined;
                const brandNames = accountBrands.map((b) => f.pick(b.name)).join(" · ");
                return (
                  <li key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
                    {accountBrands[0] ? <BrandLogo id={accountBrands[0].id} name={f.pick(accountBrands[0].name)} src={accountBrands[0].logo} size="md" /> : null}
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium">{f.pick(account.name)}</p>
                      <p className="truncate text-small text-text-muted">{brandNames}</p>
                      {w.status === "requested" &&
                        (bank ? (
                          <p className="truncate text-small text-text-muted">
                            <bdi dir="ltr">{bank.holder}</bdi> · <bdi dir="ltr">{spaced(bank.iban)}</bdi>
                          </p>
                        ) : (
                          <p className="flex items-center gap-1 text-small text-warning">
                            <Landmark aria-hidden className="size-4" strokeWidth={1.75} />
                            {t("admin.withdrawals.noBank")}
                          </p>
                        ))}
                    </div>
                    <div className="text-small text-text-muted">
                      <p>{t("admin.withdrawals.requested", { date: f.date(w.requestedAt.slice(0, 10)) })}</p>
                      {w.status === "requested" && <p>{t("admin.withdrawals.arrives", { from: f.date(arrival.from), to: f.date(arrival.to) })}</p>}
                      {w.status === "sent" && (
                        <p>
                          {t("admin.withdrawals.sentOn", { date: f.date((w.sentAt ?? w.requestedAt).slice(0, 10)) })} · <bdi dir="ltr">{w.bankRef}</bdi>
                        </p>
                      )}
                      {w.status === "rejected" && w.note && <p>“{w.note}”</p>}
                    </div>
                    <span className="min-w-24 text-end text-h3 font-medium tabular-nums">{f.money(w.amount)}</span>
                    {w.status === "requested" ? (
                      <div className="flex flex-wrap gap-2">
                        <SendWithdrawalButton id={w.id} amount={f.money(w.amount)} bank={bank} />
                        <RejectWithdrawalButton id={w.id} amount={f.money(w.amount)} />
                      </div>
                    ) : (
                      <Badge tone={w.status === "sent" ? "success" : "neutral"}>{t(`admin.withdrawals.status.${w.status}`)}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="history-title">
        <SectionHeader id="history-title" title={t("admin.payouts.history")} />
        {history.length === 0 ? (
          <EmptyState title={t("admin.payouts.noHistory")} />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-small">
              <thead className="text-text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-start font-normal">{t("admin.payouts.colDate")}</th>
                  <th className="px-3 py-3 text-start font-normal">{t("admin.payouts.colCreator")}</th>
                  <th className="px-3 py-3 text-start font-normal">{t("admin.payouts.colIban")}</th>
                  <th className="px-3 py-3 text-start font-normal">{t("admin.payouts.colRef")}</th>
                  <th className="px-3 py-3 text-end font-normal">{t("admin.payouts.colOrders")}</th>
                  <th className="px-5 py-3 text-end font-normal">{t("admin.payouts.colAmount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((p) => {
                  const creator = getCreator(p.creatorId);
                  return (
                    <tr key={p.id}>
                      <td className="px-5 py-3 whitespace-nowrap">{f.date(p.paidAt.slice(0, 10))}</td>
                      <td className="px-3 py-3 font-medium">{creator ? f.pick(creator.name) : p.creatorId}</td>
                      <td className="px-3 py-3 text-text-muted">
                        {/* Only the last four digits: the full IBAN is on the creator's record. */}
                        <bdi dir="ltr">•••• {p.iban.slice(-4)}</bdi>
                      </td>
                      <td className="px-3 py-3">
                        <bdi dir="ltr">{p.bankRef}</bdi>
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums">{f.number(p.orderIds.length)}</td>
                      <td className="px-5 py-3 text-end font-medium tabular-nums">{f.money(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
