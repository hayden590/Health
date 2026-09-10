import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import type { MacroSet, MeasureUnit } from "@/services/openFoodFacts";

interface PortionMacrosProps {
  macros: MacroSet;
  amount: number;
  unit: MeasureUnit;
}

export function PortionMacros({ macros, amount, unit }: PortionMacrosProps) {
  const { colors, typography, spacing, radius } = useTheme();

  const items: { label: string; value: number; color: string }[] = [
    { label: "Protein", value: macros.proteinG, color: colors.nutrition },
    { label: "Carbs", value: macros.carbsG, color: colors.activity },
    { label: "Fat", value: macros.fatG, color: colors.mood },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg },
      ]}
    >
      <Text style={[typography.label, { color: colors.textSecondary }]}>
        {`FOR ${formatAmount(amount)} ${unit.toUpperCase()}`}
      </Text>

      <View style={[styles.calorieRow, { marginTop: spacing.sm }]}>
        <Text style={[typography.display, { color: colors.textPrimary }]}>
          {Math.round(macros.calories)}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
          kcal
        </Text>
      </View>

      <View style={[styles.macroRow, { marginTop: spacing.lg }]}>
        {items.map((item) => (
          <View key={item.label} style={styles.macroItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[typography.statMedium, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              {formatAmount(item.value)}
              <Text style={[typography.caption, { color: colors.textSecondary }]}>g</Text>
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {},
  calorieRow: { flexDirection: "row", alignItems: "baseline" },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroItem: { flex: 1, alignItems: "flex-start" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
