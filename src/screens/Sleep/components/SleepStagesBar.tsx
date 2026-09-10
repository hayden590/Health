import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import type { SleepStageBreakdown } from "@/types";

interface StageRow {
  key: keyof SleepStageBreakdown;
  label: string;
  color: string;
}

interface SleepStagesBarProps {
  stages: SleepStageBreakdown;
}

export function SleepStagesBar({ stages }: SleepStagesBarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const total = Math.max(
    1,
    stages.lightMinutes + stages.deepMinutes + stages.remMinutes + stages.awakeMinutes
  );

  const rows: StageRow[] = [
    { key: "deepMinutes", label: "Deep", color: colors.sleep },
    { key: "remMinutes", label: "REM", color: "#C3B6FF" },
    { key: "lightMinutes", label: "Light", color: `${colors.sleep}66` },
    { key: "awakeMinutes", label: "Awake", color: colors.textTertiary },
  ];

  return (
    <View>
      <View style={[styles.bar, { borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }]}>
        {rows.map((row) => {
          const width = (stages[row.key] / total) * 100;
          if (width <= 0) return null;
          return (
            <View key={row.key} style={{ width: `${width}%`, backgroundColor: row.color }} />
          );
        })}
      </View>
      <View style={[styles.legend, { marginTop: spacing.md }]}>
        {rows.map((row) => (
          <View key={row.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              {row.label} {Math.round(stages[row.key])}m
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", height: 14, overflow: "hidden" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
