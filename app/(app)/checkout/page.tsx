import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentBrand } from "@/lib/currentBrand";
import { account, productsOf } from "@/lib/data/account";
import { cartOf, priceCart } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";

export default async function CheckoutPage() {
  const { t, f } = await getI18n();
  const brand = await getCurrentBrand();
  const { lines, total } = priceCart(cartOf(brand.id));
  if (lines.length === 0) redirect("/cart");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} back={{ href: "/cart", label: t("checkout.back") }} />
      <CheckoutForm
        creators={lines.map((l) => ({
          id: l.creator.id,
          name: f.pick(l.creator.name),
          subtotal: l.subtotal,
          summary: l.items.map((i) => `${t(`formats.${i.format}`)} × ${f.number(i.quantity)}`).join(t("common.separator")),
        }))}
        products={productsOf(brand.id).map((p) => ({ id: p.id, name: f.pick(p.name) }))}
        total={total}
        balance={account.balance}
      />
    </div>
  );
}
