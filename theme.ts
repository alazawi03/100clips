// theme.ts: the single source of design values. Mirrors DESIGN.md (Laqta design system) and app/globals.css.
export const APP_NAME = "laqta";

export const colors = {
  light: {
    primary: "#111111",
    primaryHover: "#2B2B2B",
    onPrimary: "#FFFFFF",
    brand: "#E11D74",
    brandHover: "#C4155F",
    brandSoft: "#FDE7F0",
    brandOnSoft: "#A8104F",
    onBrand: "#FFFFFF",
    link: "#6D4AFF",
    infoSoft: "#EFEAFF",
    infoOnSoft: "#4B2FC9",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    border: "#E5E5E5",
    text: "#111111",
    textMuted: "#6B6B6B",
    iconInactive: "#8E8E8E",
    success: "#15803D",
    successSoft: "#E7F6EC",
    successOnSoft: "#166534",
    warning: "#B45309",
    warningSoft: "#FEF4E2",
    warningOnSoft: "#9A5B00",
    error: "#C42E33",
    errorSoft: "#FDECEC",
  },
  dark: {
    primary: "#FFFFFF",
    primaryHover: "#E5E5E5",
    onPrimary: "#111111",
    brand: "#FF4D94",
    brandHover: "#FF6BA6",
    brandSoft: "#3A1426",
    brandOnSoft: "#FF9EC4",
    onBrand: "#FFFFFF",
    link: "#A78BFA",
    infoSoft: "#2A2245",
    infoOnSoft: "#C9BCFF",
    background: "#111111",
    surface: "#1F1F1F",
    border: "#2E2E2E",
    text: "#FFFFFF",
    textMuted: "#A3A3A3",
    iconInactive: "#6B6B6B",
    success: "#4ADE80",
    successSoft: "#14301F",
    successOnSoft: "#4ADE80",
    warning: "#FBBF24",
    warningSoft: "#3A2C12",
    warningOnSoft: "#FBBF24",
    error: "#F87171",
    errorSoft: "#3A1A1C",
  },
};

export const fonts = {
  sans: ["Thmanyah Sans", "Readex Pro", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
  weights: { regular: 400, medium: 500, bold: 700 },
};

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };
export const motion = { fast: 120, base: 200, slow: 320 };
