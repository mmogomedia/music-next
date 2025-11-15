import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid email address',
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Rate limiting: 5 requests per hour per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`forgot-password:${clientIP}`, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password reset requests. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    // Always return success message, but only send email if user exists
    if (user) {
      // Delete any existing reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hour

      // Store reset token (using VerificationToken model with identifier = email)
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // Send password reset email (don't await)
      sendPasswordResetEmail({
        email,
        name: user.name || undefined,
        token,
      }).catch(error => {
        console.error('Failed to send password reset email:', error);
      });
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
      {
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    );
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
