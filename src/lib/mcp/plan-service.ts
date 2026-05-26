/**
 * MCP v2 content-plan service — `validate_content_plan` (pure dry-run) and
 * `apply_content_plan` (orchestrated create/update of a whole topic cluster).
 *
 * This module owns the PLANNING logic only. It does NOT reimplement article or
 * cluster persistence — that lives in `@/lib/mcp/cluster-service` and
 * `@/lib/mcp/articles-service`, which already handle slugify, version snapshots,
 * per-field hashing, optimistic concurrency and webhook emission. `apply` simply
 * orchestrates those service calls in the right order.
 *
 * Canonical schemas + I/O come from `@/lib/mcp/contract`; tool slugs are
 * validated against the live registry (`@/lib/tools/registry`).
 */

import { prisma } from '@/lib/db';
import { McpError } from './auth';
import {
  ContentPlanSchema,
  type ContentPlan,
  type DraftArticle,
  type ValidationIssue,
  type ValidateContentPlanInput,
  type ValidateContentPlanOutput,
  type ApplyContentPlanInput,
  type ApplyContentPlanOutput,
  type AppliedArticle,
  type ClusterCanonical,
  type ArticleCanonicalV2,
} from './contract';
import { slugify } from '@/lib/services/article-service';
import { getAllTools } from '@/lib/tools/registry';
import {
  createCluster as createClusterSvc,
  updateCluster as updateClusterSvc,
} from './cluster-service';
import {
  createArticle as createArticleSvc,
  updateArticle as updateArticleSvc,
} from './articles-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a draft article's slug: explicit `slug` if present, else from title. */
function resolveSlug(article: Pick<DraftArticle, 'slug' | 'title'>): string {
  const explicit = article.slug?.trim();
  if (explicit) return explicit;
  return slugify(article.title ?? '');
}

/**
 * Produce a `normalized` copy of the plan with slugs filled in (from title when
 * omitted) for every article. Cluster slug is likewise defaulted from its name.
 * Re-parsed through `ContentPlanSchema` so array `.default()`s are applied and
 * the output is contract-shaped. Pure — never mutates the input.
 */
function normalizePlan(plan: ContentPlan): ContentPlan {
  const articles = plan.articles.map(a => ({
    ...a,
    slug: resolveSlug(a),
  }));
  const cluster = plan.cluster
    ? {
        ...plan.cluster,
        slug: plan.cluster.slug?.trim() || slugify(plan.cluster.name ?? ''),
      }
    : undefined;
  return ContentPlanSchema.parse({
    ...(cluster ? { cluster } : {}),
    articles,
    ...(plan.links ? { links: plan.links } : {}),
  });
}

/**
 * Collect every internal-link / explicit-link target referenced by the plan,
 * paired with a JSON-path-ish locator for precise error reporting.
 */
function collectLinkTargets(
  plan: ContentPlan
): Array<{ target: string; path: string }> {
  const targets: Array<{ target: string; path: string }> = [];
  plan.articles.forEach((article, i) => {
    (article.internalLinks ?? []).forEach((link, j) => {
      targets.push({
        target: link,
        path: `articles[${i}].internalLinks[${j}]`,
      });
    });
  });
  (plan.links ?? []).forEach((link, i) => {
    link.to.forEach((to, j) => {
      targets.push({ target: to, path: `links[${i}].to[${j}]` });
    });
  });
  return targets;
}

/** Best-effort parse of an ISO datetime; returns null when unparseable. */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// validate_content_plan — PURE, no writes.
// ---------------------------------------------------------------------------

/**
 * Validate a content plan as a pure dry-run (NO database writes beyond the
 * single read-only slug-collision lookup). Returns every finding; `ok` is true
 * iff there are no `error`-level issues. `normalized` echoes the plan with slugs
 * filled in when validation passes.
 *
 * Checks performed:
 *  (a) slug collisions WITHIN the plan, and AGAINST existing articles;
 *  (b) every internalLinks / links target resolves to a plan slug OR an existing
 *      article slug;
 *  (c) when a cluster is present: exactly one PILLAR among the articles, and
 *      every SPOKE links up to the pillar;
 *  (d) required fields present (title always; body for non-`idea`/non-draft);
 *  (e) every toolSlug exists in the live tools registry;
 *  (f) scheduledAt parses and is not in the past.
 */
