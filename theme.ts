// theme.ts — المصدر الوحيد للقيم
export const APP_NAME = "100clips";

export const gradient = {
  brand: ["#A78BFA", "#6D4AFF"],
  angle: 135,
};

export const colors = {
  light: {
    primary: "#6D4AFF",
    primaryHover: "#5B38F0",
    primarySoft: "#EFEAFF",
    primaryOnSoft: "#4B2FC9",
    onPrimary: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F4F2FA",
    border: "#EEEDF3",
    text: "#14121C",
    textMuted: "#8A8794",
    iconInactive: "#A6A3B3",
    success: "#16A34A",
    successSoft: "#E7F6EC",
    error: "#E5484D",
    errorSoft: "#FDECEC",
    warning: "#F5A524",
    warningSoft: "#FEF4E2",
  },
  dark: {
    primary: "#8B6CFF",
    primaryHover: "#9D82FF",
    primarySoft: "#2A2245",
    primaryOnSoft: "#C9BCFF",
    onPrimary: "#FFFFFF",
    background: "#0E0C14",
    surface: "#1A1724",
    border: "#2A2635",
    text: "#F5F4FA",
    textMuted: "#9A97A6",
    iconInactive: "#6B6878",
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
