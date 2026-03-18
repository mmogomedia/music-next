import { GET, PATCH, DELETE } from '../route';
import { getArticleById, updateArticle } from '@/lib/services/article-service';
import { prisma } from '@/lib/db';

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
  getArticleById: jest.fn(),
  updateArticle: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    article: {
      update: jest.fn(),
    },
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };

const mockArticle = {
  id: 'article-1',
  title: 'How CAPASSO Works',
  slug: 'how-capasso-works',
  body: 'Content here.',
  status: 'DRAFT',
  clusterRole: 'SPOKE',
  readTime: 1,
  authorId: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// eslint-disable-next-line no-undef
const makeRequest = (url: string, opts?: RequestInit) => new Request(url, opts);

// ─── GET /api/admin/articles/[id] ─────────────────────────────────────────────

describe('GET /api/admin/articles/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await GET(
      makeRequest('http://localhost/api/admin/articles/article-1'),
      {
        params: { id: 'article-1' },
      }
    );

    expect(response.status).toBe(401);
  });

  it('returns article for admin', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getArticleById as jest.Mock).mockResolvedValue(mockArticle);

    const response = await GET(
      makeRequest('http://localhost/api/admin/articles/article-1'),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.article.id).toBe('article-1');
    expect(getArticleById).toHaveBeenCalledWith('article-1');
  });

  it('returns 404 when article not found', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getArticleById as jest.Mock).mockRejectedValue(
      new Error('Article not found')
    );

    const response = await GET(
      makeRequest('http://localhost/api/admin/articles/non-existent'),
      { params: { id: 'non-existent' } }
    );

    expect(response.status).toBe(404);
  });
});

// ─── PATCH /api/admin/articles/[id] ───────────────────────────────────────────

describe('PATCH /api/admin/articles/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await PATCH(
      makeRequest('http://localhost/api/admin/articles/article-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      }),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(401);
  });

  it('updates article and returns it', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (updateArticle as jest.Mock).mockResolvedValue({
      ...mockArticle,
      title: 'Updated Title',
    });

    const response = await PATCH(
      makeRequest('http://localhost/api/admin/articles/article-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      }),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.article.title).toBe('Updated Title');
    expect(updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ title: 'Updated Title' })
    );
  });

  it('returns 400 for invalid update data', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    const response = await PATCH(
      makeRequest('http://localhost/api/admin/articles/article-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }), // empty title fails Zod min(1)
      }),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (updateArticle as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await PATCH(
      makeRequest('http://localhost/api/admin/articles/article-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid Title' }),
      }),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(500);
  });
});

// ─── DELETE /api/admin/articles/[id] ──────────────────────────────────────────

describe('DELETE /api/admin/articles/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await DELETE(
      makeRequest('http://localhost/api/admin/articles/article-1'),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(401);
  });

  it('archives article (sets status ARCHIVED)', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (prisma.article.update as jest.Mock).mockResolvedValue({
      ...mockArticle,
      status: 'ARCHIVED',
    });

    const response = await DELETE(
      makeRequest('http://localhost/api/admin/articles/article-1'),
      { params: { id: 'article-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: 'article-1' },
      data: { status: 'ARCHIVED' },
    });
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (prisma.article.update as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const response = await DELETE(
      makeRequest('http://localhost/api/admin/articles/article-1'),
      { params: { id: 'article-1' } }
    );

    expect(response.status).toBe(500);
  });
});
