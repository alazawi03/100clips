import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import { getLocale } from "@/lib/i18n/server";

const FILE = "privacy-policy.md";

export async function generateMetadata() {
  return { title: legalTitle(legalText(FILE, await getLocale())) };
}

/** The privacy policy, in the site's language (the Play Store and the apps link here). */
export default async function PrivacyPage() {
  return <LegalDocument text={legalText(FILE, await getLocale())} />;
}