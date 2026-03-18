import { GET, POST } from '../route';
import { getArticles, createArticle } from '@/lib/services/article-service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

jest.mock('@/lib/services/article-service', () => ({
  getArticles: jest.fn(),
  createArticle: jest.fn(),
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockAdminSession = {
  user: { id: 'admin-1', role: 'ADMIN' },
};

const mockArticle = {
  id: 'article-1',
  title: 'How CAPASSO Works',
  slug: 'how-capasso-works',
  body: 'Article body content here.',
  excerpt: 'A guide to CAPASSO',
  status: 'DRAFT',
  clusterRole: 'SPOKE',
  readTime: 1,
  publishedAt: null,
  authorId: 'admin-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// eslint-disable-next-line no-undef
function makeRequest(url: string, opts?: RequestInit) {
  return new Request(url, opts);
}

// ─── GET /api/admin/articles ──────────────────────────────────────────────────

describe('GET /api/admin/articles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/admin/articles');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin users', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = makeRequest('http://localhost/api/admin/articles');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns paginated articles for admin', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    (getArticles as jest.Mock).mockResolvedValue({
      articles: [mockArticle],
      total: 1,
      page: 1,
      pages: 1,
    });

    const request = makeRequest('http://localhost/api/admin/articles');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.articles).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it('passes query params to getArticles', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getArticles as jest.Mock).mockResolvedValue({
      articles: [],
      total: 0,
      page: 1,
      pages: 0,
    });

    const request = makeRequest(
      'http://localhost/api/admin/articles?status=PUBLISHED&page=2&limit=10&search=CAPASSO'
    );
    await GET(request);

    expect(getArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PUBLISHED',
        page: 2,
        limit: 10,
        search: 'CAPASSO',
      })
    );
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getArticles as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest('http://localhost/api/admin/articles');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch articles');
  });
});

// ─── POST /api/admin/articles ─────────────────────────────────────────────────

describe('POST /api/admin/articles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', body: 'Content' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    const request = makeRequest('http://localhost/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }), // missing body, empty title
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('creates article and returns 201', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (createArticle as jest.Mock).mockResolvedValue(mockArticle);

    const request = makeRequest('http://localhost/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'How CAPASSO Works',
        body: 'Article body content here.',
        targetKeywords: ['CAPASSO'],
        clusterRole: 'SPOKE',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.article.title).toBe('How CAPASSO Works');
    expect(createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'How CAPASSO Works' }),
      'admin-1'
    );
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (createArticle as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest('http://localhost/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', body: 'Content' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create article');
  });
});
