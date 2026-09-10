import { StyleSheet, Text, View } from "react-native";
import { DashboardCardShell } from "./DashboardCardShell";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { useTheme } from "@/theme/useTheme";
import type { SleepSample } from "@/types";
import { minutesToHoursLabel } from "@/utils/date";

interface SleepCardProps {
  sleep: SleepSample | null;
  onPress?: () => void;
}

export function SleepCard({ sleep, onPress }: SleepCardProps) {
  const { colors, typography, spacing } = useTheme();
  const score = sleep?.score ?? 0;

  return (
    <DashboardCardShell icon="moon" accentColor={colors.sleep} title="Sleep" onPress={onPress}>
      <View style={styles.row}>
        <ProgressRing
          size={54}
          strokeWidth={7}
          progress={score / 100}
          colorFrom={colors.sleep}
          colorTo="#C3B6FF"
          trackColor={colors.surfaceAlt}
        >
          <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: "700" }]}>
            {score || "–"}
          </Text>
        </ProgressRing>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text numberOfLines={1} style={[typography.statMedium, { color: colors.textPrimary }]}>
            {sleep ? minutesToHoursLabel(sleep.totalMinutes) : "–"}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>last night</Text>
        </View>
      </View>
      <View style={[styles.footerRow, { marginTop: spacing.md }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Deep {sleep?.stages ? minutesToHoursLabel(sleep.stages.deepMinutes) : "–"}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          REM {sleep?.stages ? minutesToHoursLabel(sleep.stages.remMinutes) : "–"}
        </Text>
      </View>
    </DashboardCardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
});
