import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { startChat } from "@/app/actions/messages";
import { Composer } from "@/components/brand/chat/Composer";
import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { conversations } from "@/lib/data/chatApi";
import { creatorProfile } from "@/lib/data/creatorsApi";
import { workspace } from "@/lib/data/live";
import { getI18n } from "@/lib/i18n/server";

/**
 * Writing to a creator for the first time, no order needed. The chat starts with the first message
 * (nothing is made before it, so creators never get an empty chat). With several brands, the brand
 * owner picks which one is writing.
 */
export default async function NewConversationPage({ searchParams }: PageProps<"/messages/new">) {
  const query = await searchParams;
  const creatorId = typeof query.creator === "string" ? query.creator : undefined;
  if (!creatorId) notFound();
  const ws = await workspace();
  const asked = typeof query.brand === "string" ? ws.brands.find((b) => b.id === query.brand) : undefined;
  const brand = asked ?? (ws.brands.length === 1 ? ws.brands[0] : undefined);
  // From "Ask for an ad code" on a clip: the request is ready in the box, to edit or send.
  const asking = query.draft === "adCode" && typeof query.order === "string" ? ws.order(query.order) : undefined;
  const draftOrder = asking?.creatorId === creatorId ? asking : undefined;
  const drafted = draftOrder ? `draft=adCode&order=${draftOrder.id}` : "";
  // Already talking with them as this brand: carry on there.
  const existing = brand && (await conversations()).find((c) => c.brandId === brand.id && c.creatorId === creatorId);
  if (existing) redirect(`/messages/${existing.id}${drafted ? `?${drafted}` : ""}`);
  const profile = await creatorProfile(creatorId);
  if (!profile) notFound();
  const { t, f } = await getI18n();
  const { creator } = profile;
  const name = f.pick(creator.name);
  const draft = draftOrder && t("adCode.requestMessage", { name, title: f.pick(draftOrder.title) });

  return (
    <Card className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden md:h-[calc(100dvh-10rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" aria-label={t("chat.back")} className="grid size-11 place-items-center rounded-full hover:bg-surface md:hidden">
          <ChevronRight aria-hidden className="size-5 rotate-180 rtl:rotate-0" />
        </Link>
        <Link href={`/creators/${creator.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-md)]">
          <Avatar id={creator.id} name={name} src={creator.photo} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{name}</span>
            <bdi dir="ltr" className="block truncate text-small text-text-muted">
              @{creator.handle}
            </bdi>
          </span>
        </Link>
      </header>

      {ws.brands.length > 1 && (
        <nav aria-label={t("chat.writeAs")} className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-small text-text-muted">{t("chat.writeAs")}</span>
          {ws.brands.map((b) => (
            <Link
              key={b.id}
              href={`/messages/new?creator=${creator.id}&brand=${b.id}${drafted && `&${drafted}`}`}
              aria-current={b.id === brand?.id ? "true" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3 text-small",
                b.id === brand?.id ? "border-primary bg-surface font-medium" : "border-border hover:bg-surface",
              )}
            >
              <BrandLogo id={b.id} name={f.pick(b.name)} src={b.logo} size="xs" />
              {f.pick(b.name)}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-text-muted">
        <MessageCircle aria-hidden className="size-10 rtl:-scale-x-100" strokeWidth={1.5} />
        <p className="max-w-sm">{brand ? t("chat.newHint", { name }) : t("chat.pickBrand")}</p>
        {brand && <p className="max-w-sm text-small">{t("chat.newOfferHint")}</p>}
      </div>

      {brand && <Composer key={`${brand.id}-${draft ?? ""}`} send={startChat.bind(null, creator.id, brand.id)} defaultText={draft} />}
    </Card>
  );
}
