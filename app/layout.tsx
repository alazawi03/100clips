import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getI18n } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme";
import { APP_NAME } from "@/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** Arabic: Thmanyah Sans, the two weights the design system uses. License in app/fonts/thmanyah. */
const thmanyah = localFont({
  variable: "--font-thmanyah",
  src: [
    { path: "./fonts/thmanyah/thmanyah-sans-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/thmanyah/thmanyah-sans-medium.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
});

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
    <html lang={locale} dir={dir} data-theme={theme === "system" ? undefined : theme} className={`${inter.variable} ${thmanyah.variable} antialiased`}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
