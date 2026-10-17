"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronDown, Copy, ImageOff, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProduct, duplicateProduct } from "@/app/actions/brands";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";
import { ProductDrawerContent, ProductDrawerFooter } from "./ProductDrawerContent";
import type { ProductView } from "./productView";

export type BrandRowView = {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  productsLabel: string;
  products: ProductView[];
};

/** Brands as a stack of accordion cards. Each card slides open into a list of its products. `showId`: a product to open on arrival. */
export function BrandsTable({ brands, openId, showId }: { brands: BrandRowView[]; openId?: string; showId?: string }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(openId ? [openId] : brands.length === 1 ? [brands[0].id] : []));
  const [shownId, setShownId] = useState<string | undefined>(showId);
  const shown = brands.flatMap((b) => b.products).find((p) => p.id === shownId);

  const toggle = (id: string) =>
    setOpen((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
        <ul className="flex flex-col gap-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <BrandCard brand={brand} expanded={open.has(brand.id)} onToggle={() => toggle(brand.id)} onOpenProduct={setShownId} />
            </li>
          ))}
        </ul>

        <Drawer open={!!shown} onClose={() => setShownId(undefined)} title={shown?.name ?? ""} footer={shown && <ProductDrawerFooter product={shown} />}>
          {shown && <ProductDrawerContent product={shown} />}
        </Drawer>
    </>
  );
}

const ease = "duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

function BrandCard({ brand, expanded, onToggle, onOpenProduct }: { brand: BrandRowView; expanded: boolean; onToggle: () => void; onOpenProduct: (id: string) => void }) {
  const { t } = useI18n();
  const panelId = `products-${brand.id}`;
  return (
    <Card className={cn("overflow-hidden transition-colors", ease, expanded && "border-icon-inactive")}>
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={t(expanded ? "brandsPage.collapse" : "brandsPage.expand", { name: brand.name })}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-lg)] p-2 text-start transition-colors hover:bg-surface/70"
        >
          <BrandLogo id={brand.id} name={brand.name} src={brand.logo} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{brand.name}</span>
            <span className="block truncate text-small text-text-muted">
              <span className="sm:hidden">
                {brand.productsLabel}
                {t("common.separator")}
              </span>
              {brand.industry}
            </span>
          </span>
          <span className="hidden sm:block">
            <Badge>{brand.productsLabel}</Badge>
          </span>
          <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-text-muted transition-transform", ease, expanded && "rotate-180")} />
        </button>
        <Link
          href={`/brands/${brand.id}/edit`}
          aria-label={t("brandsPage.editBrand", { name: brand.name })}
          className="grid size-10 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <Pencil aria-hidden className="size-[18px]" />
        </Link>
      </div>

      {/* Animates height with grid rows 0fr → 1fr; inert keeps the hidden list out of tab order. */}
      <div id={panelId} inert={!expanded} className={cn("grid transition-[grid-template-rows]", ease, expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden">
          <div className={cn("border-t border-border transition-opacity", ease, expanded ? "opacity-100" : "opacity-0")}>
            <ProductList brandId={brand.id} products={brand.products} onOpen={onOpenProduct} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** The ⋯ menu: Edit, Duplicate, Delete.  */
function ProductMenu({ product, onPending, className }: { product: ProductView; onPending: (action: () => void) => void; className?: string }) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Dropdown
        align="end"
        triggerLabel={t("brandsPage.moreActions", { name: product.name })}
        triggerClassName={cn("grid size-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-border/60 hover:text-text", className)}
        trigger={<MoreHorizontal aria-hidden className="size-5" />}
        panelClassName="min-w-44"
      >
        {(close) => (
          <ul>
            <li>
              <Link href={`/brands/products/${product.id}/edit`} className={menuItemClass}>
                <Pencil aria-hidden className="size-4" />
                {t("brandsPage.edit")}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  close();
                  onPending(() => duplicateProduct(product.id));
                }}
              >
                <Copy aria-hidden className="size-4" />
                {t("brandsPage.duplicate")}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={cn(menuItemClass, "text-error")}
                onClick={() => {
                  close();
                  setAsking(true);
                }}
              >
                <Trash2 aria-hidden className="size-4" />
                {t("brandsPage.delete")}
              </button>
            </li>
          </ul>
        )}
      </Dropdown>
      <ConfirmDialog
        open={asking}
        title={t("brandsPage.deleteConfirm.title", { name: product.name })}
        body={t("brandsPage.deleteConfirm.body")}
        confirmLabel={t("brandsPage.delete")}
        icon={<Trash2 className="size-6" />}
        onConfirm={() => onPending(() => deleteProduct(product.id))}
        onClose={() => setAsking(false)}
      />
    </>
  );
}

/** A brand's products, one row each. The whole row opens the drawer; the ⋯ menu sits above it. */
function ProductList({ brandId, products, onOpen }: { brandId: string; products: ProductView[]; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <ul className={cn("divide-y divide-border transition-opacity", pending && "opacity-60")}>
      {products.map((product) => (
        <li key={product.id} className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/60">
          <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
            {product.photos[0] ? <Image src={product.photos[0]} alt="" fill unoptimized className="object-cover" /> : <ImageOff aria-hidden className="size-4 text-icon-inactive" strokeWidth={1.5} />}
          </span>
          <div className="min-w-0 flex-1">
            {/* The ::after stretches the button over the row so any click on it opens the drawer. */}
            <button
              type="button"
              onClick={() => onOpen(product.id)}
              aria-label={t("brandsPage.openProduct", { name: product.name })}
              className="block max-w-full truncate text-start font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            >
              {product.name}
            </button>
            <p className="truncate text-small text-text-muted">
              {product.typeLabel}
              <span className="hidden sm:inline">
                {t("common.separator")}
                {product.campaignsLabel}
                {t("common.separator")}
                {product.clipsLabel}
              </span>
            </p>
          </div>
          {product.price && <span className="shrink-0 text-small font-medium tabular-nums">{product.price}</span>}
          <ProductMenu product={product} onPending={startTransition} className="relative z-10" />
        </li>
      ))}
      <li>
        <Link href={`/brands/products/new?brand=${brandId}`} className="flex items-center gap-3 px-4 py-3 font-medium text-primary transition-colors hover:bg-surface/60">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-dashed border-primary/40">
            <Plus aria-hidden className="size-5" />
          </span>
          {products.length === 0 ? t("brandsPage.addFirstProduct") : t("brandsPage.addProduct")}
        </Link>
      </li>
    </ul>
  );
}
