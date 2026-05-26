/**
 * MCP cluster service — the core that backs the v2 cluster MCP tools.
 *
 * This module is a THIN MCP-facing adapter over Flemoji's existing article
 * service (`@/lib/services/article-service`) cluster helpers and the `@/lib/db`
 * Prisma singleton. It does NOT duplicate business logic (slugify, keyword
 * combination) — it delegates to the existing helpers and only adds:
 *   - canonical ↔ ArticleCluster field mapping (per `CANONICAL_CLUSTER_FIELDS`),
 *   - per-field + content hashing for sync / optimistic concurrency,
 *   - cluster change-webhook emission on create/update/delete,
 *   - member resolution for `get_cluster`.
 *
 * Canonical → ArticleCluster column map (see contract.ts):
 *   coverImageKey  ↔ coverImageUrl
 *   targetKeywords ↔ targetKeywords  (DERIVED/combined, read-only)
 *   rest 1:1 (name, slug, description, about, goal, primaryKeywords,
 *   secondaryKeywords, longTailKeywords, audience, status).
 *
 * NOTE: the existing `createCluster`/`updateCluster` service inputs
 * (`CreateClusterInput` in `@/types/articles`) have NO `status` field — clusters
 * default to DRAFT. `status` (and any field the service input omits) is written
 * directly via `prisma.articleCluster.update(...)` after the service call,
 * mirroring the `buildExtraUpdateData` pattern in `articles-service.ts`.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { McpError } from './auth';
import { fieldHashesFor, contentHashFor, changedFieldsFor } from './crypto';
import {
  ClusterCanonicalSchema,
  ClusterSummarySchema,
  CANONICAL_CLUSTER_FIELDS,
  ArticleStatusSchema,
  type ClusterCanonical,
  type ClusterPatch,
  type ClusterSummary,
  type ClusterMember,
  type ClusterWithHashes,
  type ListClustersInput,
  type ListClustersOutput,
  type GetClusterInput,
  type CreateClusterInput,
} from './contract';
import {
  getClusters,
  createCluster as createClusterSvc,
  updateCluster as updateClusterSvc,
  deleteCluster as deleteClusterSvc,
  slugify,
} from '@/lib/services/article-service';
import { emitClusterEvent } from './webhook';

// ---------------------------------------------------------------------------
// Internal: a row shape covering every column we map to/from canonical. The
// existing service returns the full Prisma `ArticleCluster` row.
// ---------------------------------------------------------------------------

interface ClusterRowLike {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  goal: string | null;
  coverImageUrl: string | null;
  targetKeywords: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  audience: string | null;
  status: string;
  updatedAt: Date | string;
}

/** Coerce a Date | string into an ISO string. */
function toIso(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return new Date().toISOString();
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

// ---------------------------------------------------------------------------
// Mapping: ArticleCluster row → canonical, and canonical/patch → service data.
// ---------------------------------------------------------------------------

/** Map a Flemoji ArticleCluster row onto the contract's canonical shape. */
export function mapClusterToCanonical(row: ClusterRowLike): ClusterCanonical {
  return ClusterCanonicalSchema.parse({
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    about: row.about ?? null,
    goal: row.goal ?? null,
    coverImageKey: row.coverImageUrl ?? null,
    primaryKeywords: row.primaryKeywords ?? [],
    secondaryKeywords: row.secondaryKeywords ?? [],
    longTailKeywords: row.longTailKeywords ?? [],
    audience: row.audience ?? null,
    status: row.status,
  });
}

/**
 * Shape produced by `canonicalToClusterData`: the subset understood by the
 * existing `createCluster`/`updateCluster` service (`svc`) plus the fields that
 * the service input omits and must be written directly via Prisma (`extra`).
 */
interface MappedClusterData {
  svc: {
    name?: string;
    slug?: string;
    description?: string;
    about?: string;
    goal?: string;
    coverImageUrl?: string;
    primaryKeywords?: string[];
    secondaryKeywords?: string[];
    longTailKeywords?: string[];
    audience?: string;
  };
  extra: {
    status?: ClusterCanonical['status'];
  };
  hasExtra: boolean;
}

/**
 * Inverse of `mapClusterToCanonical`: map a canonical cluster (or partial patch)
 * onto the data shapes consumed by the existing service + the fields the service
 * input omits (`status`). Only keys present on `input` are emitted, so this
 * works for both create (full) and update (partial patch).
 */
export function canonicalToClusterData(
  input: Partial<ClusterCanonical>
): MappedClusterData {
  const svc: MappedClusterData['svc'] = {};
  const extra: MappedClusterData['extra'] = {};
  let hasExtra = false;

  if (input.name !== undefined) svc.name = input.name;
  if (input.slug !== undefined) svc.slug = input.slug;
  if (input.description !== undefined)
    svc.description = input.description ?? undefined;
  if (input.about !== undefined) svc.about = input.about ?? undefined;
  if (input.goal !== undefined) svc.goal = input.goal ?? undefined;
  if (input.coverImageKey !== undefined)
    svc.coverImageUrl = input.coverImageKey ?? undefined;
  if (input.primaryKeywords !== undefined)
    svc.primaryKeywords = input.primaryKeywords;
  if (input.secondaryKeywords !== undefined)
    svc.secondaryKeywords = input.secondaryKeywords;
  if (input.longTailKeywords !== undefined)
    svc.longTailKeywords = input.longTailKeywords;
  if (input.audience !== undefined) svc.audience = input.audience ?? undefined;

  // `status` is not handled by the article-service cluster helpers.
  if (input.status !== undefined) {
    extra.status = input.status;
    hasExtra = true;
  }

  return { svc, extra, hasExtra };
}

// ---------------------------------------------------------------------------
// Row loading.
// ---------------------------------------------------------------------------

const CLUSTER_ROW_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  about: true,
  goal: true,
  coverImageUrl: true,
  targetKeywords: true,
  primaryKeywords: true,
  secondaryKeywords: true,
  longTailKeywords: true,
  audience: true,
  status: true,
  updatedAt: true,
} as const;

