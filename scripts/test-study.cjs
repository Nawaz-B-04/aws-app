const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};

const { domains, topics, initialReadyTopicIds } = require('../src/data/roadmap.ts');
const { notes } = require('../src/data/notes.ts');
const { questions } = require('../src/data/mock-study.ts');
const { parseQuestion, parseQuestionRequest, isCorrect, normalizedQuestionText } = require('../src/domain/question-validation.ts');
const { makeSession, prepareExam, domainBreakdown, timeRemainingMs } = require('../src/domain/session-engine.ts');
const { calculateProgress } = require('../src/domain/progress.ts');
const { questionEndpoint, loadQuestion } = require('../src/services/question-source.ts');
const { knowledgeSources } = require('../src/data/knowledge-sources.ts');
const { hasAwsKnowledge, retrieveAwsKnowledge } = require('../src/server/aws-knowledge.ts');
const { generateQuestion } = require('../src/server/question-generation.ts');
const { extractSections, chunkSections } = require('./aws-doc-parser.cjs');

test('question API uses local Metro in development and hosted HTTPS in an APK', () => {
  const previous = process.env.EXPO_PUBLIC_API_ORIGIN;
  delete process.env.EXPO_PUBLIC_API_ORIGIN;
  assert.equal(questionEndpoint(), '/api/questions');
  process.env.EXPO_PUBLIC_API_ORIGIN = 'https://study.example.com/';
  assert.equal(questionEndpoint(), 'https://study.example.com/api/questions');
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_ORIGIN;
  else process.env.EXPO_PUBLIC_API_ORIGIN = previous;
});

test('credit failure uses one matching sample, then explains why practice must pause', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ error: 'Fresh questions are unavailable.', code: 'credits_exhausted' }), { status: 402, headers: { 'Content-Type': 'application/json' } });
  try {
    const request = { topicId: 'route53', taskId: '1.1', subtopic: 'Alias records and AWS targets', difficulty: 'exam', kind: 'single', recentQuestionIds: [], recentConceptIds: [], recentTexts: [] };
    const first = await loadQuestion(request, false);
    assert.equal(first.question.id, 'sample-route53-alias');
    await assert.rejects(loadQuestion({ ...request, recentQuestionIds: [first.question.id] }, false), /OpenRouter has insufficient credits/);
    await assert.rejects(loadQuestion(request, false, undefined, false), /OpenRouter has insufficient credits/);
  } finally { global.fetch = originalFetch; }
});

test('question API passes OpenRouter credit errors through without exposing the key', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-only-key';
  global.fetch = async () => new Response(JSON.stringify({ error: { message: 'insufficient credits' } }), { status: 402, headers: { 'Content-Type': 'application/json' } });
  try {
    const { POST } = require('../src/app/api/questions+api.ts');
    const request = new Request('http://localhost/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId: 'lambda', taskId: '1.2', subtopic: 'Concurrency and performance', difficulty: 'exam', kind: 'single', recentQuestionIds: [], recentConceptIds: [], recentTexts: [] }) });
    const response = await POST(request);
    assert.equal(response.status, 402);
    assert.deepEqual(await response.json(), { error: 'Fresh questions are unavailable.', code: 'credits_exhausted' });
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
});

test('indexed exam API pauses when the AWS index is not configured', async () => {
  const oldOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const oldPineconeKey = process.env.PINECONE_API_KEY;
  process.env.OPENROUTER_API_KEY = 'fake-key'; delete process.env.PINECONE_API_KEY;
  try {
    const { POST } = require('../src/app/api/questions+api.ts');
    const request = new Request('http://localhost/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: 'iam', taskId: '2.1', subtopic: 'Roles and temporary credentials', difficulty: 'exam', kind: 'single',
        recentQuestionIds: [], recentConceptIds: [], recentTexts: [], exam: true }) });
    const response = await POST(request);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'knowledge_unavailable');
  } finally {
    if (oldOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldOpenRouterKey;
    if (oldPineconeKey === undefined) delete process.env.PINECONE_API_KEY; else process.env.PINECONE_API_KEY = oldPineconeKey;
  }
});

