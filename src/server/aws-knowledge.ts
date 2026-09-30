import { groundedTopicIds, knowledgeSources } from '@/data/knowledge-sources';
import { getTopic } from '@/data/roadmap';
import type { QuestionRequest, SourceReference } from '@/types/study';

export const corpusVersion = 'aws-dva-c02-v1';
export type RetrievedChunk = { id: string; text: string; source: SourceReference };

export class KnowledgeError extends Error {
  constructor(public code: 'knowledge_unavailable' | 'knowledge_empty') { super(code); }
}

export const hasAwsKnowledge = (topicId: string) => groundedTopicIds.includes(topicId);

export async function retrieveAwsKnowledge(request: QuestionRequest): Promise<RetrievedChunk[]> {
  const key = process.env.PINECONE_API_KEY;
  const host = process.env.PINECONE_INDEX_HOST;
  if (!key || !host) throw new KnowledgeError('knowledge_unavailable');
  const topic = getTopic(request.topicId);
  const subtopic = topic?.subtopics.find((item) => item.title === request.subtopic && item.taskId === request.taskId);
  if (!topic || (request.subtopic && !subtopic)) throw new KnowledgeError('knowledge_empty');
  const filter = subtopic
    ? { topicId: { $eq: topic.id }, subtopicId: { $eq: subtopic.id } }
    : { topicId: { $eq: topic.id } };
  let response: Response;
  try {
    response = await fetch(`https://${host.replace(/^https?:\/\//, '').replace(/\/$/, '')}/records/namespaces/${corpusVersion}/search`, {
      method: 'POST',
      headers: { 'Api-Key': key, 'X-Pinecone-Api-Version': '2025-10', 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: { inputs: { text: `${topic.name}. ${request.subtopic ?? ''}. ${request.difficulty} AWS Developer Associate ${request.taskId}` }, top_k: 5, filter },
        fields: ['chunk_text', 'topicId', 'subtopicId', 'title', 'section', 'url', 'corpusVersion'] }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { throw new KnowledgeError('knowledge_unavailable'); }
  if (!response.ok) throw new KnowledgeError('knowledge_unavailable');
  let body: unknown;
  try { body = await response.json(); } catch { throw new KnowledgeError('knowledge_unavailable'); }
  const hits = (body as { result?: { hits?: unknown[] } })?.result?.hits;
  if (!Array.isArray(hits)) throw new KnowledgeError('knowledge_unavailable');
  const allowed = new Set(knowledgeSources.filter((item) => item.topicId === topic.id && (!subtopic || item.subtopicId === subtopic.id)).map((item) => item.url));
  const chunks: RetrievedChunk[] = [];
  for (const hit of hits) {
    if (!hit || typeof hit !== 'object') continue;
    const item = hit as { _id?: unknown; fields?: Record<string, unknown> };
    const fields = item.fields;
    if (typeof item._id !== 'string' || !fields || fields.topicId !== topic.id || fields.corpusVersion !== corpusVersion ||
      (subtopic && fields.subtopicId !== subtopic.id) || typeof fields.chunk_text !== 'string' || fields.chunk_text.length < 80 || fields.chunk_text.length > 5000 ||
      typeof fields.url !== 'string' || !allowed.has(fields.url) || typeof fields.title !== 'string' || typeof fields.section !== 'string') continue;
    chunks.push({ id: item._id, text: fields.chunk_text, source: { title: fields.title.slice(0, 180), section: fields.section.slice(0, 180), url: fields.url } });
  }
  if (!chunks.length) throw new KnowledgeError('knowledge_empty');
  return chunks;
}
