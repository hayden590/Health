import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  scroll?: boolean;
}

export function ScreenContainer({ children, scroll = true, style, ...rest }: ScreenContainerProps) {
  const { colors, spacing } = useTheme();

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, padding: spacing.lg }]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        { padding: spacing.lg, paddingBottom: spacing.xxxl },
        style as object,
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
