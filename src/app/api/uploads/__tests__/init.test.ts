import { NextRequest } from 'next/server';
import { POST } from '../init/route';
import { prisma } from '@/lib/db';

// Mock Prisma. The route calls both `create` and `update` on `uploadJob`
// (create to insert the row, update to attach the presigned upload URL).
jest.mock('@/lib/db', () => ({
  prisma: {
    uploadJob: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://test-presigned-url.com'),
}));

// Mock S3 Client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

describe('/api/uploads/init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create upload job for authenticated user', async () => {
    // The route generates its own jobId via randomUUID and builds the key
    // as `audio/<userId>/<jobId>.<ext>`. We only assert on the shape of the
    // response (jobId present, presigned uploadUrl matches the mock, key
    // follows the expected pattern) — not on a stubbed mock return value.
    (prisma.uploadJob.create as jest.Mock).mockResolvedValue(undefined);
    (prisma.uploadJob.update as jest.Mock).mockResolvedValue(undefined);

    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user1' },
    });

    const request = new NextRequest('http://localhost:3000/api/uploads/init', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'test.mp3',
        fileSize: 1024000,
        fileType: 'audio/mpeg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.jobId).toBe('string');
    expect(data.jobId.length).toBeGreaterThan(0);
    expect(data.uploadUrl).toBe('https://test-presigned-url.com');
    expect(data.key).toBe(`audio/user1/${data.jobId}.mp3`);
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock getServerSession to return null
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/uploads/init', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'test.mp3',
        fileSize: 1024000,
        fileType: 'audio/mpeg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate file type', async () => {
    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user1' },
    });

    const request = new NextRequest('http://localhost:3000/api/uploads/init', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      'Invalid file type. Allowed: MP3, WAV, FLAC, M4A, AAC'
    );
  });

  it('should validate file size', async () => {
    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: 'user1' },
    });

    const request = new NextRequest('http://localhost:3000/api/uploads/init', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'test.mp3',
        // Route's limit is 100MB — use something larger to trigger rejection.
        fileSize: 150 * 1024 * 1024, // 150MB
        fileType: 'audio/mpeg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File too large. Maximum size: 100MB');
  });
});