export async function validateContentPlan(
  input: ValidateContentPlanInput
): Promise<ValidateContentPlanOutput> {
  const issues: ValidationIssue[] = [];

  // Work against a slug-normalized view so collision / link checks see the
  // slugs that `apply` will actually persist.
  const normalized = normalizePlan(input);

  // --- (a) slug collisions -------------------------------------------------
  const planSlugs = new Set<string>();
  const duplicateSlugs = new Set<string>();
  normalized.articles.forEach((article, i) => {
    const slug = article.slug ?? '';
    if (!slug) {
      issues.push({
        level: 'error',
        code: 'missing_slug',
        message: `Article "${article.title}" has no resolvable slug`,
        path: `articles[${i}].slug`,
      });
      return;
    }
    if (planSlugs.has(slug)) {
      duplicateSlugs.add(slug);
      issues.push({
        level: 'error',
        code: 'duplicate_slug_in_plan',
        message: `Duplicate slug "${slug}" within the plan`,
        path: `articles[${i}].slug`,
      });
    }
    planSlugs.add(slug);
  });

  // Slugs that exist on already-persisted articles. An existing slug is a link
  // target (allowed) but a COLLISION only matters for create — apply treats an
  // existing-slug article as an UPDATE, so this is a `warn`, not an `error`.
  const candidateSlugs = Array.from(planSlugs);
  let existingArticleSlugs = new Set<string>();
  if (candidateSlugs.length > 0) {
    const existing = await prisma.article.findMany({
      where: { slug: { in: candidateSlugs } },
      select: { slug: true },
    });
    existingArticleSlugs = new Set(existing.map(e => e.slug));
  }
  normalized.articles.forEach((article, i) => {
    const slug = article.slug ?? '';
    if (slug && existingArticleSlugs.has(slug) && !duplicateSlugs.has(slug)) {
      issues.push({
        level: 'warn',
        code: 'slug_exists',
        message: `Slug "${slug}" already exists; this article will be updated, not created`,
        path: `articles[${i}].slug`,
      });
    }
  });

  // --- (b) internal-link / link targets resolve ---------------------------
  const targets = collectLinkTargets(normalized);
  if (targets.length > 0) {
    const targetSlugs = Array.from(new Set(targets.map(t => t.target)));
    const unknown = targetSlugs.filter(s => !planSlugs.has(s));
    let resolvedExisting = new Set<string>();
    if (unknown.length > 0) {
      const found = await prisma.article.findMany({
        where: { slug: { in: unknown } },
        select: { slug: true },
      });
      resolvedExisting = new Set(found.map(f => f.slug));
    }
    for (const { target, path } of targets) {
      if (!planSlugs.has(target) && !resolvedExisting.has(target)) {
        issues.push({
          level: 'error',
          code: 'dangling_link',
          message: `Link target "${target}" does not resolve to a plan slug or an existing article`,
          path,
        });
      }
    }
  }

  // --- (c) pillar / spoke rules (only when a cluster is present) -----------
  if (normalized.cluster) {
    const pillarIndexes: number[] = [];
    normalized.articles.forEach((article, i) => {
      if (article.clusterRole === 'PILLAR') pillarIndexes.push(i);
    });

    if (pillarIndexes.length === 0) {
      issues.push({
        level: 'error',
        code: 'no_pillar',
        message: 'A cluster plan must contain exactly one PILLAR article',
      });
    } else if (pillarIndexes.length > 1) {
      pillarIndexes.slice(1).forEach(i => {
        issues.push({
          level: 'error',
          code: 'multiple_pillars',
          message: 'A cluster plan must contain exactly one PILLAR article',
          path: `articles[${i}].clusterRole`,
        });
      });
    }

    // Spokes should link up to the pillar (via internalLinks or `links`).
    if (pillarIndexes.length === 1) {
      const pillarSlug = normalized.articles[pillarIndexes[0]].slug ?? '';
      const linksFromSlug = new Map<string, Set<string>>();
      (normalized.links ?? []).forEach(l => {
        linksFromSlug.set(l.from, new Set(l.to));
      });
      normalized.articles.forEach((article, i) => {
        if (article.clusterRole !== 'SPOKE') return;
        const slug = article.slug ?? '';
        const viaInternal = (article.internalLinks ?? []).includes(pillarSlug);
        const viaLinks = linksFromSlug.get(slug)?.has(pillarSlug) ?? false;
        if (!viaInternal && !viaLinks) {
          issues.push({
            level: 'warn',
            code: 'spoke_missing_pillar_link',
            message: `Spoke "${article.title}" does not link up to the pillar "${pillarSlug}"`,
            path: `articles[${i}].internalLinks`,
          });
        }
      });
    }
  }

  // --- (d) required fields -------------------------------------------------
  normalized.articles.forEach((article, i) => {
    if (!article.title || !article.title.trim()) {
      issues.push({
        level: 'error',
        code: 'missing_title',
        message: `Article at index ${i} is missing a title`,
        path: `articles[${i}].title`,
      });
    }
    // `body` is required for anything that will be persisted as a real article.
    // A DRAFT placeholder ("idea") may omit it; warn so the planner notices.
    const hasBody = Boolean(article.body && article.body.trim());
    if (!hasBody) {
      const isDraftIdea =
        article.status === undefined || article.status === 'DRAFT';
      issues.push({
        level: isDraftIdea ? 'warn' : 'error',
        code: 'missing_body',
        message: isDraftIdea
          ? `Article "${article.title}" has no body yet (draft idea)`
          : `Article "${article.title}" must have a body to be ${article.status}`,
        path: `articles[${i}].body`,
      });
    }
  });

  // --- (e) toolSlugs exist in the catalog ---------------------------------
  const catalogSlugs = new Set(getAllTools().map(t => t.slug));
  normalized.articles.forEach((article, i) => {
    (article.toolSlugs ?? []).forEach((toolSlug, j) => {
      if (!catalogSlugs.has(toolSlug)) {
        issues.push({
          level: 'error',
          code: 'unknown_tool_slug',
          message: `Tool slug "${toolSlug}" is not in the tools catalog`,
          path: `articles[${i}].toolSlugs[${j}]`,
        });
      }
    });
  });

  // --- (f) scheduledAt parses / is future-ish -----------------------------
  const now = Date.now();
  normalized.articles.forEach((article, i) => {
    if (article.scheduledAt === undefined || article.scheduledAt === null) {
      return;
    }
    const parsed = parseDate(article.scheduledAt);
    if (!parsed) {
      issues.push({
        level: 'error',
        code: 'invalid_scheduled_at',
        message: `scheduledAt "${article.scheduledAt}" is not a valid datetime`,
        path: `articles[${i}].scheduledAt`,
      });
    } else if (parsed.getTime() < now) {
      issues.push({
        level: 'warn',
        code: 'scheduled_at_in_past',
        message: `scheduledAt "${article.scheduledAt}" is in the past`,
        path: `articles[${i}].scheduledAt`,
      });
    }
  });

  const ok = !issues.some(issue => issue.level === 'error');

  return {
    ok,
    issues,
    // Only echo a normalized plan when it is actually applicable.
    normalized: ok ? normalized : undefined,
  };
}

