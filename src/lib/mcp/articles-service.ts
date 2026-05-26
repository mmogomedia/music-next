/**
 * MCP article service — the core that backs the article MCP tools.
 *
 * This module is a THIN MCP-facing adapter over Flemoji's existing article
 * service (`@/lib/services/article-service`) and the `@/lib/db` Prisma
 * singleton. It does NOT duplicate business logic (slugify, version snapshots,
 * publish/TimelinePost/embedding) — it delegates to the existing helpers and
 * only adds:
 *   - canonical ↔ Article field mapping (per `CANONICAL_ARTICLE_FIELDS`),
 *   - per-field + content hashing for sync / optimistic concurrency,
 *   - change-webhook emission on create/update/delete/publish.
 *
 * Canonical → Article column map (see contract.ts):
 *   keywords[]      ↔ targetKeywords[]
 *   coverImageKey   ↔ coverImageUrl
 *   socialImages    ↔ socialImages (Json, additive column)
 *   scheduledAt     ↔ scheduledAt   (additive column)
 *   primaryKeyword  ↔ primaryKeyword     (v2 ai-writable)
 *   internalLinks[] ↔ internalLinks[]    (v2 ai-writable, sibling slugs)
 *   toolSlugs[]     ↔ toolSlugs[]        (v2 ai-writable, embeddable tools)
 *   ctaText/ctaLink ↔ ctaText/ctaLink    (v2 ai-writable)
 *   clusterId       ↔ clusterId          (v2 ai-writable, parent cluster)
 *   clusterRole     ↔ clusterRole        (v2 ai-writable, PILLAR|SPOKE)
 *   readTime        ↔ readTime           (v2 DERIVED/read-only, never hashed)
 *   rest 1:1 (title, slug, body, excerpt, seoTitle, metaDescription, status,
 *   publishedAt).
 *
 * Version-aware hashing: every row is always mapped to the FULL v2 canonical
 * superset (harmless to v1 JSON consumers — they ignore the extra keys). The
 * per-field + content hashes, however, are computed over the field set that
 * matches the negotiated contract version — `CANONICAL_ARTICLE_FIELDS` for v1,
 * `CANONICAL_ARTICLE_FIELDS_V2` for v2 — so v1 contentHashes are preserved
 * bit-for-bit while v2 hashes additionally cover the new ai-writable fields.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { McpError } from './auth';
import { fieldHashesFor, contentHashFor, changedFieldsFor } from './crypto';
import {
  ArticleCanonicalV2Schema,
  ArticleReferenceSchema,
  ArticleStatusSchema,
  ClusterRoleSchema,
  SocialImageSchema,
  CANONICAL_ARTICLE_FIELDS,
  CANONICAL_ARTICLE_FIELDS_V2,
  type ArticleCanonicalV2,
  type ArticleReference,
  type ArticlePatchV2,
  type ArticleSummaryV2,
  type ArticleWithHashesV2,
  type ClusterRoleValue,
  type CreateArticleInputV2,
  type ListArticlesInput,
  type ListArticlesOutputV2,
  type GetArticleInput,
  type SocialImage,
} from './contract';
import {
  getArticles,
  createArticle as createArticleSvc,
  updateArticle as updateArticleSvc,
  publishArticle as publishArticleSvc,
  slugify,
} from '@/lib/services/article-service';
import { emitArticleEvent } from './webhook';

/**
 * Select the STABLE canonical field list to hash with, given the negotiated
 * contract version. v1 → v1 field set (preserves legacy hashes exactly); v2 (or
 * anything ≥ 2) → the extended v2 field set.
 */
function fieldsFor(contractVersion: number): readonly string[] {
  return contractVersion >= 2
    ? CANONICAL_ARTICLE_FIELDS_V2
    : CANONICAL_ARTICLE_FIELDS;
}

// ---------------------------------------------------------------------------
// Internal: a row shape covering every column we map to/from canonical. We read
// these via the existing service (which returns the full Prisma row) plus the
// two additive columns (`scheduledAt`, `socialImages`) that the public
// `Article` type does not yet expose.
// ---------------------------------------------------------------------------

interface ArticleRowLike {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  targetKeywords: string[];
  coverImageUrl: string | null;
  socialImages?: unknown;
  references?: unknown;
  scheduledAt?: Date | string | null;
  status: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  // v2 ai-writable columns.
  primaryKeyword?: string | null;
  internalLinks?: string[];
  toolSlugs?: string[];
  ctaText?: string | null;
  ctaLink?: string | null;
  clusterId?: string | null;
  clusterRole?: string | null;
  // v2 derived (read-only) column.
  readTime?: number | null;
}