test('roadmap covers every guide task; current topics have detailed notes', () => {
  assert.equal(domains.length, 4);
  for (const domain of domains) for (const task of domain.tasks) assert.ok(topics.some((topic) => topic.subtopics.some((item) => item.taskId === task.id)), task.id);
  for (const id of initialReadyTopicIds) for (const subtopic of topics.find((item) => item.id === id).subtopics) assert.ok(notes.some((item) => item.topicId === id && item.subtopic === subtopic.title && item.source.startsWith('https://docs.aws.amazon.com/')));
  assert.deepEqual(initialReadyTopicIds, ['iam', 'ec2', 'ebs']);
});
test('next course topics have complete linked notes and matching fallback questions', () => {
  const next = ['elb-asg', 'rds-aurora-cache', 'route53'];
  assert.deepEqual(topics.slice(3, 6).map((item) => item.id), next);
  for (const id of next) {
    const topic = topics.find((item) => item.id === id);
    assert.ok(topic.subtopics.length >= 4);
    for (const subtopic of topic.subtopics) {
      const item = notes.find((entry) => entry.topicId === id && entry.subtopic === subtopic.title);
      assert.ok(item, `${id}: ${subtopic.title}`);
      for (const field of ['how', 'when', 'compare', 'trap', 'example', 'tip', 'selfCheck']) assert.ok(item[field], `${id}: ${field}`);
      assert.ok(item.source.startsWith('https://docs.aws.amazon.com/'));
    }
    assert.ok(questions.some((item) => item.topicId === id && parseQuestion(item)), `${id}: fallback`);
  }
});
test('quick rotates ready topics; full mock weights every domain; lengths work', () => {
  const quick = makeSession('quick', initialReadyTopicIds, 5, 'exam');
  assert.deepEqual(quick.questionPlan.slice(0, 3).map((item) => item.topicId), ['iam', 'ec2', 'ebs']);
  for (const length of [10, 20, 40, 65]) assert.equal(makeSession('custom', ['iam'], length, 'exam').questionPlan.length, length);
  const full = makeSession('full', topics.map((item) => item.id), 65, 'exam');
  assert.equal(full.questionPlan.length, 65);
  assert.deepEqual(domains.map((domain) => full.questionPlan.filter((slot) => topics.find((item) => item.id === slot.topicId)?.subtopics.some((subtopic) => subtopic.taskId === slot.taskId) && domain.tasks.some((task) => task.id === slot.taskId)).length), [21, 17, 16, 11]);
  assert.equal(new Set(full.questionPlan.map((slot) => slot.topicId)).size, topics.length);
});
test('single and multiple answers validate and score as exact sets', () => {
  for (const question of questions) assert.ok(parseQuestion(question));
  const multi = questions.find((item) => item.kind === 'multiple');
  assert.ok(isCorrect(multi, ['c', 'a']));
  assert.equal(isCorrect(multi, ['a']), false);
  assert.equal(isCorrect(multi, ['a', 'c', 'd']), false);
  assert.equal(parseQuestion({ ...multi, options: multi.options.slice(0, 4) }), null);
  assert.equal(parseQuestion({ ...multi, correctOptionIds: ['a', 'a'] }), null);
  const request = { topicId: 'iam', taskId: '2.1', difficulty: 'exam', kind: 'single', recentQuestionIds: [], recentConceptIds: [], recentTexts: [] };
  assert.ok(parseQuestionRequest(request));
  assert.equal(parseQuestionRequest({ ...request, topicId: 'unknown' }), null);
});
test('fake provider prepares 65 unique questions in bounded batches and resumes a failed exam', async () => {
  const full = makeSession('full', topics.map((item) => item.id), 65, 'exam');
  let calls = 0; let inFlight = 0; let peak = 0; let batches = [];
  const fake = async (request) => {
    calls += 1; const sequence = calls; inFlight += 1; peak = Math.max(peak, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 1)); inFlight -= 1;
    if (sequence === 10) return null;
    const id = `fake-${sequence}`;
    return { ...questions.find((item) => item.kind === request.kind), id, topicId: request.topicId, subtopic: request.subtopic, conceptId: id,
      difficulty: request.difficulty, text: `Unique question ${id} about ${request.subtopic} in this fake provider?` };
  };
  const result = await prepareExam(full, fake, (items) => { batches.push(items.length); });
  assert.equal(result.length, 65); assert.ok(peak <= 3); assert.equal(new Set(result.map((item) => normalizedQuestionText(item.text))).size, 65);
  assert.equal(batches.at(-1), 65); assert.ok(calls >= 65);
  const breakdown = domainBreakdown({ ...full, questions: result });
  assert.deepEqual(breakdown.map((item) => item.count), [21, 17, 16, 11]);
  let saved = [];
  await assert.rejects(prepareExam(full, async (request) => {
    if (saved.length >= 3) return null;
    const id = `resume-${Math.random()}`; return { ...questions.find((item) => item.kind === request.kind), id, topicId: request.topicId, subtopic: request.subtopic,
      conceptId: id, difficulty: request.difficulty, text: `Unique resumed question ${id} about the chosen service?` };
  }, (items) => { saved = items; }));
  assert.equal(saved.length, 3);
  const resumed = await prepareExam({ ...full, questions: saved }, fake, () => {});
  assert.equal(resumed.length, 65);
});
test('exam preparation replaces duplicates and cancellation keeps completed batches', async () => {
  const custom = makeSession('custom', ['iam'], 10, 'exam');
  let count = 0;
  const fake = async (request) => {
    count += 1;
    const id = count <= 2 ? 'same' : `unique-${count}`;
    return { ...questions.find((item) => item.kind === request.kind), id, topicId: request.topicId, subtopic: request.subtopic,
      conceptId: id, difficulty: request.difficulty, text: `This is question ${id} about the requested IAM objective?` };
  };
  const prepared = await prepareExam(custom, fake, () => {});
  assert.equal(prepared.length, 10); assert.ok(count > 10);
  assert.equal(new Set(prepared.map((item) => item.conceptId)).size, 10);
  const controller = new AbortController(); let saved = [];
  await assert.rejects(prepareExam(custom, fake, (items) => { saved = items; controller.abort(); }, controller.signal));
  assert.equal(saved.length, 3);
  assert.equal(custom.deadlineAt, undefined);
});
test('timer and real progress reflect recorded answers', () => {
  const full = makeSession('full', topics.map((item) => item.id), 65, 'exam');
  assert.equal(timeRemainingMs({ ...full, deadlineAt: new Date(10000).toISOString() }, 11000), 0);
  const attempt = { question: questions[0], selectedOptionIds: questions[0].correctOptionIds, correct: true, answeredAt: '2026-09-25T12:00:00.000Z', sessionId: 'x' };
  const progress = calculateProgress([attempt], new Date('2026-09-25T13:00:00.000Z'));
  assert.equal(progress.totalAnswered, 1); assert.equal(progress.overallAccuracy, 100); assert.equal(progress.completedToday, 1);
});

