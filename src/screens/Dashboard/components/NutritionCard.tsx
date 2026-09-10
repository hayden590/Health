import { StyleSheet, Text, View } from "react-native";
import { DashboardCardShell } from "./DashboardCardShell";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { useTheme } from "@/theme/useTheme";
import type { NutritionEntry } from "@/types";

const CALORIE_GOAL = 2100;

interface NutritionCardProps {
  entries: NutritionEntry[];
  onPress?: () => void;
}

export function NutritionCard({ entries, onPress }: NutritionCardProps) {
  const { colors, typography, spacing } = useTheme();
  const calories = entries.reduce((sum, e) => sum + e.calories, 0);
  const protein = entries.reduce((sum, e) => sum + e.proteinG, 0);

  return (
    <DashboardCardShell icon="nutrition" accentColor={colors.nutrition} title="Nutrition" onPress={onPress}>
      <View style={styles.row}>
        <ProgressRing
          size={64}
          strokeWidth={7}
          progress={calories / CALORIE_GOAL}
          colorFrom={colors.nutrition}
          colorTo="#8FE3FF"
          trackColor={colors.surfaceAlt}
        />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={[typography.statMedium, { color: colors.textPrimary }]}>
            {Math.round(calories)}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            of {CALORIE_GOAL} kcal
          </Text>
        </View>
      </View>
      <View style={[styles.footerRow, { marginTop: spacing.md }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {Math.round(protein)}g protein
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {entries.length} {entries.length === 1 ? "item" : "items"} logged
        </Text>
      </View>
    </DashboardCardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
});
