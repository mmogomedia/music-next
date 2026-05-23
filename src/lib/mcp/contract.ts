/**
 * MCP Interface Contract v1 — Picasite ↔ Flemoji.
 *
 * This module is the SINGLE SOURCE OF TRUTH for every MCP tool's input/output
 * shape and the canonical article shape. ALL downstream MCP code (OAuth
 * endpoints, docs tools, article tools, image/scheduling tools, the webhook
 * emitter) imports its Zod schemas and inferred types from here.
 *
 * Tool names and I/O shapes are CONTRACTUAL — they must match Picasite's half
 * exactly (PICASITE_MCP_INTEGRATION_PLAN.md → "Interface Contract v1"). Do not
 * rename or restructure exported members without bumping MCP_CONTRACT_VERSION
 * and coordinating both sides.
 */

import { z } from 'zod';

/** Contract version negotiated via the `x-contract-version` request header. */
export const MCP_CONTRACT_VERSION = 1;

/** OAuth scopes recognised by the MCP server. */
export const MCP_SCOPES = [
  'docs:read',
  'articles:read',
  'articles:write',
] as const;
export type McpScope = (typeof MCP_SCOPES)[number];

// ---------------------------------------------------------------------------
// Article status (mirrors Prisma `ArticleStatus`).
// ---------------------------------------------------------------------------

export const ArticleStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type ArticleStatusValue = z.infer<typeof ArticleStatusSchema>;

// ---------------------------------------------------------------------------
// Social image element shape: { platform, key, url, alt? }.
// Stored on `Article.socialImages` (Json) and surfaced in article tools.
// ---------------------------------------------------------------------------

export const SocialImageSchema = z.object({
  platform: z.string(),
  key: z.string(),
  url: z.string(),
  alt: z.string().optional(),
});
export type SocialImage = z.infer<typeof SocialImageSchema>;

// ---------------------------------------------------------------------------
// Canonical article shape (the contract's article — maps onto Flemoji's
// `Article` model). Field order here is informational; the authoritative
// hashing order is `CANONICAL_ARTICLE_FIELDS` below.
//
// Canonical → Article mapping (the actual map/unmap fns live in the article
// tools module; this is the contract the article agent MUST honour):
//   title            ↔ Article.title
//   slug             ↔ Article.slug
//   body             ↔ Article.body            (markdown)
//   excerpt          ↔ Article.excerpt
//   seoTitle         ↔ Article.seoTitle
//   metaDescription  ↔ Article.metaDescription
//   keywords[]       ↔ Article.targetKeywords[]
//   coverImageKey    ↔ Article.coverImageUrl   (R2 key/URL)
//   socialImages[]   ↔ Article.socialImages    (Json)
//   scheduledAt      ↔ Article.scheduledAt
//   status           ↔ Article.status
//   publishedAt      ↔ Article.publishedAt
// ---------------------------------------------------------------------------

export const ArticleCanonicalSchema = z.object({
  title: z.string(),
  slug: z.string(),
  body: z.string(),
  excerpt: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  keywords: z.array(z.string()).default([]),
  coverImageKey: z.string().nullable().optional(),
  socialImages: z.array(SocialImageSchema).default([]),
  scheduledAt: z.string().datetime().nullable().optional(),
  status: ArticleStatusSchema,
  publishedAt: z.string().datetime().nullable().optional(),
});
export type ArticleCanonical = z.infer<typeof ArticleCanonicalSchema>;

/**
 * Canonical field names in STABLE order. Used to compute per-field hashes and
 * the combined `contentHash` deterministically on BOTH the article tools and
 * the webhook emitter. NEVER reorder without bumping the contract version —
 * doing so silently changes every content hash.
 */
export const CANONICAL_ARTICLE_FIELDS = [
  'title',
  'slug',
  'body',
  'excerpt',
  'seoTitle',
  'metaDescription',
  'keywords',
  'coverImageKey',
  'socialImages',
  'scheduledAt',
  'status',
  'publishedAt',
] as const;
export type CanonicalArticleField = (typeof CANONICAL_ARTICLE_FIELDS)[number];

/**
 * Per-field hash map returned by `get_article` (sha256 of each canonical
 * field's normalized value) and used for optimistic concurrency + webhook
 * `changedFields` diffing.
 */
export const FieldHashesSchema = z.record(z.string(), z.string());
export type FieldHashes = z.infer<typeof FieldHashesSchema>;

/** Lightweight article shape returned by `list_articles`. */
export const ArticleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: ArticleStatusSchema,
  excerpt: z.string().nullable().optional(),
  coverImageKey: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime(),
});
export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;

/** Full article shape returned by `get_article` (canonical + id + hashes). */
export const ArticleWithHashesSchema = ArticleCanonicalSchema.extend({
  id: z.string(),
  hashes: FieldHashesSchema,
  contentHash: z.string(),
});
export type ArticleWithHashes = z.infer<typeof ArticleWithHashesSchema>;

// ===========================================================================
// docs_* tool I/O
// ===========================================================================

export const DocsOverviewInputSchema = z.object({});
export type DocsOverviewInput = z.infer<typeof DocsOverviewInputSchema>;

export const DocsSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
});
export type DocsSection = z.infer<typeof DocsSectionSchema>;

export const DocsOverviewOutputSchema = z.object({
  sections: z.array(DocsSectionSchema),
});
export type DocsOverviewOutput = z.infer<typeof DocsOverviewOutputSchema>;

export const DocsSearchInputSchema = z.object({
  query: z.string(),
});
export type DocsSearchInput = z.infer<typeof DocsSearchInputSchema>;