/** Coerce a Date | string | null into an ISO string or null. */
function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

/** Parse the loosely-typed `socialImages` Json column into typed elements. */
function parseSocialImages(value: unknown): SocialImage[] {
  if (!Array.isArray(value)) return [];
  const parsed = SocialImageSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Parse the loosely-typed `references` Json column into typed elements. */
function parseReferences(value: unknown) {
  if (!Array.isArray(value)) return [];
  const parsed = ArticleReferenceSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

// ---------------------------------------------------------------------------
// Mapping: Article row → canonical, and canonical/patch → Article data.
// ---------------------------------------------------------------------------

/** Coerce a possibly-null clusterRole column into a valid enum value. */
function parseClusterRole(value: unknown): ClusterRoleValue | undefined {
  const parsed = ClusterRoleSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Map a Flemoji Article row onto the contract's FULL v2 canonical article shape
 * (a superset of v1). v1 JSON consumers simply ignore the extra keys; v1 hashing
 * only ever reads the v1 fields. `readTime` is DERIVED and intentionally NOT on
 * the canonical (input) shape — it is surfaced separately on output shapes.
 */
export function mapArticleToCanonical(
  article: ArticleRowLike
): ArticleCanonicalV2 {
  return ArticleCanonicalV2Schema.parse({
    title: article.title,
    slug: article.slug,
    body: article.body,
    excerpt: article.excerpt ?? null,
    seoTitle: article.seoTitle ?? null,
    metaDescription: article.metaDescription ?? null,
    keywords: article.targetKeywords ?? [],
    coverImageKey: article.coverImageUrl ?? null,
    socialImages: parseSocialImages(article.socialImages),
    references: parseReferences(article.references),
    scheduledAt: toIso(article.scheduledAt ?? null),
    status: article.status,
    publishedAt: toIso(article.publishedAt ?? null),
    primaryKeyword: article.primaryKeyword ?? null,
    internalLinks: article.internalLinks ?? [],
    toolSlugs: article.toolSlugs ?? [],
    ctaText: article.ctaText ?? null,
    ctaLink: article.ctaLink ?? null,
    clusterId: article.clusterId ?? null,
    clusterRole: parseClusterRole(article.clusterRole),
  });
}

/** The DERIVED read time for a row (0 when the column is unset). */
function rowReadTime(article: ArticleRowLike): number {
  return typeof article.readTime === 'number' ? article.readTime : 0;
}

/**
 * Shape produced by `canonicalToArticleData`:
 *  - `svc`   — the subset the existing `createArticle`/`updateArticle` service
 *              understands. This already includes the v2 ai-writable columns
 *              (primaryKeyword, internalLinks, toolSlugs, ctaText, ctaLink,
 *              clusterId, clusterRole), so they flow through the service path
 *              (which also keeps the ContentLink tool-graph + version snapshots
 *              in sync) rather than a raw Prisma write.
 *  - `extra` — the additive columns the service does NOT handle (`scheduledAt`,
 *              `socialImages`), written directly via `buildExtraUpdateData`.
 */
interface MappedArticleData {
  svc: {
    title?: string;
    slug?: string;
    body?: string;
    excerpt?: string;
    coverImageUrl?: string;
    seoTitle?: string;
    metaDescription?: string;
    targetKeywords?: string[];
    primaryKeyword?: string;
    internalLinks?: string[];
    toolSlugs?: string[];
    ctaText?: string;
    ctaLink?: string;
    clusterId?: string;
    clusterRole?: ClusterRoleValue;
  };
  extra: {
    scheduledAt?: Date | null;
    socialImages?: SocialImage[];
    references?: ArticleReference[];
  };
  hasExtra: boolean;
}

/**
 * Inverse of `mapArticleToCanonical`: map a canonical v2 article (or partial
 * patch) onto the data shapes consumed by the existing service + the additive
 * columns. Only keys present on `input` are emitted, so this works for both
 * create (full) and update (partial patch), and for both v1 and v2 callers (v1
 * callers simply never set the new keys).
 */
export function canonicalToArticleData(
  input: Partial<ArticleCanonicalV2>
): MappedArticleData {
  const svc: MappedArticleData['svc'] = {};
  const extra: MappedArticleData['extra'] = {};
  let hasExtra = false;

  if (input.title !== undefined) svc.title = input.title;
  if (input.slug !== undefined) svc.slug = input.slug;
  if (input.body !== undefined) svc.body = input.body;
  if (input.excerpt !== undefined) svc.excerpt = input.excerpt ?? undefined;
  if (input.seoTitle !== undefined) svc.seoTitle = input.seoTitle ?? undefined;
  if (input.metaDescription !== undefined)
    svc.metaDescription = input.metaDescription ?? undefined;
  if (input.keywords !== undefined) svc.targetKeywords = input.keywords;
  if (input.coverImageKey !== undefined)
    svc.coverImageUrl = input.coverImageKey ?? undefined;

  // v2 ai-writable fields → service input (it accepts all of these and keeps
  // the tool-link graph in sync for toolSlugs).
  if (input.primaryKeyword !== undefined)
    svc.primaryKeyword = input.primaryKeyword ?? undefined;
  if (input.internalLinks !== undefined)
    svc.internalLinks = input.internalLinks;
  if (input.toolSlugs !== undefined) svc.toolSlugs = input.toolSlugs;
  if (input.ctaText !== undefined) svc.ctaText = input.ctaText ?? undefined;
  if (input.ctaLink !== undefined) svc.ctaLink = input.ctaLink ?? undefined;
  if (input.clusterId !== undefined)
    svc.clusterId = input.clusterId ?? undefined;
  if (input.clusterRole !== undefined) svc.clusterRole = input.clusterRole;

  if (input.scheduledAt !== undefined) {
    extra.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    hasExtra = true;
  }
  if (input.socialImages !== undefined) {
    extra.socialImages = input.socialImages ?? [];
    hasExtra = true;
  }
  if (input.references !== undefined) {
    extra.references = input.references ?? [];
    hasExtra = true;
  }

  return { svc, extra, hasExtra };
}

// ---------------------------------------------------------------------------
// Author resolution. MCP requests carry no Flemoji user. We resolve in this
// order:
//   1. If the call's `clientId` maps to an `McpClient.authorUserId` that is
//      still an ADMIN, use that user. (Per-client attribution.)
//   2. Otherwise fall back to the earliest-created ADMIN account.
//      (Mirrors the admin-route auth gate, which only ADMINs satisfy.)
// Lenient by design: if a client has a mapping but the mapped user is
// missing/no-longer-ADMIN, we log a warning and fall back so MCP writes
// don't break on a stale mapping.
// ---------------------------------------------------------------------------

async function resolveAdminAuthorId(clientId?: string | null): Promise<string> {
  if (clientId) {
    const client = await prisma.mcpClient.findUnique({
      where: { clientId },
      select: {
        authorUserId: true,
        authorUser: { select: { id: true, role: true } },
      },
    });
    const mapped = client?.authorUser;
    if (mapped && mapped.role === 'ADMIN') {
      return mapped.id;
    }
    if (client?.authorUserId) {
      console.warn(
        `[mcp] McpClient ${clientId} has authorUserId=${client.authorUserId} but the user is missing or not ADMIN; falling back to earliest ADMIN`
      );
    }
  }
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!admin) {
    throw new McpError(
      'no_author',
      'No ADMIN user available to own the article',
      500
    );
  }
  return admin.id;
}

// ---------------------------------------------------------------------------
// Row loading (includes the additive columns the public Article type omits).
// ---------------------------------------------------------------------------

const ARTICLE_ROW_SELECT = {
  id: true,
  title: true,
  slug: true,
  body: true,
  excerpt: true,
  seoTitle: true,
  metaDescription: true,
  targetKeywords: true,
  coverImageUrl: true,
  socialImages: true,
  references: true,
  scheduledAt: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
  // v2 columns (ai-writable + derived readTime).
  primaryKeyword: true,
  internalLinks: true,
  toolSlugs: true,
  ctaText: true,
  ctaLink: true,
  clusterId: true,
  clusterRole: true,
  readTime: true,
} as const;

async function loadRowById(id: string): Promise<ArticleRowLike | null> {
  const row = await prisma.article.findUnique({
    where: { id },
    select: ARTICLE_ROW_SELECT,
  });
  return row as ArticleRowLike | null;
}

async function loadRowBySlug(slug: string): Promise<ArticleRowLike | null> {
  const row = await prisma.article.findUnique({
    where: { slug },
    select: ARTICLE_ROW_SELECT,
  });
  return row as ArticleRowLike | null;
}

/**
 * Compute the canonical contentHash for a loaded row (sync-consistent), over the
 * field set appropriate for the negotiated contract version.
 */
function rowContentHash(row: ArticleRowLike, contractVersion: number): string {
  return contentHashFor(mapArticleToCanonical(row), fieldsFor(contractVersion));
}

/**
 * Build a Prisma update payload for the additive columns the existing service
 * does not handle (`scheduledAt`, `socialImages`). Returns `null` when there is
 * nothing extra to write.
 */
function buildExtraUpdateData(
  extra: MappedArticleData['extra']
): Prisma.ArticleUpdateInput | null {
  const data: Prisma.ArticleUpdateInput = {};
  let any = false;
  if (extra.scheduledAt !== undefined) {
    data.scheduledAt = extra.scheduledAt;
    any = true;
  }
  if (extra.socialImages !== undefined) {
    data.socialImages = extra.socialImages as unknown as Prisma.InputJsonValue;
    any = true;
  }
  if (extra.references !== undefined) {
    data.references = extra.references as unknown as Prisma.InputJsonValue;
    any = true;
  }
  return any ? data : null;
}

// ---------------------------------------------------------------------------
// list_articles
// ---------------------------------------------------------------------------

export async function listArticles(
  input: ListArticlesInput,
  _contractVersion = 2
): Promise<ListArticlesOutputV2> {
  const result = await getArticles({
    status: input.status,
    page: input.page ?? 1,
    search: input.q,
  });

  const articles: ArticleSummaryV2[] = result.articles.map(a => {
    const row = a as unknown as ArticleRowLike;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: ArticleStatusSchema.parse(row.status),
      excerpt: row.excerpt ?? null,
      coverImageKey: row.coverImageUrl ?? null,
      scheduledAt: toIso(row.scheduledAt ?? null),
      publishedAt: toIso(row.publishedAt ?? null),
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
      // v2 membership + derived fields (harmless extras for v1 JSON clients).
      clusterId: row.clusterId ?? null,
      clusterRole: parseClusterRole(row.clusterRole),
      readTime: rowReadTime(row),
    };
  });

  return {
    articles,
    total: result.total,
    page: result.page,
    pages: result.pages,
  };
}

// ---------------------------------------------------------------------------
// get_article
// ---------------------------------------------------------------------------

export async function getArticle(
  input: GetArticleInput,
  contractVersion = 2
): Promise<ArticleWithHashesV2> {
  const row = input.id
    ? await loadRowById(input.id)
    : input.slug
      ? await loadRowBySlug(input.slug)
      : null;

  if (!row) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const canonical = mapArticleToCanonical(row);
  const fields = fieldsFor(contractVersion);
  return {
    ...canonical,
    id: row.id,
    readTime: rowReadTime(row),
    hashes: fieldHashesFor(canonical, fields),
    contentHash: contentHashFor(canonical, fields),
  };
}

// ---------------------------------------------------------------------------
// create_article
// ---------------------------------------------------------------------------

export async function createArticle(
  input: CreateArticleInputV2,
  contractVersion = 2,
  clientId?: string | null
): Promise<{ id: string; contentHash: string }> {
  const authorId = await resolveAdminAuthorId(clientId);
  const mapped = canonicalToArticleData(input);

  // Reuse the existing create logic (slugify, readTime, content-graph sync). The
  // service accepts the full v2 ai-writable set, so the new fields flow through
  // here (no raw Prisma write needed for them).
  const created = await createArticleSvc(
    {
      title: input.title,
      slug: input.slug || slugify(input.title),
      body: input.body,
      excerpt: mapped.svc.excerpt,
      coverImageUrl: mapped.svc.coverImageUrl,
      seoTitle: mapped.svc.seoTitle,
      metaDescription: mapped.svc.metaDescription,
      targetKeywords: mapped.svc.targetKeywords ?? input.keywords ?? [],
      primaryKeyword: mapped.svc.primaryKeyword,
      internalLinks: mapped.svc.internalLinks,
      toolSlugs: mapped.svc.toolSlugs,
      ctaText: mapped.svc.ctaText,
      ctaLink: mapped.svc.ctaLink,
      clusterId: mapped.svc.clusterId,
      clusterRole: mapped.svc.clusterRole,
    },
    authorId
  );

  // Persist the additive columns the service does not handle.
  if (mapped.hasExtra) {
    const extraData = buildExtraUpdateData(mapped.extra);
    if (extraData) {
      await prisma.article.update({
        where: { id: created.id },
        data: extraData,
      });
    }
  }

  const row = await loadRowById(created.id);
  const hash = row ? rowContentHash(row, contractVersion) : '';

  await emitArticleEvent('article.created', {
    articleId: created.id,
    slug: row?.slug ?? created.slug,
    contentHash: hash,
  });

  return { id: created.id, contentHash: hash };
}

// ---------------------------------------------------------------------------
// update_article (optimistic concurrency via baseHash)
// ---------------------------------------------------------------------------

export async function updateArticle(args: {
  id: string;
  patch: ArticlePatchV2;
  baseHash?: string;
  contractVersion?: number;
  clientId?: string | null;
}): Promise<{ id: string; contentHash: string }> {
  const { id, patch, baseHash, contractVersion = 2, clientId } = args;
  const fields = fieldsFor(contractVersion);

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const beforeCanonical = mapArticleToCanonical(before);
  const beforeHashes = fieldHashesFor(beforeCanonical, fields);
  const beforeContentHash = contentHashFor(beforeCanonical, fields);

  // Optimistic concurrency: stale baseHash → 409 with current field hashes.
  if (baseHash !== undefined && baseHash !== beforeContentHash) {
    throw new McpError(
      'conflict',
      'Article was modified since baseHash was issued',
      409,
      beforeHashes
    );
  }

  const mapped = canonicalToArticleData(patch);

  // Reuse the existing update logic (version snapshot, readTime, slugify on
  // title change, content-graph sync incl. tool links). Pass an author to
  // snapshot a version. The service accepts the full v2 ai-writable set.
  const authorId = await resolveAdminAuthorId(clientId);
  await updateArticleSvc(id, mapped.svc, authorId);

  // Apply the additive columns directly.
  if (mapped.hasExtra) {
    const extraData = buildExtraUpdateData(mapped.extra);
    if (extraData) {
      await prisma.article.update({ where: { id }, data: extraData });
    }
  }

  const after = await loadRowById(id);
  if (!after) {
    throw new McpError('not_found', 'Article not found', 404);
  }
  const afterCanonical = mapArticleToCanonical(after);
  const afterHashes = fieldHashesFor(afterCanonical, fields);
  const afterContentHash = contentHashFor(afterCanonical, fields);

  await emitArticleEvent('article.updated', {
    articleId: id,
    slug: after.slug,
    contentHash: afterContentHash,
    changedFields: changedFieldsFor(beforeHashes, afterHashes, fields),
  });

  return { id, contentHash: afterContentHash };
}

// ---------------------------------------------------------------------------
// delete_article (soft → ARCHIVED, or hard delete)
// ---------------------------------------------------------------------------

export async function deleteArticle(args: {
  id: string;
  hard?: boolean;
  contractVersion?: number;
}): Promise<{ id: string; status: string }> {
  const { id, hard, contractVersion = 2 } = args;

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  let status: string;
  let contentHashForEvent: string;

  if (hard) {
    // Hard delete: hash the pre-delete state so the event still carries a hash.
    contentHashForEvent = rowContentHash(before, contractVersion);
    await prisma.article.delete({ where: { id } });
    status = 'DELETED';
  } else {
    await prisma.article.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    const after = await loadRowById(id);
    status = after?.status ?? 'ARCHIVED';
    contentHashForEvent = after
      ? rowContentHash(after, contractVersion)
      : rowContentHash(before, contractVersion);
  }

  await emitArticleEvent('article.deleted', {
    articleId: id,
    slug: before.slug,
    contentHash: contentHashForEvent,
  });

  return { id, status };
}

// ---------------------------------------------------------------------------
// publish_article — reused by the MCP publish tool AND the scheduled-publish
// cron route (imports `publishArticleById` from this module).
// ---------------------------------------------------------------------------

export async function publishArticleById(
  id: string,
  contractVersion = 2,
  clientId?: string | null
): Promise<{ id: string; status: 'PUBLISHED'; publishedAt: string | null }> {
  const adminUserId = await resolveAdminAuthorId(clientId);

  // Reuse the existing publish path: status → PUBLISHED, publishedAt,
  // TimelinePost (NEWS_ARTICLE), embedding enqueue.
  await publishArticleSvc(id, adminUserId);

  const row = await loadRowById(id);
  if (!row) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const hash = rowContentHash(row, contractVersion);
  await emitArticleEvent('article.published', {
    articleId: id,
    slug: row.slug,
    contentHash: hash,
  });

  return {
    id,
    status: 'PUBLISHED',
    publishedAt: toIso(row.publishedAt ?? null),
  };
}
