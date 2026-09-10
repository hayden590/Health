import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";
import type { NutritionEntry } from "@/types";

interface FoodLogItemProps {
  entry: NutritionEntry;
  onDelete: () => void;
}

export function FoodLogItem({ entry, onDelete }: FoodLogItemProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={[styles.row, { borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm }]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {entry.brand ? `${entry.brand} · ` : ""}
          {Math.round(entry.calories)} kcal · P{Math.round(entry.proteinG)} C{Math.round(entry.carbsG)} F
          {Math.round(entry.fatG)}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={{ padding: spacing.xs }}>
        <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
