/**
 * Build-time generator for the Flemoji MCP docs index.
 *
 * Indexes the human-authored doc corpus (`rules/*.md`, plus a few useful
 * root-level `*.md`) into `src/lib/mcp/docs-index.generated.json`, which the
 * MCP docs tools (`docs_overview`, `docs_search`, `docs_get_guide`) serve so
 * the documentation always matches the code that is actually live.
 *
 * Modelled on Picasite's `scripts/generate-docs-index.ts` (its guide-collection
 * layer), but dependency-free: it uses only `node:fs` / `node:path` so it runs
 * via plain `node` with no tsx/TypeScript step. Wired into `package.json`'s
 * `build` script so it regenerates on every deploy.
 *
 * Output shape:
 *   {
 *     generatedAt: string,
 *     sections: [
 *       { id, title, summary, headings: string[], markdown: string }
 *     ]
 *   }
 *
 * Run standalone:
 *   node scripts/generate-mcp-docs-index.mjs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const RULES_DIR = path.join(ROOT, 'rules');
const OUT = path.join(ROOT, 'src', 'lib', 'mcp', 'docs-index.generated.json');

/** Root-level markdown files worth including in the docs corpus. */
const ROOT_DOCS = ['README.md'];

const SUMMARY_MAX = 200;

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');

/** Slug for a markdown file path → its filename without the `.md` extension. */
function slugFor(file) {
  return path.basename(file).replace(/\.md$/i, '');
}

/** First H1 (`# ...`) line in the text, or the filename slug as fallback. */
function extractTitle(text, file) {
  const h1 = text.match(/^#\s+(.+)$/m);
  return (h1?.[1] ?? slugFor(file)).trim();
}

/** All `#`/`##`/`###` headings as plain text, in document order. */
function extractHeadings(text) {
  return (text.match(/^#{1,3}\s+.+$/gm) ?? []).map(h =>
    h.replace(/^#+\s+/, '').trim()
  );
}

/**
 * First non-heading, non-empty paragraph, normalized to a single line and
 * trimmed to ~SUMMARY_MAX chars. Strips simple markdown emphasis/links.
 */
function extractSummary(text) {
  const lines = text.split(/\r?\n/);
  const buffer = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (buffer.length > 0) break;
      continue;
    }
    if (line.startsWith('#')) continue; // skip heading lines
    if (/^[-*>|]/.test(line) || /^\d+\.\s/.test(line)) {
      // list / blockquote / table row — skip if we haven't started a paragraph
      if (buffer.length === 0) continue;
      break;
    }
    buffer.push(line);
  }
  let summary = buffer
    .join(' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images → label text
    .replace(/[*_`~]/g, '') // emphasis / code ticks
    .replace(/\s+/g, ' ')
    .trim();
  if (summary.length > SUMMARY_MAX) {
    summary = summary.slice(0, SUMMARY_MAX - 1).trimEnd() + '…';
  }
  return summary;
}

/** Collect candidate markdown files: every `rules/*.md` + selected root docs. */
function collectFiles() {
  const files = [];

  let ruleEntries = [];
  try {
    ruleEntries = fs.readdirSync(RULES_DIR, { withFileTypes: true });
  } catch {
    ruleEntries = [];
  }
  for (const entry of ruleEntries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(path.join(RULES_DIR, entry.name));
    }
  }

  for (const name of ROOT_DOCS) {
    const full = path.join(ROOT, name);
    if (fs.existsSync(full)) files.push(full);
  }

  // Stable, human-readable order (00-* … 29-*, then root docs by name).
  return files.sort((a, b) => rel(a).localeCompare(rel(b)));
}

function buildSections(files) {
  const sections = [];
  const seen = new Set();

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!text.trim()) continue;

    const id = slugFor(file);
    if (seen.has(id)) continue; // first wins on slug collision
    seen.add(id);

    sections.push({
      id,
      title: extractTitle(text, file),
      summary: extractSummary(text),
      headings: extractHeadings(text),
      markdown: text,
    });
  }

  return sections;
}

function main() {
  const files = collectFiles();
  const sections = buildSections(files);

  const payload = {
    generatedAt: new Date().toISOString(),
    sections,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');

  console.log(
    `[mcp-docs-index] ${sections.length} sections from ${files.length} files → ${rel(OUT)}`
  );
}

main();
