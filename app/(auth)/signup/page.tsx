import { Placeholder } from "@/components/shell/Placeholder";
import { getI18n } from "@/lib/i18n/server";

export default async function SignupPage() {
  const { t } = await getI18n();
  return <Placeholder title={t("placeholder.signup")} section={2} />;
}
