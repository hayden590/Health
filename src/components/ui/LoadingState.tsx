import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

export function LoadingState({ compact = false }: { compact?: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.container, { paddingVertical: compact ? spacing.md : spacing.xxl }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});
