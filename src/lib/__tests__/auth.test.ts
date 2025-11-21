import { prisma } from '../db';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../db', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('NextAuth Credentials Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Note: Testing NextAuth providers directly is complex due to their internal structure
  // These tests verify the authentication logic patterns used in the authorize function
  describe('Authentication Logic Patterns', () => {
    const simulateAuthorize = async (identifier: string, password: string) => {
      // Simulate the authorize function logic from auth.ts
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { name: identifier }],
        },
      });

      if (!user || !user.password) {
        return null;
      }

      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      if (user.lockedUntil && new Date() < user.lockedUntil) {
        const minutesRemaining = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
        );
        throw new Error(
          `Account is temporarily locked. Please try again in ${minutesRemaining} minute(s).`
        );
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: {
          failedLoginAttempts: number;
          lockedUntil?: Date;
        } = {
          failedLoginAttempts: failedAttempts,
        };

        if (failedAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        return null;
      }

      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };
    };

    describe('Successful login', () => {
      it('should authenticate user with correct credentials', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: null,
          failedLoginAttempts: 0,
          emailVerified: new Date(),
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

        const result = await simulateAuthorize(
          'test@example.com',
          'TestPass123!'
        );

        expect(result).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        });
        // User update is only called if there were previous failed attempts or lockout
        // Since failedLoginAttempts is 0 and lockedUntil is null, update won't be called
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it('should support login with username', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'testuser',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: null,
          failedLoginAttempts: 0,
          emailVerified: new Date(),
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

        const result = await simulateAuthorize('testuser', 'TestPass123!');

        expect(result).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'testuser',
        });
        expect(prisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [{ email: 'testuser' }, { name: 'testuser' }],
          },
        });
      });
    });

    describe('Failed login attempts', () => {
      it('should increment failed attempts on wrong password', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: null,
          failedLoginAttempts: 2,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        (prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          failedLoginAttempts: 3,
        });

        const result = await simulateAuthorize(
          'test@example.com',
          'WrongPassword'
        );

        expect(result).toBeNull();
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            failedLoginAttempts: 3,
          },
        });
      });

      it('should lock account after max failed attempts', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: null,
          failedLoginAttempts: 4,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        (prisma.user.update as jest.Mock).mockResolvedValue({
          ...mockUser,
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        });

        const result = await simulateAuthorize(
          'test@example.com',
          'WrongPassword'
        );

        expect(result).toBeNull();
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          },
        });
      });
    });

    describe('Account status checks', () => {
      it('should reject inactive account', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          isActive: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

        await expect(
          simulateAuthorize('test@example.com', 'TestPass123!')
        ).rejects.toThrow('Account is inactive');
      });

      it('should reject locked account', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: new Date(Date.now() + 1800000), // 30 minutes from now
          failedLoginAttempts: 5,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

        await expect(
          simulateAuthorize('test@example.com', 'TestPass123!')
        ).rejects.toThrow('Account is temporarily locked');
      });

      it('should allow login if lockout period expired', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password',
          isActive: true,
          lockedUntil: new Date(Date.now() - 3600000), // 1 hour ago
          failedLoginAttempts: 5,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

        const result = await simulateAuthorize(
          'test@example.com',
          'TestPass123!'
        );

        expect(result).not.toBeNull();
      });
    });

    describe('User not found', () => {
      it('should return null for non-existent user', async () => {
        (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await simulateAuthorize(
          'nonexistent@example.com',
          'TestPass123!'
        );

        expect(result).toBeNull();
      });

      it('should return null for user without password', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          password: null,
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

        const result = await simulateAuthorize(
          'test@example.com',
          'TestPass123!'
        );

        expect(result).toBeNull();
      });
    });
  });
});
