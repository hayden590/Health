import { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTheme } from "@/theme/useTheme";
import { useHealthStore } from "@/store/useHealthStore";
import { useHabitStore } from "@/store/useHabitStore";
import { useMoodStore } from "@/store/useMoodStore";
import { buildInsights } from "@/utils/insights";
import { lastNDays, weekdayLabel } from "@/utils/date";

export function TrendsScreen() {
  const { colors, typography, spacing, radius } = useTheme();

  const { activityTrend, sleepTrend, loading, hasLoadedOnce, load: loadHealth } = useHealthStore();
  const habits = useHabitStore((s) => s.habits);
  const loadHabits = useHabitStore((s) => s.load);
  const moods = useMoodStore((s) => s.recent);
  const loadMood = useMoodStore((s) => s.load);

  useEffect(() => {
    if (!hasLoadedOnce) loadHealth();
  }, [hasLoadedOnce, loadHealth]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadMood();
    }, [loadHabits, loadMood])
  );

  const insights = useMemo(
    () => buildInsights(activityTrend, sleepTrend, habits, moods),
    [activityTrend, sleepTrend, habits, moods]
  );

  const last14 = lastNDays(14);
  const stepsByDate = new Map(activityTrend.map((a) => [a.date, a.steps]));
  const sleepByDate = new Map(sleepTrend.map((s) => [s.date, s.totalMinutes / 60]));

  const habitRateData = last14.map((date) => {
    const completed = habits.filter((h) => h.completions[date]).length;
    return {
      label: weekdayLabel(date).slice(0, 1),
      value: habits.length === 0 ? 0 : Math.round((completed / habits.length) * 100),
    };
  });

  return (
    <ScreenContainer>
      <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.xl }]}>
        Trends
      </Text>

      {loading && !hasLoadedOnce ? (
        <LoadingState />
      ) : (
        <>
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Insights" />
            {insights.length === 0 ? (
              <Card>
                <EmptyState
                  emoji="🔍"
                  title="Not enough data yet"
                  subtitle="Keep logging for a few more days and patterns will show up here"
                />
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id} style={{ marginBottom: spacing.md }}>
                  <View style={styles.insightRow}>
                    <View
                      style={[
                        styles.emojiWrap,
                        { backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
                      ]}
                    >
                      <Text style={styles.emoji}>{insight.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                        {insight.headline}
                      </Text>
                      <Text
                        style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
                      >
                        {insight.detail}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>

          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Steps · 14 days" />
            <MiniBarChart
              data={last14.map((d) => ({
                label: weekdayLabel(d).slice(0, 1),
                value: stepsByDate.get(d) ?? 0,
              }))}
              color={colors.activity}
              height={80}
            />
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Sleep hours · 14 days" />
            <MiniBarChart
              data={last14.map((d) => ({
                label: weekdayLabel(d).slice(0, 1),
                value: Math.round((sleepByDate.get(d) ?? 0) * 10) / 10,
              }))}
              color={colors.sleep}
              height={80}
            />
          </Card>

          <Card>
            <SectionHeader title="Habit completion · 14 days" />
            {habits.length === 0 ? (
              <EmptyState emoji="🌱" title="No habits to chart yet" />
            ) : (
              <MiniBarChart data={habitRateData} color={colors.habits} height={80} />
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  insightRow: { flexDirection: "row", alignItems: "center" },
  emojiWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22 },
});