// ---------------------------------------------------------------------------
// apply_content_plan — validate, then orchestrate create/update.
// ---------------------------------------------------------------------------

/**
 * Map a normalized draft article (+ resolved clusterId) onto the canonical-v2
 * shape consumed by the articles-service. Only the fields a planner can set are
 * carried; `slug` is always present post-normalization.
 */
function draftToCanonical(
  article: DraftArticle,
  clusterId: string | undefined
): ArticleCanonicalV2 & { slug: string } {
  return {
    title: article.title,
    slug: article.slug ?? slugify(article.title),
    body: article.body ?? '',
    excerpt: article.excerpt ?? null,
    seoTitle: article.seoTitle ?? null,
    metaDescription: article.metaDescription ?? null,
    keywords: article.keywords ?? [],
    coverImageKey: article.coverImageKey ?? null,
    socialImages: article.socialImages ?? [],
    scheduledAt: article.scheduledAt ?? null,
    status: article.status ?? 'DRAFT',
    publishedAt: article.publishedAt ?? null,
    primaryKeyword: article.primaryKeyword ?? null,
    internalLinks: article.internalLinks ?? [],
    toolSlugs: article.toolSlugs ?? [],
    ctaText: article.ctaText ?? null,
    ctaLink: article.ctaLink ?? null,
    // The cluster wins over any clusterId the planner may have set on the draft.
    clusterId: clusterId ?? article.clusterId ?? null,
    clusterRole: article.clusterRole,
  };
}

/**
 * Apply a content plan: create/update a cluster (if present) plus every article,
 * idempotent by slug (create when the slug is new, update when it already
 * exists, honoring `baseHash` if the planner supplied one on the draft).
 *
 * ATOMICITY CAVEAT: the reused cluster/article service layer is NOT
 * transaction-aware — each create/update opens its own Prisma calls and emits
 * its own webhook. We therefore cannot wrap the whole apply in a single
 * `$transaction`. Instead we use a **validated-then-sequential** strategy:
 *
 *   1. Run the full `validateContentPlan` first and abort (writing NOTHING) on
 *      any `error`-level issue.
 *   2. Apply the cluster, then the articles, in sequence — tracking every row we
 *      *created* (as opposed to updated).
 *   3. If any later step throws, perform **best-effort compensating cleanup**:
 *      hard-delete just the rows this call created (newest first), so a partial
 *      apply does not leave orphaned new content behind. Rows that were UPDATED
 *      are left as-is (we cannot safely roll them back without the prior state),
 *      and webhooks already emitted for completed steps are not retracted.
 *
 * This is a pragmatic approximation of atomicity given the non-transactional
 * service layer; the contract's "abort atomically on validation error" guarantee
 * is met exactly (validation precedes all writes), and runtime failures degrade
 * to best-effort rollback of newly-created rows.
 */
