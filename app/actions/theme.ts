"use server";

import { cookies } from "next/headers";
import { isThemeChoice, THEME_COOKIE } from "@/lib/theme";

/** Remembers the theme for the next page load; the switcher already updated the open page. */
export async function setTheme(theme: string) {
  if (!isThemeChoice(theme)) return;
  const jar = await cookies();
  if (theme === "system") jar.delete(THEME_COOKIE);
  else jar.set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
