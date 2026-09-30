import { corpusVersion, hasAwsKnowledge, retrieveAwsKnowledge } from '@/server/aws-knowledge';
import { matchesRequest, parseQuestion } from '@/domain/question-validation';
import { generateWithOpenRouter, verifyGroundedAnswer } from '@/server/openrouter-question-provider';
import type { Question, QuestionRequest } from '@/types/study';

export async function generateQuestion(request: QuestionRequest): Promise<Question> {
  const chunks = hasAwsKnowledge(request.topicId) ? await retrieveAwsKnowledge(request) : undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const generated = await generateWithOpenRouter(request, chunks);
    if (!generated || typeof generated !== 'object') continue;
    const raw = generated as Record<string, unknown>;
    let grounding: Question['grounding'] = { status: 'no_sources', sources: [] };
    if (chunks) {
      const ids = raw.sourceIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3 || new Set(ids).size !== ids.length ||
        !ids.every((id) => typeof id === 'string' && chunks.some((chunk) => chunk.id === id))) continue;
      const sources = ids.map((id) => chunks.find((chunk) => chunk.id === id)!.source);
      grounding = { status: 'aws_docs', sources: [...new Map(sources.map((source) => [source.url + source.section, source])).values()], corpusVersion };
    }
    const question = parseQuestion({ ...raw, id: `generated-${crypto.randomUUID()}`, grounding });
    if (!question || !matchesRequest(question, request)) continue;
    if (chunks && request.exam && !await verifyGroundedAnswer(question, chunks)) continue;
    return question;
  }
  throw new Error('invalid-generation');
}
