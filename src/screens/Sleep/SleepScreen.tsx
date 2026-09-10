import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTheme } from "@/theme/useTheme";
import { useHealthStore } from "@/store/useHealthStore";
import { minutesToHoursLabel, weekdayLabel } from "@/utils/date";
import { SleepStagesBar } from "./components/SleepStagesBar";

function sleepScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Poor";
}

export function SleepScreen() {
  const { colors, typography, spacing } = useTheme();
  const { todaySleep, sleepTrend, loading, hasLoadedOnce, load } = useHealthStore();

  useEffect(() => {
    if (!hasLoadedOnce) load();
  }, [hasLoadedOnce, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const score = todaySleep?.score ?? 0;
  const avgHours =
    sleepTrend.reduce((sum, s) => sum + s.totalMinutes, 0) / Math.max(1, sleepTrend.length) / 60;

  const trendData = sleepTrend.map((s) => ({
    label: weekdayLabel(s.date).slice(0, 1),
    value: Math.round((s.totalMinutes / 60) * 10) / 10,
  }));

  return (
    <ScreenContainer>
      <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.xl }]}>Sleep</Text>

      {loading && !hasLoadedOnce ? (
        <LoadingState />
      ) : !todaySleep ? (
        <EmptyState emoji="🌙" title="No sleep data for last night" subtitle="Connect a wearable to see sleep stages and trends" />
      ) : (
        <>
          <Card style={{ marginBottom: spacing.lg, alignItems: "center" }}>
            <ProgressRing
              size={140}
              strokeWidth={14}
              progress={score / 100}
              colorFrom={colors.sleep}
              colorTo="#C3B6FF"
              trackColor={colors.surfaceAlt}
            >
              <Text style={[typography.display, { color: colors.textPrimary }]}>{score}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {sleepScoreLabel(score)}
              </Text>
            </ProgressRing>
            <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
              {minutesToHoursLabel(todaySleep.totalMinutes)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {new Date(todaySleep.bedtime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              {"  →  "}
              {new Date(todaySleep.wakeTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </Text>
          </Card>

          {todaySleep.stages && (
            <Card style={{ marginBottom: spacing.lg }}>
              <SectionHeader title="Sleep stages" />
              <SleepStagesBar stages={todaySleep.stages} />
            </Card>
          )}

          <Card>
            <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>14-day trend</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                avg {avgHours.toFixed(1)}h
              </Text>
            </View>
            <MiniBarChart data={trendData} color={colors.sleep} height={80} />
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
