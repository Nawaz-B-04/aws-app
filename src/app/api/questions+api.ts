import { parseQuestionRequest } from '@/domain/question-validation';
import { generateQuestion } from '@/server/question-generation';
import { QuestionProviderError } from '@/server/openrouter-question-provider';
import { KnowledgeError } from '@/server/aws-knowledge';

const responseHeaders = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Invalid request.' }, { status: 415, headers: responseHeaders });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return Response.json({ error: 'Invalid request.' }, { status: 413, headers: responseHeaders });
    body = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400, headers: responseHeaders });
  }

  const generationRequest = parseQuestionRequest(body);
  if (!generationRequest) return Response.json({ error: 'Invalid request.' }, { status: 400, headers: responseHeaders });
  if (!process.env.OPENROUTER_API_KEY) return Response.json({ error: 'Fresh questions are unavailable.', code: 'provider_unavailable' }, { status: 503, headers: responseHeaders });

  try {
    const question = await generateQuestion(generationRequest);
    return Response.json({ question }, { headers: responseHeaders });
  } catch (error) {
    console.warn('Question generation failed:', error instanceof Error ? error.message : 'unknown error');
    const code = error instanceof QuestionProviderError || error instanceof KnowledgeError ? error.code : 'provider_unavailable';
    const status = code === 'credits_exhausted' ? 402 : code === 'rate_limited' ? 429 : 503;
    return Response.json({ error: 'Fresh questions are unavailable.', code }, { status, headers: responseHeaders });
  }
}
