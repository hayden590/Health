import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useTheme } from "@/theme/useTheme";
import { useHabitStore } from "@/store/useHabitStore";
import { useHealthStore } from "@/store/useHealthStore";
import { useMoodStore } from "@/store/useMoodStore";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import type { MainTabParamList, RootStackParamList } from "@/navigation/types";

import { ActivityCard } from "./components/ActivityCard";
import { SleepCard } from "./components/SleepCard";
import { NutritionCard } from "./components/NutritionCard";
import { HabitsCard } from "./components/HabitsCard";
import { MoodCard } from "./components/MoodCard";
import { WeeklyTrendCard } from "./components/WeeklyTrendCard";

type DashboardNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<DashboardNavigation>();
  const [refreshing, setRefreshing] = useState(false);

  const habits = useHabitStore((s) => s.habits);
  const loadHabits = useHabitStore((s) => s.load);
  const toggleToday = useHabitStore((s) => s.toggleToday);

  const health = useHealthStore();
  const loadHealth = useHealthStore((s) => s.load);

  const mood = useMoodStore((s) => s.today);
  const loadMood = useMoodStore((s) => s.load);
  const setTodayMood = useMoodStore((s) => s.setTodayMood);

  const nutritionToday = useNutritionStore((s) => s.today);
  const loadNutrition = useNutritionStore((s) => s.load);

  const selections = useOnboardingStore();

  const loadAll = useCallback(async () => {
    await Promise.all([loadHabits(), loadHealth(), loadMood(), loadNutrition()]);
  }, [loadHabits, loadHealth, loadMood, loadNutrition]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadMood();
      loadNutrition();
    }, [loadHabits, loadMood, loadNutrition])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{today}</Text>
        <Text style={[typography.display, { color: colors.textPrimary, marginTop: spacing.xs }]}>
          {greeting()}
        </Text>
      </View>

      <View style={[styles.grid, { marginBottom: spacing.lg }]}>
        {selections.trackActivity && (
          <View style={styles.gridItem}>
            <ActivityCard
              activity={health.todayActivity}
              onPress={() => navigation.navigate("Activity")}
            />
          </View>
        )}
        {selections.trackSleep && (
          <View style={styles.gridItem}>
            <SleepCard sleep={health.todaySleep} onPress={() => navigation.navigate("Sleep")} />
          </View>
        )}
        {selections.trackNutrition && (
          <View style={styles.gridItem}>
            <NutritionCard
              entries={nutritionToday}
              onPress={() => navigation.navigate("Nutrition")}
            />
          </View>
        )}
        {selections.trackHabits && (
          <View style={styles.gridItem}>
            <HabitsCard
              habits={habits}
              onToggle={toggleToday}
              onPress={() => navigation.navigate("Habits")}
            />
          </View>
        )}
      </View>

      {selections.trackMood && (
        <View style={{ marginBottom: spacing.lg }}>
          <MoodCard level={mood?.level ?? null} onSelect={setTodayMood} />
        </View>
      )}

      <WeeklyTrendCard activityTrend={health.activityTrend} sleepTrend={health.sleepTrend} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "47%", flexGrow: 1 },
});
