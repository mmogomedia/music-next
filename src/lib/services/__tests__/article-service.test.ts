import {
  slugify,
  calculateReadTime,
  getClusters,
  createCluster,
  updateCluster,
  deleteCluster,
  getArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
  updateArticle,
  publishArticle,
} from '../article-service';
import { prisma } from '@/lib/db';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({
  prisma: {
    articleCluster: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    timelinePost: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

// Prevent real embeddings during tests
jest.mock('@/lib/ai/track-embedding-service', () => ({
  embedText: jest.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockCluster = {
  id: 'cluster-1',
  name: 'Music Royalties Guide',
  slug: 'music-royalties-guide',
  description: 'Everything about music royalties',
  coverImageUrl: null,
  targetKeywords: ['royalties', 'CAPASSO'],
  status: 'DRAFT' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockArticle = {
  id: 'article-1',
  title: 'How CAPASSO Works',
  slug: 'how-capasso-works',
  body: `${'# Introduction\n\n'.repeat(10)}Content here.`,
  excerpt: 'A guide to CAPASSO royalties',
  coverImageUrl: 'https://example.com/cover.jpg',
  seoTitle: null,
  metaDescription: null,
  targetKeywords: ['CAPASSO', 'royalties'],
  clusterId: 'cluster-1',
  clusterRole: 'SPOKE' as const,
  readTime: 0,
  status: 'DRAFT' as const,
  publishedAt: null,
  authorId: 'user-1',
  timelinePostId: null,
  embeddingUpdatedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ─── slugify ─────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('converts title to lowercase hyphenated slug', () => {
    expect(slugify('Music Royalties Guide')).toBe('music-royalties-guide');
  });

  it('strips special characters', () => {
    expect(slugify('How CAPASSO Works: A Guide!')).toBe(
      'how-capasso-works-a-guide'
    );
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('a -- b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens after processing', () => {
    const result = slugify('  hello world  ');
    expect(result).toBe('hello-world');
  });

  it('truncates to 80 characters', () => {
    const longTitle = 'a'.repeat(100);
    expect(slugify(longTitle)).toHaveLength(80);
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('');
  });
});

// ─── calculateReadTime ────────────────────────────────────────────────────────

describe('calculateReadTime', () => {
  it('returns 1 for very short content', () => {
    expect(calculateReadTime('Short text.')).toBe(1);
  });

  it('returns 1 as minimum even for empty string', () => {
    expect(calculateReadTime('')).toBe(1);
  });

  it('calculates ~200 words per minute', () => {
    // 400 words → 2 minutes
    const text = 'word '.repeat(400);
    expect(calculateReadTime(text)).toBe(2);
  });

  it('rounds to nearest minute', () => {
    // 250 words → 1.25 min → rounds to 1
    const text = 'word '.repeat(250);
    expect(calculateReadTime(text)).toBe(1);
  });

  it('handles markdown content with symbols', () => {
    const markdown = `# Title\n\n${'This is a paragraph. '.repeat(50)}`;
    const result = calculateReadTime(markdown);
    expect(result).toBeGreaterThan(0);
  });
});

// ─── getClusters ─────────────────────────────────────────────────────────────

describe('getClusters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns clusters with article counts', async () => {
    const mockClusters = [{ ...mockCluster, _count: { articles: 3 } }];
    (prisma.articleCluster.findMany as jest.Mock).mockResolvedValue(
      mockClusters
    );

    const result = await getClusters();

    expect(result).toHaveLength(1);
    expect(result[0]._count.articles).toBe(3);
    expect(prisma.articleCluster.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { _count: { select: { articles: true } } },
      })
    );
  });

  it('returns empty array when no clusters exist', async () => {
    (prisma.articleCluster.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getClusters();
    expect(result).toEqual([]);
  });
});

// ─── createCluster ────────────────────────────────────────────────────────────

describe('createCluster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates cluster with provided data', async () => {
    (prisma.articleCluster.create as jest.Mock).mockResolvedValue(mockCluster);

    const result = await createCluster({
      name: 'Music Royalties Guide',
      slug: 'music-royalties-guide',
      description: 'Everything about music royalties',
      targetKeywords: ['royalties', 'CAPASSO'],
    });

    expect(result).toMatchObject({ name: 'Music Royalties Guide' });
    expect(prisma.articleCluster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Music Royalties Guide',
          slug: 'music-royalties-guide',
        }),
      })
    );
  });

  it('auto-generates slug from name when not provided', async () => {
    (prisma.articleCluster.create as jest.Mock).mockResolvedValue(mockCluster);

    await createCluster({ name: 'Music Royalties Guide' });

    expect(prisma.articleCluster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'music-royalties-guide',
        }),
      })
    );
  });
});

// ─── updateCluster ────────────────────────────────────────────────────────────

