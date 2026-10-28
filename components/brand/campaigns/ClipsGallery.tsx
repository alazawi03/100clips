"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Download, Users } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";
import type { Clip, OrderStatus } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { ORDER_STATUS, statusOfOrderStatus } from "@/lib/statuses";

type Item = { orderId: string; creatorId: string; name: string; status: OrderStatus; clip: Clip };
const FILTERS = ["all", "delivered", "approved"] as const;

/** Every clip in the campaign in one grid, filtered by creator and status. */
export function ClipsGallery({ items }: { items: Item[] }) {
  const { t, locale, currency } = useI18n();
  const f = createFormatters(locale, currency);
  const [creator, setCreator] = useState("");
  const [status, setStatus] = useState<(typeof FILTERS)[number]>("all");
  const creators = [...new Map(items.map((i) => [i.creatorId, i.name])).entries()];
  const shown = items.filter((i) => (!creator || i.creatorId === creator) && (status === "all" || i.status === status));
  const approved = items.filter((i) => i.status === "approved");

  function downloadApproved() {
    // One link per clip; the browser saves each file.
    for (const { clip } of approved) {
      const a = document.createElement("a");
      a.href = clip.videoSrc;
      a.download = `${clip.id}.mp4`;
      a.click();
    }
  }

  return (
    <section aria-labelledby="clips-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="clips-title" className="text-h2 font-medium">
          {t("campaignDetail.clipsTitle")}
        </h2>
        {approved.length > 0 && (
          <Button variant="secondary" onClick={downloadApproved} className="h-9 md:h-9">
            <Download aria-hidden />
            {t("campaignDetail.downloadApproved", { count: f.number(approved.length) })}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <Card className="p-5 text-text-muted">{t("campaignDetail.noClips")}</Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {creators.length > 1 && (
              <CreatorFilter creators={creators} value={creator} onChange={setCreator} />
            )}
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("campaignDetail.clipsTitle")}>
              {FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cn("h-9 rounded-full border px-3 text-small font-medium transition-colors", status === s ? "border-primary bg-primary text-on-primary" : "border-border hover:bg-surface")}
                >
                  {s === "all" ? t("campaignDetail.allStatuses") : ORDER_STATUS[statusOfOrderStatus(s)].label[locale]}
                </button>
              ))}
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {shown.map((i) => (
              <li key={i.orderId}>
                <Link href={`/orders/${i.orderId}`} className="flex flex-col gap-1.5">
                  <ClipPoster clip={i.clip} views={f.compact(i.clip.views)} duration={f.duration(i.clip.durationSec)} compact />
                  <span className="truncate text-small font-medium">{i.name}</span>
                  <span className="truncate text-caption text-text-muted">{ORDER_STATUS[statusOfOrderStatus(i.status)].label[locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Creator menu for the gallery, each creator with their photo. */
function CreatorFilter({ creators, value, onChange }: { creators: Array<[string, string]>; value: string; onChange: (id: string) => void }) {
  const { t } = useI18n();
  const current = creators.find(([id]) => id === value);
  const allIcon = (size: string) => (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-surface text-text-muted", size)}>
      <Users className="size-3.5" />
    </span>
  );
  return (
    <Dropdown
      align="start"
      panelClassName="w-64"
      triggerLabel={`${t("campaignDetail.allCreators")}: ${current?.[1] ?? t("campaignDetail.allCreators")}`}
      triggerClassName="inline-flex h-9 min-w-40 max-w-64 items-center gap-2 rounded-full border border-border bg-card ps-1 pe-2.5 text-small font-medium transition-colors hover:bg-surface"
      trigger={
        <>
          {current ? <Avatar id={current[0]} name={current[1]} size="xs" /> : allIcon("size-7")}
          <span className="min-w-0 flex-1 truncate text-start">{current?.[1] ?? t("campaignDetail.allCreators")}</span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-text-muted" />
        </>
      }
    >
      {(close) => (
        <ul>
          {[undefined, ...creators].map((c) => {
            const on = c ? c[0] === value : !value;
            return (
              <li key={c?.[0] ?? "all"}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onChange(c?.[0] ?? "");
                    close();
                  }}
                  className={cn(menuItemClass, "text-small", on && "font-medium")}
                >
                  {c ? <Avatar id={c[0]} name={c[1]} size="sm" /> : allIcon("size-8")}
                  <span className="min-w-0 flex-1 truncate">{c?.[1] ?? t("campaignDetail.allCreators")}</span>
                  {on && <Check aria-hidden className="size-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dropdown>
  );
}
