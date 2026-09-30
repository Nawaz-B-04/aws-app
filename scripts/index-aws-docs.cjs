const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { extractSections, chunkSections } = require('./aws-doc-parser.cjs');

const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { knowledgeSources } = require('../src/data/knowledge-sources.ts');
const { corpusVersion } = require('../src/server/aws-knowledge.ts');
const indexName = 'aws-practice-dva-c02';

function loadLocalEnv() {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${new URL(url).pathname}: HTTP ${response.status}`);
  if (response.status === 204) return {};
  const body = await response.text();
  return body ? JSON.parse(body) : {};
}

async function ensureIndex(key) {
  const headers = { 'Api-Key': key, 'X-Pinecone-Api-Version': '2025-10', 'Content-Type': 'application/json' };
  const endpoint = `https://api.pinecone.io/indexes/${indexName}`;
  let response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
  if (response.status === 404) {
    await request('https://api.pinecone.io/indexes/create-for-model', { method: 'POST', headers, body: JSON.stringify({ name: indexName, cloud: 'aws', region: 'us-east-1',
      embed: { model: 'llama-text-embed-v2', field_map: { text: 'chunk_text' } } }) });
  } else if (!response.ok) throw new Error(`Pinecone index lookup: HTTP ${response.status}`);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Pinecone index status: HTTP ${response.status}`);
    const index = await response.json();
    if (index.embed?.model !== 'llama-text-embed-v2' || index.embed?.field_map?.text !== 'chunk_text') throw new Error('Existing index has a different embedding model or text field.');
    if (index.status?.ready && typeof index.host === 'string') return { host: index.host, headers };
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Pinecone index did not become ready.');
}

async function listIds(host, headers, prefix) {
  const ids = [];
  let token;
  do {
    const query = new URLSearchParams({ namespace: corpusVersion, prefix, limit: '100' });
    if (token) query.set('paginationToken', token);
    const page = await request(`https://${host}/vectors/list?${query}`, { headers });
    ids.push(...(page.vectors ?? []).map((item) => item.id).filter((id) => typeof id === 'string'));
    token = page.pagination?.next;
  } while (token);
  return ids;
}

async function main() {
  const subtopicIds = [...new Set(knowledgeSources.map((item) => item.subtopicId))];
  if (subtopicIds.length !== 28) throw new Error('Expected AWS sources for each of 28 studied subtopics.');
  if (process.argv.includes('--check')) { process.stdout.write(`Source catalog OK: ${knowledgeSources.length} pages for ${subtopicIds.length} subtopics.\n`); return; }
  const dryRun = process.argv.includes('--dry-run');
  loadLocalEnv();
  const key = process.env.PINECONE_API_KEY;
  if (!dryRun && !key) throw new Error('Add PINECONE_API_KEY to .env.local before indexing.');
  const pinecone = dryRun ? null : await ensureIndex(key);
  const htmlByUrl = new Map();
  for (const subtopicId of subtopicIds) {
    const sources = knowledgeSources.filter((item) => item.subtopicId === subtopicId);
    const records = [];
    for (const source of sources) {
      if (!htmlByUrl.has(source.url)) {
        const response = await fetch(source.url, { headers: { 'User-Agent': 'AWSPracticeStudyIndexer/1.0' }, signal: AbortSignal.timeout(20000) });
        if (!response.ok || !response.url.startsWith('https://docs.aws.amazon.com/')) throw new Error(`Could not read curated AWS page for ${subtopicId}: HTTP ${response.status}`);
        htmlByUrl.set(source.url, await response.text());
      }
      const document = extractSections(htmlByUrl.get(source.url));
      const chunks = chunkSections(document, source, corpusVersion);
      if (document.title === 'AWS documentation' || !chunks.length) throw new Error(`No useful AWS text extracted for ${subtopicId}: ${source.url}`);
      records.push(...chunks);
    }
    if (dryRun) { process.stdout.write(`${subtopicId}: ${records.length} chunks from ${sources.length} AWS page(s).\n`); continue; }
    const { host, headers } = pinecone;
    const prefix = `${subtopicId}-`;
    const previous = await listIds(host, headers, prefix);
    for (let start = 0; start < records.length; start += 32) {
      await request(`https://${host}/records/namespaces/${corpusVersion}/upsert`, { method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/x-ndjson' },
        body: records.slice(start, start + 32).map((item) => JSON.stringify(item)).join('\n') });
    }
    const current = new Set(records.map((item) => item._id));
    const stale = previous.filter((id) => !current.has(id));
    for (let start = 0; start < stale.length; start += 100) await request(`https://${host}/vectors/delete`, { method: 'POST', headers,
      body: JSON.stringify({ namespace: corpusVersion, ids: stale.slice(start, start + 100) }) });
    process.stdout.write(`${subtopicId}: ${records.length} chunks indexed, ${stale.length} outdated chunks removed.\n`);
  }
  if (dryRun) process.stdout.write(`Dry run complete: ${subtopicIds.length} subtopics parsed; Pinecone unchanged.\n`);
  else process.stdout.write(`Index complete. Set PINECONE_INDEX_HOST=${pinecone.host} locally and in EAS preview (Sensitive).\n`);
}

if (require.main === module) main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
