/**
 * MCP docs tools — `docs_overview`, `docs_search`, `docs_get_guide`.
 *
 * Serves the build-time docs index (`docs-index.generated.json`, produced by
 * `scripts/generate-mcp-docs-index.mjs` over `rules/*.md`) so an external MCP
 * client (Picasite) can ground itself in Flemoji's documentation before
 * operating the article system. All three tools require the `docs:read` scope
 * and match the I/O shapes in `@/lib/mcp/contract` exactly.
 */

import { McpError } from '../auth';
import {
  DocsOverviewInputSchema,
  DocsSearchInputSchema,
  DocsGetGuideInputSchema,
  type DocsOverviewOutput,
  type DocsSearchOutput,
  type DocsGetGuideOutput,
  type DocsHit,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import docsIndex from '../docs-index.generated.json';

/** One indexed doc section (matches the generator's output shape). */
interface DocsIndexSection {
  id: string;
  title: string;
  summary: string;
  headings: string[];
  markdown: string;
}

interface DocsIndexFile {
  generatedAt: string;
  sections: DocsIndexSection[];
}

const index = docsIndex as DocsIndexFile;

/** Max number of hits returned by `docs_search`. */
const MAX_HITS = 10;
/** Characters of context shown either side of a search match in a snippet. */
const SNIPPET_CONTEXT = 120;

/**
 * Build a short snippet centred on the first occurrence of `query` in `text`
 * (case-insensitive). Falls back to the start of the text when there is no
 * direct match (e.g. the match was only in the title/headings).
 */
function buildSnippet(text: string, query: string): string {
  const haystack = text.replace(/\s+/g, ' ').trim();
  const idx = haystack.toLowerCase().indexOf(query.toLowerCase());

  if (idx === -1) {
    const head = haystack.slice(0, SNIPPET_CONTEXT * 2).trim();
    return head.length < haystack.length ? `${head}…` : head;
  }

  const start = Math.max(0, idx - SNIPPET_CONTEXT);
  const end = Math.min(haystack.length, idx + query.length + SNIPPET_CONTEXT);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < haystack.length ? '…' : '';
  return `${prefix}${haystack.slice(start, end).trim()}${suffix}`;
}

/** Count case-insensitive occurrences of `needle` in `haystack`. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  const lowerHay = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  for (;;) {
    const at = lowerHay.indexOf(lowerNeedle, from);
    if (at === -1) break;
    count += 1;
    from = at + lowerNeedle.length;
  }
  return count;
}

/**
 * Score a section against a query. Title and heading matches are weighted most
 * heavily, then the summary, then body frequency. Returns 0 for no match.
 */
function scoreSection(section: DocsIndexSection, query: string): number {
  const q = query.toLowerCase();
  if (!q) return 0;

  let score = 0;

  const title = section.title.toLowerCase();
  if (title.includes(q)) score += title === q ? 12 : 8;

  const headingHits = section.headings.filter(h =>
    h.toLowerCase().includes(q)
  ).length;
  score += headingHits * 4;

  if (section.summary.toLowerCase().includes(q)) score += 3;

  score += Math.min(countOccurrences(section.markdown, q), 20);

  // `id`/slug match (e.g. searching for a guide id directly).
  if (section.id.toLowerCase().includes(q)) score += 2;

  return score;
}

export const registerDocsTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'docs_overview',
    {
      description:
        'List all Flemoji documentation sections with id, title, and a short summary.',
      inputSchema: DocsOverviewInputSchema.shape,
    },
    wrapTool(
      { name: 'docs_overview', scopes: ['docs:read'], ctx },
      async (): Promise<DocsOverviewOutput> => ({
        sections: index.sections.map(s => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
        })),
      })
    )
  );

  server.registerTool(
    'docs_search',
    {
      description:
        'Search Flemoji documentation by keyword; returns ranked hits with id, title, snippet, and score.',
      inputSchema: DocsSearchInputSchema.shape,
    },
    wrapTool(
      { name: 'docs_search', scopes: ['docs:read'], ctx },
      async (args: { query: string }): Promise<DocsSearchOutput> => {
        const query = args.query.trim();
        if (!query) return { hits: [] };

        const scored = index.sections
          .map(section => ({ section, score: scoreSection(section, query) }))
          .filter(entry => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_HITS);

        const hits: DocsHit[] = scored.map(({ section, score }) => ({
          id: section.id,
          title: section.title,
          snippet: buildSnippet(section.markdown, query),
          score,
        }));

        return { hits };
      }
    )
  );

  server.registerTool(
    'docs_get_guide',
    {
      description:
        'Fetch the full markdown of a single Flemoji documentation section by id.',
      inputSchema: DocsGetGuideInputSchema.shape,
    },
    wrapTool(
      { name: 'docs_get_guide', scopes: ['docs:read'], ctx },
      async (args: { id: string }): Promise<DocsGetGuideOutput> => {
        const section = index.sections.find(s => s.id === args.id);
        if (!section) {
          throw new McpError('not_found', `Unknown guide id: ${args.id}`, 404);
        }
        return {
          id: section.id,
          title: section.title,
          markdown: section.markdown,
        };
      }
    )
  );
};