describe('updateCluster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates cluster with provided fields', async () => {
    const updated = { ...mockCluster, name: 'Updated Name' };
    (prisma.articleCluster.update as jest.Mock).mockResolvedValue(updated);

    const result = await updateCluster('cluster-1', { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
    expect(prisma.articleCluster.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cluster-1' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      })
    );
  });

  it('only includes provided fields in update', async () => {
    (prisma.articleCluster.update as jest.Mock).mockResolvedValue(mockCluster);

    await updateCluster('cluster-1', { name: 'New Name' });

    const callArgs = (prisma.articleCluster.update as jest.Mock).mock
      .calls[0][0];
    expect(callArgs.data).not.toHaveProperty('description');
    expect(callArgs.data).not.toHaveProperty('slug');
  });
});

// ─── deleteCluster ────────────────────────────────────────────────────────────

describe('deleteCluster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes cluster when no articles exist', async () => {
    (prisma.article.count as jest.Mock).mockResolvedValue(0);
    (prisma.articleCluster.delete as jest.Mock).mockResolvedValue(mockCluster);

    await deleteCluster('cluster-1');

    expect(prisma.articleCluster.delete).toHaveBeenCalledWith({
      where: { id: 'cluster-1' },
    });
  });

  it('throws 409 error when articles exist', async () => {
    (prisma.article.count as jest.Mock).mockResolvedValue(3);

    await expect(deleteCluster('cluster-1')).rejects.toMatchObject({
      message: expect.stringContaining('Cannot delete cluster'),
      statusCode: 409,
    });

    expect(prisma.articleCluster.delete).not.toHaveBeenCalled();
  });
});

// ─── getArticles ─────────────────────────────────────────────────────────────

describe('getArticles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated articles', async () => {
    const mockArticles = [mockArticle];
    (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
    (prisma.article.count as jest.Mock).mockResolvedValue(1);

    const result = await getArticles({ page: 1, limit: 10 });

    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('filters by status', async () => {
    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.article.count as jest.Mock).mockResolvedValue(0);

    await getArticles({ status: 'PUBLISHED' });

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
      })
    );
  });

  it('filters by clusterId', async () => {
    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.article.count as jest.Mock).mockResolvedValue(0);

    await getArticles({ clusterId: 'cluster-1' });

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clusterId: 'cluster-1' }),
      })
    );
  });

  it('applies search filter on title and excerpt', async () => {
    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.article.count as jest.Mock).mockResolvedValue(0);

    await getArticles({ search: 'CAPASSO' });

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              title: { contains: 'CAPASSO', mode: 'insensitive' },
            }),
          ]),
        }),
      })
    );
  });

  it('calculates correct pagination', async () => {
    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.article.count as jest.Mock).mockResolvedValue(45);

    const result = await getArticles({ page: 2, limit: 20 });

    expect(result.pages).toBe(3);
    expect(result.page).toBe(2);
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });
});

// ─── getArticleById ───────────────────────────────────────────────────────────

describe('getArticleById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns article when found', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

    const result = await getArticleById('article-1');
    expect(result.id).toBe('article-1');
  });

  it('throws error when article not found', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getArticleById('non-existent')).rejects.toThrow(
      'Article not found: non-existent'
    );
  });
});

// ─── getArticleBySlug ─────────────────────────────────────────────────────────

describe('getArticleBySlug', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns article with cluster when found', async () => {
    const articleWithCluster = {
      ...mockArticle,
      cluster: {
        ...mockCluster,
        articles: [mockArticle],
      },
      author: { id: 'user-1', name: 'Admin', image: null },
    };
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(
      articleWithCluster
    );

    const result = await getArticleBySlug('how-capasso-works');

    expect(result.slug).toBe('how-capasso-works');
    expect(result.cluster).toBeDefined();
    expect(result.author.id).toBe('user-1');
  });

  it('throws error when article not found by slug', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getArticleBySlug('non-existent-slug')).rejects.toThrow(
      'Article not found: non-existent-slug'
    );
  });
});

// ─── createArticle ────────────────────────────────────────────────────────────

describe('createArticle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates article with auto-calculated read time', async () => {
    const body = 'word '.repeat(400); // ~2 min
    const inputData = { title: 'Test Article', body };
    (prisma.article.create as jest.Mock).mockResolvedValue({
      ...mockArticle,
      title: 'Test Article',
      readTime: 2,
    });

    const result = await createArticle(inputData, 'user-1');

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Test Article',
          authorId: 'user-1',
          readTime: 2,
        }),
      })
    );
    expect(result.readTime).toBe(2);
  });

  it('auto-generates slug from title when not provided', async () => {
    (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

    await createArticle(
      { title: 'How CAPASSO Works', body: 'content' },
      'user-1'
    );

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'how-capasso-works',
        }),
      })
    );
  });

  it('uses provided slug when given', async () => {
    (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

    await createArticle(
      { title: 'My Article', slug: 'custom-slug', body: 'content' },
      'user-1'
    );

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'custom-slug' }),
      })
    );
  });

  it('sets default clusterRole to SPOKE', async () => {
    (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

    await createArticle({ title: 'Article', body: 'content' }, 'user-1');

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clusterRole: 'SPOKE' }),
      })
    );
  });

  it('sets PILLAR role when specified', async () => {
    (prisma.article.create as jest.Mock).mockResolvedValue({
      ...mockArticle,
      clusterRole: 'PILLAR',
    });

    await createArticle(
      { title: 'Article', body: 'content', clusterRole: 'PILLAR' },
      'user-1'
    );

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clusterRole: 'PILLAR' }),
      })
    );
  });

  it('converts empty coverImageUrl to null', async () => {
    (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

    await createArticle(
      { title: 'Article', body: 'content', coverImageUrl: '' },
      'user-1'
    );

    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverImageUrl: null }),
      })
    );
  });
});

