import { GET, POST } from '../route';
import { getClusters, createCluster } from '@/lib/services/article-service';

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
  getClusters: jest.fn(),
  createCluster: jest.fn(),
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };

const mockCluster = {
  id: 'cluster-1',
  name: 'Music Royalties Guide',
  slug: 'music-royalties-guide',
  description: 'Everything about royalties',
  coverImageUrl: null,
  targetKeywords: ['royalties'],
  status: 'DRAFT',
  _count: { articles: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// eslint-disable-next-line no-undef
const makeRequest = (url: string, opts?: RequestInit) => new Request(url, opts);

// ─── GET /api/admin/clusters ──────────────────────────────────────────────────

describe('GET /api/admin/clusters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin users', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns clusters for admin', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getClusters as jest.Mock).mockResolvedValue([mockCluster]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clusters).toHaveLength(1);
    expect(data.clusters[0].name).toBe('Music Royalties Guide');
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (getClusters as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch clusters');
  });
});

// ─── POST /api/admin/clusters ─────────────────────────────────────────────────

describe('POST /api/admin/clusters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated requests', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/admin/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Cluster' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing name', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);

    const request = makeRequest('http://localhost/api/admin/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('creates cluster and returns 201', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (createCluster as jest.Mock).mockResolvedValue(mockCluster);

    const request = makeRequest('http://localhost/api/admin/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Music Royalties Guide',
        description: 'Everything about royalties',
        targetKeywords: ['royalties'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.cluster.name).toBe('Music Royalties Guide');
    expect(createCluster).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Music Royalties Guide',
        slug: 'music-royalties-guide',
      })
    );
  });

  it('auto-generates slug from name', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (createCluster as jest.Mock).mockResolvedValue(mockCluster);

    const request = makeRequest('http://localhost/api/admin/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Cluster Name' }),
    });

    await POST(request);

    expect(createCluster).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'test-cluster-name',
      })
    );
  });

  it('returns 500 on service error', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockAdminSession);
    (createCluster as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest('http://localhost/api/admin/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create cluster');
  });
});
