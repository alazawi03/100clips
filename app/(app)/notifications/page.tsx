import { NotificationList } from "@/components/shell/NotificationBell";
import { notificationRows } from "@/components/shell/notificationRows";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getI18n } from "@/lib/i18n/server";

/** Every update from creators, newest first: the bell's panel in full. Opening it marks them seen. */
export default async function NotificationsPage() {
  const i18n = await getI18n();
  const { rows } = await notificationRows(i18n);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title={i18n.t("notifications.title")} />
      <Card className="overflow-hidden">
        <NotificationList rows={rows} />
      </Card>
    </div>
  );
}
