import { GET } from '../route';
import { getArticles } from '@/lib/services/article-service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock('@/lib/services/article-service', () => ({
  getArticles: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockArticle = {
  id: 'article-1',
  title: 'How CAPASSO Works',
  slug: 'how-capasso-works',
  body: 'This is the full body content that should be stripped.',
  excerpt: 'A guide to CAPASSO royalties',
  status: 'PUBLISHED',
  clusterRole: 'SPOKE',
  readTime: 3,
  publishedAt: new Date('2026-01-15'),
  authorId: 'admin-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const makeRequest = (url: string) => new Request(url);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/articles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns published articles without body', async () => {
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [mockArticle],
      total: 1,
      page: 1,
      pages: 1,
    });

    const response = await GET(makeRequest('http://localhost/api/articles'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.articles).toHaveLength(1);

    // body should be stripped from public response
    expect(data.articles[0].body).toBeUndefined();
    expect(data.articles[0].title).toBe('How CAPASSO Works');
  });

  it('always queries for PUBLISHED articles only', async () => {
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [],
      total: 0,
      page: 1,
      pages: 0,
    });

    const response = await GET(makeRequest('http://localhost/api/articles'));

    expect(getArticles).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PUBLISHED' })
    );
    expect(response.status).toBe(200);
  });

  it('passes query params to getArticles', async () => {
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [],
      total: 0,
      page: 2,
      pages: 3,
    });

    await GET(
      makeRequest(
        'http://localhost/api/articles?clusterId=cluster-1&page=2&limit=5&search=royalties'
      )
    );

    expect(getArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PUBLISHED',
        clusterId: 'cluster-1',
        page: 2,
        limit: 5,
        search: 'royalties',
      })
    );
  });

  it('returns pagination metadata', async () => {
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [mockArticle],
      total: 42,
      page: 1,
      pages: 3,
    });

    const response = await GET(makeRequest('http://localhost/api/articles'));
    const data = await response.json();

    expect(data.total).toBe(42);
    expect(data.pages).toBe(3);
    expect(data.page).toBe(1);
  });

  it('returns 500 on service error', async () => {
    (getArticles as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await GET(makeRequest('http://localhost/api/articles'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch articles');
  });

  it('returns empty articles array when none published', async () => {
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [],
      total: 0,
      page: 1,
      pages: 0,
    });

    const response = await GET(makeRequest('http://localhost/api/articles'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.articles).toEqual([]);
    expect(data.total).toBe(0);
  });
});
