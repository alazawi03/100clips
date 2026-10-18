import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import terms from "@/content/legal/terms";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: legalTitle(legalText(terms, await getLocale())) };
}

/** The terms of use, for brands and creators alike (the landing page and the creator app link here). */
export default async function TermsPage() {
  return <LegalDocument text={legalText(terms, await getLocale())} />;
}
