import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SearchForm } from "@/components/admin/SearchForm";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { currentBank } from "@/lib/admin/data";
import { brandRows, creatorRows, matches } from "@/lib/admin/users";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const tab = params.tab === "brands" ? "brands" : "creators";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { t, tp, f } = await getI18n();
  const creators = creatorRows().filter((r) => matches(q, r.creator.name.ar, r.creator.name.en, r.creator.handle, r.creator.id));
  const brands = brandRows().filter((r) => matches(q, r.brand.name.ar, r.brand.name.en, r.brand.id, r.owner.name.ar, r.owner.name.en, r.owner.email, r.owner.phone));
  const tabHref = (next: string) => `/admin/users?tab=${next}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.users.title")} subtitle={t("admin.users.subtitle")} />
      <SearchForm action="/admin/users" q={q} placeholder={t("admin.users.search")} keep={{ tab }} />
      <FilterTabs
        label={t("admin.users.tabsLabel")}
        tabs={[
          { href: tabHref("creators"), label: t("admin.users.creators"), count: f.number(creators.length), active: tab === "creators" },
          { href: tabHref("brands"), label: t("admin.users.brands"), count: f.number(brands.length), active: tab === "brands" },
        ]}
      />

      {tab === "creators" ? (
        creators.length === 0 ? (
          <EmptyState title={t("admin.users.empty")} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {creators.map(({ creator, suspended, approved, earned }) => {
                const name = f.pick(creator.name);
                return (
                  <li key={creator.id}>
                    <Link href={`/admin/users/creators/${creator.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-surface sm:px-5">
                      <Avatar id={creator.id} name={name} size="md" />
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="truncate font-medium">{name}</p>
                        <p className="truncate text-small text-text-muted">
                          <bdi dir="ltr">@{creator.handle}</bdi> · {f.pick(creator.city)}
                          {!currentBank(creator.id) && <> · {t("admin.payouts.noBank")}</>}
                        </p>
                      </div>
                      <div className="text-small text-text-muted">
                        <p>{tp("admin.payouts.orders", approved)}</p>
                        <p>{t("admin.users.earned", { amount: f.money(earned) })}</p>
                      </div>
                      <Badge tone={suspended ? "error" : "success"}>{t(suspended ? "admin.users.suspendedBadge" : "admin.users.live")}</Badge>
                      <ChevronLeft aria-hidden className="size-5 rotate-180 text-text-muted rtl:rotate-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : brands.length === 0 ? (
        <EmptyState title={t("admin.users.empty")} />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {brands.map(({ brand, owner, suspended, orders, spent }) => {
              const name = f.pick(brand.name);
              return (
                <li key={brand.id}>
                  <Link href={`/admin/users/brands/${brand.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-surface sm:px-5">
                    <BrandLogo id={brand.id} name={name} src={brand.logo} size="md" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-small text-text-muted">
                        {t(`industries.${brand.industry}`)} · {f.pick(owner.name)} · <bdi dir="ltr">{owner.email}</bdi>
                      </p>
                    </div>
                    <div className="text-small text-text-muted">
                      <p>{tp("admin.users.ordersCount", orders)}</p>
                      <p>{t("admin.users.spent", { amount: f.money(spent) })}</p>
                    </div>
                    <Badge tone={suspended ? "error" : "success"}>{t(suspended ? "admin.users.suspendedBadge" : "admin.users.active")}</Badge>
                    <ChevronLeft aria-hidden className="size-5 rotate-180 text-text-muted rtl:rotate-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
