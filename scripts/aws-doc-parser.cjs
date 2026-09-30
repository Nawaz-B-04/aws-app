const { createHash } = require('node:crypto');

function cleanText(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/\s+/g, ' ').trim();
}

function extractSections(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const content = main.replace(/<(script|style|nav|aside|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const blocks = [...content.matchAll(/<(h[1-4]|p|li|pre|td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  let title = 'AWS documentation'; let section = title;
  const sections = [];
  for (const [, tag, raw] of blocks) {
    const value = cleanText(raw);
    if (!value) continue;
    if (/^h[1-4]$/i.test(tag)) {
      if (tag.toLowerCase() === 'h1') title = value.slice(0, 180);
      section = value.slice(0, 180);
      sections.push({ heading: section, text: '' });
    } else if (value.length >= 40) {
      if (!sections.length) sections.push({ heading: section, text: '' });
      sections.at(-1).text += `${value}\n`;
    }
  }
  return { title, sections: sections.filter((item) => item.text.trim().length >= 80) };
}

function chunkSections(document, source, corpusVersion) {
  const chunks = [];
  for (const section of document.sections) {
    const words = section.text.trim().split(/\s+/);
    for (let start = 0; start < words.length; start += 380) {
      const text = words.slice(start, start + 420).join(' ');
      if (text.length < 80) continue;
      const hash = createHash('sha256').update(`${source.url}\n${section.heading}\n${text}`).digest('hex').slice(0, 20);
      chunks.push({ _id: `${source.subtopicId}-${hash}`, chunk_text: text, topicId: source.topicId, subtopicId: source.subtopicId,
        title: document.title, section: section.heading, url: source.url, corpusVersion });
    }
  }
  return chunks;
}

module.exports = { extractSections, chunkSections };
