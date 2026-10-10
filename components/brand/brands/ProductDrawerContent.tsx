"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, MapPin, Pencil, Search } from "lucide-react";
import { hireForProduct } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ProductView } from "./productView";

/** Everything about one product, shown in the drawer: gallery, details, and the campaigns that use it. */
export function ProductDrawerContent({ product }: { product: ProductView }) {
  const { t } = useI18n();
  const [photo, setPhoto] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      {product.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-surface">
            <Image src={product.photos[photo]} alt="" fill unoptimized className="object-cover" />
          </div>
          {product.photos.length > 1 && (
            <ul className="flex gap-2 overflow-x-auto">
              {product.photos.map((src, i) => (
                <li key={src + i}>
                  <button
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={t("productDrawer.showPhoto", { n: i + 1 })}
                    aria-current={i === photo}
                    className={cn("relative block size-14 overflow-hidden rounded-[var(--radius-md)] bg-surface ring-2", i === photo ? "ring-primary" : "ring-transparent")}
                  >
                    <Image src={src} alt="" fill unoptimized className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{product.typeLabel}</Badge>
          {product.price && <span className="font-medium tabular-nums">{product.price}</span>}
        </div>
        <h3 className="text-h2 font-medium">{product.name}</h3>
        {product.description && <p className="text-text-muted">{product.description}</p>}
        {product.link && (
          <a href={product.link} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-small font-medium text-primary hover:underline">
            <ExternalLink aria-hidden className="size-4" />
            <bdi dir="ltr">{product.link.replace(/^https?:\/\//, "")}</bdi>
          </a>
        )}
        {product.mapUrl && (
          <a href={product.mapUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-small font-medium text-primary hover:underline">
            <MapPin aria-hidden className="size-4" />
            {t("productDrawer.openMap")}
          </a>
        )}
      </div>

      {product.info.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[var(--radius-lg)] bg-surface p-4 text-small">
          {product.info.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-text-muted">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {product.benefits.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="font-medium">{t("productDrawer.benefits")}</h4>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-text-muted">
            {product.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {product.concerns.length > 0 && (
        <section className="flex flex-col gap-3">
          <h4 className="font-medium">{t("productDrawer.concerns")}</h4>
          <dl className="flex flex-col gap-3">
            {product.concerns.map((c, i) => (
              <div key={i}>
                <dt className="font-medium">{c.question}</dt>
                <dd className="text-text-muted">{c.answer ?? t("productDrawer.noAnswer")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h4 className="font-medium">{t("productDrawer.campaigns")}</h4>
        {product.campaigns.length > 0 ? (
          <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border">
            {product.campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-surface/60">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.title}</span>
                    <span className="block text-small text-text-muted">{c.clips}</span>
                  </span>
                  <Badge>{c.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">{t("productDrawer.noCampaigns")}</p>
        )}
      </section>

    </div>
  );
}

/** The drawer's pinned actions: edit the product, or start hiring creators for it. */
export function ProductDrawerFooter({ product }: { product: ProductView }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3">
      <Link href={`/brands/products/${product.id}/edit`} className={buttonClass("secondary")}>
        <Pencil aria-hidden />
        {t("brandsPage.edit")}
      </Link>
      <form action={hireForProduct.bind(null, product.brandId, product.id)} className="flex-1">
        <Button type="submit" variant="primary" className="w-full">
          <Search aria-hidden />
          {t("productDrawer.findCreators")}
        </Button>
      </form>
    </div>
  );
}
