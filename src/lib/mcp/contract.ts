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

/**
 * Contract versions this server accepts on the `x-contract-version` header.
 * `1` keeps every v1 client working unchanged; `2` additionally exposes the
 * cluster / system / plan tools and the extended canonical article fields.
 */
export const MCP_CONTRACT_VERSIONS = [1, 2] as const;
export type McpContractVersion = (typeof MCP_CONTRACT_VERSIONS)[number];

/** The newest contract version this server implements (advertised in v2 docs). */
export const MCP_CONTRACT_VERSION_LATEST = 2;

/**
 * OAuth scopes recognised by the MCP server. The `clusters:*` scopes are v2
 * additions; `docs:read` / `articles:read` / `articles:write` stay unchanged so
 * v1 tokens keep working.
 */
export const MCP_SCOPES = [
  'docs:read',
  'articles:read',
  'articles:write',
  'clusters:read',
  'clusters:write',
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

// ===========================================================================
// ===========================================================================
//  CONTRACT v2 — clusters, full-field articles, self-description & planning.
//
//  Everything below is gated behind `x-contract-version: 2`. The v1 exports
//  above are FROZEN: v2 builds on top of them and must never break them. All
//  newly-added article fields are OPTIONAL so existing v1 create/update calls
//  still validate against the v2 schemas.
// ===========================================================================
// ===========================================================================

// ---------------------------------------------------------------------------
// Cluster role (mirrors Prisma `ClusterRole`). A cluster has exactly one
// PILLAR and many SPOKEs.
// ---------------------------------------------------------------------------

export const ClusterRoleSchema = z.enum(['PILLAR', 'SPOKE']);
export type ClusterRoleValue = z.infer<typeof ClusterRoleSchema>;

// ---------------------------------------------------------------------------
// Canonical article shape — v2 (full coverage).
//
// Extends the v1 canonical article with every remaining AI-writable `Article`
// column. The new fields map 1:1 onto their Prisma columns unless noted:
//   primaryKeyword  ↔ Article.primaryKeyword   (single most-important keyword)
//   internalLinks[] ↔ Article.internalLinks[]  (slugs of sibling articles)
//   toolSlugs[]     ↔ Article.toolSlugs[]      (embeddable tool slugs)
//   ctaText         ↔ Article.ctaText
//   ctaLink         ↔ Article.ctaLink
//   clusterId       ↔ Article.clusterId        (parent cluster, nullable)
//   clusterRole     ↔ Article.clusterRole      (PILLAR | SPOKE, default SPOKE)
// (v1 fields keep their v1 mapping: keywords↔targetKeywords,
//  coverImageKey↔coverImageUrl, the rest 1:1.)
//
// `readTime` (↔ Article.readTime) is DERIVED/read-only — it is NOT on this
// input schema; it only appears on the v2 OUTPUT shapes below and is never
// hashed.
// ---------------------------------------------------------------------------

/**
 * External source citation. Tracks where the article's information came
 * from — populated automatically when the MCP client (e.g. Picasite)
 * runs a web search or fetches a URL during planning/drafting. Stored
 * on `Article.references` (Json column) so it survives publish and can
 * be rendered as a "Sources" section on the live article.
 */
export const ArticleReferenceSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  /** Short excerpt from the source (search hit content or page summary). */
  snippet: z.string().optional(),
  /** ISO timestamp of when the source was looked up. */
  accessedAt: z.string(),
  /** Where this reference was captured in the client's pipeline. */
  source: z.enum(['web_search', 'fetch_page', 'manual']).optional(),
});
export type ArticleReference = z.infer<typeof ArticleReferenceSchema>;

export const ArticleCanonicalV2Schema = ArticleCanonicalSchema.extend({
  primaryKeyword: z.string().nullable().optional(),
  internalLinks: z.array(z.string()).default([]),
  toolSlugs: z.array(z.string()).default([]),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  clusterId: z.string().nullable().optional(),
  clusterRole: ClusterRoleSchema.optional(),
  /**
   * Citation list. Deliberately EXCLUDED from CANONICAL_ARTICLE_FIELDS_V2
   * below — references don't participate in content hashing or webhook
   * changedFields. Treat like `socialImages` / `readTime`: persisted but
   * not part of the optimistic-concurrency contract. Lets clients update
   * references without invalidating other clients' baseHash.
   */
  references: z.array(ArticleReferenceSchema).default([]),
});
export type ArticleCanonicalV2 = z.infer<typeof ArticleCanonicalV2Schema>;

