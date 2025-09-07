import { NextRequest } from 'next/server';
import { POST } from '../init/route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    uploadJob: {
      create: jest.fn(),
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
    const mockUploadJob = {
      id: 'test-job-id',
      userId: 'user1',
      fileName: 'test.mp3',
      fileSize: 1024000,
      mimeType: 'audio/mpeg',
      status: 'PENDING_UPLOAD',
      key: 'uploads/user1/test-job-id.mp3',
    };

    (prisma.uploadJob.create as jest.Mock).mockResolvedValue(mockUploadJob);

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
        mimeType: 'audio/mpeg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe('test-job-id');
    expect(data.uploadUrl).toBe('https://test-presigned-url.com');
    expect(data.key).toBe('uploads/user1/test-job-id.mp3');
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
        mimeType: 'audio/mpeg',
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
        mimeType: 'text/plain',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid file type. Only audio files are allowed.');
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
        fileSize: 100 * 1024 * 1024, // 100MB
        mimeType: 'audio/mpeg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File size must be less than 50MB');
  });
});
