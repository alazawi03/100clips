import { redirect } from "next/navigation";
import { NeedBrandOnArrival } from "@/components/brand/campaigns/NeedBrandDialog";
import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { account, brands, DEMO_TODAY, productsOf } from "@/lib/data/account";
import { cartOf, getCheckoutDefault, priceCart } from "@/lib/data/store";
import { getI18n } from "@/lib/i18n/server";

/** "2026-10-03" → "2026-10-04". */
function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default async function CheckoutPage() {
  const { t, f } = await getI18n();
  const { lines, total } = priceCart(cartOf());
  if (lines.length === 0) redirect("/cart");

  const creators = lines.map((l) => ({
    id: l.creator.id,
    name: f.pick(l.creator.name),
    subtotal: l.subtotal,
    summary: l.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator")),
  }));

  // No brand yet (the address bar, or the last one deleted): the dialog first; "Not now" goes back to the cart.
  if (brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
        <NeedBrandOnArrival then="checkout" back="/cart" />
      </div>
    );
  }

  // Set by "Find creators for this product".
  const start = getCheckoutDefault();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
      <CheckoutForm
        creators={creators}
        brands={brands.map((b) => ({
          id: b.id,
          name: f.pick(b.name),
          logo: b.logo,
          products: productsOf(b.id).map((p) => ({ id: p.id, name: f.pick(p.name), typeLabel: t(`productForm.types.${p.details.type}`), photo: p.photos[0], type: p.details.type, downloadLink: p.details.type === "app" ? p.details.downloadLink : undefined, mapUrl: p.details.type === "venue" ? p.details.mapUrl : undefined, price: p.price !== undefined ? f.money(p.price) : undefined })),
        }))}
        initial={start}
        minDeadline={nextDay(DEMO_TODAY)}
        total={total}
        balance={account.balance}
      />
    </div>
  );
}
