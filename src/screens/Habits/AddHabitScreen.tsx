import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTheme } from "@/theme/useTheme";
import { useHabitStore } from "@/store/useHabitStore";
import type { HabitColor } from "@/types";
import type { RootStackParamList } from "@/navigation/types";

const EMOJI_OPTIONS = ["💧", "🏃", "🧘", "📖", "🥦", "😴", "✍️", "🚭", "🧹", "🎯", "🙏", "💊"];
const COLOR_OPTIONS: HabitColor[] = ["primary", "sleep", "activity", "nutrition", "mood", "habits"];
const REMINDER_PRESETS = ["7:00 AM", "8:00 AM", "12:00 PM", "6:00 PM", "9:00 PM"];

export function AddHabitScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addHabit = useHabitStore((s) => s.addHabit);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState<HabitColor>("primary");
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [reminder, setReminder] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await addHabit({
      name: name.trim(),
      emoji,
      color,
      targetPerWeek,
      reminderTime: reminder,
    });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        NAME
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            marginBottom: spacing.xl,
          },
        ]}
      />

      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        ICON
      </Text>
      <View style={[styles.wrapRow, { marginBottom: spacing.xl }]}>
        {EMOJI_OPTIONS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[
              styles.emojiButton,
              {
                borderRadius: radius.md,
                backgroundColor: e === emoji ? colors.surfaceAlt : "transparent",
                borderColor: e === emoji ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        COLOR
      </Text>
      <View style={[styles.wrapRow, { marginBottom: spacing.xl }]}>
        {COLOR_OPTIONS.map((c) => {
          const swatch = (colors as unknown as Record<string, string>)[c];
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                {
                  backgroundColor: swatch,
                  borderWidth: c === color ? 3 : 0,
                  borderColor: colors.textPrimary,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        TARGET PER WEEK
      </Text>
      <View style={[styles.stepperRow, { marginBottom: spacing.xl }]}>
        <Pressable
          onPress={() => setTargetPerWeek((n) => Math.max(1, n - 1))}
          style={[styles.stepperButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary }]}>–</Text>
        </Pressable>
        <Text style={[typography.h2, { color: colors.textPrimary, width: 60, textAlign: "center" }]}>
          {targetPerWeek}×
        </Text>
        <Pressable
          onPress={() => setTargetPerWeek((n) => Math.min(7, n + 1))}
          style={[styles.stepperButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary }]}>+</Text>
        </Pressable>
      </View>

      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        DAILY REMINDER (OPTIONAL)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xxl }}>
        <Pressable
          onPress={() => setReminder(null)}
          style={[
            styles.pill,
            {
              borderRadius: radius.pill,
              marginRight: spacing.sm,
              backgroundColor: reminder === null ? colors.surfaceAlt : "transparent",
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>None</Text>
        </Pressable>
        {REMINDER_PRESETS.map((time) => (
          <Pressable
            key={time}
            onPress={() => setReminder(time)}
            style={[
              styles.pill,
              {
                borderRadius: radius.pill,
                marginRight: spacing.sm,
                backgroundColor: reminder === time ? `${colors.accent}26` : "transparent",
                borderColor: reminder === time ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textPrimary }]}>{time}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <PrimaryButton label="Save habit" onPress={onSave} disabled={!canSave} loading={saving} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emojiButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  emojiText: { fontSize: 22 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  stepperRow: { flexDirection: "row", alignItems: "center" },
  stepperButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
});
