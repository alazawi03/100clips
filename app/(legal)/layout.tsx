import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/shell/LanguageToggle";

/** Public pages anyone can open, signed in or not (the Play Store links here): the logo and the language. */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="100clips" className="rounded-[var(--radius-sm)]">
          <Image src="/100clips-wordmark-on-light.svg" alt="" width={575} height={128} priority className="h-7 w-auto dark:hidden" />
          <Image src="/100clips-wordmark-on-dark.svg" alt="" width={575} height={128} priority className="hidden h-7 w-auto dark:block" />
        </Link>
        <LanguageToggle />
      </header>
      {children}
    </div>
  );
}