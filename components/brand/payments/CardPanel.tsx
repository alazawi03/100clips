"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { benefitPage, checkPayment } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";

/** A backup to Gate-E's page telling laqta: how often to ask whether the payment went through. */
const CHECK_MS = 5_000;

/**
 * What Gate-E's page may do in the panel: run, keep its cookies, send its forms (the bank's code step) and open
 * windows or a payment app, but not move laqta's whole tab. It tries to when BENEFIT is picked, which would land the
 * brand on Gate-E's full page to pick BENEFIT again.
 */
const SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-top-navigation-to-custom-protocols";

/**
 * After paying with a card part, when Gate-E is set up: its payment page inside laqta's. Cards (with the bank's
 * code step, which Gate-E shows in its own frame) and BenefitPay are paid right here. BENEFIT's page can't be shown
 * inside another site: picked here, Gate-E's page opens it in the frame, which laqta's frame rule (next.config,
 * FRAMES) stops before BENEFIT is even asked (it allows one opening per payment). The browser tells this page, which
 * then opens BENEFIT's page for the payment in the whole tab (Gate-E's full page if the API can't get it). Any other
 * step the frame can't show goes on in Gate-E's full page. Gate-E brings the brand back to /payments/{id}: inside the
 * frame, that page tells this one; laqta also checks every few seconds, and Gate-E's close button ends here too.
 * The link opens Gate-E's page in the tab if the frame doesn't show it.
 */
export function CardPanel({ url, paymentId }: { url: string; paymentId: string }) {
  const { t } = useI18n();
  // Leaving for BENEFIT's page (or Gate-E's full one): covers the frame's "blocked" page while its address comes.
  const [moving, setMoving] = useState<"benefit" | "gatee">();

  useEffect(() => {
    let leaving = false;
    const go = (to: string) => {
      leaving = true;
      window.location.assign(to);
    };
    const result = () => !leaving && go(`/payments/${paymentId}`);
    const onMessage = (e: MessageEvent) => {
      if (e.origin === new URL(url).origin && e.data?.action === "paymentCancelled") result();
      if (e.origin === window.location.origin && e.data?.type === "laqta:payment-returned") result();
    };
    const onBlocked = async (e: SecurityPolicyViolationEvent) => {
      if (leaving || !e.effectiveDirective.startsWith("frame-src")) return;
      leaving = true;
      const benefit = /benefit-gateway\.bh/.test(e.blockedURI);
      setMoving(benefit ? "benefit" : "gatee");
      go(benefit ? await benefitPage(paymentId).catch(() => url) : url);
    };
    addEventListener("message", onMessage);
    document.addEventListener("securitypolicyviolation", onBlocked);
    const timer = setInterval(async () => {
      const now = await checkPayment(paymentId).catch(() => undefined);
      if (now && now.status !== "pending") result();
    }, CHECK_MS);
    return () => {
      removeEventListener("message", onMessage);
      document.removeEventListener("securitypolicyviolation", onBlocked);
      clearInterval(timer);
    };
  }, [url, paymentId]);

  return (
    <Card className="flex flex-col gap-4 overflow-hidden px-0 pb-4 pt-5">
      <div className="flex flex-col gap-1 px-5">
        <h2 className="text-h2 font-medium">{t("payment.panelTitle")}</h2>
        <p className="text-text-muted">{t("payment.panelBody")}</p>
      </div>
      <div className="relative">
        <iframe src={url} title={t("payment.panelTitle")} allow="payment" sandbox={SANDBOX} className="h-[720px] w-full border-0 bg-surface" />
        {moving && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface text-center">
            <LoaderCircle aria-hidden className="size-8 text-primary motion-safe:animate-spin" strokeWidth={1.5} />
            <p className="font-medium">{t(moving === "benefit" ? "payment.toBenefit" : "payment.toGatee")}</p>
          </div>
        )}
      </div>
      <p className="px-5 text-small text-text-muted">
        {t("payment.panelTrouble")}{" "}
        <a href={url} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("payment.openPage")}
        </a>
      </p>
    </Card>
  );
}
