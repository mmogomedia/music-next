/**
 * MCP v2 system / self-description tools.
 *
 * Registered ONLY when the client negotiates `x-contract-version: 2`. These let
 * an AI client understand Flemoji's entire article system in one call and plan
 * content with confidence. Tool names + I/O are contractual (see contract.ts).
 * Every tool is registered through `wrapTool` for uniform enforcement.
 *
 * Tools (scopes in parentheses):
 *   - describe_article_system   (docs:read)     — runtime manifest of the model
 *   - list_tools_catalog        (docs:read)     — embeddable tool slugs
 *   - search_articles           (articles:read) — semantic article search
 *   - suggest_internal_links    (articles:read) — scored sibling-link suggestions
 *
 * `describe_article_system` is generated from the live contract + registry (see
 * `../system-manifest`). `search_articles` / `suggest_internal_links` delegate
 * to the existing pgvector semantic search (`searchArticlesBySemantic`) — no
 * duplicated retrieval logic.
 */

import { McpError } from '../auth';
import {
  DescribeArticleSystemInputSchema,
  ListToolsCatalogInputSchema,
  SearchArticlesInputSchema,
  SuggestInternalLinksInputSchema,
  type DescribeArticleSystemOutput,
  type ListToolsCatalogOutput,
  type SearchArticlesInput,
  type SearchArticlesOutput,
  type ArticleSearchHit,
  type SuggestInternalLinksInput,
  type SuggestInternalLinksOutput,
  type InternalLinkSuggestion,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import { buildSystemManifest } from '../system-manifest';
import { getAllTools } from '@/lib/tools/registry';
import {
  searchArticlesBySemantic,
  getArticleById,
} from '@/lib/services/article-service';

/** Default number of hits/suggestions returned when the caller omits `limit`. */
const DEFAULT_LIMIT = 10;

/**
 * Subset of the article fields returned by `searchArticlesBySemantic`. Its
 * Prisma `select` only surfaces these; notably `status`/`scheduledAt`/`updatedAt`
 * are NOT selected, but the search is restricted to PUBLISHED articles, so we
 * can safely fill `status` and fall back for `updatedAt`.
 */
interface SemanticArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | string | null;
  body?: string;
}

/** ISO-string a Date | string | null, or null. */
function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

/**
 * Synthesize a descending [0,1] relevance score from rank order. The semantic
 * service sorts by cosine similarity but does not surface the raw score, so we
 * approximate it monotonically: rank 0 → ~1.0, decreasing toward 0. This keeps
 * `hits`/`suggestions` ordered and comparable without re-running the vector
 * query or duplicating retrieval logic.
 */
function rankScore(index: number, total: number): number {
  if (total <= 1) return 1;
  const score = 1 - index / total;
  return Math.round(score * 1000) / 1000;
}

