import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface MacroBarProps {
  label: string;
  grams: number;
  goalGrams: number;
  color: string;
}

export function MacroBar({ label, grams, goalGrams, color }: MacroBarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const progress = Math.max(0, Math.min(1, grams / goalGrams));

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.labelRow}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[typography.caption, { color: colors.textPrimary }]}>
          {Math.round(grams)}g / {goalGrams}g
        </Text>
      </View>
      <View
        style={[
          styles.track,
          { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, marginTop: spacing.xs },
        ]}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: radius.pill,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
  track: { height: 8, overflow: "hidden" },
});
