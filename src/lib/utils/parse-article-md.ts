import type { CreateArticleInput } from '@/types/articles';

interface ParsedArticle extends Partial<CreateArticleInput> {
  body: string;
}

/**
 * Parse a frontmatter field value. Handles quoted strings, plain strings.
 */
function parseScalar(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Parse a structured Flemoji article .md file.
 *
 * Expects YAML frontmatter between --- delimiters followed by the article body.
 * Returns a Partial<CreateArticleInput> populated from the frontmatter, plus the body.
 */
export function parseArticleMd(text: string): ParsedArticle {
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!frontmatterMatch) {
    // No frontmatter — treat the whole file as the body and try to grab the title
    const titleMatch = text.match(/^#\s+(.+)/m);
    const bodyText = text.replace(/^#[^\n]+\n?/, '').trimStart();
    return { title: titleMatch?.[1]?.trim(), body: bodyText };
  }

  const [, frontmatter, rawBody] = frontmatterMatch;
  const result: ParsedArticle = { body: rawBody.trim() };

  // Parse YAML frontmatter line by line
  const lines = frontmatter.split('\n');
  let currentKey: string | null = null;
  let listAccumulator: string[] = [];

  const flushList = () => {
    if (currentKey && listAccumulator.length > 0) {
      assignListField(result, currentKey, listAccumulator);
      listAccumulator = [];
    }
  };

  for (const line of lines) {
    // Skip comments
    if (line.trimStart().startsWith('#')) continue;

    // List item (  - value)
    if (/^\s+-\s+/.test(line)) {
      const value = line.replace(/^\s+-\s+/, '').trim();
      if (value) listAccumulator.push(parseScalar(value));
      continue;
    }

    // Key: value pair
    const kvMatch = line.match(/^([a-z_]+):\s*(.*)/);
    if (kvMatch) {
      // Flush any pending list
      flushList();
      currentKey = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      if (rawValue) {
        // Inline scalar value
        assignScalarField(result, currentKey, parseScalar(rawValue));
        currentKey = null;
      }
      // else: value will follow as list items or next key
      continue;
    }

    // Empty line — flush list
    if (!line.trim()) {
      flushList();
      currentKey = null;
    }
  }

  // Flush any trailing list
  flushList();

  // Strip the H1 title from the body if it matches the frontmatter title
  if (result.body) {
    result.body = result.body.replace(/^#[^\n]+\n?/, '').trimStart();
  }

  return result;
}

function assignScalarField(target: ParsedArticle, key: string, value: string) {
  const placeholder = /^\[.*\]$/;
  if (!value || placeholder.test(value)) return;

  switch (key) {
    case 'title':
      target.title = value;
      break;
    case 'excerpt':
      target.excerpt = value;
      break;
    case 'seo_title':
      target.seoTitle = value;
      break;
    case 'meta_description':
      target.metaDescription = value;
      break;
    case 'primary_keyword':
      target.primaryKeyword = value;
      break;
    case 'cluster_role':
      if (value === 'PILLAR' || value === 'SPOKE') target.clusterRole = value;
      break;
    case 'cta_text':
      target.ctaText = value;
      break;
    case 'cta_link':
      target.ctaLink = value;
      break;
  }
}

function assignListField(target: ParsedArticle, key: string, values: string[]) {
  const placeholder = /^\[.*\]$/;
  const clean = values.filter(v => v && !placeholder.test(v));
  if (clean.length === 0) return;

  switch (key) {
    case 'secondary_keywords':
      target.targetKeywords = clean;
      break;
  }
}