export const registerSystemTools: ToolRegistrar = (server, ctx) => {
  // ── describe_article_system ───────────────────────────────────────────────
  server.registerTool(
    'describe_article_system',
    {
      description:
        "Return a single machine-readable manifest of Flemoji's entire article system: the article + cluster data model (every field, type, writable tag, and mapping), the pillar/spoke methodology, internal-linking + keyword-tier rules, the publish/scheduling/versioning lifecycle, the embeddable-tool taxonomy, constraints, a runnable worked example plan, and the full v2 tool list. Call this once to understand everything needed to plan and create content.",
      inputSchema: DescribeArticleSystemInputSchema.shape,
    },
    wrapTool(
      { name: 'describe_article_system', scopes: ['docs:read'], ctx },
      async (): Promise<DescribeArticleSystemOutput> => buildSystemManifest()
    )
  );

  // ── list_tools_catalog ────────────────────────────────────────────────────
  server.registerTool(
    'list_tools_catalog',
    {
      description:
        'List the interactive tools an article may embed via toolSlugs[], each as { slug, name, category, description }. Use this to discover valid tool slugs before setting toolSlugs on an article.',
      inputSchema: ListToolsCatalogInputSchema.shape,
    },
    wrapTool(
      { name: 'list_tools_catalog', scopes: ['docs:read'], ctx },
      async (): Promise<ListToolsCatalogOutput> => ({
        tools: getAllTools().map(t => ({
          slug: t.slug,
          name: t.name,
          category: t.category,
          description: t.description,
        })),
      })
    )
  );

  // ── search_articles ───────────────────────────────────────────────────────
  server.registerTool(
    'search_articles',
    {
      description:
        'Semantic (pgvector) search over existing PUBLISHED articles. Returns article summaries each with a relevance score (highest first). Use it to find related content, avoid duplicating topics, and discover link targets.',
      inputSchema: SearchArticlesInputSchema.shape,
    },
    wrapTool(
      { name: 'search_articles', scopes: ['articles:read'], ctx },
      async (args: SearchArticlesInput): Promise<SearchArticlesOutput> => {
        const query = args.query.trim();
        if (!query) return { hits: [] };

        const limit = args.limit ?? DEFAULT_LIMIT;
        const results = (await searchArticlesBySemantic(query, {
          limit,
        })) as unknown as SemanticArticleRow[];

        const hits: ArticleSearchHit[] = results.map((row, index) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          // searchArticlesBySemantic only returns PUBLISHED rows.
          status: 'PUBLISHED',
          excerpt: row.excerpt ?? null,
          coverImageKey: row.coverImageUrl ?? null,
          scheduledAt: null,
          publishedAt: toIso(row.publishedAt),
          updatedAt: toIso(row.publishedAt) ?? new Date().toISOString(),
          score: rankScore(index, results.length),
        }));

        return { hits };
      }
    )
  );

  // ── suggest_internal_links ────────────────────────────────────────────────
  server.registerTool(
    'suggest_internal_links',
    {
      description:
        "Suggest sibling articles to cross-link, by semantic similarity to either an existing article (pass `id`) or a draft body (pass `draftBody`). Returns scored { slug, title, score, reason } — use the slugs in an article's internalLinks[]. Requires either `id` or `draftBody`.",
      inputSchema: SuggestInternalLinksInputSchema.shape,
    },
    wrapTool(
      { name: 'suggest_internal_links', scopes: ['articles:read'], ctx },
      async (
        args: SuggestInternalLinksInput
      ): Promise<SuggestInternalLinksOutput> => {
        if (!args.id && !args.draftBody) {
          throw new McpError(
            'bad_request',
            'Either `id` or `draftBody` is required',
            400
          );
        }

        // Build the semantic query text + remember the source slug (so an
        // article never suggests linking to itself).
        let queryText: string;
        let sourceSlug: string | null = null;

        if (args.id) {
          const article = await getArticleById(args.id);
          sourceSlug = article.slug;
          queryText = [
            article.title,
            article.excerpt ?? '',
            article.targetKeywords.join(', '),
            article.body,
          ]
            .filter(Boolean)
            .join('\n')
            .slice(0, 4000);
        } else {
          queryText = (args.draftBody ?? '').slice(0, 4000);
        }

        if (!queryText.trim()) return { suggestions: [] };

        const limit = args.limit ?? DEFAULT_LIMIT;
        // Over-fetch by one so removing the source article still leaves `limit`.
        const results = (await searchArticlesBySemantic(queryText, {
          limit: limit + 1,
        })) as unknown as SemanticArticleRow[];

        const filtered = results.filter(row => row.slug !== sourceSlug);

        const suggestions: InternalLinkSuggestion[] = filtered
          .slice(0, limit)
          .map((row, index) => ({
            slug: row.slug,
            title: row.title,
            score: rankScore(index, Math.min(filtered.length, limit)),
            reason: `Semantically related to ${
              args.id ? 'this article' : 'the draft'
            }: "${row.title}".`,
          }));

        return { suggestions };
      }
    )
  );
};
