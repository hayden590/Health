import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTheme } from "@/theme/useTheme";
import { useHabitStore } from "@/store/useHabitStore";
import type { MainTabParamList, RootStackParamList } from "@/navigation/types";
import { HabitListItem } from "./components/HabitListItem";

type HabitsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Habits">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HabitsScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<HabitsNavigation>();

  const habits = useHabitStore((s) => s.habits);
  const loading = useHabitStore((s) => s.loading);
  const hasLoadedOnce = useHabitStore((s) => s.hasLoadedOnce);
  const load = useHabitStore((s) => s.load);
  const toggleDate = useHabitStore((s) => s.toggleDate);

  useEffect(() => {
    if (!hasLoadedOnce) load();
  }, [hasLoadedOnce, load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalStreakDays = habits.reduce((sum, h) => sum + h.currentStreak, 0);

  return (
    <ScreenContainer>
      <View style={[styles.headerRow, { marginBottom: spacing.xl }]}>
        <View>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Habits</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {habits.length} active · {totalStreakDays} combined streak days
          </Text>
        </View>
        <PrimaryButton label="+ Add" onPress={() => navigation.navigate("AddHabit")} />
      </View>

      {loading && !hasLoadedOnce ? (
        <LoadingState />
      ) : habits.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="No habits yet"
          subtitle="Tap + Add to create your first daily habit"
        />
      ) : (
        habits.map((habit) => (
          <HabitListItem
            key={habit.id}
            habit={habit}
            onToggleToday={() => toggleDate(habit.id, new Date().toISOString().slice(0, 10))}
            onPress={() => navigation.navigate("HabitDetail", { habitId: habit.id })}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
});
