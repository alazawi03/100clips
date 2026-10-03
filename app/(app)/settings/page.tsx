import { Placeholder } from "@/components/shell/Placeholder";
import { getI18n } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const { t } = await getI18n();
  return <Placeholder title={t("nav.settings")} section={6} />;
}
