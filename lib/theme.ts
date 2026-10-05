import { cookies } from "next/headers";

/** "system" follows the device; light and dark are the user's own pick. */
export type ThemeChoice = "system" | "light" | "dark";
export const THEME_COOKIE = "theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

export async function getTheme(): Promise<ThemeChoice> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isThemeChoice(value) ? value : "system";
}