/**
 * Canonical article field names — v2, STABLE order. v1 fields first (same order
 * as `CANONICAL_ARTICLE_FIELDS`) followed by the new ai-writable fields. Used to
 * compute per-field hashes + `contentHash` under contract v2 so concurrency and
 * webhook `changedFields` cover the extended set.
 *
 * Excludes DERIVED/MANAGED columns (readTime, id, createdAt, updatedAt) — those
 * are never hashed. NEVER reorder without bumping the contract version.
 */
export const CANONICAL_ARTICLE_FIELDS_V2 = [
  ...CANONICAL_ARTICLE_FIELDS,
  'primaryKeyword',
  'internalLinks',
  'toolSlugs',
  'ctaText',
  'ctaLink',
  'clusterId',
  'clusterRole',
] as const;
export type CanonicalArticleFieldV2 =
  (typeof CANONICAL_ARTICLE_FIELDS_V2)[number];

/** Lightweight v2 article summary (v1 summary + cluster membership). */
export const ArticleSummaryV2Schema = ArticleSummarySchema.extend({
  clusterId: z.string().nullable().optional(),
  clusterRole: ClusterRoleSchema.optional(),
  readTime: z.number().int().nonnegative().optional(),
});
export type ArticleSummaryV2 = z.infer<typeof ArticleSummaryV2Schema>;

/**
 * Full v2 article shape returned by `get_article` under contract v2: canonical
 * v2 fields + the DERIVED `readTime` + id + per-field hashes (over
 * `CANONICAL_ARTICLE_FIELDS_V2`) + combined `contentHash`.
 */
export const ArticleWithHashesV2Schema = ArticleCanonicalV2Schema.extend({
  id: z.string(),
  readTime: z.number().int().nonnegative(),
  hashes: FieldHashesSchema,
  contentHash: z.string(),
});
export type ArticleWithHashesV2 = z.infer<typeof ArticleWithHashesV2Schema>;

// ---------------------------------------------------------------------------
// Article tool I/O — v2 (supersets of the v1 article tool I/O). v1 clients can
// keep calling with the v1 field set: every new field is optional, so omitting
// them validates exactly as before. The article tools switch to these schemas
// under both contract versions; the version-aware hashing in the service is what
// actually distinguishes v1 from v2 behaviour.
// ---------------------------------------------------------------------------

/** Canonical v2 fields accepted on create (status/slug optional → defaulted). */
export const CreateArticleInputV2Schema = ArticleCanonicalV2Schema.extend({
  slug: z.string().optional(),
  status: ArticleStatusSchema.optional(),
  keywords: z.array(z.string()).optional(),
  socialImages: z.array(SocialImageSchema).optional(),
  internalLinks: z.array(z.string()).optional(),
  toolSlugs: z.array(z.string()).optional(),
});
export type CreateArticleInputV2 = z.infer<typeof CreateArticleInputV2Schema>;

/** Partial canonical v2 patch for update. */
export const ArticlePatchV2Schema = ArticleCanonicalV2Schema.partial();
export type ArticlePatchV2 = z.infer<typeof ArticlePatchV2Schema>;

export const UpdateArticleInputV2Schema = z.object({
  id: z.string(),
  patch: ArticlePatchV2Schema,
  /**
   * Optimistic concurrency: when provided, the article tool compares it to the
   * current `contentHash` (computed over the version-appropriate field set); on
   * mismatch it throws McpError code `conflict` (httpStatus 409) carrying the
   * current per-field hashes in `detail`.
   */
  baseHash: z.string().optional(),
});
export type UpdateArticleInputV2 = z.infer<typeof UpdateArticleInputV2Schema>;

/** `get_article` (v2) returns the full v2 article with `readTime` + hashes. */
export const GetArticleOutputV2Schema = ArticleWithHashesV2Schema;
export type GetArticleOutputV2 = z.infer<typeof GetArticleOutputV2Schema>;

export const ListArticlesOutputV2Schema = z.object({
  articles: z.array(ArticleSummaryV2Schema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});
export type ListArticlesOutputV2 = z.infer<typeof ListArticlesOutputV2Schema>;

// ===========================================================================
// Canonical cluster shape — v2 (maps onto Prisma `ArticleCluster`).
//
// Cluster canonical ↔ ArticleCluster column map:
//   name, slug, description, about, goal      → same
//   coverImageKey                             ↔ coverImageUrl (R2 key/URL)
//   primaryKeywords[], secondaryKeywords[],
//     longTailKeywords[]                      → same
//   audience, status                          → same
//   targetKeywords[] (DERIVED, combined)      ↔ targetKeywords (read-only)
//   id, createdAt, updatedAt (DERIVED)        → same (read-only)
// ===========================================================================

export const ClusterCanonicalSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  coverImageKey: z.string().nullable().optional(),
  primaryKeywords: z.array(z.string()).default([]),
  secondaryKeywords: z.array(z.string()).default([]),
  longTailKeywords: z.array(z.string()).default([]),
  audience: z.string().nullable().optional(),
  status: ArticleStatusSchema,
});
export type ClusterCanonical = z.infer<typeof ClusterCanonicalSchema>;

