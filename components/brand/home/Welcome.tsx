import Link from "next/link";
import { ArrowRight, Check, ImagePlus, Package, Search, Store } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import type { Brand } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

/**
 * The dashboard before a brand's first campaign: one clear way in (choose creators), how it works in
 * three steps, and what's missing from the brand's setup.
 */
export function Welcome({ brands, productCounts, i18n }: { brands: Brand[]; productCounts: Record<string, number>; i18n: I18n }) {
  const { t, f } = i18n;
  const steps = [
    { title: t("brandHome.step1Title"), body: t("brandHome.step1Body") },
    { title: t("brandHome.step2Title"), body: t("brandHome.step2Body") },
    { title: t("brandHome.step3Title"), body: t("brandHome.step3Body") },
  ];
  // What each brand still lacks before its clips look their best.
  // A brand-new account has no brand yet: that comes first.
  const setup = [
    ...(brands.length === 0 ? [{ key: "brand", label: t("brandHome.setupBrand"), href: "/brands/new", icon: Store }] : []),
    ...brands.flatMap((b) => [
    ...(b.logo ? [] : [{ key: `${b.id}-logo`, label: t("brandHome.setupLogo", { brand: f.pick(b.name) }), href: `/brands/${b.id}/edit`, icon: ImagePlus }]),
    ...((productCounts[b.id] ?? 0) > 0
      ? []
      : [{ key: `${b.id}-product`, label: t("brandHome.setupProduct", { brand: f.pick(b.name) }), href: `/brands/products/new?brand=${b.id}`, icon: Package }]),
    ]),
  ];

  return (
    <Card className="flex flex-col gap-8 p-6 sm:p-8">
      <div className="flex max-w-xl flex-col gap-3">
        <h2 className="text-display font-medium text-balance">{t("brandHome.welcomeTitle")}</h2>
        <p className="text-text-muted">{t("brandHome.welcomeBody")}</p>
        <div className="mt-2">
          <LinkButton href="/explore" variant="hero">
            <Search aria-hidden />
            {t("brandHome.welcomeCta")}
          </LinkButton>
        </div>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-[var(--radius-lg)] bg-surface p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-small font-medium tabular-nums">{f.number(i + 1)}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{s.title}</span>
              <span className="text-small text-text-muted">{s.body}</span>
            </div>
          </li>
        ))}
      </ol>

      {setup.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-small font-medium text-text-muted">{t("brandHome.setupTitle")}</h3>
          <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-lg)] border border-border">
            {setup.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/60">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border">
                    <Check aria-hidden className="size-3.5 text-transparent" />
                  </span>
                  <item.icon aria-hidden className="size-5 shrink-0 text-text-muted" />
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-text-muted rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
