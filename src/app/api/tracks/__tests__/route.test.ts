// import { NextRequest } from 'next/server' // Not used in this test
import { GET } from '../route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    track: {
      findMany: jest.fn(),
    },
  },
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock URL utils
jest.mock('@/lib/url-utils', () => ({
  constructFileUrl: jest.fn(path => `https://test.example.com/${path}`),
}));

describe('/api/tracks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return tracks for authenticated user', async () => {
    const mockTracks = [
      {
        id: '1',
        title: 'Test Track 1',
        filePath: 'uploads/user1/track1.mp3',
        artistId: 'user1',
        playCount: 10,
        duration: 180,
        genre: 'Pop',
        album: 'Test Album',
        description: 'Test Description',
        coverImageUrl: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    (prisma.track.findMany as jest.Mock).mockResolvedValue(mockTracks);

    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user1' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0]).toMatchObject({
      id: '1',
      title: 'Test Track 1',
      fileUrl: 'https://test.example.com/uploads/user1/track1.mp3',
    });
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock getServerSession to return null
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors', async () => {
    (prisma.track.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user1' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch tracks');
  });
});
