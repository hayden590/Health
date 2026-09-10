import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme/useTheme";

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

interface StreakCelebrationProps {
  message: string | null;
  onDismiss: () => void;
}

export function StreakCelebration({ message, onDismiss }: StreakCelebrationProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    progress.value = withSpring(1, { damping: 14, stiffness: 180 });
    const timer = setTimeout(() => {
      progress.value = withTiming(0, { duration: 220 });
      setTimeout(onDismiss, 240);
    }, 2200);
    return () => clearTimeout(timer);
  }, [message, progress, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -24 }, { scale: 0.96 + progress.value * 0.04 }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <View
        style={[
          styles.banner,
          { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.lg },
        ]}
      >
        <Text style={styles.emoji}>🔥</Text>
        <Text style={[typography.bodyMedium, { color: colors.onAccent, marginLeft: spacing.sm }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    pointerEvents: "none",
  },
  banner: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  emoji: { fontSize: 18 },
});
