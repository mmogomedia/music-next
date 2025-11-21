import { POST } from '../route';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

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
    verificationToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('/api/auth/reset-password', () => {
  const mockRequest = (body: object) =>
    new Request('http://localhost:3000/api/auth/reset-password', {
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
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  describe('Successful password reset', () => {
    it('should reset password with valid token', async () => {
      const mockToken = {
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'old-hashed-password',
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
      });
      (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});

      const request = mockRequest({
        token: 'valid-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Password reset successfully');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          password: 'hashed-password',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing token', async () => {
      const request = mockRequest({
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for weak password', async () => {
      const request = mockRequest({
        token: 'valid-token',
        password: 'weak',
        confirmPassword: 'weak',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for mismatched passwords', async () => {
      const request = mockRequest({
        token: 'valid-token',
        password: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Invalid token', () => {
    it('should return 400 for invalid token', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const request = mockRequest({
        token: 'invalid-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired reset token');
    });

    it('should return 400 for expired token', async () => {
      const expiredToken = {
        identifier: 'test@example.com',
        token: 'expired-token',
        expires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken
      );
      (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});

      const request = mockRequest({
        token: 'expired-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Reset token has expired. Please request a new one.');
    });
  });

  describe('User not found', () => {
    it('should return 404 if user does not exist', async () => {
      const mockToken = {
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000),
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = mockRequest({
        token: 'valid-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
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
        token: 'valid-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe(
        'Too many password reset attempts. Please try again later.'
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = mockRequest({
        token: 'valid-token',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Password reset failed. Please try again.');
    });
  });
});

