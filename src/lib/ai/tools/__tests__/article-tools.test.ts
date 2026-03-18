import { searchArticlesTool, articleTools } from '../article-tools';
import { searchArticlesBySemantic } from '@/lib/services/article-service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/services/article-service', () => ({
  searchArticlesBySemantic: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockArticles = [
  {
    id: 'article-1',
    title: 'How CAPASSO Works',
    slug: 'how-capasso-works',
    excerpt: 'A guide to CAPASSO royalties in South Africa.',
    readTime: 4,
    publishedAt: new Date('2026-01-15'),
    clusterRole: 'SPOKE',
    cluster: { name: 'Music Royalties Guide', slug: 'music-royalties-guide' },
  },
  {
    id: 'article-2',
    title: 'SAMRO Explained',
    slug: 'samro-explained',
    excerpt: 'How SAMRO distributes performance royalties.',
    readTime: 3,
    publishedAt: new Date('2026-01-10'),
    clusterRole: 'PILLAR',
    cluster: { name: 'Music Royalties Guide', slug: 'music-royalties-guide' },
  },
];

// ─── Tool definition ──────────────────────────────────────────────────────────

describe('searchArticlesTool definition', () => {
  it('has correct name', () => {
    expect(searchArticlesTool.name).toBe('search_articles');
  });

  it('has a description mentioning music business topics', () => {
    expect(searchArticlesTool.description).toMatch(/royalt/i);
    expect(searchArticlesTool.description).toMatch(/CAPASSO|SAMRO/);
  });

  it('is included in articleTools array', () => {
    expect(articleTools).toContain(searchArticlesTool);
  });
});

// ─── Tool invocation ──────────────────────────────────────────────────────────

describe('searchArticlesTool.invoke', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns matching articles for a query', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue(mockArticles);

    const result = await searchArticlesTool.invoke({
      query: 'how do royalties work in South Africa',
      limit: 5,
    });

    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(2);
    expect(parsed.articles).toHaveLength(2);
    expect(parsed.articles[0].title).toBe('How CAPASSO Works');
    expect(parsed.articles[0].url).toBe('/articles/how-capasso-works');
    expect(parsed.articles[0].readTime).toBe(4);
  });

  it('includes cluster name in results', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue(mockArticles);

    const result = await searchArticlesTool.invoke({ query: 'royalties' });
    const parsed = JSON.parse(result);

    expect(parsed.articles[0].cluster).toBe('Music Royalties Guide');
  });

  it('returns empty array when no articles found', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([]);

    const result = await searchArticlesTool.invoke({
      query: 'unrelated topic',
    });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBe(0);
    expect(parsed.articles).toEqual([]);
  });

  it('returns empty array with error key on service failure', async () => {
    (searchArticlesBySemantic as jest.Mock).mockRejectedValue(
      new Error('Embedding service unavailable')
    );

    const result = await searchArticlesTool.invoke({ query: 'royalties' });
    const parsed = JSON.parse(result);

    expect(parsed.count).toBe(0);
    expect(parsed.articles).toEqual([]);
    expect(parsed.error).toBe('Search failed');
  });

  it('passes query and limit to searchArticlesBySemantic', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([]);

    await searchArticlesTool.invoke({ query: 'CAPASSO', limit: 3 });

    expect(searchArticlesBySemantic).toHaveBeenCalledWith('CAPASSO', {
      limit: 3,
      minSimilarity: 0.25,
    });
  });

  it('uses default limit of 5 when not provided', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([]);

    await searchArticlesTool.invoke({ query: 'SAMRO' });

    expect(searchArticlesBySemantic).toHaveBeenCalledWith(
      'SAMRO',
      expect.objectContaining({ limit: 5 })
    );
  });

  it('returns excerpt in article results', async () => {
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([
      mockArticles[0],
    ]);

    const result = await searchArticlesTool.invoke({ query: 'CAPASSO' });
    const parsed = JSON.parse(result);

    expect(parsed.articles[0].excerpt).toBe(
      'A guide to CAPASSO royalties in South Africa.'
    );
  });

  it('returns empty string for null excerpts', async () => {
    const articleWithNullExcerpt = { ...mockArticles[0], excerpt: null };
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([
      articleWithNullExcerpt,
    ]);

    const result = await searchArticlesTool.invoke({ query: 'CAPASSO' });
    const parsed = JSON.parse(result);

    expect(parsed.articles[0].excerpt).toBe('');
  });

  it('returns null for cluster when article has no cluster', async () => {
    const articleWithNoCluster = { ...mockArticles[0], cluster: null };
    (searchArticlesBySemantic as jest.Mock).mockResolvedValue([
      articleWithNoCluster,
    ]);

    const result = await searchArticlesTool.invoke({ query: 'CAPASSO' });
    const parsed = JSON.parse(result);

    expect(parsed.articles[0].cluster).toBeNull();
  });
});
