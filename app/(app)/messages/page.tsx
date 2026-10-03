import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getI18n } from "@/lib/i18n/server";

export default async function MessagesPage() {
  const { t } = await getI18n();
  return (
    <Card className="grid min-h-[420px] place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <MessageCircle aria-hidden className="size-10 rtl:-scale-x-100" strokeWidth={1.5} />
        <p>{t("chat.pick")}</p>
      </div>
    </Card>
  );
}