export const DocsHitSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  score: z.number(),
});
export type DocsHit = z.infer<typeof DocsHitSchema>;

export const DocsSearchOutputSchema = z.object({
  hits: z.array(DocsHitSchema),
});
export type DocsSearchOutput = z.infer<typeof DocsSearchOutputSchema>;

export const DocsGetGuideInputSchema = z.object({
  id: z.string(),
});
export type DocsGetGuideInput = z.infer<typeof DocsGetGuideInputSchema>;

export const DocsGetGuideOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  markdown: z.string(),
});
export type DocsGetGuideOutput = z.infer<typeof DocsGetGuideOutputSchema>;

// ===========================================================================
// Article tool I/O
// ===========================================================================

export const ListArticlesInputSchema = z.object({
  status: ArticleStatusSchema.optional(),
  page: z.number().int().positive().optional(),
  q: z.string().optional(),
});
export type ListArticlesInput = z.infer<typeof ListArticlesInputSchema>;

export const ListArticlesOutputSchema = z.object({
  articles: z.array(ArticleSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});
export type ListArticlesOutput = z.infer<typeof ListArticlesOutputSchema>;

export const GetArticleInputSchema = z
  .object({
    id: z.string().optional(),
    slug: z.string().optional(),
  })
  .refine(v => Boolean(v.id) || Boolean(v.slug), {
    message: 'Either `id` or `slug` is required',
  });
export type GetArticleInput = z.infer<typeof GetArticleInputSchema>;

/** `get_article` returns the full article with per-field hashes for sync. */
export const GetArticleOutputSchema = ArticleWithHashesSchema;
export type GetArticleOutput = z.infer<typeof GetArticleOutputSchema>;

/** Canonical fields accepted on create (status/slug optional → defaulted). */
export const CreateArticleInputSchema = ArticleCanonicalSchema.extend({
  slug: z.string().optional(),
  status: ArticleStatusSchema.optional(),
  keywords: z.array(z.string()).optional(),
  socialImages: z.array(SocialImageSchema).optional(),
});
export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

export const CreateArticleOutputSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
});
export type CreateArticleOutput = z.infer<typeof CreateArticleOutputSchema>;

/** Partial canonical patch for update. */
export const ArticlePatchSchema = ArticleCanonicalSchema.partial();
export type ArticlePatch = z.infer<typeof ArticlePatchSchema>;

export const UpdateArticleInputSchema = z.object({
  id: z.string(),
  patch: ArticlePatchSchema,
  /**
   * Optimistic concurrency: when provided, the article tool compares it to the
   * current `contentHash`; on mismatch it throws an McpError code `conflict`
   * (httpStatus 409) carrying the current per-field hashes in `detail`.
   */
  baseHash: z.string().optional(),
});
export type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;

export const UpdateArticleOutputSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
});
export type UpdateArticleOutput = z.infer<typeof UpdateArticleOutputSchema>;

export const DeleteArticleInputSchema = z.object({
  id: z.string(),
  /** `true` = hard delete; otherwise soft-delete (status → ARCHIVED). */
  hard: z.boolean().optional(),
});
export type DeleteArticleInput = z.infer<typeof DeleteArticleInputSchema>;

export const DeleteArticleOutputSchema = z.object({
  id: z.string(),
  status: z.string(),
});
export type DeleteArticleOutput = z.infer<typeof DeleteArticleOutputSchema>;

// ===========================================================================
// Image ingest tool I/O
// ===========================================================================

export const IngestImageKindSchema = z.enum(['hero', 'social']);
export type IngestImageKind = z.infer<typeof IngestImageKindSchema>;

export const IngestImageInputSchema = z
  .object({
    bytesBase64: z.string().optional(),
    url: z.string().url().optional(),
    kind: IngestImageKindSchema,
    alt: z.string().optional(),
  })
  .refine(v => Boolean(v.bytesBase64) || Boolean(v.url), {
    message: 'Either `bytesBase64` or `url` is required',
  });
export type IngestImageInput = z.infer<typeof IngestImageInputSchema>;

export const IngestImageOutputSchema = z.object({
  key: z.string(),
  url: z.string(),
});
export type IngestImageOutput = z.infer<typeof IngestImageOutputSchema>;

// ===========================================================================
// Scheduling tool I/O
// ===========================================================================

export const SetScheduleInputSchema = z.object({
  id: z.string(),
  /** ISO-8601 datetime, or null to clear the schedule. */
  scheduledAt: z.string().datetime().nullable(),
});
export type SetScheduleInput = z.infer<typeof SetScheduleInputSchema>;

export const SetScheduleOutputSchema = z.object({
  id: z.string(),
  scheduledAt: z.string().datetime().nullable(),
});
export type SetScheduleOutput = z.infer<typeof SetScheduleOutputSchema>;

export const PublishArticleInputSchema = z.object({
  id: z.string(),
});
export type PublishArticleInput = z.infer<typeof PublishArticleInputSchema>;

export const PublishArticleOutputSchema = z.object({
  id: z.string(),
  status: ArticleStatusSchema,
  publishedAt: z.string().datetime().nullable(),
});
export type PublishArticleOutput = z.infer<typeof PublishArticleOutputSchema>;

// ===========================================================================
// Change webhook (Flemoji → Picasite) body shape.
// ===========================================================================

export const WebhookEventSchema = z.enum([
  'article.created',
  'article.updated',
  'article.published',
  'article.deleted',
]);
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

export const WebhookPayloadSchema = z.object({
  siteId: z.string(),
  event: WebhookEventSchema,
  articleId: z.string(),
  slug: z.string(),
  contentHash: z.string(),
  changedFields: z.array(z.string()),
  at: z.string().datetime(),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
