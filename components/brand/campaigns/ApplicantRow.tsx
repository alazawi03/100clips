import Link from "next/link";
import { Check, Star, X } from "lucide-react";
import { decideApplication } from "@/app/actions/brand";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { getCreator } from "@/lib/data/creators";
import type { Application } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";

type Props = {
  campaignId: string;
  application: Application;
  /** False when every spot is taken: hide Accept rather than show a disabled button. */
  canAccept: boolean;
  orderId?: string;
  i18n: I18n;
};

export function ApplicantRow({ campaignId, application, canAccept, orderId, i18n }: Props) {
  const { t, f } = i18n;
  const creator = getCreator(application.creatorId)!;
  const name = f.pick(creator.name);

  return (
    <li className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Link href={`/creators/${creator.id}`} className="rounded-full">
          <Avatar id={creator.id} name={name} size="md" ring={creator.hasNewClips ? "new" : undefined} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/creators/${creator.id}`} className="font-medium hover:underline">
            {name}
          </Link>
          <p className="text-small text-text-muted">
            {f.pick(creator.city)}
            {t("common.separator")}
            {t("campaignDetail.appliedOn", { date: f.date(application.appliedAt) })}
          </p>
        </div>
        {creator.rating && (
          <span className="inline-flex shrink-0 items-center gap-1 text-small" aria-label={t("common.rating", { rating: creator.rating })}>
            <Star aria-hidden className="size-4 fill-warning text-warning" />
            {creator.rating.toFixed(1)}
          </span>
        )}
      </div>

      <blockquote className="rounded-[var(--radius-md)] bg-surface px-4 py-3">{f.pick(application.pitch)}</blockquote>

      {application.status === "pending" && (
        <div className="flex flex-wrap justify-end gap-2">
          <form action={decideApplication.bind(null, campaignId, creator.id, "rejected")}>
            <button type="submit" className={buttonClass("destructive")}>
              <X aria-hidden />
              {t("campaignDetail.reject")}
            </button>
          </form>
          {canAccept && (
            <form action={decideApplication.bind(null, campaignId, creator.id, "accepted")}>
              <button type="submit" className={buttonClass("primary")}>
                <Check aria-hidden />
                {t("campaignDetail.accept")}
              </button>
            </form>
          )}
        </div>
      )}
      {application.status === "accepted" && orderId && (
        <div className="flex justify-end">
          <Link href={`/orders/${orderId}`} className={buttonClass("ghost")}>
            {t("campaignDetail.viewOrder")}
          </Link>
        </div>
      )}
    </li>
  );
}
