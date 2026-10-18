import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import privacy from "@/content/legal/privacy-policy";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: legalTitle(legalText(privacy, await getLocale())) };
}

/** The privacy policy, in the site's language (the Play Store and the apps link here). */
export default async function PrivacyPage() {
  return <LegalDocument text={legalText(privacy, await getLocale())} />;
}