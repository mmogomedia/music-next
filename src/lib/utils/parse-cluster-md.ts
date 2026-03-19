import type { CreateClusterInput } from '@/types/articles';

/**
 * Parse a Flemoji cluster .md file (YAML frontmatter only — no body content).
 *
 * Supported frontmatter keys:
 *   name, slug, audience, description, about, goal,
 *   primary_keywords, secondary_keywords, long_tail_keywords
 *
 * Supports:
 *   - Quoted and plain scalar values
 *   - Block scalars with | (multi-line text)
 *   - List items (  - value)
 *   - Comments (lines starting with #)
 */
export function parseClusterMd(text: string): Partial<CreateClusterInput> {
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const [, frontmatter] = frontmatterMatch;
  const result: Partial<CreateClusterInput> = {};
  const lines = frontmatter.split('\n');

  let currentKey: string | null = null;
  let listAccumulator: string[] = [];
  let multilineAccumulator: string[] = [];
  let inMultiline = false;

  const flushList = () => {
    if (currentKey && listAccumulator.length > 0) {
      assignListField(result, currentKey, listAccumulator);
      listAccumulator = [];
    }
  };

  const flushMultiline = () => {
    if (currentKey && multilineAccumulator.length > 0) {
      assignScalarField(
        result,
        currentKey,
        multilineAccumulator.join('\n').trim()
      );
      multilineAccumulator = [];
      inMultiline = false;
    }
  };

  for (const line of lines) {
    // Skip comments
    if (line.trimStart().startsWith('#')) continue;

    // Multi-line block scalar continuation
    if (inMultiline) {
      if (/^\s+/.test(line) || line.trim() === '') {
        multilineAccumulator.push(line.replace(/^\s{2}/, ''));
        continue;
      } else {
        flushMultiline();
      }
    }

    // List item (  - value)
    if (/^\s+-\s+/.test(line)) {
      const value = parseScalar(line.replace(/^\s+-\s+/, '').trim());
      if (value) listAccumulator.push(value);
      continue;
    }

    // Key: value  or  Key: |  (block scalar)
    const kvMatch = line.match(/^([a-z_]+):\s*(.*)/);
    if (kvMatch) {
      flushList();
      flushMultiline();
      currentKey = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      if (rawValue === '|') {
        inMultiline = true;
        continue;
      }

      if (rawValue) {
        assignScalarField(result, currentKey, parseScalar(rawValue));
        currentKey = null;
      }
      continue;
    }

    // Empty line — flush pending state
    if (!line.trim()) {
      flushList();
      if (inMultiline) flushMultiline();
      currentKey = null;
    }
  }

  // Flush any trailing state
  flushList();
  flushMultiline();

  return result;
}

/**
 * Serialize a cluster to a clean .md string for export.
 * Omits internal fields (id, createdAt, updatedAt, status, _count, etc.)
 */
export function serializeClusterMd(cluster: {
  name: string;
  slug: string;
  audience?: string | null;
  description?: string | null;
  about?: string | null;
  goal?: string | null;
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
}): string {
  const lines: string[] = ['---'];

  lines.push(`name: ${cluster.name}`);
  lines.push(`slug: ${cluster.slug}`);

  if (cluster.audience) lines.push(`audience: ${cluster.audience}`);

  if (cluster.description) {
    const desc = cluster.description.includes('\n')
      ? `|\n  ${cluster.description.replace(/\n/g, '\n  ')}`
      : cluster.description;
    lines.push(`description: ${desc}`);
  }

  if (cluster.about) {
    lines.push(`about: |`);
    cluster.about.split('\n').forEach(l => lines.push(`  ${l}`));
  }

  if (cluster.goal) {
    const g = cluster.goal.includes('\n')
      ? `|\n  ${cluster.goal.replace(/\n/g, '\n  ')}`
      : cluster.goal;
    lines.push(`goal: ${g}`);
  }

  const writeKeywords = (key: string, kws?: string[]) => {
    if (!kws || kws.length === 0) return;
    lines.push(`${key}:`);
    kws.forEach(k => lines.push(`  - ${k}`));
  };

  lines.push('');
  writeKeywords('primary_keywords', cluster.primaryKeywords);
  writeKeywords('secondary_keywords', cluster.secondaryKeywords);
  writeKeywords('long_tail_keywords', cluster.longTailKeywords);

  lines.push('---');
  return lines.join('\n');
}

// ── Internal helpers ──────────────────────────────────────────────────────────

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

function assignScalarField(
  target: Partial<CreateClusterInput>,
  key: string,
  value: string
) {
  const placeholder = /^\[.*\]$/;
  if (!value || placeholder.test(value)) return;

  switch (key) {
    case 'name':
      target.name = value;
      break;
    case 'slug':
      target.slug = value;
      break;
    case 'audience':
      target.audience = value;
      break;
    case 'description':
      target.description = value;
      break;
    case 'about':
      target.about = value;
      break;
    case 'goal':
      target.goal = value;
      break;
  }
}

function assignListField(
  target: Partial<CreateClusterInput>,
  key: string,
  values: string[]
) {
  const placeholder = /^\[.*\]$/;
  const clean = values.filter(v => v && !placeholder.test(v));
  if (clean.length === 0) return;

  switch (key) {
    case 'primary_keywords':
      target.primaryKeywords = clean;
      break;
    case 'secondary_keywords':
      target.secondaryKeywords = clean;
      break;
    case 'long_tail_keywords':
      target.longTailKeywords = clean;
      break;
  }
}
