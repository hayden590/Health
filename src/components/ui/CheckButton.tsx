import { useEffect } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/useTheme";

interface CheckButtonProps {
  checked: boolean;
  color: string;
  size?: number;
  onPress: () => void;
}

/**
 * Habit check-off control. The spring pop on completion is the app's one
 * deliberate celebratory moment — keep it short so daily use never feels slow.
 */
export function CheckButton({ checked, color, size = 36, onPress }: CheckButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const fill = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(checked ? 1 : 0, { duration: 180 });
  }, [checked, fill]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: fill.value > 0.5 ? color : "transparent",
  }));

  const handlePress = () => {
    if (!checked) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 6, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View
        style={[
          styles.button,
          animatedStyle,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      >
        <Ionicons name="checkmark" size={size * 0.55} color={checked ? colors.onAccent : color} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