async function loadRowById(id: string): Promise<ClusterRowLike | null> {
  const row = await prisma.articleCluster.findUnique({
    where: { id },
    select: CLUSTER_ROW_SELECT,
  });
  return row as ClusterRowLike | null;
}

async function loadRowBySlug(slug: string): Promise<ClusterRowLike | null> {
  const row = await prisma.articleCluster.findUnique({
    where: { slug },
    select: CLUSTER_ROW_SELECT,
  });
  return row as ClusterRowLike | null;
}

/** Per-field hash map over `CANONICAL_CLUSTER_FIELDS` for a canonical cluster. */
function clusterFieldHashes(
  canonical: ClusterCanonical
): Record<string, string> {
  return fieldHashesFor(canonical, CANONICAL_CLUSTER_FIELDS);
}

/** Combined content hash over `CANONICAL_CLUSTER_FIELDS` for a canonical cluster. */
function clusterContentHash(canonical: ClusterCanonical): string {
  return contentHashFor(canonical, CANONICAL_CLUSTER_FIELDS);
}

/** Compute the canonical contentHash for a loaded row (sync-consistent). */
function rowContentHash(row: ClusterRowLike): string {
  return clusterContentHash(mapClusterToCanonical(row));
}

/** Load the article members of a cluster (never the full body). */
async function loadMembers(clusterId: string): Promise<ClusterMember[]> {
  const articles = await prisma.article.findMany({
    where: { clusterId },
    select: {
      id: true,
      slug: true,
      title: true,
      clusterRole: true,
      status: true,
    },
    orderBy: [{ clusterRole: 'asc' }, { updatedAt: 'desc' }],
  });
  return articles.map(a => ({
    articleId: a.id,
    slug: a.slug,
    title: a.title,
    clusterRole: a.clusterRole,
    status: a.status,
  }));
}

/**
 * Persist the fields the existing service input omits (`status`) directly via
 * Prisma. Returns `null` when there is nothing extra to write.
 */
function buildExtraUpdateData(
  extra: MappedClusterData['extra']
): Prisma.ArticleClusterUpdateInput | null {
  const data: Prisma.ArticleClusterUpdateInput = {};
  let any = false;
  if (extra.status !== undefined) {
    data.status = ArticleStatusSchema.parse(extra.status);
    any = true;
  }
  return any ? data : null;
}

// ---------------------------------------------------------------------------
// list_clusters
// ---------------------------------------------------------------------------

