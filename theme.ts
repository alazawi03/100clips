// theme.ts — المصدر الوحيد للقيم
export const APP_NAME = "100clips";

export const gradient = {
  brand: ["#FF6FA8", "#FF2E7E"],
  angle: 135,
};

/** Black and white throughout; accent (pink) only for the logo, main actions, counts and the new-clips ring. */
export const colors = {
  light: {
    primary: "#0A0A0A",
    primaryHover: "#262626",
    primarySoft: "#F2F2F2",
    primaryOnSoft: "#0A0A0A",
    onPrimary: "#FFFFFF",
    accent: "#FF2E7E",
    accentSoft: "#FFE4EE",
    onAccent: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F4F4F4",
    border: "#EBEBEB",
    text: "#0A0A0A",
    textMuted: "#737373",
    iconInactive: "#A3A3A3",
    success: "#16A34A",
    successSoft: "#E7F6EC",
    error: "#E5484D",
    errorSoft: "#FDECEC",
    warning: "#F5A524",
    warningSoft: "#FEF4E2",
  },
  dark: {
    primary: "#FAFAFA",
    primaryHover: "#E5E5E5",
    primarySoft: "#333333",
    primaryOnSoft: "#FAFAFA",
    onPrimary: "#171717",
    accent: "#FF4F95",
    accentSoft: "#451A2E",
    onAccent: "#FFFFFF",
    background: "#171717",
    surface: "#2A2A2A",
    border: "#383838",
    text: "#FAFAFA",
    textMuted: "#A3A3A3",
    iconInactive: "#7A7A7A",
    success: "#22C55E",
    successSoft: "#14301F",
    error: "#F2555A",
    errorSoft: "#3A1A1C",
    warning: "#F7B547",
    warningSoft: "#3A2C12",
  },
};

export const fonts = {
  arabic: "Thmanyah Sans",
  latin: "Inter",
  weights: { regular: 400, medium: 500 },
};

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

export const motion = { fast: 120, base: 200, slow: 320 };
