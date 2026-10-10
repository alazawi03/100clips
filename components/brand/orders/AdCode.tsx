"use client";

import { useState } from "react";
import { Check, Copy, Megaphone } from "lucide-react";
import { requestAdCode } from "@/app/actions/messages";
import { useI18n } from "@/components/i18n/I18nProvider";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { cn } from "@/lib/cn";
import type { AdCode as AdCodeData, AdPlatform } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";

type Props = {
  orderId: string;
  /** The clip's platform; only TikTok and Instagram have ad codes. */
  platform: AdPlatform;
  code?: AdCodeData;
  /** yyyy-mm-dd, to tell whether the code has run out. */
  today: string;
};

/**
 * The creator's Spark Ads / Partnership Ads code for this clip, to boost their post as an ad:
 * copy it, see until when it works. Without one (it's optional for creators), ask for it in the chat.
 */
export function AdCode({ orderId, platform, code, today }: Props) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const [copied, setCopied] = useState(false);
  const expired = !!code?.expiresAt && code.expiresAt < today;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border p-3">
      <p className="flex items-center gap-2 text-small font-medium">
        <PlatformLogo platform={platform} className="size-4" />
        {t(`adCode.title.${platform}`)}
      </p>
      {code ? (
        <>
          <div className="flex items-center gap-2">
            <bdi dir="ltr" className={cn("min-w-0 flex-1 truncate rounded-[var(--radius-sm)] bg-surface px-2.5 py-1.5 font-mono text-small", expired && "text-text-muted line-through")}>
              {code.code}
            </bdi>
            <button
              type="button"
              disabled={expired}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard blocked: the code is still there to select by hand.
                }
              }}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
              {copied ? t("adCode.copied") : t("adCode.copy")}
            </button>
          </div>
          {code.expiresAt && (
            <p className={cn("text-caption", expired ? "font-medium text-status-red-text" : "text-text-muted")}>
              {expired ? t("adCode.expired", { date: f.date(code.expiresAt) }) : t("adCode.validUntil", { date: f.date(code.expiresAt) })}
            </p>
          )}
          {expired && <RequestButton orderId={orderId} label={t("adCode.requestNew")} />}
        </>
      ) : (
        <>
          <p className="text-caption text-text-muted">{t("adCode.none")}</p>
          <RequestButton orderId={orderId} label={t("adCode.request")} />
        </>
      )}
    </div>
  );
}

function RequestButton({ orderId, label }: { orderId: string; label: string }) {
  return (
    <form action={requestAdCode.bind(null, orderId)}>
      <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface">
        <Megaphone aria-hidden className="size-4" />
        {label}
      </button>
    </form>
  );
}
