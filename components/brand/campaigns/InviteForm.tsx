"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Check, Compass, ListChecks, LoaderCircle } from "lucide-react";
import { inviteToCampaign, type CheckoutState } from "@/app/actions/brand";
import { PaymentFields } from "@/components/brand/cart/PaymentFields";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Form";
import { FormatLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import type { ContentFormat } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { PaymentSuccess } from "./PaymentSuccess";

export type InviteCreator = {
  id: string;
  name: string;
  city: string;
  inCampaign: boolean;
  packages: Array<{ format: ContentFormat; label: string; price: number }>;
};

type Props = {
  campaignId: string;
  lists: Array<{ id: string; name: string; creators: InviteCreator[] }>;
  /** Coming from creator cards or a profile (?creators=): just these creators, already ticked. */
  preset?: InviteCreator[];
  initialListId?: string;
  /** Coming from a list's "Invite to campaign" (?list=): its members start ticked. */
  tickList?: boolean;
  balance: number;
};

const REDIRECT_MS = 3000;

/**
 * Pick who to invite (from a list, all or some, or the one creator from their profile), choose each
 * creator's package (one video in one format), and pay up front. Then the success screen, then the campaign.
 */
export function InviteForm({ campaignId, lists, preset, initialListId, tickList, balance }: Props) {
  const { t, tp, locale } = useI18n();
  const f = createFormatters(locale);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(inviteToCampaign.bind(null, campaignId), null);
  const [listId, setListId] = useState(initialListId);
  // creatorId → chosen package. Everyone starts on their first package; ticking adds them.
  const [picked, setPicked] = useState<Map<string, ContentFormat>>(() => {
    const start = preset ?? (tickList ? (lists.find((l) => l.id === initialListId)?.creators ?? []) : []);
    return new Map(start.map((c) => [c.id, c.packages[0].format]));
  });
  const [packages, setPackages] = useState<Map<string, ContentFormat>>(() => new Map());
  const [useBalance, setUseBalance] = useState(balance > 0);

  const shown = preset ?? lists.find((l) => l.id === listId)?.creators ?? [];
  const everyone = new Map([...lists.flatMap((l) => l.creators), ...(preset ?? [])].map((c) => [c.id, c]));
  const chosen = [...picked.entries()].map(([id, format]) => ({ creator: everyone.get(id)!, format })).filter((p) => p.creator);
  const total = chosen.reduce((sum, p) => sum + (p.creator.packages.find((o) => o.format === p.format)?.price ?? 0), 0);
  const fromBalance = useBalance ? Math.min(balance, total) : 0;
  const byCard = total - fromBalance;
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const paid = state?.paid;

  useEffect(() => {
    if (!paid) return;
    window.scrollTo({ top: 0 });
    const timer = setTimeout(() => window.location.replace(`/campaigns/${paid.campaignId}`), REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [paid]);

  if (paid) {
    return (
      <PaymentSuccess t={t} tp={tp} creators={paid.creators.map((c) => ({ id: c.id, name: f.pick(c.name) }))}>
        <p className="text-small text-text-muted">{t("checkout.redirecting")}</p>
        <span aria-hidden className="block h-1 w-40 overflow-hidden rounded-full bg-surface">
          <span className="block h-full origin-left bg-primary motion-safe:animate-[fill_3s_linear_both] rtl:origin-right" />
        </span>
        <Link href={`/campaigns/${paid.campaignId}`} replace className={buttonClass("secondary")}>
          {t("checkout.viewCampaign")}
        </Link>
      </PaymentSuccess>
    );
  }

  const packageOf = (c: InviteCreator) => picked.get(c.id) ?? packages.get(c.id) ?? c.packages[0].format;
  const toggle = (c: InviteCreator) =>
    setPicked((m) => {
      const next = new Map(m);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, packageOf(c));
      return next;
    });
  const choosePackage = (c: InviteCreator, format: ContentFormat) => {
    setPackages((m) => new Map(m).set(c.id, format));
    setPicked((m) => new Map(m).set(c.id, format));
  };
  const allPicked = shown.length > 0 && shown.every((c) => picked.has(c.id));

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      {chosen.map((p) => (
        <input key={p.creator.id} type="hidden" name="pick" value={`${p.creator.id}|${p.format}`} />
      ))}

      <div className="flex min-w-0 flex-col gap-6">
        {!preset && (
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-medium">
                <ListChecks aria-hidden className="size-5 text-text-muted" />
                {t("invite.fromList")}
              </h2>
              <Link href="/explore" className="inline-flex items-center gap-1.5 text-small font-medium text-text-muted hover:text-text">
                <Compass aria-hidden className="size-4" />
                {t("invite.browse")}
              </Link>
            </div>
            {lists.length === 0 ? (
              <p className="text-small text-text-muted">{t("invite.noLists")}</p>
            ) : (
              <div role="radiogroup" aria-label={t("invite.chooseList")} className="flex flex-wrap gap-2">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={l.id === listId}
                    onClick={() => setListId(l.id)}
                    className={cn("h-9 rounded-full border px-3 text-small font-medium transition-colors", l.id === listId ? "border-primary bg-primary text-on-primary" : "border-border hover:bg-surface")}
                  >
                    {l.name} <span className="opacity-70">({f.number(l.creators.length)})</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-medium">{t("invite.invitees")}</h2>
            {shown.length > 1 && (
              <label className="flex cursor-pointer items-center gap-2 text-small font-medium">
                <input
                  type="checkbox"
                  checked={allPicked}
                  onChange={() =>
                    setPicked((m) => {
                      const next = new Map(m);
                      for (const c of shown) {
                        if (allPicked) next.delete(c.id);
                        else next.set(c.id, packageOf(c));
                      }
                      return next;
                    })
                  }
                  className="size-4 accent-[var(--primary)]"
                />
                {t("invite.selectAll")}
              </label>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="p-5 text-small text-text-muted">{lists.length ? t("invite.emptyList") : t("invite.noLists")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {shown.map((c) => {
                const on = picked.has(c.id);
                return (
                  <li key={c.id} className={cn("flex flex-col gap-3 px-5 py-4 transition-colors", on && "bg-primary-soft/40")}>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={on} onChange={() => toggle(c)} className="size-5 accent-[var(--primary)]" />
                      <Avatar id={c.id} name={c.name} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block truncate text-small text-text-muted">
                          {c.city}
                          {c.inCampaign && ` · ${t("invite.inCampaign")}`}
                        </span>
                      </span>
                    </label>
                    {/* The package: one video in one format, at the creator's own price. */}
                    <div role="radiogroup" aria-label={`${t("invite.package")} · ${c.name}`} className="flex flex-wrap gap-2 ps-8">
                      {c.packages.map((p) => {
                        const active = packageOf(c) === p.format;
                        return (
                          <button
                            key={p.format}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => choosePackage(c, p.format)}
                            className={cn(
                              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-small transition-colors",
                              active ? "border-primary bg-card font-medium" : "border-border text-text-muted hover:bg-surface",
                            )}
                          >
                            {active && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                            <FormatLogo format={p.format} className="size-3.5" />
                            {p.label}
                            <span className="tabular-nums">{f.money(p.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {err("pick") && (
            <div className="border-t border-border px-5 py-3">
              <FieldError>{err("pick")}</FieldError>
            </div>
          )}
        </Card>

        <Card inert={pending} className="flex flex-col gap-5 p-5 md:p-6">
          <h2 className="text-h2 font-medium">{t("checkout.payment")}</h2>
          <PaymentFields balance={balance} useBalance={useBalance} onUseBalance={setUseBalance} byCard={byCard} err={err} v={(name) => state?.values[name]} />
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
        <p className="font-medium">{tp("invite.selected", chosen.length)}</p>
        {chosen.length > 0 && (
          <ul className="flex flex-col gap-2 text-small">
            {chosen.map((p) => (
              <li key={p.creator.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  {p.creator.name} · {p.creator.packages.find((o) => o.format === p.format)?.label}
                </span>
                <span className="shrink-0 tabular-nums">{f.money(p.creator.packages.find((o) => o.format === p.format)?.price ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between gap-2 border-t border-border pt-3 font-medium">
          <span>{t("cart.total")}</span>
          <span className="tabular-nums">{f.money(total)}</span>
        </div>
        <Button type="submit" variant="hero" aria-busy={pending} disabled={pending || chosen.length === 0} className="w-full disabled:opacity-60">
          {pending ? (
            <>
              <LoaderCircle aria-hidden className="animate-spin" />
              {t("checkout.paying")}
            </>
          ) : byCard > 0 ? (
            t("checkout.pay", { amount: f.money(byCard) })
          ) : (
            t("checkout.payBalance")
          )}
        </Button>
      </Card>
    </form>
  );
}
