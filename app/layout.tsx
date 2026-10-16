import type { Metadata } from "next";
import { Readex_Pro } from "next/font/google";
import localFont from "next/font/local";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getI18n } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme";
import { APP_NAME } from "@/theme";
import "./globals.css";

/** Thmanyah Sans for Arabic and Latin (DESIGN.md), regular, medium and bold. License in app/fonts/thmanyah. */
const thmanyah = localFont({
  variable: "--font-thmanyah",
  src: [
    { path: "./fonts/thmanyah/thmanyah-sans-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/thmanyah/thmanyah-sans-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/thmanyah/thmanyah-sans-bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

/** Laqta's fallback font (DESIGN.md). Not preloaded: only downloaded if Thmanyah fails. */
const readex = Readex_Pro({ variable: "--font-readex", subsets: ["arabic", "latin"], preload: false, display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir } = await getI18n();
  const theme = await getTheme();
  return (
    <html lang={locale} dir={dir} data-theme={theme === "system" ? undefined : theme} className={`${thmanyah.variable} ${readex.variable} antialiased`}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