/**
 * Canonical cluster field names in STABLE order — used for per-field hashing +
 * `contentHash` on clusters. Excludes DERIVED columns (targetKeywords, id,
 * createdAt, updatedAt). NEVER reorder without bumping the contract version.
 */
export const CANONICAL_CLUSTER_FIELDS = [
  'name',
  'slug',
  'description',
  'about',
  'goal',
  'coverImageKey',
  'primaryKeywords',
  'secondaryKeywords',
  'longTailKeywords',
  'audience',
  'status',
] as const;
export type CanonicalClusterField = (typeof CANONICAL_CLUSTER_FIELDS)[number];

/** Lightweight cluster shape returned by `list_clusters`. */
export const ClusterSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: ArticleStatusSchema,
  description: z.string().nullable().optional(),
  coverImageKey: z.string().nullable().optional(),
  /** DERIVED: combined keyword set across all tiers. */
  targetKeywords: z.array(z.string()).default([]),
  /** DERIVED: number of articles assigned to this cluster. */
  articleCount: z.number().int().nonnegative().default(0),
  updatedAt: z.string().datetime(),
});
export type ClusterSummary = z.infer<typeof ClusterSummarySchema>;

/** A cluster member as returned inside `get_cluster`. */
export const ClusterMemberSchema = z.object({
  articleId: z.string(),
  slug: z.string(),
  title: z.string(),
  clusterRole: ClusterRoleSchema,
  status: ArticleStatusSchema,
});
export type ClusterMember = z.infer<typeof ClusterMemberSchema>;

/**
 * Full cluster shape returned by `get_cluster`: canonical + id + the DERIVED
 * combined `targetKeywords` + members[] + per-field `hashes` (over
 * `CANONICAL_CLUSTER_FIELDS`) + combined `contentHash`.
 */
export const ClusterWithHashesSchema = ClusterCanonicalSchema.extend({
  id: z.string(),
  /** DERIVED/read-only: combined keyword set across all tiers. */
  targetKeywords: z.array(z.string()).default([]),
  members: z.array(ClusterMemberSchema).default([]),
  hashes: FieldHashesSchema,
  contentHash: z.string(),
});
export type ClusterWithHashes = z.infer<typeof ClusterWithHashesSchema>;

// ===========================================================================
// Cluster tool I/O (scopes noted in each tool's registrar).
// ===========================================================================

export const ListClustersInputSchema = z.object({
  status: ArticleStatusSchema.optional(),
  q: z.string().optional(),
});
export type ListClustersInput = z.infer<typeof ListClustersInputSchema>;

export const ListClustersOutputSchema = z.object({
  clusters: z.array(ClusterSummarySchema),
});
export type ListClustersOutput = z.infer<typeof ListClustersOutputSchema>;

export const GetClusterInputSchema = z
  .object({
    id: z.string().optional(),
    slug: z.string().optional(),
  })
  .refine(v => Boolean(v.id) || Boolean(v.slug), {
    message: 'Either `id` or `slug` is required',
  });
export type GetClusterInput = z.infer<typeof GetClusterInputSchema>;

/** `get_cluster` returns the full cluster with members + per-field hashes. */
export const GetClusterOutputSchema = ClusterWithHashesSchema;
export type GetClusterOutput = z.infer<typeof GetClusterOutputSchema>;

/** Canonical cluster fields accepted on create (status/slug optional). */
export const CreateClusterInputSchema = ClusterCanonicalSchema.extend({
  slug: z.string().optional(),
  status: ArticleStatusSchema.optional(),
  primaryKeywords: z.array(z.string()).optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  longTailKeywords: z.array(z.string()).optional(),
});
export type CreateClusterInput = z.infer<typeof CreateClusterInputSchema>;

export const CreateClusterOutputSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
});
export type CreateClusterOutput = z.infer<typeof CreateClusterOutputSchema>;

/** Partial canonical cluster patch for update. */
export const ClusterPatchSchema = ClusterCanonicalSchema.partial();
export type ClusterPatch = z.infer<typeof ClusterPatchSchema>;

