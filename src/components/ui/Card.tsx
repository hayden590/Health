import { Pressable, StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/theme/useTheme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, onPress, padded = true, style, ...rest }: CardProps) {
  const { colors, radius, spacing } = useTheme();

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
        },
        style as object,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: "0px 6px 16px rgba(11, 26, 29, 0.04)",
    elevation: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
