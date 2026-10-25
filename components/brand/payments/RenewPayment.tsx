"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { checkPayment, payAgain } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Form";

/** Payments already being renewed on this page, so a second run of the effect (React's dev double run) doesn't renew twice. */
const renewing = new Set<string>();

/**
 * Back from BENEFIT's (or Gate-E's own) page, which CardPanel marks with ?renew=1. BENEFIT allows one try per payment,
 * so the waiting payment is swapped for a fresh one with its own Gate-E page (the API ends the old one; its card paid
 * after all goes to the balance). Asked first: if it went through, the payment page says so. `then`: the view the new
 * payment opens in. If renewing fails, `children` show (the old payment's panel: cards still work there).
 */
export function RenewPayment({ paymentId, then, children }: { paymentId: string; then: "checkout" | "payment"; children: ReactNode }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (renewing.has(paymentId)) return;
    renewing.add(paymentId);
    (async () => {
      try {
        if ((await checkPayment(paymentId)).status === "paid") return window.location.replace(`/payments/${paymentId}`);
        const id = await payAgain(paymentId);
        window.location.replace(then === "checkout" ? `/checkout?payment=${id}` : `/payments/${id}`);
      } catch {
        renewing.delete(paymentId);
        setFailed(true);
      }
    })();
  }, [paymentId, then]);

  if (failed) {
    return (
      <div className="flex flex-col gap-3">
        <FieldError>{t("payment.againFailed")}</FieldError>
        {children}
      </div>
    );
  }
  return (
    <Card role="status" aria-live="polite" className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <LoaderCircle aria-hidden className="size-8 text-primary motion-safe:animate-spin" strokeWidth={1.5} />
      <p className="font-medium">{t("payment.preparing")}</p>
    </Card>
  );
}
