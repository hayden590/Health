import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface SectionHeaderProps {
  title: string;
  action?: string;
  onPressAction?: () => void;
}

export function SectionHeader({ title, action, onPressAction }: SectionHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing.md }]}>
      <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
      {action ? (
        <Text
          onPress={onPressAction}
          style={[typography.bodyMedium, { color: colors.accent }]}
          suppressHighlighting
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
