/** Independent, documented ladder. No claim to reproduce the original backend. */
export type Schedule = {
  dueAt: number;
  streak: number;
  lapses: number;
  intervalMs: number;
};
export const MINUTE = 60_000,
  DAY = 86_400_000;
const intervals = [1, 3, 7, 14, 30, 60];
export function schedule(
  previous: Pick<Schedule, "streak" | "lapses"> | undefined,
  score: { accuracy: number; wrong: number },
  now: number,
): Schedule {
  if (score.wrong > 0 || score.accuracy < 0.9)
    return {
      streak: 0,
      lapses: (previous?.lapses ?? 0) + 1,
      intervalMs: 10 * MINUTE,
      dueAt: now + 10 * MINUTE,
    };
  const streak = (previous?.streak ?? 0) + 1;
  const intervalMs =
    intervals[Math.min(streak - 1, intervals.length - 1)] * DAY;
  return {
    streak,
    lapses: previous?.lapses ?? 0,
    intervalMs,
    dueAt: now + intervalMs,
  };
}
