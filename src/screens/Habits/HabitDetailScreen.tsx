import { useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTheme } from "@/theme/useTheme";
import { useHabitStore } from "@/store/useHabitStore";
import type { RootStackParamList } from "@/navigation/types";
import { HeatmapCalendar } from "./components/HeatmapCalendar";
import { todayIso } from "@/utils/date";

export function HabitDetailScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "HabitDetail">>();

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === route.params.habitId));
  const toggleDate = useHabitStore((s) => s.toggleDate);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const accentColor = useMemo(
    () => (habit ? (colors as unknown as Record<string, string>)[habit.color] ?? colors.accent : colors.accent),
    [habit, colors]
  );

  if (!habit) {
    return (
      <ScreenContainer>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Habit not found.</Text>
      </ScreenContainer>
    );
  }

  const completedDays = Object.keys(habit.completions).length;

  const confirmDelete = () => {
    Alert.alert("Archive habit?", `"${habit.name}" will be hidden but its history is kept.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: async () => {
          await removeHabit(habit.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.display, { color: colors.textPrimary }]}>
          {habit.emoji} {habit.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Target {habit.targetPerWeek}× per week{habit.reminderTime ? ` · reminder ${habit.reminderTime}` : ""}
        </Text>
      </View>

      <View style={[styles.statsRow, { marginBottom: spacing.xl }]}>
        <Card style={styles.statCard}>
          <Text style={[typography.statLarge, { color: accentColor }]}>{habit.currentStreak}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>current streak</Text>
        </Card>
        <Card style={[styles.statCard, { marginLeft: spacing.md }]}>
          <Text style={[typography.statLarge, { color: colors.textPrimary }]}>{habit.bestStreak}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>best streak</Text>
        </Card>
        <Card style={[styles.statCard, { marginLeft: spacing.md }]}>
          <Text style={[typography.statLarge, { color: colors.textPrimary }]}>{completedDays}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>total days</Text>
        </Card>
      </View>

      <Card style={{ marginBottom: spacing.xl }}>
        <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.lg }]}>
          History
        </Text>
        <HeatmapCalendar completions={habit.completions} color={accentColor} weeks={26} />
      </Card>

      <PrimaryButton
        label={habit.completedToday ? "Mark as not done today" : "Mark done today"}
        onPress={() => toggleDate(habit.id, todayIso())}
        variant={habit.completedToday ? "outline" : "solid"}
      />

      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton label="Archive habit" onPress={confirmDelete} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row" },
  statCard: { flex: 1, alignItems: "center" },
});
