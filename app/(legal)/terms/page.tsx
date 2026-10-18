import { LegalDocument, legalText, legalTitle } from "@/components/legal/LegalDocument";
import { getLocale } from "@/lib/i18n/server";

const FILE = "terms.md";

export async function generateMetadata() {
  return { title: legalTitle(legalText(FILE, await getLocale())) };
}

/** The terms of use, for brands and creators alike (the landing page and the creator app link here). */
export default async function TermsPage() {
  return <LegalDocument text={legalText(FILE, await getLocale())} />;
}
