import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import { useTheme } from "@/theme/useTheme";
import type { ActivitySample, SleepSample } from "@/types";
import { lastNDays, weekdayLabel, isToday } from "@/utils/date";

interface WeeklyTrendCardProps {
  activityTrend: ActivitySample[];
  sleepTrend: SleepSample[];
}

export function WeeklyTrendCard({ activityTrend, sleepTrend }: WeeklyTrendCardProps) {
  const { colors, typography, spacing } = useTheme();
  const days = lastNDays(7);

  const stepsByDate = new Map(activityTrend.map((a) => [a.date, a.steps]));
  const sleepByDate = new Map(sleepTrend.map((s) => [s.date, s.score ?? 0]));

  const stepsData = days.map((date) => ({
    label: weekdayLabel(date).slice(0, 1),
    value: stepsByDate.get(date) ?? 0,
    highlight: isToday(date),
  }));

  const sleepData = days.map((date) => ({
    label: weekdayLabel(date).slice(0, 1),
    value: sleepByDate.get(date) ?? 0,
    highlight: isToday(date),
  }));

  const avgSteps = Math.round(
    stepsData.reduce((sum, d) => sum + d.value, 0) / Math.max(1, stepsData.length)
  );
  const avgSleepScore = Math.round(
    sleepData.reduce((sum, d) => sum + d.value, 0) / Math.max(1, sleepData.length)
  );

  return (
    <Card>
      <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
        <Text style={[typography.h3, { color: colors.textPrimary }]}>This week</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          avg {avgSteps.toLocaleString()} steps · sleep {avgSleepScore}
        </Text>
      </View>

      <View style={styles.chartsRow}>
        <View style={styles.chartCol}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            STEPS
          </Text>
          <MiniBarChart data={stepsData} color={colors.activity} />
        </View>
        <View style={[styles.chartCol, { marginLeft: spacing.xl }]}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            SLEEP SCORE
          </Text>
          <MiniBarChart data={sleepData} color={colors.sleep} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  chartsRow: { flexDirection: "row" },
  chartCol: { flex: 1 },
});
