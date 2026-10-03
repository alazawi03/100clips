import Image from "next/image";
import Link from "next/link";
import { AppWindow, ImageOff, MapPin, Package, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Product, ProductType } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

const typeIcon: Record<ProductType, LucideIcon> = { physical: Package, app: AppWindow, service: Sparkles, venue: MapPin };

export function ProductCard({ product, i18n }: { product: Product; i18n: I18n }) {
  const { t, f } = i18n;
  const name = f.pick(product.name);
  const Icon = typeIcon[product.details.type];
  const meta =
    product.details.type === "venue"
      ? [t(`productForm.venueKinds.${product.details.kind}`), product.details.location].filter(Boolean).join(t("common.separator"))
      : product.price !== undefined
        ? f.money(product.price)
        : undefined;

  return (
    <Link href={`/brands/products/${product.id}/edit`} aria-label={t("brandsPage.editProduct", { name })} className="group block h-full rounded-[var(--radius-xl)]">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 group-hover:shadow-lift">
        <div className="relative aspect-[4/3] bg-surface">
          {product.photos[0] ? (
            <Image src={product.photos[0]} alt="" fill unoptimized className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-text-muted">
              <ImageOff aria-hidden className="size-7" strokeWidth={1.5} />
            </span>
          )}
          <span className="absolute start-3 top-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-card/95 px-3 text-small font-medium shadow-soft">
            <Icon aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
            {t(`productForm.types.${product.details.type}`)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="font-medium">{name}</p>
          {meta && <p className="text-small text-text-muted">{meta}</p>}
          {product.benefits[0] && <p className="mt-1 line-clamp-1 text-small text-text-muted">{product.benefits.join(t("common.separator"))}</p>}
        </div>
      </Card>
    </Link>
  );
}
