import { getTopic } from '@/data/roadmap';
import type { Attempt } from '@/types/study';

const day = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
export function calculateProgress(attempts: Attempt[], now = new Date()) {
  const today = day(now);
  const completedToday = attempts.filter((item) => day(new Date(item.answeredAt)) === today).length;
  const dates = new Set(attempts.map((item) => day(new Date(item.answeredAt))));
  const cursor = new Date(now); if (!dates.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streakDays = 0;
  while (dates.has(day(cursor))) { streakDays += 1; cursor.setDate(cursor.getDate() - 1); }
  const byTopic = new Map<string, Attempt[]>();
  for (const attempt of attempts) byTopic.set(attempt.question.topicId, [...(byTopic.get(attempt.question.topicId) ?? []), attempt]);
  const topicPerformance = [...byTopic.entries()].map(([topicId, items]) => ({ topicId, name: getTopic(topicId)?.name ?? topicId, answered: items.length, accuracy: Math.round(100 * items.filter((item) => item.correct).length / items.length) }));
  return { completedToday, dailyGoal: 10, streakDays, totalAnswered: attempts.length,
    overallAccuracy: attempts.length ? Math.round(100 * attempts.filter((item) => item.correct).length / attempts.length) : 0,
    topicPerformance, weakAreas: [...topicPerformance].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3) };
}
