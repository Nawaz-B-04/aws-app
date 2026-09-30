import { getTopic, domains } from '@/data/roadmap';
import type { QuestionRequest } from '@/types/study';
import type { RetrievedChunk } from '@/server/aws-knowledge';

const baseSchema = {
  type: 'object', additionalProperties: false,
  required: ['topicId', 'subtopic', 'conceptId', 'difficulty', 'kind', 'text', 'options', 'correctOptionIds', 'explanation', 'memoryTip', 'conceptSummary'],
  properties: {
    topicId: { type: 'string' }, subtopic: { type: 'string' }, conceptId: { type: 'string' },
    difficulty: { type: 'string', enum: ['basic', 'exam', 'tricky'] }, kind: { type: 'string', enum: ['single', 'multiple'] },
    text: { type: 'string' },
    options: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'text', 'explanation'], properties: {
      id: { type: 'string', enum: ['a', 'b', 'c', 'd', 'e'] }, text: { type: 'string' }, explanation: { type: 'string' },
    } } },
    correctOptionIds: { type: 'array', items: { type: 'string', enum: ['a', 'b', 'c', 'd', 'e'] } },
    explanation: { type: 'string' }, memoryTip: { type: 'string' }, conceptSummary: { type: 'string' },
  },
};
const systemPrompt = `Write ONE original AWS Certified Developer Associate DVA-C02 exam-style practice question as structured JSON.
Follow the exact requested topic, task, subtopic (if supplied), kind and difficulty. The question must test the chosen objective, not a nearby service.
Single: exactly four distinct options a-d, exactly one correctOptionId in correctOptionIds.
Multiple: exactly five distinct options a-e, exactly TWO or THREE correctOptionIds; say "Select two" or "Select three" in the text.
Basic asks direct knowledge. Exam uses a concise realistic scenario. Tricky has plausible distractors but no ambiguity.
Give a useful main explanation and an accurate explanation for EVERY option. Avoid unsupported precise numbers, obscure trivia, and near-duplicate recent questions.
Keep text readable on a phone. These are original practice questions, never official exam items.`;
type Payload = { choices?: { message?: { content?: unknown } }[] };

export class QuestionProviderError extends Error {
  constructor(public code: 'credits_exhausted' | 'rate_limited' | 'provider_unavailable') { super(code); }
}

export async function generateWithOpenRouter(request: QuestionRequest, chunks?: RetrievedChunk[]): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('missing-key');
  const topic = getTopic(request.topicId);
  const task = domains.flatMap((domain): { id: string; name: string }[] => [...domain.tasks]).find((item) => item.id === request.taskId);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openai/gpt-5.4-mini', max_tokens: 1600,
      provider: { require_parameters: true },
      messages: [{ role: 'system', content: systemPrompt + (chunks ? '\nUse only the supplied AWS documentation excerpts for factual claims. Choose a correct answer supported by them. Return 1-3 supporting sourceIds from the supplied IDs. Do not invent source IDs or facts absent from the excerpts.' : '\nDo not claim AWS source verification or invent citations.') }, { role: 'user', content: JSON.stringify({ ...request,
        topicName: topic?.name, objective: task?.name, allowedSubtopics: topic?.subtopics.map((item) => item.title),
        ...(chunks ? { awsContext: chunks.map(({ id, text }) => ({ id, text })) } : {}),
        instruction: 'Return a new question about the requested objective and avoid recent concept IDs and question wording.' }) }],
      response_format: { type: 'json_schema', json_schema: { name: 'aws_practice_question', strict: true, schema: chunks ? {
        ...baseSchema, required: [...baseSchema.required, 'sourceIds'], properties: { ...baseSchema.properties,
          sourceIds: { type: 'array', items: { type: 'string', enum: chunks.map((chunk) => chunk.id) } },
        },
      } : baseSchema } },
    }), signal: AbortSignal.timeout(25000),
  });
  if (response.status === 402) throw new QuestionProviderError('credits_exhausted');
  if (response.status === 429) throw new QuestionProviderError('rate_limited');
  if (!response.ok) throw new QuestionProviderError('provider_unavailable');
  const payload = (await response.json()) as Payload;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('empty-generation');
  try { return JSON.parse(content) as unknown; } catch { throw new Error('invalid-json'); }
}

export async function verifyGroundedAnswer(question: unknown, chunks: RetrievedChunk[]): Promise<boolean> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new QuestionProviderError('provider_unavailable');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openai/gpt-5.4-mini', max_tokens: 200, provider: { require_parameters: true },
      messages: [{ role: 'system', content: 'Check whether the selected correct answer, main explanation, and explanations for correct options are supported by the AWS excerpts. Reject contradictions or claims requiring outside facts. Return JSON only. This is a screening check, not a guarantee.' },
        { role: 'user', content: JSON.stringify({ question, awsContext: chunks.map(({ id, text }) => ({ id, text })) }) }],
      response_format: { type: 'json_schema', json_schema: { name: 'aws_grounding_check', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['supported', 'reason'], properties: { supported: { type: 'boolean' }, reason: { type: 'string' } },
      } } },
    }), signal: AbortSignal.timeout(15000),
  });
  if (response.status === 402) throw new QuestionProviderError('credits_exhausted');
  if (response.status === 429) throw new QuestionProviderError('rate_limited');
  if (!response.ok) throw new QuestionProviderError('provider_unavailable');
  const payload = (await response.json()) as Payload;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return false;
  try { return (JSON.parse(content) as { supported?: unknown }).supported === true; } catch { return false; }
}
