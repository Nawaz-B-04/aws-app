import { domains, getDomainForTask, getTopic, topics } from '@/data/roadmap';
import { isCorrect, normalizedQuestionText } from '@/domain/question-validation';
import type { Question, QuestionRequest, SessionDifficulty, SessionMode, StudySession } from '@/types/study';

type Slot = StudySession['questionPlan'][number];
const allSlots = topics.flatMap((topic) => topic.subtopics.map((subtopic) => ({ topicId: topic.id, subtopic: subtopic.title, taskId: subtopic.taskId })));
function interleave(slots: typeof allSlots) {
  const groups = [...new Set(slots.map((item) => item.topicId))].map((id) => slots.filter((item) => item.topicId === id));
  const result: typeof allSlots = [];
  for (let row = 0; row < Math.max(...groups.map((group) => group.length)); row += 1) for (const group of groups) if (group[row]) result.push(group[row]);
  return result;
}
const makeId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const isExam = (mode: SessionMode) => mode === 'custom' || mode === 'full';
export const timeRemainingMs = (session: StudySession, now = Date.now()) => session.deadlineAt ? Math.max(0, Date.parse(session.deadlineAt) - now) : null;
export const sessionScore = (session: StudySession) => session.questions.reduce((score, question) => score + Number(isCorrect(question, session.answers[question.id] ?? [])), 0);
export const sessionPercent = (session: StudySession) => session.questions.length ? Math.round(100 * sessionScore(session) / session.questions.length) : 0;
export const domainBreakdown = (session: StudySession) => domains.map((domain) => { const matches = session.questions.filter((question) => getDomainForTask(getTopic(question.topicId)?.subtopics.find((item) => item.title === question.subtopic)?.taskId ?? '')?.id === domain.id); return { domain, count: matches.length, correct: matches.filter((question) => isCorrect(question, session.answers[question.id] ?? [])).length }; });

export function makeSession(mode: SessionMode, topicIds: string[], target: number, difficulty: SessionDifficulty, offset = 0, subtopic?: string, retryQuestion?: Question): StudySession {
  const allowed = mode === 'full' ? allSlots : allSlots.filter((item) => topicIds.includes(item.topicId) && (!subtopic || item.subtopic === subtopic));
  if (!allowed.length && !retryQuestion) throw new Error('Select at least one topic.');
  let candidates = interleave(allowed);
  const plan: Slot[] = [];
  for (let index = 0; index < target; index += 1) {
    if (mode === 'full') {
      const domain = domains.find((_, position) => index < [21, 38, 54, 65][position])!;
      candidates = interleave(allSlots.filter((item) => getDomainForTask(item.taskId)?.id === domain.id));
    }
    const slot = candidates[(index + offset) % candidates.length];
    plan.push({ ...slot, kind: index % 5 === 4 ? 'multiple' : 'single' });
  }
  const now = new Date().toISOString();
  return { id: makeId(), mode, title: mode === 'full' ? 'Full DVA-C02 Mock' : mode === 'custom' ? 'Custom Exam' : mode === 'quick' ? 'Quick Practice' : mode === 'mixed' ? 'Mixed Practice' : mode === 'revision' ? 'Revision Session' : mode === 'retry' ? 'Retry Question' : `${getTopic(topicIds[0])?.name ?? 'Topic'} Practice`,
    target, difficulty, topicIds, questionPlan: plan, questions: retryQuestion ? [retryQuestion] : [], answers: {}, checkedQuestionIds: [], flags: [], index: 0,
    status: isExam(mode) ? 'preparing' : 'active', ...(isExam(mode) ? {} : { startedAt: now }) };
}

export type QuestionLoader = (request: QuestionRequest, signal?: AbortSignal) => Promise<Question | null>;
export async function prepareExam(session: StudySession, loader: QuestionLoader, onBatch: (questions: Question[]) => void, signal?: AbortSignal): Promise<Question[]> {
  const completed = [...session.questions];
  while (completed.length < session.target) {
    if (signal?.aborted) throw new Error('cancelled');
    const start = completed.length;
    const slots = session.questionPlan.slice(start, start + 3);
    const batch = await Promise.all(slots.map(async (slot) => {
      for (let retry = 0; retry < 3; retry += 1) {
        const recent = completed.slice(-12);
        const request: QuestionRequest = { ...slot, difficulty: session.difficulty === 'mixed' ? (['basic', 'exam', 'tricky'] as const)[(start + retry) % 3] : session.difficulty,
          recentQuestionIds: recent.map((item) => item.id), recentConceptIds: recent.map((item) => item.conceptId), recentTexts: recent.slice(-8).map((item) => item.text) };
        const question = await loader(request, signal);
        if (question && !completed.some((item) => normalizedQuestionText(item.text) === normalizedQuestionText(question.text) || item.conceptId === question.conceptId)) return question;
      }
      throw new Error('A unique question could not be prepared. Retry to continue.');
    }));
    for (let position = 0; position < batch.length; position += 1) {
      let question = batch[position];
      for (let retry = 0; retry < 3 && completed.some((item) => normalizedQuestionText(item.text) === normalizedQuestionText(question.text) || item.conceptId === question.conceptId); retry += 1) {
        const slot = slots[position]; const recent = completed.slice(-12);
        const request: QuestionRequest = { ...slot, difficulty: session.difficulty === 'mixed' ? (['basic', 'exam', 'tricky'] as const)[(start + position + retry) % 3] : session.difficulty,
          recentQuestionIds: recent.map((item) => item.id), recentConceptIds: recent.map((item) => item.conceptId), recentTexts: recent.slice(-8).map((item) => item.text) };
        const replacement = await loader(request, signal);
        if (!replacement) throw new Error('A duplicate could not be replaced. Retry to continue.');
        question = replacement;
      }
      if (completed.some((item) => normalizedQuestionText(item.text) === normalizedQuestionText(question.text) || item.conceptId === question.conceptId)) throw new Error('Duplicate questions were generated. Retry to continue.');
      completed.push(question);
    }
    onBatch([...completed]);
  }
  return completed;
}
