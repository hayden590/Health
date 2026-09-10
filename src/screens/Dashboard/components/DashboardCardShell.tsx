import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/theme/useTheme";

interface DashboardCardShellProps {
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}

export function DashboardCardShell({
  icon,
  accentColor,
  title,
  onPress,
  children,
}: DashboardCardShellProps) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${accentColor}1F`, borderRadius: radius.sm },
          ]}
        >
          <Ionicons name={icon} size={16} color={accentColor} />
        </View>
        <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 150 },
  header: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});
