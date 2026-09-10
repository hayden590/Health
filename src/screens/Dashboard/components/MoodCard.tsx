import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardCardShell } from "./DashboardCardShell";
import { useTheme } from "@/theme/useTheme";
import type { MoodLevel } from "@/types";

const MOODS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: "😞", label: "Rough" },
  { level: 2, emoji: "😕", label: "Meh" },
  { level: 3, emoji: "🙂", label: "Okay" },
  { level: 4, emoji: "😄", label: "Good" },
  { level: 5, emoji: "🤩", label: "Great" },
];

interface MoodCardProps {
  level: MoodLevel | null;
  onSelect: (level: MoodLevel) => void;
}

export function MoodCard({ level, onSelect }: MoodCardProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <DashboardCardShell icon="happy" accentColor={colors.mood} title="Mood check-in">
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {level ? `Feeling ${MOODS.find((m) => m.level === level)?.label.toLowerCase()} today` : "How are you feeling?"}
      </Text>
      <View style={styles.row}>
        {MOODS.map((mood) => {
          const selected = mood.level === level;
          return (
            <Pressable
              key={mood.level}
              onPress={() => onSelect(mood.level)}
              style={[
                styles.moodButton,
                {
                  borderRadius: radius.pill,
                  backgroundColor: selected ? `${colors.mood}26` : "transparent",
                  borderWidth: selected ? 1.5 : 0,
                  borderColor: colors.mood,
                },
              ]}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </DashboardCardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  moodButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22 },
});
