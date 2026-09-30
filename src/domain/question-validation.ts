import { getTopic } from '@/data/roadmap';
import type { Difficulty, Question, QuestionRequest } from '@/types/study';

const difficulties: Difficulty[] = ['basic', 'exam', 'tricky'];
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown, max: number, min = 1): value is string => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const list = (value: unknown, maxItems = 12): value is string[] => Array.isArray(value) && value.length <= maxItems && value.every((item) => str(item, 600));
export const normalizedQuestionText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function parseQuestionRequest(value: unknown): QuestionRequest | null {
  if (!record(value) || !str(value.topicId, 60) || !str(value.taskId, 5) || !difficulties.includes(value.difficulty as Difficulty) || !['single', 'multiple'].includes(value.kind as string)) return null;
  const topic = getTopic(value.topicId);
  if (!topic || !topic.subtopics.some((item) => item.taskId === value.taskId)) return null;
  if (value.subtopic !== undefined && (!str(value.subtopic, 100) || !topic.subtopics.some((item) => item.title === value.subtopic && item.taskId === value.taskId))) return null;
  if (!list(value.recentQuestionIds) || !list(value.recentConceptIds) || !list(value.recentTexts, 8)) return null;
  if (value.exam !== undefined && typeof value.exam !== 'boolean') return null;
  return { topicId: value.topicId, taskId: value.taskId, difficulty: value.difficulty as Difficulty, kind: value.kind as 'single' | 'multiple',
    ...(value.subtopic ? { subtopic: value.subtopic as string } : {}), recentQuestionIds: value.recentQuestionIds, recentConceptIds: value.recentConceptIds, recentTexts: value.recentTexts,
    ...(value.exam !== undefined ? { exam: value.exam } : {}) };
}

export function parseQuestion(value: unknown): Question | null {
  if (!record(value) || !str(value.id, 120) || !str(value.topicId, 60) || !str(value.subtopic, 100) || !str(value.conceptId, 120) ||
    !difficulties.includes(value.difficulty as Difficulty) || !['single', 'multiple'].includes(value.kind as string) ||
    !str(value.text, 600, 20) || !str(value.explanation, 1200, 20) || !str(value.memoryTip, 240) || !str(value.conceptSummary, 600, 20) ||
    !Array.isArray(value.options) || !Array.isArray(value.correctOptionIds)) return null;
  const topic = getTopic(value.topicId);
  if (!topic?.subtopics.some((item) => item.title === value.subtopic)) return null;
  const kind = value.kind as 'single' | 'multiple';
  const expected = kind === 'single' ? 4 : 5;
  if (value.options.length !== expected || value.correctOptionIds.length < (kind === 'single' ? 1 : 2) || value.correctOptionIds.length > (kind === 'single' ? 1 : 3)) return null;
  if (kind === 'multiple' && !new RegExp(`select\\s+(?:${value.correctOptionIds.length === 2 ? 'two|2' : 'three|3'})`, 'i').test(value.text)) return null;
  if (value.grounding !== undefined) {
    const grounding = value.grounding;
    if (!record(grounding) || !['aws_docs', 'no_sources', 'sample'].includes(grounding.status as string) || !Array.isArray(grounding.sources) || grounding.sources.length > 5 ||
      !grounding.sources.every((source: unknown) => record(source) && str(source.title, 180) && str(source.section, 180) && str(source.url, 500) && /^https:\/\/docs\.aws\.amazon\.com\//.test(source.url)) ||
      (grounding.status === 'aws_docs' && grounding.sources.length === 0) || (grounding.status !== 'aws_docs' && grounding.sources.length !== 0) ||
      (grounding.corpusVersion !== undefined && !str(grounding.corpusVersion, 80))) return null;
  }
  const options: Question['options'] = [];
  for (const item of value.options) {
    if (!record(item) || !str(item.id, 20) || !str(item.text, 240) || !str(item.explanation, 500, 10)) return null;
    options.push({ id: item.id.trim(), text: item.text.trim(), explanation: item.explanation.trim() });
  }
  const ids = options.map((item) => item.id);
  if (new Set(ids).size !== expected || !ids.every((id) => ['a', 'b', 'c', 'd', 'e'].slice(0, expected).includes(id)) ||
    new Set(options.map((item) => item.text.toLowerCase())).size !== expected ||
    !value.correctOptionIds.every((id: unknown) => typeof id === 'string' && ids.includes(id)) ||
    new Set(value.correctOptionIds).size !== value.correctOptionIds.length) return null;
  return { id: value.id.trim(), topicId: value.topicId, subtopic: value.subtopic.trim(), conceptId: value.conceptId.trim(), difficulty: value.difficulty as Difficulty,
    kind, text: value.text.trim(), options, correctOptionIds: value.correctOptionIds, explanation: value.explanation.trim(), memoryTip: value.memoryTip.trim(), conceptSummary: value.conceptSummary.trim(),
    ...(value.grounding ? { grounding: value.grounding as Question['grounding'] } : {}) };
}

export function matchesRequest(question: Question, request: QuestionRequest): boolean {
  return question.topicId === request.topicId && question.difficulty === request.difficulty && question.kind === request.kind &&
    (!request.subtopic || question.subtopic === request.subtopic) && !request.recentQuestionIds.includes(question.id) &&
    !request.recentConceptIds.includes(question.conceptId) && !request.recentTexts.some((text) => normalizedQuestionText(text) === normalizedQuestionText(question.text));
}

export function isCorrect(question: Question, selected: string[]): boolean {
  return selected.length === question.correctOptionIds.length && selected.every((id) => question.correctOptionIds.includes(id));
}
