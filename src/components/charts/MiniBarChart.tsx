import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

export interface MiniBarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface MiniBarChartProps {
  data: MiniBarDatum[];
  color: string;
  height?: number;
}

export function MiniBarChart({ data, color, height = 64 }: MiniBarChartProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const barHeight = Math.max(4, (d.value / max) * height);
        return (
          <View key={i} style={styles.col}>
            <View style={{ height, justifyContent: "flex-end" }}>
              <View
                style={{
                  width: 10,
                  height: barHeight,
                  borderRadius: radius.sm,
                  backgroundColor: d.highlight ? color : `${color}55`,
                }}
              />
            </View>
            <Text
              style={[
                typography.label,
                { color: colors.textTertiary, marginTop: spacing.xs, fontSize: 10 },
              ]}
            >
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  col: { alignItems: "center" },
});