test('curated AWS source catalog and section chunking cover six studied topics', () => {
  assert.equal(knowledgeSources.length, 35);
  assert.equal(new Set(knowledgeSources.map((source) => source.subtopicId)).size, 28);
  assert.equal(topics.filter((topic) => hasAwsKnowledge(topic.id)).length, 6);
  const html = `<main><h1>IAM roles</h1><h2>Temporary credentials</h2><p>${'An IAM role provides temporary credentials to a trusted principal. '.repeat(12)}</p></main>`;
  const document = extractSections(html);
  const records = chunkSections(document, knowledgeSources[0], 'aws-dva-c02-v1');
  assert.equal(document.title, 'IAM roles');
  assert.ok(records.length >= 1);
  assert.equal(records[0].section, 'Temporary credentials');
  assert.equal(records[0].topicId, 'iam');
  assert.deepEqual(records.map((item) => item._id), chunkSections(document, knowledgeSources[0], 'aws-dva-c02-v1').map((item) => item._id));
});

test('grounded generation filters Pinecone to the subtopic and verifies exam answers', async () => {
  const originalFetch = global.fetch;
  const oldPineconeKey = process.env.PINECONE_API_KEY;
  const oldHost = process.env.PINECONE_INDEX_HOST;
  const oldOpenRouterKey = process.env.OPENROUTER_API_KEY;
  process.env.PINECONE_API_KEY = 'fake-pinecone-key';
  process.env.PINECONE_INDEX_HOST = 'fake-index.pinecone.io';
  process.env.OPENROUTER_API_KEY = 'fake-openrouter-key';
  const sample = questions.find((item) => item.topicId === 'iam' && item.kind === 'single');
  const source = knowledgeSources.find((item) => item.topicId === sample.topicId && item.subtopic === sample.subtopic);
  assert.ok(source);
  const request = { topicId: source.topicId, taskId: source.taskId, subtopic: source.subtopic, difficulty: sample.difficulty,
    kind: 'single', recentQuestionIds: [], recentConceptIds: [], recentTexts: [], exam: true };
  let generated = 0; let verified = 0;
  global.fetch = async (url, options) => {
    if (String(url).includes('pinecone.io')) {
      const body = JSON.parse(options.body);
      assert.equal(body.query.filter.topicId.$eq, source.topicId);
      assert.equal(body.query.filter.subtopicId.$eq, source.subtopicId);
      return Response.json({ result: { hits: [{ _id: 'chunk-1', fields: { topicId: source.topicId, subtopicId: source.subtopicId,
        corpusVersion: 'aws-dva-c02-v1', chunk_text: 'An IAM role has a trust policy and is assumed to receive temporary credentials. '.repeat(4),
        title: 'IAM roles', section: 'Temporary credentials', url: source.url } }] } });
    }
    const body = JSON.parse(options.body);
    if (body.response_format.json_schema.name === 'aws_grounding_check') {
      verified += 1;
      return Response.json({ choices: [{ message: { content: JSON.stringify({ supported: verified > 1, reason: verified > 1 ? 'Supported' : 'Unsupported' }) } }] });
    }
    generated += 1;
    return Response.json({ choices: [{ message: { content: JSON.stringify({ ...sample, sourceIds: ['chunk-1'] }) } }] });
  };
  try {
    const question = await generateQuestion(request);
    assert.equal(question.grounding.status, 'aws_docs');
    assert.equal(question.grounding.sources[0].url, source.url);
    assert.equal(generated, 2);
    assert.equal(verified, 2);
    assert.ok(parseQuestion(question));
    assert.equal(parseQuestion({ ...question, grounding: { status: 'aws_docs', sources: [{ ...question.grounding.sources[0], url: 'https://example.com' }] } }), null);
    const legacy = { ...question }; delete legacy.grounding;
    assert.ok(parseQuestion(legacy));
  } finally {
    global.fetch = originalFetch;
    for (const [name, value] of [['PINECONE_API_KEY', oldPineconeKey], ['PINECONE_INDEX_HOST', oldHost], ['OPENROUTER_API_KEY', oldOpenRouterKey]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('indexed topics fail closed when Pinecone is missing or sources are invalid', async () => {
  const oldKey = process.env.PINECONE_API_KEY;
  const oldHost = process.env.PINECONE_INDEX_HOST;
  const oldFetch = global.fetch;
  delete process.env.PINECONE_API_KEY;
  const request = { topicId: 'iam', taskId: '2.1', subtopic: 'Roles and temporary credentials', difficulty: 'exam', kind: 'single',
    recentQuestionIds: [], recentConceptIds: [], recentTexts: [] };
  try {
    await assert.rejects(retrieveAwsKnowledge(request), /knowledge_unavailable/);
    process.env.PINECONE_API_KEY = 'fake-key'; process.env.PINECONE_INDEX_HOST = 'fake-index.pinecone.io';
    global.fetch = async () => Response.json({ result: { hits: [{ _id: 'bad', fields: { topicId: 'iam', subtopicId: 'iam-1',
      corpusVersion: 'aws-dva-c02-v1', chunk_text: 'A valid looking chunk. '.repeat(10), title: 'IAM roles', section: 'Roles', url: 'https://example.com/forged' } }] } });
    await assert.rejects(retrieveAwsKnowledge(request), /knowledge_empty/);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.PINECONE_API_KEY; else process.env.PINECONE_API_KEY = oldKey;
    if (oldHost === undefined) delete process.env.PINECONE_INDEX_HOST; else process.env.PINECONE_INDEX_HOST = oldHost;
  }
});

test('model invented source IDs cannot become AWS links', async () => {
  const oldFetch = global.fetch;
  const oldPineconeKey = process.env.PINECONE_API_KEY;
  const oldHost = process.env.PINECONE_INDEX_HOST;
  const oldOpenRouterKey = process.env.OPENROUTER_API_KEY;
  process.env.PINECONE_API_KEY = 'fake-key'; process.env.PINECONE_INDEX_HOST = 'fake-index.pinecone.io'; process.env.OPENROUTER_API_KEY = 'fake-key';
  const sample = questions.find((item) => item.topicId === 'iam' && item.kind === 'single');
  const source = knowledgeSources.find((item) => item.topicId === sample.topicId && item.subtopic === sample.subtopic);
  let calls = 0;
  global.fetch = async (url) => {
    if (String(url).includes('pinecone.io')) return Response.json({ result: { hits: [{ _id: 'real-chunk', fields: {
      topicId: source.topicId, subtopicId: source.subtopicId, corpusVersion: 'aws-dva-c02-v1',
      chunk_text: 'IAM policies and temporary role credentials are controlled through permissions and a trust relationship. '.repeat(3),
      title: 'IAM roles', section: 'Temporary credentials', url: source.url,
    } }] } });
    calls += 1;
    return Response.json({ choices: [{ message: { content: JSON.stringify({ ...sample, sourceIds: ['invented-chunk'] }) } }] });
  };
  try {
    await assert.rejects(generateQuestion({ topicId: source.topicId, taskId: source.taskId, subtopic: source.subtopic,
      difficulty: sample.difficulty, kind: 'single', recentQuestionIds: [], recentConceptIds: [], recentTexts: [] }), /invalid-generation/);
    assert.equal(calls, 2);
  } finally {
    global.fetch = oldFetch;
    for (const [name, value] of [['PINECONE_API_KEY', oldPineconeKey], ['PINECONE_INDEX_HOST', oldHost], ['OPENROUTER_API_KEY', oldOpenRouterKey]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
