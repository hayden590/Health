import { useColorScheme } from "react-native";
import { lightColors, darkColors, type ThemeColors } from "./colors";
import { spacing, radius, typography } from "./spacing";
import { useThemeStore } from "@/store/useThemeStore";

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
}

export function useTheme(): Theme {
  const preference = useThemeStore((s) => s.preference);
  const systemScheme = useColorScheme();

  const isDark = preference === "system" ? systemScheme === "dark" : preference === "dark";

  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    isDark,
  };
}
