import { Compass, Plus } from "lucide-react";
import { CartLineEditor } from "@/components/brand/cart/CartLineEditor";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { cartOf, priceCart } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";

export default async function CartPage() {
  const { t, tp, f } = await getI18n();
  const cart = cartOf((await getCurrentBrand()).id);
  const { lines, total } = priceCart(cart);
  const clips = lines.reduce((n, l) => n + l.clips, 0);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("cart.title")} />
        <EmptyState
          title={t("cart.emptyTitle")}
          hint={t("cart.emptyHint")}
          action={
            <LinkButton href="/explore">
              <Compass aria-hidden />
              {t("cart.explore")}
            </LinkButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("cart.title")} subtitle={`${tp("cart.creators", lines.length)}${t("common.separator")}${tp("cart.clips", clips)}`}>
        <LinkButton href="/explore" variant="secondary">
          <Plus aria-hidden />
          {t("cart.addMore")}
        </LinkButton>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
        <Card>
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <CartLineEditor
                key={line.creator.id}
                creatorId={line.creator.id}
                creatorName={f.pick(line.creator.name)}
                location={f.pick(line.creator.city)}
                offers={line.creator.formats}
                quantities={Object.fromEntries(line.items.map((i) => [i.format, i.quantity]))}
              />
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-4 p-5 md:sticky md:top-24">
          <dl className="flex flex-col gap-2 text-small">
            {lines.map((line) => (
              <div key={line.creator.id} className="flex justify-between gap-2">
                <dt className="truncate text-text-muted">{f.pick(line.creator.name)}</dt>
                <dd className="tabular-nums">{f.money(line.subtotal)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-2 border-t border-border pt-2 text-body">
              <dt className="font-medium">{t("cart.total")}</dt>
              <dd className="font-medium tabular-nums">{f.money(total)}</dd>
            </div>
          </dl>
          <LinkButton href="/checkout" variant="hero" className="w-full">
            {t("cart.checkout")}
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
