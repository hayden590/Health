import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import type { Habit } from "@/types";

const HABIT_CATEGORY = "habit-reminder";
const BEDTIME_CATEGORY = "bedtime-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Parses "7:00 AM" / "21:30" into 24-hour parts. */
export function parseTimeLabel(label: string): { hour: number; minute: number } | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  return { hour, minute };
}

async function cancelByCategory(category: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.category === category)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Re-schedules one daily reminder per habit that has a reminder time set.
 * Cancels the previous batch first so edits and deletions don't leave orphans.
 */
export async function syncHabitReminders(habits: Habit[]): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelByCategory(HABIT_CATEGORY);

  for (const habit of habits) {
    if (!habit.reminderTime) continue;
    const time = parseTimeLabel(habit.reminderTime);
    if (!time) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.emoji} ${habit.name}`,
        body: "Time to check this one off for today.",
        data: { category: HABIT_CATEGORY, habitId: habit.id },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
  }
}

export async function scheduleBedtimeReminder(timeLabel: string): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelByCategory(BEDTIME_CATEGORY);
  const time = parseTimeLabel(timeLabel);
  if (!time) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌙 Wind-down time",
      body: "Start winding down to protect tomorrow's sleep score.",
      data: { category: BEDTIME_CATEGORY },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  });
}

export async function cancelBedtimeReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelByCategory(BEDTIME_CATEGORY);
}
