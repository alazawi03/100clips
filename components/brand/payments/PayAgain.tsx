"use client";

import { useState } from "react";
import { payAgain } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Form";

/**
 * Under a waiting payment's panel: the same payment afresh, with its own Gate-E page. BENEFIT allows one try per
 * payment, so after BENEFIT's page this is the way to try BENEFIT again. The API ends the waiting one. `then`: where
 * the new one opens, the checkout's waiting view or the payment page.
 */
export function PayAgain({ paymentId, then }: { paymentId: string; then: "checkout" | "payment" }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setBusy(true);
    setFailed(false);
    try {
      const id = await payAgain(paymentId);
      window.location.assign(then === "checkout" ? `/checkout?payment=${id}` : `/payments/${id}`);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-text-muted">{t("payment.againHint")}</p>
        <Button variant="secondary" onClick={start} disabled={busy} aria-busy={busy} className="shrink-0">
          {t("payment.againButton")}
        </Button>
      </div>
      {failed && <FieldError>{t("payment.againFailed")}</FieldError>}
    </div>
  );
}