export async function applyContentPlan(
  input: ApplyContentPlanInput,
  contractVersion: number
): Promise<ApplyContentPlanOutput> {
  // 1. Validate first — never write on an invalid plan.
  const validation = await validateContentPlan(input);
  if (!validation.ok) {
    throw new McpError(
      'invalid_plan',
      'Content plan failed validation',
      422,
      validation.issues
    );
  }

  // Use the normalized plan (slugs filled) for all writes.
  const plan = validation.normalized ?? normalizePlan(input);

  // Track newly-created rows for best-effort compensating cleanup on failure.
  const createdClusterIds: string[] = [];
  const createdArticleIds: string[] = [];

  // Pre-compute which articles already exist (→ update) vs are new (→ create),
  // by slug, in one query.
  const articleSlugs = plan.articles
    .map(a => a.slug)
    .filter((s): s is string => Boolean(s));
  const existingArticles =
    articleSlugs.length > 0
      ? await prisma.article.findMany({
          where: { slug: { in: articleSlugs } },
          select: { id: true, slug: true },
        })
      : [];
  const existingArticleIdBySlug = new Map(
    existingArticles.map(a => [a.slug, a.id])
  );

  try {
    // 2a. Upsert the cluster (if present): create when no slug match, else
    // update via optimistic concurrency.
    let clusterId: string | undefined;
    if (plan.cluster) {
      const cluster: ClusterCanonical = plan.cluster;
      const existingCluster = cluster.slug
        ? await prisma.articleCluster.findUnique({
            where: { slug: cluster.slug },
            select: { id: true },
          })
        : null;

      if (existingCluster) {
        const updated = await updateClusterSvc({
          id: existingCluster.id,
          patch: cluster,
        });
        clusterId = updated.id;
      } else {
        const created = await createClusterSvc(cluster);
        clusterId = created.id;
        createdClusterIds.push(created.id);
      }
    }

    // 2b. Upsert each article by slug, wiring clusterId/clusterRole/
    // internalLinks/scheduledAt through the canonical shape.
    const applied: AppliedArticle[] = [];
    const created: string[] = [];
    const updated: string[] = [];

    for (const draft of plan.articles) {
      const canonical = draftToCanonical(draft, clusterId);
      const existingId = existingArticleIdBySlug.get(canonical.slug);

      // NOTE: the plan contract's `DraftArticle` does not carry a per-article
      // `baseHash` (it is a partial canonical-v2 shape), so apply performs an
      // unconditional last-writer-wins update on slug collisions. Optimistic
      // concurrency via `baseHash` remains available on the standalone
      // `update_article` tool for clients that need it.
      const baseHash = (draft as { baseHash?: string }).baseHash;

      if (existingId) {
        const result = await updateArticleSvc({
          id: existingId,
          patch: canonical,
          baseHash,
          contractVersion,
        });
        applied.push({
          id: result.id,
          slug: canonical.slug,
          contentHash: result.contentHash,
        });
        updated.push(result.id);
      } else {
        const result = await createArticleSvc(canonical, contractVersion);
        createdArticleIds.push(result.id);
        applied.push({
          id: result.id,
          slug: canonical.slug,
          contentHash: result.contentHash,
        });
        created.push(result.id);
      }
    }

    return {
      ...(clusterId ? { clusterId } : {}),
      articles: applied,
      created,
      updated,
    };
  } catch (error) {
    // 3. Best-effort compensating cleanup of rows THIS call created (newest
    // first). Updated rows are intentionally not rolled back. Cleanup failures
    // are swallowed so the original error surfaces to the caller.
    await cleanupCreated(createdArticleIds, createdClusterIds);
    throw error;
  }
}

/**
 * Best-effort hard-delete of rows created during a failed `applyContentPlan`.
 * Deletes articles first (they reference the cluster), then the clusters.
 * Never throws — cleanup is opportunistic and must not mask the original error.
 */
async function cleanupCreated(
  articleIds: string[],
  clusterIds: string[]
): Promise<void> {
  for (const id of [...articleIds].reverse()) {
    try {
      await prisma.article.delete({ where: { id } });
    } catch (cleanupError) {
      console.error(
        `[MCP plan] compensating cleanup failed for article ${id}:`,
        cleanupError
      );
    }
  }
  for (const id of [...clusterIds].reverse()) {
    try {
      await prisma.articleCluster.delete({ where: { id } });
    } catch (cleanupError) {
      console.error(
        `[MCP plan] compensating cleanup failed for cluster ${id}:`,
        cleanupError
      );
    }
  }
}