export const UpdateClusterInputSchema = z.object({
  id: z.string(),
  patch: ClusterPatchSchema,
  /**
   * Optimistic concurrency: when provided, compared to the current cluster
   * `contentHash`; on mismatch the tool throws McpError code `conflict`
   * (httpStatus 409) carrying the current per-field hashes in `detail`.
   */
  baseHash: z.string().optional(),
});
export type UpdateClusterInput = z.infer<typeof UpdateClusterInputSchema>;

export const UpdateClusterOutputSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
});
export type UpdateClusterOutput = z.infer<typeof UpdateClusterOutputSchema>;

export const DeleteClusterInputSchema = z.object({
  id: z.string(),
});
export type DeleteClusterInput = z.infer<typeof DeleteClusterInputSchema>;

/** Deleting a cluster unassigns its members; it never hard-deletes articles. */
export const DeleteClusterOutputSchema = z.object({
  id: z.string(),
  status: z.string(),
});
export type DeleteClusterOutput = z.infer<typeof DeleteClusterOutputSchema>;

// ===========================================================================
// System self-description tool I/O.
// ===========================================================================

/**
 * `describe_article_system` output. The runtime payload is assembled from the
 * live Zod schemas + tool registry (so it can't drift from reality), which is
 * richer/looser than a hand-frozen schema would allow — hence a passthrough
 * object. See FLEMOJI_MCP_V2_PLAN.md → "describe_article_system() output" for
 * the contractual top-level keys (contractVersion, entities, methodology,
 * taxonomy, examples, constraints, tools).
 */
export const DescribeArticleSystemInputSchema = z.object({});
export type DescribeArticleSystemInput = z.infer<
  typeof DescribeArticleSystemInputSchema
>;

export const DescribeArticleSystemOutputSchema = z
  .object({
    contractVersion: z.number().optional(),
  })
  .passthrough();
export type DescribeArticleSystemOutput = z.infer<
  typeof DescribeArticleSystemOutputSchema
>;

// ---------------------------------------------------------------------------
// list_tools_catalog — the embeddable `toolSlugs` an article may reference,
// sourced from `@/lib/tools/registry` getAllTools().
// ---------------------------------------------------------------------------

export const ToolCatalogEntrySchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
});
export type ToolCatalogEntry = z.infer<typeof ToolCatalogEntrySchema>;

export const ListToolsCatalogInputSchema = z.object({});
export type ListToolsCatalogInput = z.infer<typeof ListToolsCatalogInputSchema>;

export const ListToolsCatalogOutputSchema = z.object({
  tools: z.array(ToolCatalogEntrySchema),
});
export type ListToolsCatalogOutput = z.infer<
  typeof ListToolsCatalogOutputSchema
>;

// ---------------------------------------------------------------------------
// search_articles — semantic search over existing articles (pgvector).
// ---------------------------------------------------------------------------

export const SearchArticlesInputSchema = z.object({
  query: z.string(),
  limit: z.number().int().positive().optional(),
});
export type SearchArticlesInput = z.infer<typeof SearchArticlesInputSchema>;

/** A semantic search hit: an article summary plus a relevance score. */
export const ArticleSearchHitSchema = ArticleSummarySchema.extend({
  score: z.number(),
});
export type ArticleSearchHit = z.infer<typeof ArticleSearchHitSchema>;

export const SearchArticlesOutputSchema = z.object({
  hits: z.array(ArticleSearchHitSchema),
});
export type SearchArticlesOutput = z.infer<typeof SearchArticlesOutputSchema>;

// ---------------------------------------------------------------------------
// suggest_internal_links — semantic suggestions of sibling articles to link.
// ---------------------------------------------------------------------------

export const SuggestInternalLinksInputSchema = z
  .object({
    id: z.string().optional(),
    draftBody: z.string().optional(),
    limit: z.number().int().positive().optional(),
  })
  .refine(v => Boolean(v.id) || Boolean(v.draftBody), {
    message: 'Either `id` or `draftBody` is required',
  });
export type SuggestInternalLinksInput = z.infer<
  typeof SuggestInternalLinksInputSchema
>;

export const InternalLinkSuggestionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  score: z.number(),
  reason: z.string(),
});
export type InternalLinkSuggestion = z.infer<
  typeof InternalLinkSuggestionSchema
>;

export const SuggestInternalLinksOutputSchema = z.object({
  suggestions: z.array(InternalLinkSuggestionSchema),
});
export type SuggestInternalLinksOutput = z.infer<
  typeof SuggestInternalLinksOutputSchema
>;

// ===========================================================================
// Content planning — DraftArticle / ContentPlan / validate / apply.
// ===========================================================================

