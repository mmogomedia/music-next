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
 *   keywords[]    ↔ targetKeywords[]
 *   coverImageKey ↔ coverImageUrl
 *   socialImages  ↔ socialImages (Json, additive column)
 *   scheduledAt   ↔ scheduledAt   (additive column)
 *   rest 1:1 (title, slug, body, excerpt, seoTitle, metaDescription, status,
 *   publishedAt).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { McpError } from './auth';
import { fieldHashes, contentHash, changedFields } from './crypto';
import {
  ArticleCanonicalSchema,
  SocialImageSchema,
  type ArticleCanonical,
  type ArticlePatch,
  type ArticleSummary,
  type ArticleWithHashes,
  type CreateArticleInput,
  type ListArticlesInput,
  type ListArticlesOutput,
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
  scheduledAt?: Date | string | null;
  status: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
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

// ---------------------------------------------------------------------------
// Mapping: Article row → canonical, and canonical/patch → Article data.
// ---------------------------------------------------------------------------

/** Map a Flemoji Article row onto the contract's canonical article shape. */
export function mapArticleToCanonical(
  article: ArticleRowLike
): ArticleCanonical {
  return ArticleCanonicalSchema.parse({
    title: article.title,
    slug: article.slug,
    body: article.body,
    excerpt: article.excerpt ?? null,
    seoTitle: article.seoTitle ?? null,
    metaDescription: article.metaDescription ?? null,
    keywords: article.targetKeywords ?? [],
    coverImageKey: article.coverImageUrl ?? null,
    socialImages: parseSocialImages(article.socialImages),
    scheduledAt: toIso(article.scheduledAt ?? null),
    status: article.status,
    publishedAt: toIso(article.publishedAt ?? null),
  });
}

/**
 * Shape produced by `canonicalToArticleData`: the subset understood by the
 * existing `createArticle`/`updateArticle` service (`svc`) plus the two
 * additive columns that must be written directly via Prisma (`extra`).
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
  };
  extra: {
    scheduledAt?: Date | null;
    socialImages?: SocialImage[];
  };
  hasExtra: boolean;
}

/**
 * Inverse of `mapArticleToCanonical`: map a canonical article (or partial
 * patch) onto the data shapes consumed by the existing service + the additive
 * columns. Only keys present on `input` are emitted, so this works for both
 * create (full) and update (partial patch).
 */
export function canonicalToArticleData(
  input: Partial<ArticleCanonical>
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

  if (input.scheduledAt !== undefined) {
    extra.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    hasExtra = true;
  }
  if (input.socialImages !== undefined) {
    extra.socialImages = input.socialImages ?? [];
    hasExtra = true;
  }

  return { svc, extra, hasExtra };
}

// ---------------------------------------------------------------------------
// Author resolution. MCP requests carry no Flemoji user; reuse the first ADMIN
// account as the authoring/publishing identity (mirrors the admin-route auth
// gate, which only ADMINs satisfy).
// ---------------------------------------------------------------------------

async function resolveAdminAuthorId(): Promise<string> {
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
  scheduledAt: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
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

/** Compute the canonical contentHash for a loaded row (sync-consistent). */
function rowContentHash(row: ArticleRowLike): string {
  return contentHash(mapArticleToCanonical(row));
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
  return any ? data : null;
}

// ---------------------------------------------------------------------------
// list_articles
// ---------------------------------------------------------------------------

export async function listArticles(
  input: ListArticlesInput
): Promise<ListArticlesOutput> {
  const result = await getArticles({
    status: input.status,
    page: input.page ?? 1,
    search: input.q,
  });

  const articles: ArticleSummary[] = result.articles.map(a => {
    const row = a as unknown as ArticleRowLike;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: ArticleCanonicalSchema.shape.status.parse(row.status),
      excerpt: row.excerpt ?? null,
      coverImageKey: row.coverImageUrl ?? null,
      scheduledAt: toIso(row.scheduledAt ?? null),
      publishedAt: toIso(row.publishedAt ?? null),
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
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
  input: GetArticleInput
): Promise<ArticleWithHashes> {
  const row = input.id
    ? await loadRowById(input.id)
    : input.slug
      ? await loadRowBySlug(input.slug)
      : null;

  if (!row) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const canonical = mapArticleToCanonical(row);
  return {
    ...canonical,
    id: row.id,
    hashes: fieldHashes(canonical),
    contentHash: contentHash(canonical),
  };
}

// ---------------------------------------------------------------------------
// create_article
// ---------------------------------------------------------------------------

export async function createArticle(
  input: CreateArticleInput
): Promise<{ id: string; contentHash: string }> {
  const authorId = await resolveAdminAuthorId();
  const mapped = canonicalToArticleData(input);

  // Reuse the existing create logic (slugify, readTime, content-graph sync).
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
  const hash = row ? rowContentHash(row) : '';

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
  patch: ArticlePatch;
  baseHash?: string;
}): Promise<{ id: string; contentHash: string }> {
  const { id, patch, baseHash } = args;

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const beforeCanonical = mapArticleToCanonical(before);
  const beforeHashes = fieldHashes(beforeCanonical);
  const beforeContentHash = contentHash(beforeCanonical);

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
  // title change, content-graph sync). Pass an author to snapshot a version.
  const authorId = await resolveAdminAuthorId();
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
  const afterHashes = fieldHashes(afterCanonical);
  const afterContentHash = contentHash(afterCanonical);

  await emitArticleEvent('article.updated', {
    articleId: id,
    slug: after.slug,
    contentHash: afterContentHash,
    changedFields: changedFields(beforeHashes, afterHashes),
  });

  return { id, contentHash: afterContentHash };
}

// ---------------------------------------------------------------------------
// delete_article (soft → ARCHIVED, or hard delete)
// ---------------------------------------------------------------------------

export async function deleteArticle(args: {
  id: string;
  hard?: boolean;
}): Promise<{ id: string; status: string }> {
  const { id, hard } = args;

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  let status: string;
  let contentHashForEvent: string;

  if (hard) {
    // Hard delete: hash the pre-delete state so the event still carries a hash.
    contentHashForEvent = rowContentHash(before);
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
      ? rowContentHash(after)
      : rowContentHash(before);
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
  id: string
): Promise<{ id: string; status: 'PUBLISHED'; publishedAt: string | null }> {
  const adminUserId = await resolveAdminAuthorId();

  // Reuse the existing publish path: status → PUBLISHED, publishedAt,
  // TimelinePost (NEWS_ARTICLE), embedding enqueue.
  await publishArticleSvc(id, adminUserId);

  const row = await loadRowById(id);
  if (!row) {
    throw new McpError('not_found', 'Article not found', 404);
  }

  const hash = rowContentHash(row);
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
