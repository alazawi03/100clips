import { redirect } from "next/navigation";
import { NeedBrandOnArrival } from "@/components/brand/campaigns/NeedBrandDialog";
import { CheckoutForm } from "@/components/brand/cart/CheckoutForm";
import { WaitingCheckout } from "@/components/brand/cart/WaitingCheckout";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCheckoutStart } from "@/lib/data/checkoutStart";
import { cardOnline, priceCart, shopping } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";
import { nextDay, today } from "@/lib/today";
import { checkoutBrands } from "@/components/brand/cart/checkoutBrands";

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  // Back from BENEFIT's or Gate-E's page: the checkout whose card part is waiting (WaitingCheckout).
  const { payment, renew } = await searchParams;
  if (typeof payment === "string") return <WaitingCheckout paymentId={payment} renew={renew === "1"} />;
  const i18n = await getI18n();
  const { t, f } = i18n;
  const [ws, online] = await Promise.all([shopping(), cardOnline()]);
  const { lines, total } = priceCart(ws);
  if (lines.length === 0) redirect("/cart");

  const creators = lines.map((l) => ({
    id: l.creator.id,
    name: f.pick(l.creator.name),
    subtotal: l.subtotal,
    summary: l.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator")),
  }));

  // No brand yet (the address bar, or the last one deleted): the dialog first; "Not now" goes back to the cart.
  if (ws.brands.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
        <NeedBrandOnArrival then="checkout" back="/cart" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("checkout.title")} subtitle={t("checkout.subtitle")} />
      <CheckoutForm
        creators={creators}
        brands={checkoutBrands(ws, i18n)}
        // Set by "Find creators for this product".
        initial={await getCheckoutStart()}
        minDeadline={nextDay(today())}
        total={total}
        balance={ws.balance}
        cardOnline={online}
      />
    </div>
  );
}