/**
 * A single article in a content plan: a partial canonical-v2 article with
 * `title` and `clusterRole` REQUIRED (everything else optional so a planner can
 * sketch a cluster before filling every field). `slug` defaults from `title`
 * downstream; spokes carry `internalLinks` pointing at the pillar slug.
 */
export const DraftArticleSchema = ArticleCanonicalV2Schema.partial().extend({
  title: z.string(),
  clusterRole: ClusterRoleSchema,
});
export type DraftArticle = z.infer<typeof DraftArticleSchema>;

/**
 * A whole content plan: an optional cluster definition plus the articles
 * (pillar + spokes) to create/update, and optional explicit cross-links.
 * `links` is an adjacency list: each entry links a source slug to target slugs.
 */
export const ContentPlanLinkSchema = z.object({
  from: z.string(),
  to: z.array(z.string()).default([]),
});
export type ContentPlanLink = z.infer<typeof ContentPlanLinkSchema>;

export const ContentPlanSchema = z.object({
  cluster: ClusterCanonicalSchema.optional(),
  articles: z.array(DraftArticleSchema),
  links: z.array(ContentPlanLinkSchema).optional(),
});
export type ContentPlan = z.infer<typeof ContentPlanSchema>;

/** Severity of a single validation finding. */
export const ValidationLevelSchema = z.enum(['error', 'warn']);
export type ValidationLevel = z.infer<typeof ValidationLevelSchema>;

/** One validation finding from `validate_content_plan`. */
export const ValidationIssueSchema = z.object({
  level: ValidationLevelSchema,
  code: z.string(),
  message: z.string(),
  /** Optional JSON-path-ish locator into the plan (e.g. `articles[2].slug`). */
  path: z.string().optional(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidateContentPlanInputSchema = ContentPlanSchema;
export type ValidateContentPlanInput = z.infer<
  typeof ValidateContentPlanInputSchema
>;

/**
 * `validate_content_plan` is a pure dry-run (no writes). `ok` is false when any
 * `error`-level issue is present. `normalized` echoes the plan after defaulting
 * (slugs filled, etc.) when validation passes.
 */
export const ValidateContentPlanOutputSchema = z.object({
  ok: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  normalized: ContentPlanSchema.optional(),
});
export type ValidateContentPlanOutput = z.infer<
  typeof ValidateContentPlanOutputSchema
>;

export const ApplyContentPlanInputSchema = ContentPlanSchema;
export type ApplyContentPlanInput = z.infer<typeof ApplyContentPlanInputSchema>;

/** One applied article result: its id, slug, and resulting contentHash. */
export const AppliedArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  contentHash: z.string(),
});
export type AppliedArticle = z.infer<typeof AppliedArticleSchema>;

/**
 * `apply_content_plan` result. `clusterId` is set when a cluster was created or
 * updated; `created`/`updated` are the article ids partitioned by operation.
 */
export const ApplyContentPlanOutputSchema = z.object({
  clusterId: z.string().optional(),
  articles: z.array(AppliedArticleSchema),
  created: z.array(z.string()).default([]),
  updated: z.array(z.string()).default([]),
});
export type ApplyContentPlanOutput = z.infer<
  typeof ApplyContentPlanOutputSchema
>;

// ===========================================================================
// Change webhook v2 — cluster + membership events (Flemoji → Picasite).
//
// Keeps every v1 article event; ADDS cluster lifecycle events so a mirror stays
// 1:1. Article cluster-membership changes are still emitted as `article.updated`
// with `clusterId`/`clusterRole` in `changedFields` (no new article event).
// ===========================================================================

export const ClusterWebhookEventSchema = z.enum([
  'cluster.created',
  'cluster.updated',
  'cluster.deleted',
]);
export type ClusterWebhookEvent = z.infer<typeof ClusterWebhookEventSchema>;

/** Union of all v2 webhook events (article v1 events + cluster events). */
export const WebhookEventV2Schema = z.union([
  WebhookEventSchema,
  ClusterWebhookEventSchema,
]);
export type WebhookEventV2 = z.infer<typeof WebhookEventV2Schema>;

/** Cluster webhook envelope — mirrors the article envelope (clusterId vs articleId). */
export const ClusterWebhookPayloadSchema = z.object({
  siteId: z.string(),
  event: ClusterWebhookEventSchema,
  clusterId: z.string(),
  slug: z.string(),
  contentHash: z.string(),
  changedFields: z.array(z.string()),
  at: z.string().datetime(),
});
export type ClusterWebhookPayload = z.infer<typeof ClusterWebhookPayloadSchema>;
