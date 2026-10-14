import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import { getLocale } from "@/lib/i18n/server";

const FILE = "delete-account.md";

export async function generateMetadata() {
  return { title: legalTitle(legalText(FILE, await getLocale())) };
}

/** How to delete an account (Google Play requires this page for apps with accounts). */
export default async function DeleteAccountPage() {
  return <LegalDocument text={legalText(FILE, await getLocale())} />;
}