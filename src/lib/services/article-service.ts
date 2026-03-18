/**
 * Article Service
 *
 * Business logic for article and content cluster management.
 * Used by both API routes and AI agents.
 *
 * @module ArticleService
 */

import { prisma } from '@/lib/db';
import { setToolLinksForArticle } from '@/lib/services/graph-service';
import type {
  Article,
  ArticleCluster,
  ArticleWithCluster,
  ClusterWithCount,
  CreateArticleInput,
  CreateClusterInput,
} from '@/types/articles';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Auto-calculate read time from markdown body (~200 words/min, min 1 minute).
 */
export function calculateReadTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Generate a URL-safe slug from a title string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ─── Embedding helpers ───────────────────────────────────────────────────────

function buildArticleEmbeddingText(article: {
  title: string;
  excerpt?: string | null;
  body: string;
  targetKeywords: string[];
}): string {
  const parts: string[] = [];
  parts.push(article.title);
  if (article.excerpt?.trim()) parts.push(article.excerpt.trim());
  if (article.targetKeywords.length > 0) {
    parts.push(`Topics: ${article.targetKeywords.join(', ')}.`);
  }
  const bodyText = article.body.replace(/[#*_`~>[\]!()]/g, ' ').trim();
  parts.push(bodyText.slice(0, 1500));
  return parts.join(' ');
}

async function storeArticleEmbedding(
  articleId: string,
  embedding: number[]
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "articles"
    SET embedding = ${embedding}::vector(1536), "embeddingUpdatedAt" = NOW()
    WHERE id = ${articleId}
  `;
}

export function enqueueArticleEmbedding(article: {
  id: string;
  title: string;
  excerpt?: string | null;
  body: string;
  targetKeywords: string[];
}): void {
  const { embedText } = require('@/lib/ai/track-embedding-service');
  const text = buildArticleEmbeddingText(article);
  embedText(text)
    .then((vec: number[]) => storeArticleEmbedding(article.id, vec))
    .catch((err: Error) =>
      console.error('[ArticleEmbedding] Failed:', err.message)
    );
}

// ─── Cluster CRUD ────────────────────────────────────────────────────────────

export async function getClusters(): Promise<ClusterWithCount[]> {
  return prisma.articleCluster.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { articles: true } },
    },
  }) as unknown as ClusterWithCount[];
}

export async function getClusterById(id: string): Promise<ArticleCluster> {
  const cluster = await prisma.articleCluster.findUnique({ where: { id } });
  if (!cluster) throw new Error(`Cluster not found: ${id}`);
  return cluster as unknown as ArticleCluster;
}

export async function createCluster(
  data: CreateClusterInput
): Promise<ArticleCluster> {
  const slug = data.slug || slugify(data.name);
  const primaryKeywords = data.primaryKeywords ?? [];
  const secondaryKeywords = data.secondaryKeywords ?? [];
  const longTailKeywords = data.longTailKeywords ?? [];
  const targetKeywords = data.targetKeywords ?? [
    ...primaryKeywords,
    ...secondaryKeywords,
    ...longTailKeywords,
  ];

  return prisma.articleCluster.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      about: data.about ?? null,
      goal: data.goal ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      targetKeywords,
      primaryKeywords,
      secondaryKeywords,
      longTailKeywords,
      audience: data.audience ?? null,
    },
  }) as unknown as ArticleCluster;
}

export async function updateCluster(
  id: string,
  data: Partial<CreateClusterInput>
): Promise<ArticleCluster> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.about !== undefined) updateData.about = data.about ?? null;
  if (data.goal !== undefined) updateData.goal = data.goal ?? null;
  if (data.coverImageUrl !== undefined)
    updateData.coverImageUrl = data.coverImageUrl;
  if (data.audience !== undefined) updateData.audience = data.audience ?? null;

  // Keyword fields — recompute targetKeywords when any category changes
  const primary = data.primaryKeywords;
  const secondary = data.secondaryKeywords;
  const longTail = data.longTailKeywords;
  if (primary !== undefined) updateData.primaryKeywords = primary;
  if (secondary !== undefined) updateData.secondaryKeywords = secondary;
  if (longTail !== undefined) updateData.longTailKeywords = longTail;
  if (data.targetKeywords !== undefined) {
    updateData.targetKeywords = data.targetKeywords;
  } else if (
    primary !== undefined ||
    secondary !== undefined ||
    longTail !== undefined
  ) {
    const current = await prisma.articleCluster.findUnique({
      where: { id },
      select: {
        primaryKeywords: true,
        secondaryKeywords: true,
        longTailKeywords: true,
      },
    });
    updateData.targetKeywords = [
      ...(primary ?? current?.primaryKeywords ?? []),
      ...(secondary ?? current?.secondaryKeywords ?? []),
      ...(longTail ?? current?.longTailKeywords ?? []),
    ];
  }

  return prisma.articleCluster.update({
    where: { id },
    data: updateData,
  }) as unknown as ArticleCluster;
}

export async function deleteCluster(id: string): Promise<void> {
  const count = await prisma.article.count({ where: { clusterId: id } });
  if (count > 0) {
    throw Object.assign(
      new Error('Cannot delete cluster with existing articles'),
      { statusCode: 409 }
    );
  }
  await prisma.articleCluster.delete({ where: { id } });
}

// ─── Article CRUD ────────────────────────────────────────────────────────────

export interface GetArticlesOptions {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  clusterId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getArticles(opts: GetArticlesOptions = {}): Promise<{
  articles: Article[];
  total: number;
  page: number;
  pages: number;
}> {
  const { page = 1, limit = 20, status, clusterId, search } = opts;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        cluster: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles: articles as unknown as Article[],
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getArticleById(id: string): Promise<Article> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      cluster: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });
  if (!article) throw new Error(`Article not found: ${id}`);
  return article as unknown as Article;
}

export async function getArticleBySlug(
  slug: string
): Promise<ArticleWithCluster> {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      cluster: {
        include: {
          articles: {
            where: { status: 'PUBLISHED' },
            orderBy: [{ clusterRole: 'asc' }, { publishedAt: 'asc' }],
            select: {
              id: true,
              title: true,
              slug: true,
              clusterRole: true,
              excerpt: true,
              readTime: true,
              publishedAt: true,
            },
          },
        },
      },
      author: { select: { id: true, name: true, image: true } },
    },
  });
  if (!article) throw new Error(`Article not found: ${slug}`);

  // Resolve internalLinks slugs → lightweight article objects
  const internalLinks: string[] = (article as any).internalLinks ?? [];
  let internalLinkArticles: Array<{
    slug: string;
    title: string;
    excerpt: string | null;
    readTime: number;
  }> = [];

  if (internalLinks.length > 0) {
    const rows = await prisma.article.findMany({
      where: { slug: { in: internalLinks }, status: 'PUBLISHED' },
      select: { slug: true, title: true, excerpt: true, readTime: true },
    });
    // Preserve the author-defined order
    internalLinkArticles = internalLinks
      .map(s => rows.find(r => r.slug === s))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);
  }

  // Resolve linked tools from ContentLink (richer than raw toolSlugs)
  const toolLinks = await prisma.contentLink.findMany({
    where: {
      fromType: 'ARTICLE',
      fromId: article.id,
      toType: 'TOOL',
      linkType: 'REFERENCES',
    },
    orderBy: { order: 'asc' },
  });
  const linkedToolSlugs = toolLinks.map(l => l.toId);
  // Use ContentLink order if available, otherwise fall back to article.toolSlugs
  const resolvedToolSlugs =
    linkedToolSlugs.length > 0
      ? linkedToolSlugs
      : ((article as any).toolSlugs ?? []);

  return {
    ...article,
    internalLinkArticles,
    resolvedToolSlugs,
  } as unknown as ArticleWithCluster;
}

export async function createArticle(
  data: CreateArticleInput,
  authorId: string
): Promise<Article> {
  const slug = data.slug || slugify(data.title);
  const readTime = calculateReadTime(data.body);

  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      body: data.body,
      excerpt: data.excerpt ?? null,
      coverImageUrl: data.coverImageUrl || null,
      seoTitle: data.seoTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      targetKeywords: data.targetKeywords ?? [],
      primaryKeyword: data.primaryKeyword ?? null,
      internalLinks: data.internalLinks ?? [],
      toolSlugs: data.toolSlugs ?? [],
      ctaText: data.ctaText ?? null,
      ctaLink: data.ctaLink ?? null,
      clusterId: data.clusterId ?? null,
      clusterRole: data.clusterRole ?? 'SPOKE',
      readTime,
      authorId,
    },
  });

  // Sync to content graph
  if ((data.toolSlugs ?? []).length > 0) {
    await setToolLinksForArticle(article.id, data.toolSlugs ?? []);
  }

  return article as unknown as Article;
}

const VERSION_LIMIT = 50;

async function snapshotArticleVersion(
  articleId: string,
  savedById: string
): Promise<void> {
  const current = await prisma.article.findUnique({ where: { id: articleId } });
  if (!current) return;

  // Get next version number
  const latest = await (prisma as any).articleVersion.findFirst({
    where: { articleId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  // Create snapshot
  await (prisma as any).articleVersion.create({
    data: {
      articleId,
      version: nextVersion,
      title: current.title,
      body: current.body,
      excerpt: current.excerpt ?? null,
      coverImageUrl: current.coverImageUrl ?? null,
      seoTitle: current.seoTitle ?? null,
      metaDescription: current.metaDescription ?? null,
      targetKeywords: (current as any).targetKeywords ?? [],
      primaryKeyword: (current as any).primaryKeyword ?? null,
      internalLinks: (current as any).internalLinks ?? [],
      toolSlugs: (current as any).toolSlugs ?? [],
      ctaText: current.ctaText ?? null,
      ctaLink: current.ctaLink ?? null,
      savedById,
    },
  });

  // Prune oldest versions beyond the limit
  const allVersions = await (prisma as any).articleVersion.findMany({
    where: { articleId },
    orderBy: { version: 'desc' },
    select: { id: true },
  });
  if (allVersions.length > VERSION_LIMIT) {
    const toDelete = allVersions
      .slice(VERSION_LIMIT)
      .map((v: { id: string }) => v.id);
    await (prisma as any).articleVersion.deleteMany({
      where: { id: { in: toDelete } },
    });
  }
}

export async function updateArticle(
  id: string,
  data: Partial<CreateArticleInput>,
  savedById?: string
): Promise<Article> {
  // Snapshot current state before applying changes
  if (savedById) {
    await snapshotArticleVersion(id, savedById);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) {
    updateData.title = data.title;
    if (!data.slug) updateData.slug = slugify(data.title);
  }
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.body !== undefined) {
    updateData.body = data.body;
    updateData.readTime = calculateReadTime(data.body);
  }
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImageUrl !== undefined)
    updateData.coverImageUrl = data.coverImageUrl || null;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.metaDescription !== undefined)
    updateData.metaDescription = data.metaDescription;
  if (data.targetKeywords !== undefined)
    updateData.targetKeywords = data.targetKeywords;
  if (data.primaryKeyword !== undefined)
    updateData.primaryKeyword = data.primaryKeyword || null;
  if (data.internalLinks !== undefined)
    updateData.internalLinks = data.internalLinks;
  if (data.toolSlugs !== undefined) updateData.toolSlugs = data.toolSlugs;
  if (data.ctaText !== undefined) updateData.ctaText = data.ctaText || null;

  if (data.ctaLink !== undefined) updateData.ctaLink = data.ctaLink || null;
  if (data.clusterId !== undefined)
    updateData.clusterId = data.clusterId || null;
  if (data.clusterRole !== undefined) updateData.clusterRole = data.clusterRole;

  const article = await prisma.article.update({
    where: { id },
    data: updateData,
  });

  // Sync tool links to content graph
  if (data.toolSlugs !== undefined) {
    await setToolLinksForArticle(id, data.toolSlugs);
  }

  return article as unknown as Article;
}

// ─── Version history ─────────────────────────────────────────────────────────

export async function getArticleVersions(articleId: string) {
  return (prisma as any).articleVersion.findMany({
    where: { articleId },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      title: true,
      excerpt: true,
      createdAt: true,
      savedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getArticleVersion(articleId: string, versionId: string) {
  const version = await (prisma as any).articleVersion.findFirst({
    where: { id: versionId, articleId },
    include: { savedBy: { select: { id: true, name: true } } },
  });
  if (!version) throw new Error(`Version not found: ${versionId}`);
  return version;
}

export async function restoreArticleVersion(
  articleId: string,
  versionId: string,
  restoredById: string
): Promise<Article> {
  const version = await getArticleVersion(articleId, versionId);

  // Snapshot current state before restoring
  await snapshotArticleVersion(articleId, restoredById);

  // Apply the version's content to the article
  return updateArticle(articleId, {
    title: version.title,
    body: version.body,
    excerpt: version.excerpt ?? undefined,
    coverImageUrl: version.coverImageUrl ?? undefined,
    seoTitle: version.seoTitle ?? undefined,
    metaDescription: version.metaDescription ?? undefined,
    targetKeywords: version.targetKeywords,
    primaryKeyword: version.primaryKeyword ?? undefined,
    internalLinks: version.internalLinks,
    toolSlugs: version.toolSlugs,
    ctaText: version.ctaText ?? undefined,
    ctaLink: version.ctaLink ?? undefined,
  });
  // Note: no savedById here to avoid double-snapshotting
}

// ─── Publish flow ────────────────────────────────────────────────────────────

export async function publishArticle(
  id: string,
  adminUserId: string
): Promise<Article> {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new Error(`Article not found: ${id}`);
  if (existing.status === 'PUBLISHED') {
    throw Object.assign(new Error('Article is already published'), {
      statusCode: 409,
    });
  }

  const readTime = calculateReadTime(existing.body);
  const publishedAt = new Date();

  // Create timeline post
  const timelinePost = await prisma.timelinePost.create({
    data: {
      postType: 'NEWS_ARTICLE',
      authorType: 'ADMIN',
      authorId: adminUserId,
      title: existing.title,
      description: existing.excerpt ?? null,
      coverImageUrl: existing.coverImageUrl ?? null,
      content: {
        articleId: existing.id,
        slug: existing.slug,
        readTime: `${readTime} min read`,
        isInternal: true,
      },
      status: 'PUBLISHED',
      publishedAt,
    },
  });

  // Update article
  const article = await prisma.article.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt,
      readTime,
      timelinePostId: timelinePost.id,
    },
  });

  // Fire-and-forget embedding
  enqueueArticleEmbedding({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    targetKeywords: article.targetKeywords,
  });

  return article as unknown as Article;
}

// ─── Semantic search ─────────────────────────────────────────────────────────

export async function searchArticlesBySemantic(
  query: string,
  options: { limit?: number; minSimilarity?: number } = {}
): Promise<Article[]> {
  const { limit = 10, minSimilarity = 0.25 } = options;
  const fetchLimit = Math.min(limit * 5, 50);

  const { embedText } = await import('@/lib/ai/track-embedding-service');
  const queryVec = await embedText(query);

  type RawRow = { id: string; similarity: number };
  let rows = await prisma.$queryRaw<RawRow[]>`
    SELECT id, 1 - (embedding <=> ${queryVec}::vector(1536)) AS similarity
    FROM "articles"
    WHERE embedding IS NOT NULL AND status = 'PUBLISHED'
    ORDER BY embedding <=> ${queryVec}::vector(1536)
    LIMIT ${fetchLimit}
  `;

  if (minSimilarity > 0) {
    rows = rows
      .filter(r => Number(r.similarity) >= minSimilarity)
      .slice(0, limit);
  }

  if (rows.length === 0) return [];

  const ids = rows.map(r => r.id);
  const similarityMap = new Map(rows.map(r => [r.id, r.similarity]));

  const articles = await prisma.article.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      readTime: true,
      publishedAt: true,
      clusterRole: true,
      cluster: { select: { name: true, slug: true } },
    },
  });

  return (articles as unknown as Article[]).sort(
    (a, b) =>
      (similarityMap.get((b as Article).id) ?? 0) -
      (similarityMap.get((a as Article).id) ?? 0)
  );
}
