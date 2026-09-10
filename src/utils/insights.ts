import type { ActivitySample, HabitWithStats, MoodEntry, SleepSample } from "@/types";

export interface Insight {
  id: string;
  emoji: string;
  headline: string;
  detail: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function percentDelta(high: number, low: number): number {
  if (low === 0) return 0;
  return Math.round(((high - low) / low) * 100);
}

const ACTIVE_DAY_STEPS = 8000;

/**
 * Correlates each pillar against the others over the loaded history window.
 * Every insight needs at least two days on both sides of the split before it
 * is shown, so a brand-new account doesn't get told nonsense.
 */
export function buildInsights(
  activity: ActivitySample[],
  sleep: SleepSample[],
  habits: HabitWithStats[],
  moods: MoodEntry[]
): Insight[] {
  const insights: Insight[] = [];
  const sleepByDate = new Map(sleep.map((s) => [s.date, s]));

  // Steps → sleep score
  const activeDayScores: number[] = [];
  const quietDayScores: number[] = [];
  for (const day of activity) {
    const nightAfter = sleepByDate.get(day.date);
    if (!nightAfter?.score) continue;
    (day.steps >= ACTIVE_DAY_STEPS ? activeDayScores : quietDayScores).push(nightAfter.score);
  }
  if (activeDayScores.length >= 2 && quietDayScores.length >= 2) {
    const delta = percentDelta(average(activeDayScores), average(quietDayScores));
    if (delta !== 0) {
      insights.push({
        id: "steps-sleep",
        emoji: delta > 0 ? "🚶" : "🌙",
        headline:
          delta > 0
            ? `Sleep score is ${delta}% higher on ${ACTIVE_DAY_STEPS / 1000}k+ step days`
            : `Sleep score is ${Math.abs(delta)}% lower on ${ACTIVE_DAY_STEPS / 1000}k+ step days`,
        detail: `${Math.round(average(activeDayScores))} avg on active days vs ${Math.round(
          average(quietDayScores)
        )} on quieter ones.`,
      });
    }
  }

  // Habit completion → sleep duration
  const mostLoggedHabit = [...habits].sort(
    (a, b) => Object.keys(b.completions).length - Object.keys(a.completions).length
  )[0];
  if (mostLoggedHabit && Object.keys(mostLoggedHabit.completions).length >= 2) {
    const doneMinutes: number[] = [];
    const missedMinutes: number[] = [];
    for (const night of sleep) {
      const done = Boolean(mostLoggedHabit.completions[night.date]);
      (done ? doneMinutes : missedMinutes).push(night.totalMinutes);
    }
    if (doneMinutes.length >= 2 && missedMinutes.length >= 2) {
      const diff = Math.round(average(doneMinutes) - average(missedMinutes));
      if (Math.abs(diff) >= 5) {
        insights.push({
          id: "habit-sleep",
          emoji: mostLoggedHabit.emoji,
          headline: `You sleep ${Math.abs(diff)} min ${diff > 0 ? "more" : "less"} on "${mostLoggedHabit.name}" days`,
          detail: `Based on ${doneMinutes.length} days where you completed it and ${missedMinutes.length} where you didn't.`,
        });
      }
    }
  }

  // Sleep duration → mood
  if (moods.length >= 4) {
    const goodSleepMoods: number[] = [];
    const shortSleepMoods: number[] = [];
    for (const mood of moods) {
      const night = sleepByDate.get(mood.date);
      if (!night) continue;
      (night.totalMinutes >= 420 ? goodSleepMoods : shortSleepMoods).push(mood.level);
    }
    if (goodSleepMoods.length >= 2 && shortSleepMoods.length >= 2) {
      const goodAvg = average(goodSleepMoods);
      const shortAvg = average(shortSleepMoods);
      if (Math.abs(goodAvg - shortAvg) >= 0.3) {
        insights.push({
          id: "sleep-mood",
          emoji: "😊",
          headline: `Mood averages ${goodAvg.toFixed(1)}/5 after 7h+ of sleep`,
          detail: `Compared to ${shortAvg.toFixed(1)}/5 on shorter nights.`,
        });
      }
    }
  }

  // Habit consistency this week
  if (habits.length > 0) {
    const completedThisWeek = habits.reduce((sum, h) => {
      const last7 = Object.keys(h.completions).filter(
        (d) => d >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
      );
      return sum + last7.length;
    }, 0);
    const possible = habits.length * 7;
    const rate = Math.round((completedThisWeek / possible) * 100);
    insights.push({
      id: "habit-consistency",
      emoji: "📈",
      headline: `${rate}% habit consistency this week`,
      detail: `${completedThisWeek} of ${possible} possible check-ins across ${habits.length} habit${habits.length === 1 ? "" : "s"}.`,
    });
  }

  return insights;
}
