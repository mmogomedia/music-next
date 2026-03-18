import { POST } from '../route';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email-service', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('/api/auth/forgot-password', () => {
  const mockRequest = (body: object) =>
    new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 3600000,
    });
    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: () => 'reset-token',
    });
  });

  describe('Successful password reset request', () => {
    it('should send reset email for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});

      const request = mockRequest({
        email: 'test@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('password reset link has been sent');
      expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'test@example.com' },
      });
      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: 'test@example.com',
          token: 'reset-token',
          expires: expect.any(Date),
        }),
      });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        token: 'reset-token',
      });
    });

    it('should return success even for non-existent user (security)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = mockRequest({
        email: 'nonexistent@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid email', async () => {
      const request = mockRequest({
        email: 'invalid-email',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email address');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      const request = mockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email address');
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      (checkRateLimit as jest.Mock).mockReturnValue({
        allowed: false,
        remaining: 0,
        retryAfter: 3600,
        resetAt: Date.now() + 3600000,
      });

      const request = mockRequest({
        email: 'test@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe(
        'Too many password reset requests. Please try again later.'
      );
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = mockRequest({
        email: 'test@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred. Please try again.');
    });
  });
});
