import { POST } from '../route';
import { publishArticle } from '@/lib/services/article-service';

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
  publishArticle: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };

const mockPublishedArticle = {
  id: 'article-1',
  title: 'How CAPASSO Works',
  slug: 'how-capasso-works',
  status: 'PUBLISHED',
  timelinePostId: 'tp-1',
  publishedAt: new Date(),
  readTime: 3,
};

// eslint-disable-next-line no-undef
const makeRequest = (url: string, opts?: RequestInit) => new Request(url, opts);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/articles/[id]/publish', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/article-1/publish', {
        method: 'POST',
      }),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(401);
  });

  it('returns 401 for non-admin users', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/article-1/publish', {
        method: 'POST',
      }),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(401);
  });

  it('publishes article and returns it', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (publishArticle as jest.Mock).mockResolvedValue(mockPublishedArticle);

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/article-1/publish', {
        method: 'POST',
      }),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.article.status).toBe('PUBLISHED');
    expect(data.article.timelinePostId).toBe('tp-1');
    expect(publishArticle).toHaveBeenCalledWith('article-1', 'admin-1');
  });

  it('returns 409 when article is already published', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    const alreadyPublishedError = Object.assign(
      new Error('Article is already published'),
      { statusCode: 409 }
    );
    (publishArticle as jest.Mock).mockRejectedValue(alreadyPublishedError);

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/article-1/publish', {
        method: 'POST',
      }),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Article is already published');
  });

  it('returns 404 when article not found', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    const notFoundError = Object.assign(
      new Error('Article not found: non-existent'),
      { statusCode: 404 }
    );
    (publishArticle as jest.Mock).mockRejectedValue(notFoundError);

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/non-existent/publish', {
        method: 'POST',
      }),
      { params: { id: 'non-existent' } }
    );

    expect(response.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (publishArticle as jest.Mock).mockRejectedValue(
      new Error('DB connection failed')
    );

    const response = await POST(
      makeRequest('http://localhost/api/admin/articles/article-1/publish', {
        method: 'POST',
      }),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('DB connection failed');
  });
});