// ─── updateArticle ────────────────────────────────────────────────────────────

describe('updateArticle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates article fields', async () => {
    const updated = { ...mockArticle, title: 'Updated Title' };
    (prisma.article.update as jest.Mock).mockResolvedValue(updated);

    const result = await updateArticle('article-1', { title: 'Updated Title' });

    expect(result.title).toBe('Updated Title');
    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({ title: 'Updated Title' }),
      })
    );
  });

  it('recalculates readTime when body is updated', async () => {
    (prisma.article.update as jest.Mock).mockResolvedValue({
      ...mockArticle,
      readTime: 3,
    });

    await updateArticle('article-1', { body: 'word '.repeat(600) });

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ readTime: 3 }),
      })
    );
  });

  it('auto-generates slug when title changes but no slug provided', async () => {
    (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);

    await updateArticle('article-1', { title: 'New Title Here' });

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'new-title-here' }),
      })
    );
  });

  it('does not change slug when title changes and slug explicitly provided', async () => {
    (prisma.article.update as jest.Mock).mockResolvedValue(mockArticle);

    await updateArticle('article-1', {
      title: 'New Title Here',
      slug: 'my-custom-slug',
    });

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'my-custom-slug' }),
      })
    );
  });
});

// ─── publishArticle ───────────────────────────────────────────────────────────

describe('publishArticle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('publishes draft article and creates timeline post', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.timelinePost.create as jest.Mock).mockResolvedValue({
      id: 'timeline-post-1',
    });
    const publishedArticle = {
      ...mockArticle,
      status: 'PUBLISHED' as const,
      timelinePostId: 'timeline-post-1',
    };
    (prisma.article.update as jest.Mock).mockResolvedValue(publishedArticle);

    const result = await publishArticle('article-1', 'admin-user-1');

    expect(result.status).toBe('PUBLISHED');
    expect(result.timelinePostId).toBe('timeline-post-1');
  });

  it('creates timeline post with NEWS_ARTICLE postType', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.timelinePost.create as jest.Mock).mockResolvedValue({
      id: 'tp-1',
    });
    (prisma.article.update as jest.Mock).mockResolvedValue({
      ...mockArticle,
      status: 'PUBLISHED',
    });

    await publishArticle('article-1', 'admin-user-1');

    expect(prisma.timelinePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postType: 'NEWS_ARTICLE',
          authorType: 'ADMIN',
          authorId: 'admin-user-1',
        }),
      })
    );
  });

  it('sets isInternal: true in timeline post content', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.timelinePost.create as jest.Mock).mockResolvedValue({ id: 'tp-1' });
    (prisma.article.update as jest.Mock).mockResolvedValue({
      ...mockArticle,
      status: 'PUBLISHED',
    });

    await publishArticle('article-1', 'admin-user-1');

    expect(prisma.timelinePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: expect.objectContaining({
            isInternal: true,
            slug: 'how-capasso-works',
          }),
        }),
      })
    );
  });

  it('throws error when article not found', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      publishArticle('non-existent', 'admin-user-1')
    ).rejects.toThrow('Article not found: non-existent');
  });

  it('throws 409 when article is already published', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue({
      ...mockArticle,
      status: 'PUBLISHED',
    });

    await expect(
      publishArticle('article-1', 'admin-user-1')
    ).rejects.toMatchObject({
      message: expect.stringContaining('already published'),
      statusCode: 409,
    });

    expect(prisma.timelinePost.create).not.toHaveBeenCalled();
    expect(prisma.article.update).not.toHaveBeenCalled();
  });

  it('updates article with publishedAt, readTime, and timelinePostId', async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.timelinePost.create as jest.Mock).mockResolvedValue({
      id: 'tp-1',
    });
    (prisma.article.update as jest.Mock).mockResolvedValue({
      ...mockArticle,
      status: 'PUBLISHED',
    });

    await publishArticle('article-1', 'admin-user-1');

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          timelinePostId: 'tp-1',
          publishedAt: expect.any(Date),
          readTime: expect.any(Number),
        }),
      })
    );
  });
});
