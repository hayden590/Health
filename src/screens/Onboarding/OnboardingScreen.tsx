import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTheme } from "@/theme/useTheme";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { getHealthDataProvider } from "@/services/health";
import { requestNotificationPermission, scheduleBedtimeReminder } from "@/services/notifications";
import type { OnboardingSelections } from "@/types";
import type { RootStackParamList } from "@/navigation/types";

const PILLARS: { key: keyof OnboardingSelections; label: string; description: string; emoji: string }[] = [
  { key: "trackSleep", label: "Sleep", description: "Stages, duration, and nightly score", emoji: "🌙" },
  { key: "trackActivity", label: "Activity", description: "Steps, workouts, and active minutes", emoji: "🏃" },
  { key: "trackNutrition", label: "Nutrition", description: "Barcode scanning and macros", emoji: "🥦" },
  { key: "trackHabits", label: "Habits", description: "Custom daily habits and streaks", emoji: "✅" },
  { key: "trackMood", label: "Mood", description: "A five-second daily check-in", emoji: "😊" },
];

export function OnboardingScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const selections = useOnboardingStore();
  const setSelections = useOnboardingStore((s) => s.setSelections);
  const complete = useOnboardingStore((s) => s.complete);

  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<string | null>(null);

  const provider = getHealthDataProvider();

  const finish = () => {
    complete();
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  const connectHealth = async () => {
    setConnecting(true);
    try {
      const available = await provider.isAvailable();
      if (!available) {
        setConnectResult(
          Platform.OS === "android"
            ? "Health Connect isn't set up on this device — you can still track everything manually."
            : "No health source found here — you can still track everything manually."
        );
        setSelections({ healthConnected: false });
      } else {
        const permissions = await provider.requestPermissions();
        const granted = Object.values(permissions).some((p) => p === "granted");
        setSelections({ healthConnected: granted });
        setConnectResult(
          granted
            ? "Connected. Your steps, sleep, and workouts will sync automatically."
            : "Permissions were declined — you can grant them later in settings."
        );
      }
    } catch {
      setConnectResult("Couldn't reach the health source — you can retry later in settings.");
    } finally {
      setConnecting(false);
    }
  };

  const enableReminders = async () => {
    const granted = await requestNotificationPermission();
    if (granted) await scheduleBedtimeReminder("9:30 PM");
    finish();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { padding: spacing.xl }]}>
        {step === 0 && (
          <View style={styles.flex}>
            <LinearGradient
              colors={[colors.accent, colors.sleep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { borderRadius: radius.xl }]}
            >
              <Text style={styles.heroEmoji}>🌿</Text>
            </LinearGradient>
            <Text style={[typography.display, { color: colors.textPrimary, marginTop: spacing.xxl }]}>
              Vitalis
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Sleep, activity, nutrition, habits, and mood — tracked together, weighted equally, in one
              calm dashboard.
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.flex}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>What do you want to track?</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl }]}>
              You can change this any time.
            </Text>
            {PILLARS.map((pillar) => {
              const enabled = Boolean(selections[pillar.key]);
              return (
                <Pressable
                  key={pillar.key}
                  onPress={() => setSelections({ [pillar.key]: !enabled })}
                  style={[
                    styles.pillarRow,
                    {
                      borderRadius: radius.md,
                      borderColor: enabled ? colors.accent : colors.border,
                      backgroundColor: enabled ? `${colors.accent}14` : colors.surface,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <Text style={styles.pillarEmoji}>{pillar.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                      {pillar.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {pillar.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={enabled ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={enabled ? colors.accent : colors.textTertiary}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <View style={styles.flex}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>Connect your devices</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              {Platform.OS === "ios"
                ? "Vitalis reads from Apple Health, so anything your Apple Watch or other apps write there flows straight in."
                : "Vitalis reads from Health Connect, which Fitbit, Garmin, Samsung Health and most Android wearables already write into."}
            </Text>

            <View
              style={[
                styles.sourceCard,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.xl },
              ]}
            >
              <Ionicons name="watch" size={28} color={colors.accent} />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginTop: spacing.md }]}>
                {Platform.OS === "ios" ? "Apple Health" : "Health Connect"}
              </Text>
              <Text
                style={[typography.caption, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs }]}
              >
                Steps · Sleep stages · Heart rate · Workouts
              </Text>
            </View>

            {connectResult && (
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg, textAlign: "center" }]}>
                {connectResult}
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.flex}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>Gentle nudges</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Two quiet reminders: one to check off your habits, one to start winding down at 9:30 PM.
              No streak-guilt spam.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={[styles.dots, { marginBottom: spacing.lg }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? colors.accent : colors.border,
                    width: i === step ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {step === 2 ? (
            <>
              <PrimaryButton
                label={selections.healthConnected ? "Connected ✓" : "Connect health data"}
                onPress={connectHealth}
                loading={connecting}
              />
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton label="Continue" variant="ghost" onPress={() => setStep(3)} />
              </View>
            </>
          ) : step === 3 ? (
            <>
              <PrimaryButton label="Enable reminders" onPress={enableReminders} />
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton label="Not now" variant="ghost" onPress={finish} />
              </View>
            </>
          ) : (
            <PrimaryButton label="Continue" onPress={() => setStep(step + 1)} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: "space-between" },
  hero: { height: 180, alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 64 },
  pillarRow: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1 },
  pillarEmoji: { fontSize: 24 },
  sourceCard: { alignItems: "center", padding: 24, borderWidth: StyleSheet.hairlineWidth },
  footer: { paddingTop: 16 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
