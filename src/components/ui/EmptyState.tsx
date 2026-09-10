import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.xl }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 32 },
});
