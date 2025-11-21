import { GET } from '../route';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email-service';

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

jest.mock('@/lib/email-service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('/api/auth/verify-email', () => {
  const createRequest = (token: string) =>
    new Request(`http://localhost:3000/api/auth/verify-email?token=${token}`);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful verification', () => {
    it('should verify email and activate user', async () => {
      const mockToken = {
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: null,
        isActive: false,
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: new Date(),
      });
      (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});

      const request = createRequest('valid-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email verified successfully');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          emailVerified: expect.any(Date),
        },
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
      expect(sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  describe('Already verified', () => {
    it('should return 400 if email already verified', async () => {
      const mockToken = {
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date(), // Already verified
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = createRequest('valid-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email already verified');
    });
  });

  describe('Invalid token', () => {
    it('should return 400 for missing token', async () => {
      const request = new Request(
        'http://localhost:3000/api/auth/verify-email'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Verification token is required');
    });

    it('should return 400 for invalid token', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const request = createRequest('invalid-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired verification token');
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

      const request = createRequest('expired-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Verification token has expired');
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'expired-token' },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      (prisma.verificationToken.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = createRequest('valid-token');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Verification failed. Please try again.');
    });

    it('should not fail if welcome email sending fails', async () => {
      const mockToken = {
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000),
      };

      (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date(),
      });
      (prisma.verificationToken.delete as jest.Mock).mockResolvedValue({});
      (sendWelcomeEmail as jest.Mock).mockRejectedValue(
        new Error('Email service error')
      );

      const request = createRequest('valid-token');
      const response = await GET(request);
      const data = await response.json();

      // Verification should still succeed even if email fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
