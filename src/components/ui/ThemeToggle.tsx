import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";
import { useThemeStore, type ThemePreference } from "@/store/useThemeStore";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICON: Record<ThemePreference, keyof typeof Ionicons.glyphMap> = {
  system: "phone-portrait-outline",
  light: "sunny-outline",
  dark: "moon-outline",
};

export function ThemeToggle() {
  const { colors, radius } = useTheme();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <Pressable
      onPress={() => setPreference(NEXT[preference])}
      hitSlop={8}
      accessibilityLabel={`Theme: ${preference}. Tap to change.`}
      style={[
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill },
      ]}
    >
      <Ionicons name={ICON[preference]} size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
