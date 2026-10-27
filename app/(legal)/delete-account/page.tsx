import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import deleteAccount from "@/content/legal/delete-account";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: legalTitle(legalText(deleteAccount, await getLocale())) };
}

/** How to delete an account (Google Play requires this page for apps with accounts). */
export default async function DeleteAccountPage() {
  return <LegalDocument text={legalText(deleteAccount, await getLocale())} />;
}