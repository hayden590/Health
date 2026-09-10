import { StyleSheet, Text, View } from "react-native";
import { DashboardCardShell } from "./DashboardCardShell";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { useTheme } from "@/theme/useTheme";
import type { ActivitySample } from "@/types";

const STEP_GOAL = 10000;

interface ActivityCardProps {
  activity: ActivitySample | null;
  onPress?: () => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { colors, typography, spacing } = useTheme();
  const steps = activity?.steps ?? 0;
  const progress = steps / STEP_GOAL;

  return (
    <DashboardCardShell icon="walk" accentColor={colors.activity} title="Activity" onPress={onPress}>
      <View style={styles.row}>
        <ProgressRing
          size={64}
          strokeWidth={7}
          progress={progress}
          colorFrom={colors.activity}
          colorTo="#FFC15C"
          trackColor={colors.surfaceAlt}
        />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={[typography.statMedium, { color: colors.textPrimary }]}>
            {steps.toLocaleString()}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>steps today</Text>
        </View>
      </View>
      <View style={[styles.footerRow, { marginTop: spacing.md }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {(activity?.distanceKm ?? 0).toFixed(1)} km
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {activity?.activeMinutes ?? 0} active min
        </Text>
      </View>
    </DashboardCardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
});
