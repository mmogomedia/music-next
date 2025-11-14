import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/email-service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import crypto from 'crypto';
import type { ZodIssue } from 'zod';

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 registrations per hour per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`register:${clientIP}`, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);
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

    const {
      email,
      password,
      name,
      termsAccepted,
      privacyAccepted,
      marketingConsent,
    } = validationResult.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hash,
        termsAcceptedAt: termsAccepted ? new Date() : null,
        privacyAcceptedAt: privacyAccepted ? new Date() : null,
        marketingConsent: marketingConsent || false,
        emailVerified: null, // Will be set when email is verified
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email (don't await - send in background)
    sendVerificationEmail({
      email,
      name: name || undefined,
      token,
    }).catch(error => {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    });

    // Return success (don't include password hash)
    // eslint-disable-next-line no-unused-vars
    const { password: _unused, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        ok: true,
        user: userWithoutPassword,
        message:
          'Account created successfully. Please check your email to verify your account.',
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
