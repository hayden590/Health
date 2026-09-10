import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "solid" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  variant = "solid",
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          backgroundColor: isGhost ? "transparent" : isOutline ? "transparent" : colors.accent,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: colors.accent,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.accent : colors.onAccent} />
      ) : (
        <Text
          style={[
            typography.bodyMedium,
            { color: isOutline || isGhost ? colors.accent : colors.onAccent },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});
