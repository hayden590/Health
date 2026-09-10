import { Platform } from "react-native";
import type { Habit } from "@/types";

type NotificationsModule = typeof import("expo-notifications");

const HABIT_CATEGORY = "habit-reminder";
const BEDTIME_CATEGORY = "bedtime-reminder";

let cached: NotificationsModule | null | undefined;

/**
 * Loads expo-notifications on first use rather than at import.
 *
 * Importing it eagerly runs DevicePushTokenAutoRegistration, which registers a
 * push-token listener and throws on Android inside Expo Go (SDK 53 removed
 * push there). Reminders are a nice-to-have, so a failure to load degrades to
 * no-ops instead of taking down the whole app at startup.
 */
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;

  if (Platform.OS === "web") {
    cached = null;
    return cached;
  }

  try {
    const module: NotificationsModule = require("expo-notifications");
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = module;
  } catch {
    cached = null;
  }

  return cached;
}

/** Whether reminders can actually be scheduled in this build. */
export function areRemindersAvailable(): boolean {
  return getNotifications() !== null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;

  try {
    const existing = await N.getPermissionsAsync();
    if (existing.granted) return true;

    const requested = await N.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
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

async function cancelByCategory(N: NotificationsModule, category: string): Promise<void> {
  const scheduled = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.category === category)
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Re-schedules one daily reminder per habit that has a reminder time set.
 * Cancels the previous batch first so edits and deletions don't leave orphans.
 */
export async function syncHabitReminders(habits: Habit[]): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  try {
    await cancelByCategory(N, HABIT_CATEGORY);

    for (const habit of habits) {
      if (!habit.reminderTime) continue;
      const time = parseTimeLabel(habit.reminderTime);
      if (!time) continue;

      await N.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji} ${habit.name}`,
          body: "Time to check this one off for today.",
          data: { category: HABIT_CATEGORY, habitId: habit.id },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
        },
      });
    }
  } catch {
    // A reminder that can't be scheduled shouldn't break saving the habit.
  }
}

export async function scheduleBedtimeReminder(timeLabel: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  const time = parseTimeLabel(timeLabel);
  if (!time) return;

  try {
    await cancelByCategory(N, BEDTIME_CATEGORY);
    await N.scheduleNotificationAsync({
      content: {
        title: "🌙 Wind-down time",
        body: "Start winding down to protect tomorrow's sleep score.",
        data: { category: BEDTIME_CATEGORY },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
  } catch {
    // Ignore — reminders are optional.
  }
}

export async function cancelBedtimeReminder(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    await cancelByCategory(N, BEDTIME_CATEGORY);
  } catch {
    // Ignore — reminders are optional.
  }
}
