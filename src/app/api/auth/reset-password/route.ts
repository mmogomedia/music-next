import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import type { ZodIssue } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Rate limiting: 5 reset attempts per hour per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`reset-password:${clientIP}`, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash new password
    const hash = await bcrypt.hash(password, 12);

    // Update user password and reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Delete reset token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message:
        'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: 'Password reset failed. Please try again.' },
      { status: 500 }
    );
  }
}
