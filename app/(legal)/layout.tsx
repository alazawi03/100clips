import Image from "next/image";
import Link from "next/link";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { LanguageToggle } from "@/components/shell/LanguageToggle";

/** Public pages anyone can open, signed in or not (the Play Store links here): the logo and the language, and links to each other at the foot. */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="laqta" className="rounded-[var(--radius-sm)]">
          <Image src="/laqta-logo-black.svg" alt="" width={2205} height={960} priority className="h-7 w-auto dark:hidden" />
          <Image src="/laqta-logo-white.svg" alt="" width={2205} height={960} priority className="hidden h-7 w-auto dark:block" />
        </Link>
        <LanguageToggle />
      </header>
      {children}
      <footer className="mt-auto border-t border-border pt-6">
        <LegalLinks />
      </footer>
    </div>
  );
}