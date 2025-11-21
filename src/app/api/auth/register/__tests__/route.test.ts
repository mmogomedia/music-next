import { POST } from '../route';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email-service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import crypto from 'crypto';
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
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('/api/auth/register', () => {
  const mockRequest = (body: object) =>
    new Request('http://localhost:3000/api/auth/register', {
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
    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: () => 'verification-token',
    });
  });

  describe('Successful registration', () => {
    it('should create a new user with valid data', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: null,
        isActive: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        marketingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});

      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        name: 'Test User',
        termsAccepted: true,
        privacyAccepted: true,
        marketingConsent: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.password).toBeUndefined(); // Password should be excluded
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed-password',
          termsAcceptedAt: expect.any(Date),
          privacyAcceptedAt: expect.any(Date),
          marketingConsent: false,
          emailVerified: null,
        }),
      });
      expect(sendVerificationEmail).toHaveBeenCalled();
      expect(prisma.verificationToken.create).toHaveBeenCalled();
    });

    it('should handle optional name field', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        password: 'hashed-password',
        emailVerified: null,
        isActive: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        marketingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});

      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
        marketingConsent: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: null,
        }),
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid email', async () => {
      const request = mockRequest({
        email: 'invalid-email',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors).toBeDefined();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for weak password', async () => {
      const request = mockRequest({
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for mismatched passwords', async () => {
      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'DifferentPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 if terms not accepted', async () => {
      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: false,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate email', () => {
    it('should return 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email already in use');
      expect(prisma.user.create).not.toHaveBeenCalled();
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
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe(
        'Too many registration attempts. Please try again later.'
      );
      expect(data.retryAfter).toBe(3600);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Registration failed. Please try again.');
    });

    it('should not fail registration if email sending fails', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: null,
        isActive: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        marketingConsent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
      (sendVerificationEmail as jest.Mock).mockRejectedValue(
        new Error('Email service error')
      );

      const request = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        termsAccepted: true,
        privacyAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      // Registration should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
    });
  });
});

