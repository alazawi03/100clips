"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";

/**
 * Just paid with a card part (checkout, New campaign, inviting creators): the payment opens on the checkout's waiting
 * view (/checkout?payment=, WaitingCheckout), the one page where a checkout's card part is paid, with the order's
 * summary. A new entry in the history, so Back from it comes to this payment step again.
 */
export function ToWaitingCheckout({ paymentId }: { paymentId: string }) {
  const { t } = useI18n();
  useEffect(() => {
    // A full load on purpose: Back then loads this step afresh (filled in from the draft), not this "preparing" screen.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/checkout?payment=${paymentId}`);
  }, [paymentId]);
  return (
    <Card role="status" aria-live="polite" className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <LoaderCircle aria-hidden className="size-8 text-primary motion-safe:animate-spin" strokeWidth={1.5} />
      <p className="font-medium">{t("payment.preparing")}</p>
    </Card>
  );
}
