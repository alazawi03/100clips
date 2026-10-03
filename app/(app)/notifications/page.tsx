import { Placeholder } from "@/components/shell/Placeholder";
import { getI18n } from "@/lib/i18n/server";

export default async function NotificationsPage() {
  const { t } = await getI18n();
  return <Placeholder title={t("nav.notifications")} section={6} />;
}
