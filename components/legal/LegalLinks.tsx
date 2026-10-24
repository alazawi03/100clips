import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/cn";

/** The public legal pages (app/(legal)), for the foot of Settings and of the legal pages themselves. */
export async function LegalLinks({ className }: { className?: string }) {
  const { t } = await getI18n();
  const links = [
    { href: "/terms", label: t("legal.terms") },
    { href: "/privacy", label: t("legal.privacy") },
    { href: "/delete-account", label: t("legal.deleteAccount") },
  ];
  return (
    <nav aria-label={t("legal.label")} className={cn("flex flex-wrap gap-x-5 gap-y-2 text-small text-text-muted", className)}>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-text hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
