import { Compass, Plus } from "lucide-react";
import { NeedBrandButton } from "@/components/brand/campaigns/NeedBrandDialog";
import { CartLineEditor } from "@/components/brand/cart/CartLineEditor";
import { FeeTotal } from "@/components/brand/cart/FeeTotal";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { priceCart, shopping } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";
import { priceForBrand } from "@/lib/fees";

export default async function CartPage() {
  const { t, tp, f } = await getI18n();
  const ws = await shopping();
  const { lines, total } = priceCart(ws);
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <CartLineEditor
              key={line.creator.id}
              creatorId={line.creator.id}
              creatorName={f.pick(line.creator.name)}
              photo={line.creator.photo}
              location={f.pick(line.creator.city)}
              offers={line.creator.formats}
              quantities={Object.fromEntries(line.items.map((i) => [i.format, i.quantity]))}
            />
          ))}
        </ul>

        <Card className="flex flex-col gap-4 p-5 lg:sticky lg:top-24">
          <dl className="flex flex-col gap-2 text-small">
            {lines.map((line) => (
              <div key={line.creator.id} className="flex justify-between gap-2">
                <dt className="truncate text-text-muted">{f.pick(line.creator.name)}</dt>
                <dd className="tabular-nums">{f.money(priceForBrand(line.subtotal))}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-2 border-t border-border pt-2">
              <FeeTotal creatorsTotal={total} />
            </div>
          </dl>
          {/* The order becomes a campaign for one of your brands: no brand yet, the dialog says so first. */}
          <NeedBrandButton hasBrand={ws.brands.length > 0} href="/checkout" then="checkout" variant="hero" className="w-full">
            {t("cart.checkout")}
          </NeedBrandButton>
        </Card>
      </div>
    </div>
  );
}
