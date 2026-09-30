import { questions } from '@/data/mock-study';
import { matchesRequest, parseQuestion } from '@/domain/question-validation';
import type { Question, QuestionRequest, QuestionSourceResult } from '@/types/study';

export function questionEndpoint() {
  // Expo replaces this public URL in the standalone app. The key stays on the server.
  const hostedOrigin = process.env.EXPO_PUBLIC_API_ORIGIN;
  return hostedOrigin ? `${hostedOrigin.replace(/\/$/, '')}/api/questions` : '/api/questions';
}

function chooseMock(request: QuestionRequest, allowOtherTopics: boolean): Question | null {
  const unused = questions.filter((question) => !request.recentQuestionIds.includes(question.id) && !request.recentConceptIds.includes(question.conceptId) && question.kind === request.kind);
  const sameTopic = unused.filter((question) => question.topicId === request.topicId);
  return (
    sameTopic.find((question) => question.subtopic === request.subtopic && question.difficulty === request.difficulty) ??
    sameTopic.find((question) => question.subtopic === request.subtopic) ??
    sameTopic.find((question) => question.difficulty === request.difficulty) ??
    sameTopic[0] ??
    (allowOtherTopics ? unused[0] : null) ?? null
  );
}

export async function loadQuestion(request: QuestionRequest, allowOtherTopics: boolean, signal?: AbortSignal, allowFallback = true): Promise<QuestionSourceResult> {
  if (signal?.aborted) throw new Error('cancelled');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 100000);
  let failure = 'A fresh question could not be generated. Check your connection and try again.';
  try {
    const response = await fetch(questionEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (response.ok) {
      const body = (await response.json()) as unknown;
      const candidate = typeof body === 'object' && body !== null && 'question' in body ? parseQuestion(body.question) : null;
      if (candidate && matchesRequest(candidate, request)) return { question: candidate, source: 'generated', usedFallback: false };
      failure = 'The generated question was invalid. Retry this question.';
    } else if (response.status === 402) {
      failure = 'OpenRouter has insufficient credits or the key limit was reached. Your session is saved; add credits or raise the key limit, then retry.';
    } else if (response.status === 429) {
      failure = 'OpenRouter is rate limiting questions. Your session is saved; wait a moment, then retry.';
    } else if (response.status === 503) {
      const body = await response.json().catch(() => null) as { code?: string } | null;
      if (body?.code === 'knowledge_unavailable') failure = 'AWS source search is unavailable. Your session is saved; retry later.';
      if (body?.code === 'knowledge_empty') failure = 'AWS source material is missing for this topic. Your session is saved; retry after the document index is updated.';
    }
  } catch {
    if (signal?.aborted) throw new Error('cancelled');
    failure = controller.signal.aborted ? 'Question loading timed out. Your session is saved; retry when your connection is stable.' : 'Could not reach the question API. Your session is saved; check your internet connection and retry.';
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
  if (signal?.aborted) throw new Error('cancelled');
  const mock = allowFallback ? chooseMock(request, allowOtherTopics) : null;
  if (mock) return { question: { ...mock, grounding: { status: 'sample', sources: [] } }, source: 'mock', usedFallback: true };
  throw new Error(failure);
}
