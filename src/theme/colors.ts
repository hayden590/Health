export const accent = {
  primary: "#3DD6C4",
  primaryDark: "#22B8A6",
  sleep: "#8B7CF6",
  activity: "#FF8A5C",
  nutrition: "#4FB6F0",
  habits: "#3DD6C4",
  mood: "#F6B93B",
};

export const lightColors = {
  background: "#F6F8F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F3F4",
  border: "#E6EAEB",
  textPrimary: "#12181B",
  textSecondary: "#68767B",
  textTertiary: "#A2AEB2",
  accent: accent.primary,
  accentDark: accent.primaryDark,
  danger: "#F0533D",
  success: "#3DD6C4",
  overlay: "rgba(18, 24, 27, 0.45)",
  ...accent,
};

export const darkColors = {
  background: "#0B0F10",
  surface: "#161C1E",
  surfaceAlt: "#1E2528",
  border: "#262F32",
  textPrimary: "#F4F7F8",
  textSecondary: "#93A1A5",
  textTertiary: "#5C6A6E",
  accent: accent.primary,
  accentDark: accent.primaryDark,
  danger: "#FF6B54",
  success: "#3DD6C4",
  overlay: "rgba(0, 0, 0, 0.6)",
  ...accent,
};

export type ThemeColors = typeof lightColors;
