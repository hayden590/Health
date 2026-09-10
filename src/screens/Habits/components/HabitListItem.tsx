import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/theme/useTheme";
import type { HabitWithStats } from "@/types";
import { HeatmapCalendar } from "./HeatmapCalendar";

interface HabitListItemProps {
  habit: HabitWithStats;
  onToggleToday: () => void;
  onPress: () => void;
}

export function HabitListItem({ habit, onToggleToday, onPress }: HabitListItemProps) {
  const { colors, typography, spacing } = useTheme();
  const accentColor = (colors as unknown as Record<string, string>)[habit.color] ?? colors.accent;

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {habit.emoji} {habit.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            🔥 {habit.currentStreak} day streak · best {habit.bestStreak}
          </Text>
        </View>
        <Pressable
          onPress={onToggleToday}
          hitSlop={10}
          style={[
            styles.checkButton,
            {
              backgroundColor: habit.completedToday ? accentColor : "transparent",
              borderColor: accentColor,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color={habit.completedToday ? "#03211E" : accentColor}
          />
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <HeatmapCalendar completions={habit.completions} color={accentColor} weeks={14} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  titleGroup: { flex: 1, marginRight: 12 },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
