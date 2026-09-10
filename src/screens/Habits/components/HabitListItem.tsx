import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { CheckButton } from "@/components/ui/CheckButton";
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
        <CheckButton checked={habit.completedToday} color={accentColor} onPress={onToggleToday} />
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
});
