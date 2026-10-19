"use client";

import { CreditCard } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * After paying with a card part, when Gate-E is set up: opens its payment page straight away, with a
 * button in case the browser doesn't follow. replace() keeps the form out of history; Gate-E sends the
 * brand back to /payments/{id}.
 */
export function CardRedirect({ url }: { url: string }) {
  const { t } = useI18n();
  useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return (
    <Card role="status" className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <CreditCard aria-hidden className="size-10 text-primary" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-medium">{t("payment.toGateeTitle")}</h2>
        <p className="text-text-muted">{t("payment.toGateeBody")}</p>
      </div>
      <a href={url} className={buttonClass("primary")}>
        {t("payment.continue")}
      </a>
    </Card>
  );
}