export async function listClusters(
  input: ListClustersInput
): Promise<ListClustersOutput> {
  const rows = await getClusters();

  const q = input.q?.trim().toLowerCase();
  const filtered = rows.filter(row => {
    if (input.status && row.status !== input.status) return false;
    if (q) {
      const haystack = [row.name, row.slug, row.description ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const clusters: ClusterSummary[] = filtered.map(row =>
    ClusterSummarySchema.parse({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      description: row.description ?? null,
      coverImageKey: row.coverImageUrl ?? null,
      targetKeywords: row.targetKeywords ?? [],
      articleCount: row._count?.articles ?? 0,
      updatedAt: toIso(row.updatedAt),
    })
  );

  return { clusters };
}

// ---------------------------------------------------------------------------
// get_cluster
// ---------------------------------------------------------------------------

export async function getCluster(
  input: GetClusterInput
): Promise<ClusterWithHashes> {
  const row = input.id
    ? await loadRowById(input.id)
    : input.slug
      ? await loadRowBySlug(input.slug)
      : null;

  if (!row) {
    throw new McpError('not_found', 'Cluster not found', 404);
  }

  const canonical = mapClusterToCanonical(row);
  const members = await loadMembers(row.id);

  return {
    ...canonical,
    id: row.id,
    targetKeywords: row.targetKeywords ?? [],
    members,
    hashes: clusterFieldHashes(canonical),
    contentHash: clusterContentHash(canonical),
  };
}

// ---------------------------------------------------------------------------
// create_cluster
// ---------------------------------------------------------------------------

export async function createCluster(
  canonical: CreateClusterInput
): Promise<{ id: string; contentHash: string }> {
  const mapped = canonicalToClusterData(canonical);

  // Reuse the existing create logic (slugify, keyword combination).
  const created = await createClusterSvc({
    name: canonical.name,
    slug: canonical.slug || slugify(canonical.name),
    description: mapped.svc.description,
    about: mapped.svc.about,
    goal: mapped.svc.goal,
    coverImageUrl: mapped.svc.coverImageUrl,
    primaryKeywords: mapped.svc.primaryKeywords,
    secondaryKeywords: mapped.svc.secondaryKeywords,
    longTailKeywords: mapped.svc.longTailKeywords,
    audience: mapped.svc.audience,
  });

  // Persist the fields the service does not handle (`status`).
  if (mapped.hasExtra) {
    const extraData = buildExtraUpdateData(mapped.extra);
    if (extraData) {
      await prisma.articleCluster.update({
        where: { id: created.id },
        data: extraData,
      });
    }
  }

  const row = await loadRowById(created.id);
  const hash = row ? rowContentHash(row) : '';

  await emitClusterEvent('cluster.created', {
    clusterId: created.id,
    slug: row?.slug ?? created.slug,
    contentHash: hash,
  });

  return { id: created.id, contentHash: hash };
}

// ---------------------------------------------------------------------------
// update_cluster (optimistic concurrency via baseHash)
// ---------------------------------------------------------------------------

export async function updateCluster(args: {
  id: string;
  patch: ClusterPatch;
  baseHash?: string;
}): Promise<{ id: string; contentHash: string }> {
  const { id, patch, baseHash } = args;

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Cluster not found', 404);
  }

  const beforeCanonical = mapClusterToCanonical(before);
  const beforeHashes = clusterFieldHashes(beforeCanonical);
  const beforeContentHash = clusterContentHash(beforeCanonical);

  // Optimistic concurrency: stale baseHash → 409 with current field hashes.
  if (baseHash !== undefined && baseHash !== beforeContentHash) {
    throw new McpError(
      'conflict',
      'Cluster was modified since baseHash was issued',
      409,
      beforeHashes
    );
  }

  const mapped = canonicalToClusterData(patch);

  // Reuse the existing update logic (keyword recombination, slug handling).
  await updateClusterSvc(id, mapped.svc);

  // Apply the fields the service omits (`status`) directly.
  if (mapped.hasExtra) {
    const extraData = buildExtraUpdateData(mapped.extra);
    if (extraData) {
      await prisma.articleCluster.update({ where: { id }, data: extraData });
    }
  }

  const after = await loadRowById(id);
  if (!after) {
    throw new McpError('not_found', 'Cluster not found', 404);
  }
  const afterCanonical = mapClusterToCanonical(after);
  const afterHashes = clusterFieldHashes(afterCanonical);
  const afterContentHash = clusterContentHash(afterCanonical);

  await emitClusterEvent('cluster.updated', {
    clusterId: id,
    slug: after.slug,
    contentHash: afterContentHash,
    changedFields: changedFieldsFor(
      beforeHashes,
      afterHashes,
      CANONICAL_CLUSTER_FIELDS
    ),
  });

  return { id, contentHash: afterContentHash };
}

// ---------------------------------------------------------------------------
// delete_cluster — unassigns members (never hard-deletes articles), then deletes
// the cluster.
// ---------------------------------------------------------------------------

export async function deleteCluster(args: {
  id: string;
}): Promise<{ id: string; status: string }> {
  const { id } = args;

  const before = await loadRowById(id);
  if (!before) {
    throw new McpError('not_found', 'Cluster not found', 404);
  }

  const contentHashForEvent = rowContentHash(before);

  // Unassign members so the cluster can be removed without deleting articles.
  await prisma.article.updateMany({
    where: { clusterId: id },
    data: { clusterId: null },
  });

  // Reuse the existing delete logic (now safe — no remaining members).
  await deleteClusterSvc(id);

  await emitClusterEvent('cluster.deleted', {
    clusterId: id,
    slug: before.slug,
    contentHash: contentHashForEvent,
  });

  return { id, status: 'DELETED' };
}
