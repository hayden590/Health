import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DashboardCardShell } from "./DashboardCardShell";
import { useTheme } from "@/theme/useTheme";
import type { HabitWithStats } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";

interface HabitsCardProps {
  habits: HabitWithStats[];
  onToggle: (id: string) => void;
  onPress?: () => void;
}

export function HabitsCard({ habits, onToggle, onPress }: HabitsCardProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const completed = habits.filter((h) => h.completedToday).length;

  return (
    <DashboardCardShell icon="checkmark-circle" accentColor={colors.habits} title="Habits" onPress={onPress}>
      <Text style={[typography.statMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
        {completed}/{habits.length}
        <Text style={[typography.caption, { color: colors.textSecondary }]}> done today</Text>
      </Text>

      {habits.length === 0 ? (
        <EmptyState emoji="🌱" title="No habits yet" subtitle="Add your first one" />
      ) : (
        <View>
          {habits.slice(0, 4).map((habit) => (
            <Pressable
              key={habit.id}
              onPress={() => onToggle(habit.id)}
              style={[styles.habitRow, { marginBottom: spacing.xs }]}
            >
              <Ionicons
                name={habit.completedToday ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={habit.completedToday ? colors.habits : colors.textTertiary}
              />
              <Text
                numberOfLines={1}
                style={[
                  typography.body,
                  {
                    color: habit.completedToday ? colors.textSecondary : colors.textPrimary,
                    marginLeft: spacing.sm,
                    textDecorationLine: habit.completedToday ? "line-through" : "none",
                    flex: 1,
                  },
                ]}
              >
                {habit.emoji} {habit.name}
              </Text>
              {habit.currentStreak > 1 ? (
                <View
                  style={[
                    styles.streakPill,
                    { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.textSecondary, fontSize: 11 }]}>
                    🔥{habit.currentStreak}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </DashboardCardShell>
  );
}

const styles = StyleSheet.create({
  habitRow: { flexDirection: "row", alignItems: "center" },
  streakPill: { paddingHorizontal: 8, paddingVertical: 2 },
});
