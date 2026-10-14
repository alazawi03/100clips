import type { Workspace } from "@/lib/data/live";
import type { I18n } from "@/lib/i18n/server";

/** The account's brands and their products, as checkout's first step lists them. */
export function checkoutBrands(ws: Workspace, { t, f }: I18n) {
  return ws.brands.map((b) => ({
    id: b.id,
    name: f.pick(b.name),
    logo: b.logo,
    products: ws.productsOf(b.id).map((p) => ({
      id: p.id,
      name: f.pick(p.name),
      typeLabel: t(`productForm.types.${p.details.type}`),
      photo: p.photos[0],
      type: p.details.type,
      downloadLink: p.details.type === "app" ? p.details.downloadLink : undefined,
      mapUrl: p.details.type === "venue" ? p.details.mapUrl : undefined,
      price: p.price !== undefined ? f.money(p.price) : undefined,
    })),
  }));
}
