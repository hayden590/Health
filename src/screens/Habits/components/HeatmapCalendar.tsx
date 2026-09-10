import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { addDays, isoWeekStart, todayIso } from "@/utils/date";

interface HeatmapCalendarProps {
  completions: Record<string, boolean>;
  color: string;
  weeks?: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function HeatmapCalendar({ completions, color, weeks = 18 }: HeatmapCalendarProps) {
  const { colors, spacing, typography } = useTheme();

  const today = todayIso();
  const gridStart = addDays(isoWeekStart(today), -7 * (weeks - 1));

  const columns: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(gridStart, w * 7);
    const column: string[] = [];
    for (let d = 0; d < 7; d++) {
      column.push(addDays(weekStart, d));
    }
    columns.push(column);
  }

  const monthMarkers = columns.map((col, i) => {
    if (i === 0) return MONTH_LABELS[new Date(`${col[0]}T12:00:00`).getMonth()];
    const prevMonth = new Date(`${columns[i - 1][0]}T12:00:00`).getMonth();
    const thisMonth = new Date(`${col[0]}T12:00:00`).getMonth();
    return thisMonth !== prevMonth ? MONTH_LABELS[thisMonth] : "";
  });

  return (
    <View>
      <View style={styles.monthRow}>
        {monthMarkers.map((label, i) =>
          // Positioned rather than laid out in flow, so a three-letter month
          // isn't squeezed into the width of one day cell.
          label ? (
            <Text
              key={i}
              numberOfLines={1}
              style={[
                typography.label,
                styles.monthLabel,
                { color: colors.textTertiary, left: i * (CELL_SIZE + CELL_GAP) },
              ]}
            >
              {label}
            </Text>
          ) : null
        )}
      </View>
      <View style={[styles.grid, { marginTop: spacing.xs }]}>
        {columns.map((column, ci) => (
          <View key={ci} style={{ marginRight: CELL_GAP }}>
            {column.map((date) => {
              const isFuture = date > today;
              const completed = Boolean(completions[date]);
              return (
                <View
                  key={date}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: isFuture
                        ? "transparent"
                        : completed
                          ? color
                          : colors.surfaceAlt,
                      opacity: isFuture ? 0 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { height: 12 },
  monthLabel: { fontSize: 9, position: "absolute", top: 0 },
  grid: { flexDirection: "row" },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    marginBottom: CELL_GAP,
  },
});
