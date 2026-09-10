import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTheme } from "@/theme/useTheme";
import { useHealthStore } from "@/store/useHealthStore";
import { weekdayLabel, lastNDays } from "@/utils/date";

const STEP_GOAL = 10000;

export function ActivityScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { todayActivity, activityTrend, loading, hasLoadedOnce, load } = useHealthStore();

  useEffect(() => {
    if (!hasLoadedOnce) load();
  }, [hasLoadedOnce, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const steps = todayActivity?.steps ?? 0;
  const last7 = lastNDays(7);
  const trendByDate = new Map(activityTrend.map((a) => [a.date, a.steps]));
  const trendData = last7.map((date) => ({
    label: weekdayLabel(date).slice(0, 1),
    value: trendByDate.get(date) ?? 0,
  }));
  const avgSteps = Math.round(trendData.reduce((s, d) => s + d.value, 0) / trendData.length);

  return (
    <ScreenContainer>
      <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.xl }]}>
        Activity
      </Text>

      {loading && !hasLoadedOnce ? (
        <LoadingState />
      ) : !todayActivity ? (
        <EmptyState emoji="🏃" title="No activity data yet" />
      ) : (
        <>
          <Card style={{ marginBottom: spacing.lg, alignItems: "center" }}>
            <ProgressRing
              size={168}
              strokeWidth={14}
              progress={steps / STEP_GOAL}
              colorFrom={colors.activity}
              colorTo="#FFC15C"
              trackColor={colors.surfaceAlt}
            >
              <Text numberOfLines={1} style={[typography.statLarge, { color: colors.textPrimary }]}>
                {steps.toLocaleString()}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                of {STEP_GOAL.toLocaleString()} steps
              </Text>
            </ProgressRing>
          </Card>

          <View style={[styles.statsRow, { marginBottom: spacing.lg }]}>
            <Card style={styles.statCard}>
              <Ionicons name="map" size={18} color={colors.activity} />
              <Text style={[typography.statMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                {todayActivity.distanceKm.toFixed(1)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>km</Text>
            </Card>
            <Card style={[styles.statCard, { marginLeft: spacing.md }]}>
              <Ionicons name="time" size={18} color={colors.activity} />
              <Text style={[typography.statMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                {todayActivity.activeMinutes}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>active min</Text>
            </Card>
            <Card style={[styles.statCard, { marginLeft: spacing.md }]}>
              <Ionicons name="flame" size={18} color={colors.activity} />
              <Text style={[typography.statMedium, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                {todayActivity.activeEnergyKcal}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>kcal</Text>
            </Card>
          </View>

          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.headerRow}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Weekly steps</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                avg {avgSteps.toLocaleString()}
              </Text>
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <MiniBarChart data={trendData} color={colors.activity} height={90} />
            </View>
          </Card>

          <Card>
            <SectionHeader title="Today's workouts" />
            {todayActivity.workouts.length === 0 ? (
              <EmptyState emoji="🧘" title="No workouts logged today" />
            ) : (
              todayActivity.workouts.map((w) => (
                <View
                  key={w.id}
                  style={[
                    styles.workoutRow,
                    { borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm },
                  ]}
                >
                  <View
                    style={[
                      styles.workoutIcon,
                      { backgroundColor: `${colors.activity}1F`, borderRadius: radius.pill },
                    ]}
                  >
                    <Ionicons name="fitness" size={16} color={colors.activity} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{w.type}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {w.durationMinutes} min · {w.energyKcal} kcal
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row" },
  statCard: { flex: 1, alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  workoutRow: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: StyleSheet.hairlineWidth },
  workoutIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
