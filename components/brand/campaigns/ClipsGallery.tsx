"use client";

import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClipPoster } from "@/components/ui/ClipPoster";
import { Select } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import type { Clip, OrderStatus } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";

type Item = { orderId: string; creatorId: string; name: string; status: OrderStatus; clip: Clip };
const FILTERS = ["all", "delivered", "submitted", "approved"] as const;

/** Every clip in the campaign in one grid, filtered by creator and status. */
export function ClipsGallery({ items }: { items: Item[] }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
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
              <Select value={creator} onChange={(e) => setCreator(e.target.value)} aria-label={t("campaignDetail.allCreators")} className="h-9 w-auto min-w-40">
                <option value="">{t("campaignDetail.allCreators")}</option>
                {creators.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
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
                  {s === "all" ? t("campaignDetail.allStatuses") : t(`status.order.${s}`)}
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
                  <span className="truncate text-caption text-text-muted">{t(`status.order.${i.status}`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
