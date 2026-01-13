# Flemoji Rules Archive (Chunk 2)

## 02-authentication-setup.md

# Phase 2: Authentication Setup & User Management

## 🎯 Objective

Implement NextAuth.js authentication system with user registration, login, role-based access control, and session management for the music streaming platform.

## 📋 Prerequisites

- Phase 1 completed successfully
- Next.js project running without errors
- Database connection ready (Prisma configured)
- Environment variables set up

## 🚀 Step-by-Step Implementation

### 1. Database Schema Setup

#### `prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole  @default(USER)
  isPremium     Boolean   @default(false)
  stripeCustomerId String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  tracks        Track[]
  playEvents    PlayEvent[]
  smartLinks    SmartLink[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Track {
  id              String    @id @default(cuid())
  title           String
  artistId        String
  artist          User      @relation(fields: [artistId], references: [id], onDelete: Cascade)
  fileUrl         String
  coverImageUrl   String?
  genre           String
  album           String?
  description     String?
  duration        Int       // in seconds
  playCount       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  playEvents      PlayEvent[]
  smartLinks      SmartLink[]

  @@map("tracks")
}

model PlayEvent {
  id        String   @id @default(cuid())
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?

  @@map("play_events")
}

model SmartLink {
  id           String        @id @default(cuid())
  trackId      String
  track        Track         @relation(fields: [trackId], references: [id], onDelete: Cascade)
  slug         String        @unique
  clickCount   Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  platformLinks PlatformLink[]

  @@map("smart_links")
}

model PlatformLink {
  id           String     @id @default(cuid())
  smartLinkId  String
  smartLink    SmartLink  @relation(fields: [smartLinkId], references: [id], onDelete: Cascade)
  platform     Platform
  url          String
  clickCount   Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@map("platform_links")
}

enum UserRole {
  USER
  ARTIST
  ADMIN
}

enum Platform {
  SPOTIFY
  APPLE_MUSIC
  YOUTUBE
  SOUNDCLOUD
}
```

### 2. Database Migration

```bash
# Generate and run the initial migration
npx prisma generate
npx prisma db push

# If you prefer migrations (recommended for production)
npx prisma migrate dev --name init
```

### 3. NextAuth Configuration

#### `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isPremium = user.isPremium;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.isPremium = token.isPremium as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 4. Database Connection

#### `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 5. NextAuth API Route

#### `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 6. Session Provider Setup

#### `src/components/providers/SessionProvider.tsx`

```typescript
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
```

### 7. Update Root Layout with Session Provider

#### `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import SessionProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flemoji - Music Streaming Platform',
  description: 'Discover and stream music from independent artists',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Header />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
```

### 8. Authentication Forms

#### `src/components/forms/LoginForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Refresh session to get updated user data
        await getSession()
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-primary-600 hover:text-primary-500">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

#### `src/components/forms/RegisterForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER' as 'USER' | 'ARTIST'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      if (response.ok) {
        router.push('/login?message=Registration successful! Please sign in.')
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="USER">Music Listener</option>
                <option value="ARTIST">Artist</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 9. Registration API Route

#### `src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { userSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = userSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: body.role || 'USER',
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 10. Authentication Pages

#### `src/app/(auth)/login/page.tsx`

```typescript
import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
```

#### `src/app/(auth)/register/page.tsx`

```typescript
import RegisterForm from '@/components/forms/RegisterForm'

export default function RegisterPage() {
  return <RegisterForm />
}
```

### 11. Middleware for Route Protection

#### `src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define public routes that don't require authentication
    const publicRoutes = [
      // Main pages - all publicly accessible
      '/',
      '/browse',
      '/tracks',
      '/artists',
      '/genres',
      '/albums',
      '/search',

      // Authentication pages
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',

      // Static pages
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/help',
      '/faq',

      // Public API endpoints
      '/api/health',
      '/api/tracks',
      '/api/artists',
      '/api/genres',
      '/api/albums',
      '/api/search',
      '/api/play-events', // For tracking plays (anonymous)
      '/api/smart-links',
      '/api/public',

      // Static assets
      '/_next',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(
      route => path === route || path.startsWith(route + '/')
    );

    // Allow public routes to pass through
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // All other routes require authentication
    if (!token) {
      // Redirect to login for protected routes
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based access control for specific routes
    if (path.startsWith('/admin')) {
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    if (path.startsWith('/artist')) {
      if (token.role !== 'ARTIST' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Define public routes that don't need authorization
        const publicRoutes = [
          // Main pages
          '/',
          '/browse',
          '/tracks',
          '/artists',
          '/genres',
          '/albums',
          '/search',

          // Authentication pages
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',

          // Static pages
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/help',
          '/faq',

          // Public API endpoints
          '/api/health',
          '/api/tracks',
          '/api/artists',
          '/api/genres',
          '/api/albums',
          '/api/search',
          '/api/play-events',
          '/api/smart-links',
          '/api/public',

          // Static assets
          '/_next',
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
        ];

        const isPublicRoute = publicRoutes.some(
          route => path === route || path.startsWith(route + '/')
        );

        // Public routes don't need authorization
        if (isPublicRoute) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes except public ones
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

### 12. Component-Level Authentication & Function Protection

#### `src/hooks/useAuth.ts`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth: boolean = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [requireAuth, status, router]);

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    isAdmin: session?.user?.role === 'ADMIN',
    isArtist: session?.user?.role === 'ARTIST',
    isPremium: session?.user?.isPremium,
  };
}

export function useRequireAuth() {
  return useAuth(true);
}

export function useRequireRole(requiredRole: 'ADMIN' | 'ARTIST') {
  const { user, isAuthenticated, isLoading } = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role !== requiredRole &&
      user?.role !== 'ADMIN'
    ) {
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, user?.role, requiredRole, router]);

  return { user, isAuthenticated, isLoading };
}
```

#### `src/components/auth/AuthGuard.tsx`

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: 'ADMIN' | 'ARTIST' | 'USER'
  requirePremium?: boolean
  fallback?: ReactNode
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireRole,
  requirePremium = false,
  fallback = null
}: AuthGuardProps) {
  const { data: session, status } = useSession()

  // Show loading state
  if (status === 'loading') {
    return <div>Loading...</div>
  }

  // Check authentication requirement
  if (requireAuth && !session) {
    return <>{fallback}</>
  }

  // Check role requirement
  if (requireRole && session?.user?.role !== requireRole && session?.user?.role !== 'ADMIN') {
    return <>{fallback}</>
  }

  // Check premium requirement
  if (requirePremium && !session?.user?.isPremium) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

#### `src/components/auth/ProtectedButton.tsx`

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, MouseEvent } from 'react'

interface ProtectedButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  requireAuth?: boolean
  requirePremium?: boolean
  requireRole?: 'ADMIN' | 'ARTIST' | 'USER'
  className?: string
  disabled?: boolean
  fallbackText?: string
}

export default function ProtectedButton({
  children,
  onClick,
  requireAuth = false,
  requirePremium = false,
  requireRole,
  className = '',
  disabled = false,
  fallbackText = 'Login required'
}: ProtectedButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Check authentication
    if (requireAuth && !session) {
      router.push('/login')
      return
    }

    // Check role
    if (requireRole && session?.user?.role !== requireRole && session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
      return
    }

    // Check premium
    if (requirePremium && !session?.user?.isPremium) {
      router.push('/pricing')
      return
    }

    // Execute original onClick
    if (onClick) {
      onClick(e)
    }
  }

  const isDisabled = disabled ||
    (requireAuth && !session) ||
    (requireRole && session?.user?.role !== requireRole && session?.user?.role !== 'ADMIN') ||
    (requirePremium && !session?.user?.isPremium)

  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={isDisabled}
      title={isDisabled ? fallbackText : undefined}
    >
      {children}
    </button>
  )
}
```

#### `src/components/music/TrackCard.tsx` (Example with Protected Functions)

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedButton from '@/components/auth/ProtectedButton'
import { HeartIcon, PlusIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface TrackCardProps {
  track: {
    id: string
    title: string
    artist: { name: string }
    coverImageUrl?: string
    duration: number
    isLiked?: boolean
  }
  onPlay: () => void
  onLike?: () => void
  onAddToPlaylist?: () => void
}

export default function TrackCard({ track, onPlay, onLike, onAddToPlaylist }: TrackCardProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(track.isLiked || false)

  const handleLike = () => {
    if (onLike) {
      onLike()
      setIsLiked(!isLiked)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <img
          src={track.coverImageUrl || '/default-cover.jpg'}
          alt={track.title}
          className="w-16 h-16 rounded-lg object-cover"
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {track.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {track.artist.name}
          </p>
          <p className="text-xs text-gray-500">
            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Play button - always available */}
          <button
            onClick={onPlay}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
          >
            ▶️
          </button>

          {/* Like button - requires authentication */}
          <ProtectedButton
            onClick={handleLike}
            requireAuth={true}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            fallbackText="Login to like tracks"
          >
            {isLiked ? (
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </ProtectedButton>

          {/* Add to playlist - requires authentication */}
          <ProtectedButton
            onClick={onAddToPlaylist}
            requireAuth={true}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            fallbackText="Login to add to playlist"
          >
            <PlusIcon className="w-5 h-5" />
          </ProtectedButton>
        </div>
      </div>
    </div>
  )
}
```

#### `src/components/music/PlayButton.tsx` (Public Play Function)

```typescript
'use client'

import { useState } from 'react'

interface PlayButtonProps {
  trackId: string
  onPlay?: () => void
}

export default function PlayButton({ trackId, onPlay }: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    try {
      // Track play event (public - no auth required)
      await fetch('/api/play-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId,
          // No userId needed for anonymous plays
        }),
      })

      setIsPlaying(true)
      if (onPlay) {
        onPlay()
      }

      // Reset playing state after track duration
      setTimeout(() => setIsPlaying(false), 30000) // Example: 30 seconds
    } catch (error) {
      console.error('Failed to track play event:', error)
    }
  }

  return (
    <button
      onClick={handlePlay}
      className={`p-3 rounded-full transition-colors ${
        isPlaying
          ? 'bg-primary-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-primary-600 hover:text-white'
      }`}
    >
      {isPlaying ? '⏸️' : '▶️'}
    </button>
  )
}
```

### 13. API Route Protection Examples

#### `src/app/api/play-events/route.ts` (Public Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsOperations } from '@/lib/db-operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, duration, completed } = body;

    // Get session if available (optional for anonymous plays)
    const session = await getServerSession(authOptions);

    // Record play event (works for both authenticated and anonymous users)
    await analyticsOperations.recordPlayEvent({
      trackId,
      userId: session?.user?.id, // Will be null for anonymous users
      ipAddress:
        request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      duration,
      completed,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Play event error:', error);
    return NextResponse.json(
      { error: 'Failed to record play event' },
      { status: 500 }
    );
  }
}
```

#### `src/app/api/likes/route.ts` (Protected Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { trackId } = body;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      // Decrement like count
      await prisma.track.update({
        where: { id: trackId },
        data: { likeCount: { decrement: 1 } },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          trackId,
        },
      });

      // Increment like count
      await prisma.track.update({
        where: { id: trackId },
        data: { likeCount: { increment: 1 } },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Failed to update like status' },
      { status: 500 }
    );
  }
}
```

### 14. Install Additional Dependencies

```bash
# Install bcryptjs for password hashing
yarn add bcryptjs
yarn add -D @types/bcryptjs

# Install next-auth
yarn add next-auth
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Database migration successful** - Tables created without errors
2. **User registration works** - Can create new accounts
3. **User login works** - Can authenticate with credentials
4. **Session management** - User stays logged in across page refreshes
5. **Route protection** - Security by default: all routes protected unless explicitly public
6. **Public route access** - Anonymous users can access all public routes
7. **Protected route access** - Unauthorized users redirected to login for protected routes
8. **Role-based access** - Different user types see appropriate content
9. **Public access** - Anonymous users can browse and play music
10. **Function-level protection** - Protected buttons redirect to login when needed
11. **API protection** - Public endpoints work without auth, protected endpoints require auth
12. **Middleware coverage** - All routes properly handled by middleware

### Test Commands:

```bash
# Test database connection
npx prisma studio

# Test authentication flow
# 1. Register new user
# 2. Login with credentials
# 3. Verify session persistence
# 4. Test logout functionality

# Test public route access
# 1. Visit homepage without login (should work)
# 2. Browse tracks without login (should work)
# 3. Play tracks without login (should work)
# 4. Search music without login (should work)
# 5. Visit artist pages without login (should work)
# 6. Verify play events are tracked

# Test protected route access
# 1. Try accessing /dashboard without login (should redirect to login)
# 2. Try accessing /account without login (should redirect to login)
# 3. Try accessing /upload without login (should redirect to login)
# 4. Try accessing /admin without admin role (should redirect to unauthorized)
# 5. Try accessing /artist without artist role (should redirect to unauthorized)

# Test function-level protection
# 1. Try to like track without login (should redirect to login)
# 2. Try to add to playlist without login (should redirect to login)
# 3. Verify protected buttons show appropriate tooltips

# Test API endpoints
# 1. GET /api/tracks without auth (should work)
# 2. POST /api/play-events without auth (should work)
# 3. POST /api/likes without auth (should return 401)
# 4. POST /api/likes with auth (should work)
# 5. GET /api/users with auth (should work)
# 6. GET /api/users without auth (should return 401)

# Test middleware coverage
# 1. Verify all routes are handled by middleware
# 2. Check that static assets are excluded
# 3. Verify public routes work without authentication
# 4. Verify protected routes require authentication
```

## 🚨 Common Issues & Solutions

### Issue: Database connection errors

**Solution**: Verify DATABASE_URL in .env.local and ensure database is running

### Issue: Password hashing errors

**Solution**: Ensure bcryptjs is properly installed and imported

### Issue: Session not persisting

**Solution**: Check NEXTAUTH_SECRET is set and SessionProvider wraps the app

### Issue: Route protection not working

**Solution**: Verify middleware.ts is in the correct location and matcher config is correct

### Issue: Public routes requiring authentication

**Solution**: Check that public routes are properly listed in middleware.ts

### Issue: Protected functions not working

**Solution**: Ensure ProtectedButton and AuthGuard components are properly implemented

## 📝 Authentication Strategy

### **Public Access (No Authentication Required)**

- **Main Pages**: Homepage, browse, tracks, artists, genres, albums, search
- **Authentication Pages**: Login, register, forgot-password, reset-password, verify-email
- **Static Pages**: About, contact, privacy, terms, help, FAQ
- **Public APIs**: Health, tracks, artists, genres, albums, search, play-events, smart-links
- **Static Assets**: Next.js assets, favicon, robots.txt, sitemap.xml
- **Music Player**: Always visible and functional for all users

### **Protected Routes (Authentication Required)**

- **User Dashboard** (`/dashboard`) - User dashboard and settings
- **Artist Dashboard** (`/artist`) - Artist management tools
- **Admin Panel** (`/admin`) - System administration
- **User APIs** (`/api/users`, `/api/playlists`, `/api/likes`, `/api/follows`)
- **Account Management** (`/account`, `/settings`, `/profile`)
- **Upload/Management** (`/upload`, `/manage`, `/analytics`)
- **Premium Features** (`/premium`, `/subscription`)

### **Function-Level Protection**

- **Play Music** - Always available (public)
- **Like Tracks** - Requires authentication
- **Add to Playlist** - Requires authentication
- **Follow Artists** - Requires authentication
- **Upload Music** - Requires artist role
- **Premium Features** - Requires premium subscription
- **User Profile Access** - Requires authentication
- **Theme Switching** - Always available (public)

### **UI Component Behavior Based on Authentication**

#### **Sidebar Navigation**

- **Non-Authenticated**: Shows MENU and ACCOUNT sections
- **Authenticated**: Shows MENU section and user profile at bottom

#### **User Profile Section**

- **Non-Authenticated**: Not visible
- **Authenticated**: Shows user avatar, name, and dropdown menu with:
  - Account settings
  - Logout option

#### **Music Player**

- **All Users**: Always visible at bottom of screen
- **Non-Authenticated**: Full playback controls available
- **Authenticated**: Full playback controls + personalized features

#### **Theme Switching**

- **All Users**: Available via subtle button next to logo
- **Location**: Integrated into logo section for easy access
- **Functionality**: Toggles between light and dark modes

### **Implementation Benefits**

1. **Better User Experience** - Users can discover and play music without barriers
2. **Increased Engagement** - Anonymous users can interact with content
3. **Analytics Tracking** - Play events tracked for both authenticated and anonymous users
4. **Gradual Conversion** - Users can experience the platform before signing up
5. **Flexible Protection** - Granular control over what requires authentication
6. **Security by Default** - All routes are protected by default, only public routes are explicitly allowed
7. **Easy Maintenance** - Clear list of public routes makes it easy to manage access
8. **Scalable Architecture** - Easy to add new routes without worrying about protection

## 📝 Route Protection Strategy

### **Security by Default Approach**

- **Default State**: All routes are protected by default
- **Public Routes**: Only explicitly listed routes are publicly accessible
- **Middleware**: Runs on all routes except static assets
- **Matcher**: Uses negative lookahead to exclude static assets

### **Public Route Categories**

1. **Main Content**: Homepage, browse, tracks, artists, genres, albums, search
2. **Authentication**: Login, register, password reset, email verification
3. **Static Pages**: About, contact, privacy, terms, help, FAQ
4. **Public APIs**: Content discovery, search, play tracking, smart links
5. **Static Assets**: Next.js assets, favicon, robots.txt, sitemap.xml

### **Protected Route Categories**

1. **User Features**: Dashboard, account, settings, profile
2. **Artist Features**: Upload, manage, analytics, artist dashboard
3. **Admin Features**: Admin panel, user management, system settings
4. **Premium Features**: Subscription, premium content, advanced analytics
5. **User APIs**: Personal data, playlists, likes, follows

### **Role-Based Access Control**

- **USER**: Access to user dashboard and personal features
- **ARTIST**: Access to artist dashboard and upload features
- **ADMIN**: Access to admin panel and all features

### **Role-Based Login Flow**

The platform implements an intelligent redirect system that automatically directs users to the appropriate dashboard based on their role, providing a seamless and role-appropriate user experience.

#### **Admin Users**

1. **Login**: Enter admin credentials (`dev@dev.com` / `dev`)
2. **Role Detection**: System detects `role: 'ADMIN'`
3. **Automatic Redirect**: Directly redirected to `/admin/dashboard`
4. **No Profile Creation**: Skip profile selection screen entirely
5. **Access**: Full admin panel with user management, content moderation, and system analytics

#### **Regular Users & Artists**

1. **Login**: Enter user/artist credentials
2. **Role Detection**: System detects non-admin role
3. **Profile Flow**: Continue to profile selection or dashboard
4. **Profile Creation**: Create appropriate profile type if needed
5. **Access**: Role-appropriate dashboard features

### **Role-Based Redirect Implementation**

#### **RoleBasedRedirect Component**

Located at `src/components/auth/RoleBasedRedirect.tsx`:

```typescript
// Checks user role and redirects accordingly
if (session.user?.role === 'ADMIN') {
  router.push('/admin/dashboard');
  return;
}
// Continue normal flow for other users
```

#### **Pages Using Role-Based Redirects**

- `/profile/select` - Profile selection page
- `/dashboard` - Main user dashboard
- `/profile/create/artist` - Artist profile creation

#### **Technical Flow**

```
Login → Role Check → Appropriate Dashboard
```

**Admin Flow:**

```
Login → Role: ADMIN → /admin/dashboard (Direct)
```

**User/Artist Flow:**

```
Login → Role: USER/ARTIST → Profile Selection → Dashboard
```

### **Admin Account Setup**

#### **Development Credentials**

- **Email**: `dev@dev.com`
- **Password**: `dev`
- **Name**: `Dev`
- **Role**: `ADMIN`

#### **Quick Admin Setup**

```bash
# Create admin account
yarn create-admin

# Or use the seed script
yarn db:seed

# Or run full database setup
yarn setup-db
```

#### **Custom Admin Creation**

```bash
# Interactive mode - prompts for details
yarn create-admin

# Command line mode - specify details
yarn create-admin --email admin@yourdomain.com --password securepassword --name "Your Name"
```

### **Testing Role-Based Redirects**

#### **Test Admin Redirect**

1. Go to `http://localhost:3000/login`
2. Login with `dev@dev.com` / `dev`
3. Should automatically redirect to `/admin/dashboard`
4. Should NOT see profile creation screen

#### **Test User Flow**

1. Go to `http://localhost:3000/login`
2. Login with regular user credentials
3. Should continue to normal dashboard flow
4. May see profile creation if no profile exists

### **Troubleshooting Role-Based Redirects**

#### **Admin Not Redirecting**

- Check that user has `role: 'ADMIN'` in database
- Verify session includes role information
- Check browser console for errors

#### **Profile Creation Screen Showing for Admin**

- Ensure `RoleBasedRedirect` component is properly implemented
- Check that admin role is correctly detected
- Verify redirect logic is working

#### **Regular Users Redirected to Admin Dashboard**

- Check user role in database
- Verify role detection logic
- Ensure proper role assignment during registration

## 📝 Notes

- Passwords are hashed using bcryptjs with 12 salt rounds
- User roles are enforced at both middleware and component levels
- Session data includes user role and premium status for easy access
- Registration allows users to choose between USER and ARTIST roles initially
- Public routes allow anonymous music streaming and discovery
- Protected functions provide clear user feedback and redirect to appropriate pages
- Security by default: all routes protected unless explicitly made public
- Easy to add new routes: they're automatically protected unless added to public list

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 3: Database Schema & Models](./03-database-schema.md)

---

## 03-database-schema.md

# Phase 3: Database Schema & Models

## 🎯 Objective

Complete the database schema setup, create additional models for the music platform, implement database operations, and ensure proper relationships between all entities.

## 📋 Prerequisites

- Phase 1 & 2 completed successfully
- Prisma installed and configured
- Database connection working
- Basic authentication system functional

## 🚀 Step-by-Step Implementation

### 1. Enhanced Database Schema

#### Update `prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id                String    @id @default(cuid())
  name              String?
  email             String    @unique
  emailVerified     DateTime?
  image             String?
  password          String?
  role              UserRole  @default(USER)
  isPremium         Boolean   @default(false)
  stripeCustomerId  String?   @unique
  bio               String?
  website           String?
  location          String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  accounts          Account[]
  sessions          Session[]
  tracks            Track[]
  playEvents        PlayEvent[]
  smartLinks        SmartLink[]
  playlists         Playlist[]
  playlistTracks    PlaylistTrack[]
  likes             Like[]
  follows           Follow[]  @relation("following")
  followers         Follow[]  @relation("followers")

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Track {
  id              String    @id @default(cuid())
  title           String
  artistId        String
  artist          User      @relation(fields: [artistId], references: [id], onDelete: Cascade)
  fileUrl         String
  coverImageUrl   String?
  genre           String
  album           String?
  description     String?
  duration        Int       // in seconds
  playCount       Int       @default(0)
  likeCount       Int       @default(0)
  isExplicit      Boolean   @default(false)
  isPublished     Boolean   @default(true)
  releaseDate     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  playEvents      PlayEvent[]
  smartLinks      SmartLink[]
  playlistTracks  PlaylistTrack[]
  likes           Like[]

  @@map("tracks")
  @@index([artistId])
  @@index([genre])
  @@index([isPublished])
}

model PlayEvent {
  id        String   @id @default(cuid())
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
  duration  Int?     // how long the track was played (in seconds)
  completed Boolean  @default(false) // whether the track was played to completion

  @@map("play_events")
  @@index([trackId])
  @@index([userId])
  @@index([timestamp])
}

model SmartLink {
  id           String        @id @default(cuid())
  trackId      String
  track        Track         @relation(fields: [trackId], references: [id], onDelete: Cascade)
  slug         String        @unique
  title        String?       // custom title for the smart link
  description  String?       // custom description
  clickCount   Int           @default(0)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  platformLinks PlatformLink[]

  @@map("smart_links")
  @@index([trackId])
  @@index([slug])
}

model PlatformLink {
  id           String     @id @default(cuid())
  smartLinkId  String
  smartLink    SmartLink  @relation(fields: [smartLinkId], references: [id], onDelete: Cascade)
  platform     Platform
  url          String
  clickCount   Int        @default(0)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@map("platform_links")
  @@index([smartLinkId])
  @@index([platform])
}

model Playlist {
  id          String    @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  isPublic    Boolean   @default(true)
  coverImage  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  playlistTracks PlaylistTrack[]

  @@map("playlists")
  @@index([userId])
}

model PlaylistTrack {
  id          String   @id @default(cuid())
  playlistId  String
  playlist    Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  trackId     String
  track       Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  position    Int      // order in playlist
  addedAt     DateTime @default(now())

  @@map("playlist_tracks")
  @@unique([playlistId, trackId])
  @@index([playlistId])
  @@index([trackId])
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@map("likes")
  @@unique([userId, trackId])
  @@index([userId])
  @@index([trackId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("following", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User     @relation("followers", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@map("follows")
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Subscription {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeSubscriptionId   String    @unique
  stripeCustomerId      String
  stripePriceId         String
  status                SubscriptionStatus
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("subscriptions")
}

model Analytics {
  id        String   @id @default(cuid())
  trackId   String
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date
  plays     Int      @default(0)
  likes     Int      @default(0)
  shares    Int      @default(0)
  uniqueListeners Int @default(0)

  @@map("analytics")
  @@unique([trackId, date])
  @@index([trackId])
  @@index([date])
}

enum UserRole {
  USER
  ARTIST
  ADMIN
}

enum Platform {
  SPOTIFY
  APPLE_MUSIC
  YOUTUBE
  SOUNDCLOUD
  TIKTOK
  INSTAGRAM
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  UNPAID
}
```

### 2. Database Migration

```bash
# Generate and run the enhanced migration
npx prisma generate
npx prisma db push

# If using migrations
npx prisma migrate dev --name enhanced_schema
```

### 3. Database Utility Functions

#### `src/lib/db-operations.ts`

```typescript
import { prisma } from './db';
import { Track, User, PlayEvent, SmartLink } from '@prisma/client';

// Track operations
export const trackOperations = {
  // Get track by ID with artist info
  async getTrackById(id: string) {
    return prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  // Get tracks by artist
  async getTracksByArtist(artistId: string, publishedOnly: boolean = true) {
    return prisma.track.findMany({
      where: {
        artistId,
        ...(publishedOnly && { isPublished: true }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  // Get tracks by genre
  async getTracksByGenre(genre: string, limit: number = 20) {
    return prisma.track.findMany({
      where: {
        genre,
        isPublished: true,
      },
      orderBy: { playCount: 'desc' },
      take: limit,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  // Search tracks
  async searchTracks(query: string, limit: number = 20) {
    return prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { name: { contains: query, mode: 'insensitive' } } },
          { album: { contains: query, mode: 'insensitive' } },
        ],
        isPublished: true,
      },
      orderBy: { playCount: 'desc' },
      take: limit,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  // Increment play count
  async incrementPlayCount(trackId: string) {
    return prisma.track.update({
      where: { id: trackId },
      data: {
        playCount: {
          increment: 1,
        },
      },
    });
  },

  // Get trending tracks
  async getTrendingTracks(limit: number = 10, days: number = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return prisma.track.findMany({
      where: {
        isPublished: true,
        playEvents: {
          some: {
            timestamp: {
              gte: date,
            },
          },
        },
      },
      orderBy: { playCount: 'desc' },
      take: limit,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },
};

// User operations
export const userOperations = {
  // Get user by ID with profile
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isPremium: true,
        bio: true,
        website: true,
        location: true,
        createdAt: true,
        _count: {
          select: {
            tracks: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  },

  // Get artist profile
  async getArtistProfile(artistId: string) {
    return prisma.user.findUnique({
      where: {
        id: artistId,
        role: { in: ['ARTIST', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        location: true,
        createdAt: true,
        tracks: {
          where: { isPublished: true },
          orderBy: { playCount: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            playCount: true,
            duration: true,
          },
        },
        _count: {
          select: {
            tracks: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  },

  // Follow user
  async followUser(followerId: string, followingId: string) {
    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  },

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string) {
    return prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  },

  // Check if following
  async isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  },
};

// Analytics operations
export const analyticsOperations = {
  // Record play event
  async recordPlayEvent(data: {
    trackId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
    completed?: boolean;
  }) {
    const [playEvent, updatedTrack] = await prisma.$transaction([
      prisma.playEvent.create({
        data: {
          trackId: data.trackId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          duration: data.duration,
          completed: data.completed,
        },
      }),
      prisma.track.update({
        where: { id: data.trackId },
        data: {
          playCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { playEvent, updatedTrack };
  },

  // Get track analytics
  async getTrackAnalytics(trackId: string, days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const analytics = await prisma.playEvent.groupBy({
      by: ['timestamp'],
      where: {
        trackId,
        timestamp: {
          gte: date,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        duration: true,
      },
    });

    return analytics.map(item => ({
      date: item.timestamp,
      plays: item._count.id,
      totalDuration: item._sum.duration || 0,
    }));
  },

  // Get artist analytics
  async getArtistAnalytics(artistId: string, days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const tracks = await prisma.track.findMany({
      where: {
        artistId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        playCount: true,
        playEvents: {
          where: {
            timestamp: {
              gte: date,
            },
          },
          select: {
            timestamp: true,
            duration: true,
          },
        },
      },
    });

    const totalPlays = tracks.reduce((sum, track) => sum + track.playCount, 0);
    const recentPlays = tracks.reduce(
      (sum, track) => sum + track.playEvents.length,
      0
    );

    return {
      tracks: tracks.length,
      totalPlays,
      recentPlays,
      trackBreakdown: tracks.map(track => ({
        id: track.id,
        title: track.title,
        totalPlays: track.playCount,
        recentPlays: track.playEvents.length,
      })),
    };
  },
};

// Smart link operations
export const smartLinkOperations = {
  // Create smart link
  async createSmartLink(data: {
    trackId: string;
    title?: string;
    description?: string;
    platformLinks: Array<{
      platform: string;
      url: string;
    }>;
  }) {
    const slug = generateUniqueSlug();

    return prisma.smartLink.create({
      data: {
        trackId: data.trackId,
        title: data.title,
        description: data.description,
        slug,
        platformLinks: {
          create: data.platformLinks,
        },
      },
      include: {
        track: {
          select: {
            title: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
        platformLinks: true,
      },
    });
  },

  // Get smart link by slug
  async getSmartLinkBySlug(slug: string) {
    return prisma.smartLink.findUnique({
      where: { slug },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            artist: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        platformLinks: {
          where: { isActive: true },
        },
      },
    });
  },

  // Record platform link click
  async recordPlatformClick(smartLinkId: string, platform: string) {
    const [updatedSmartLink, updatedPlatformLink] = await prisma.$transaction([
      prisma.smartLink.update({
        where: { id: smartLinkId },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),
      prisma.platformLink.updateMany({
        where: {
          smartLinkId,
          platform: platform as any,
        },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { updatedSmartLink, updatedPlatformLink };
  },
};

// Utility function to generate unique slug
function generateUniqueSlug(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

### 4. Database Seeding

#### `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flemoji.com' },
    update: {},
    create: {
      email: 'admin@flemoji.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isPremium: true,
    },
  });

  // Create sample artist
  const artistPassword = await bcrypt.hash('artist123', 12);
  const artist = await prisma.user.upsert({
    where: { email: 'artist@flemoji.com' },
    update: {},
    create: {
      email: 'artist@flemoji.com',
      name: 'Sample Artist',
      password: artistPassword,
      role: 'ARTIST',
      bio: 'A talented musician creating amazing music',
      website: 'https://sampleartist.com',
      location: 'New York, NY',
    },
  });

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@flemoji.com' },
    update: {},
    create: {
      email: 'user@flemoji.com',
      name: 'Sample User',
      password: userPassword,
      role: 'USER',
    },
  });

  // Create sample tracks
  const track1 = await prisma.track.create({
    data: {
      title: 'Amazing Song',
      artistId: artist.id,
      fileUrl: 'https://example.com/song1.mp3',
      coverImageUrl: 'https://example.com/cover1.jpg',
      genre: 'Pop',
      album: 'First Album',
      description: 'A wonderful pop song that everyone loves',
      duration: 180, // 3 minutes
      playCount: 150,
      likeCount: 25,
    },
  });

  const track2 = await prisma.track.create({
    data: {
      title: 'Rock Anthem',
      artistId: artist.id,
      fileUrl: 'https://example.com/song2.mp3',
      coverImageUrl: 'https://example.com/cover2.jpg',
      genre: 'Rock',
      album: 'First Album',
      description: 'An energetic rock song',
      duration: 240, // 4 minutes
      playCount: 89,
      likeCount: 12,
    },
  });

  // Create sample smart link
  const smartLink = await prisma.smartLink.create({
    data: {
      trackId: track1.id,
      slug: 'amazing-song',
      title: 'Check out my new song!',
      description: 'Listen to "Amazing Song" on all platforms',
      platformLinks: {
        create: [
          {
            platform: 'SPOTIFY',
            url: 'https://open.spotify.com/track/sample1',
          },
          {
            platform: 'APPLE_MUSIC',
            url: 'https://music.apple.com/track/sample1',
          },
          {
            platform: 'YOUTUBE',
            url: 'https://youtube.com/watch?v=sample1',
          },
        ],
      },
    },
  });

  // Create sample play events
  await prisma.playEvent.createMany({
    data: [
      {
        trackId: track1.id,
        userId: user.id,
        duration: 180,
        completed: true,
      },
      {
        trackId: track1.id,
        userId: user.id,
        duration: 90,
        completed: false,
      },
      {
        trackId: track2.id,
        userId: user.id,
        duration: 240,
        completed: true,
      },
    ],
  });

  // Create sample playlist
  const playlist = await prisma.playlist.create({
    data: {
      name: 'My Favorites',
      description: 'A collection of my favorite songs',
      userId: user.id,
      isPublic: true,
      playlistTracks: {
        create: [
          {
            trackId: track1.id,
            position: 1,
          },
          {
            trackId: track2.id,
            position: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeding completed!');
  console.log('👤 Admin user:', admin.email);
  console.log('🎵 Artist user:', artist.email);
  console.log('👥 Regular user:', user.email);
  console.log('🎵 Sample tracks created:', track1.title, track2.title);
  console.log('🔗 Smart link created:', smartLink.slug);
  console.log('📝 Playlist created:', playlist.name);
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5. Update Package.json Scripts

```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

### 6. Database Connection Testing

#### `src/lib/db-test.ts`

```typescript
import { prisma } from './db';

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    // Test complex query
    const tracksWithArtists = await prisma.track.findMany({
      take: 5,
      include: {
        artist: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    console.log(`🎵 Sample tracks: ${tracksWithArtists.length}`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
```

### 7. Environment Variables Update

Add to `.env.local`:

```bash
# Database connection timeout
DATABASE_CONNECTION_TIMEOUT=30000

# Database pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### 8. Database Indexes and Performance

#### `prisma/schema.prisma` (add these indexes)

```prisma
model Track {
  // ... existing fields ...

  @@index([artistId])
  @@index([genre])
  @@index([isPublished])
  @@index([playCount])
  @@index([createdAt])
}

model PlayEvent {
  // ... existing fields ...

  @@index([trackId])
  @@index([userId])
  @@index([timestamp])
  @@index([completed])
}

model User {
  // ... existing fields ...

  @@index([role])
  @@index([isPremium])
  @@index([createdAt])
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Database schema updated** - All new models and relationships created
2. **Migration successful** - No errors during database push/migration
3. **Seeding works** - Sample data created successfully
4. **Database operations functional** - All CRUD operations work
5. **Performance acceptable** - Queries execute within reasonable time
6. **Indexes working** - Database performance optimized

### Test Commands:

```bash
# Test database connection
npx tsx src/lib/db-test.ts

# Run database seeding
yarn seed

# Test Prisma Studio
yarn db:studio

# Test database operations
# 1. Create new user
# 2. Create new track
# 3. Query tracks with relationships
# 4. Test analytics functions
```

## 🚨 Common Issues & Solutions

### Issue: Database migration fails

**Solution**: Check for syntax errors in schema, ensure database is accessible

### Issue: Seeding fails

**Solution**: Verify all required fields are provided, check for unique constraints

### Issue: Slow queries

**Solution**: Add appropriate database indexes, optimize query structure

### Issue: Relationship errors

**Solution**: Verify foreign key relationships, check cascade delete settings

## 📝 Notes

- Database indexes are crucial for performance with large datasets
- Use transactions for operations that modify multiple tables
- Consider implementing database connection pooling for production
- Regular database backups should be implemented before going live

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 4: Music Upload System](./04-music-upload.md)

---

## 04-music-upload-system.md

# Music Upload System

## 🎯 Overview

A complete file upload system for Flemoji that handles music file uploads with real-time progress tracking, cloud storage, and database integration. The system uses a hybrid approach combining direct browser uploads with server-side processing to avoid CORS issues while maintaining security and control.

## 🏗️ Architecture

### **Current Implementation: Hybrid Upload Flow**

```
User → FileUpload Component → Next.js API → Cloudflare R2 → Database
  ↓           ↓                    ↓           ↓            ↓
Select    Real-time           Server-side   Cloud        Track
File      Progress            Upload        Storage      Creation
```

### **System Components**

1. **Frontend**: `FileUpload` component with drag & drop
2. **API Layer**: Next.js API routes for upload management
3. **Storage**: Cloudflare R2 for file storage
4. **Database**: PostgreSQL with Prisma ORM
5. **Real-time**: Ably for progress updates
6. **Processing**: Server-side file handling

## 🔄 Upload Flow

### **Step 1: Initialize Upload**

```typescript
POST /api/uploads/init
{
  "fileName": "song.mp3",
  "fileType": "audio/mpeg",
  "fileSize": 5242880
}
```

**Response:**

```json
{
  "jobId": "cmf8bhi0n00058km0u8u476ef",
  "key": "uploads/userId/uuid.mp3",
  "uploadUrl": "https://r2-presigned-url"
}
```

### **Step 2: Real-time Connection**

```typescript
GET /api/ably/auth?jobId={jobId}
```

**Response:**

```json
{
  "keyName": "your-key",
  "timestamp": 1234567890,
  "nonce": "random",
  "mac": "signature"
}
```

### **Step 3: Server-side Upload**

```typescript
POST / api / uploads / server - upload;
FormData: {
  (file, jobId, uploadUrl, key);
}
```

**Process:**

- Validates job ownership
- Uploads file to R2 using presigned URL
- Updates job status to `UPLOADED`

### **Step 4: Complete Upload**

```typescript
POST /api/uploads/complete
{
  "jobId": "uuid",
  "key": "uploads/userId/uuid.mp3",
  "size": 5242880,
  "mime": "audio/mpeg"
}
```

**Process:**

- Creates `Track` record in database
- Updates job status to `COMPLETED`
- Returns track information

## 📊 Database Schema

### **UploadJob Model**

```prisma
model UploadJob {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  key         String        @unique
  status      UploadStatus  @default(PENDING_UPLOAD)
  fileName    String
  fileType    String
  fileSize    Int
  uploadUrl   String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("upload_jobs")
}

enum UploadStatus {
  PENDING_UPLOAD
  UPLOADED
  PROCESSING
  COMPLETED
  FAILED
}
```

### **Track Model**

```prisma
model Track {
  id            String    @id @default(cuid())
  title         String
  artistId      String
  artist        User      @relation(fields: [artistId], references: [id], onDelete: Cascade)
  fileUrl       String
  coverImageUrl String?
  genre         String
  album         String?
  description   String?
  duration      Int
  playCount     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  playEvents    PlayEvent[]
  smartLinks    SmartLink[]

  @@map("tracks")
}
```

## 🔧 API Endpoints

### **POST /api/uploads/init**

- **Purpose**: Initialize upload job and get presigned URL
- **Auth**: Required
- **Validation**: File type, size limits
- **Response**: `{ jobId, key, uploadUrl }`

### **POST /api/uploads/server-upload**

- **Purpose**: Handle file upload via server (avoids CORS)
- **Auth**: Required
- **Input**: FormData with file, jobId, uploadUrl, key
- **Process**: Upload to R2, update job status

### **POST /api/uploads/complete**

- **Purpose**: Mark upload complete and create track record
- **Auth**: Required
- **Input**: `{ jobId, key, size, mime }`
- **Process**: Create Track record, update job status

### **GET /api/ably/auth**

- **Purpose**: Get Ably token for real-time updates
- **Auth**: Required
- **Input**: `jobId` query parameter
- **Response**: Ably authentication token

### **GET /api/tracks**

- **Purpose**: Fetch user's tracks
- **Auth**: Required
- **Response**: Array of user's tracks

## 🎨 Frontend Components

### **FileUpload Component**

```typescript
interface FileUploadProps {
  onUploadComplete?: (jobId: string) => void;
}
```

**Features:**

- Drag & drop file selection
- Real-time progress tracking via Ably
- File validation (type, size)
- Error handling and status updates
- Auto-refresh after successful upload

**Supported Formats:**

- MP3, WAV, FLAC, M4A, AAC
- Maximum size: 100MB

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flemoji"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_AUDIO_BUCKET_NAME="your-audio-bucket-name"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://your-bucket.your-domain.com"

# Ably
ABLY_API_KEY="your-ably-api-key"
```

## 🔒 Security Features

- **Authentication**: All endpoints require valid session
- **File Validation**: Type and size restrictions
- **Job Ownership**: Users can only access their own uploads
- **Presigned URLs**: Time-limited access to R2
- **CORS Protection**: Server-side uploads avoid browser CORS issues

## 📈 Real-time Updates

### **Ably Integration**

- **Channel**: `upload:{jobId}`
- **Messages**: `progress` and `status` updates
- **Reconnection**: Uses `?rewind=1` for message history
- **Authentication**: Token-based via `/api/ably/auth`

### **Progress Tracking**

- Upload progress percentage
- Status updates (initializing, uploading, processing, complete)
- Error notifications
- Real-time UI updates

## 🚀 Deployment Considerations

### **Vercel Limitations**

- Serverless functions have execution time limits
- File uploads go through server (bandwidth usage)
- Consider file size limits for serverless

### **Scaling Options**

- Move to direct R2 uploads for high volume
- Implement background processing for large files
- Add CDN for file delivery
- Consider dedicated upload service

## 🔄 Error Handling

### **Client-side**

- File validation errors
- Network connectivity issues
- Upload progress failures
- User-friendly error messages

### **Server-side**

- Authentication failures
- File validation errors
- R2 upload failures
- Database errors
- Job status updates

## 📝 File Structure

```
src/
├── components/upload/
│   └── FileUpload.tsx              # Main upload component
├── app/api/uploads/
│   ├── init/route.ts               # Initialize upload
│   ├── server-upload/route.ts      # Server-side upload
│   └── complete/route.ts           # Complete upload
├── app/api/ably/
│   └── auth/route.ts               # Ably authentication
└── app/api/tracks/
    └── route.ts                    # Fetch user tracks
```

## 🎯 Benefits of Current Approach

### **Advantages**

- ✅ **No CORS issues** - Server handles R2 communication
- ✅ **Better security** - Files go through server first
- ✅ **Real-time updates** - Ably integration for progress
- ✅ **Database integration** - Automatic track creation
- ✅ **Error handling** - Comprehensive error management
- ✅ **File validation** - Type and size restrictions
- ✅ **User experience** - Drag & drop with progress

### **Trade-offs**

- ⚠️ **Server bandwidth** - Files pass through server
- ⚠️ **Processing time** - Double upload (client→server→R2)
- ⚠️ **Vercel limits** - Serverless function constraints

## 🔮 Future Enhancements

1. **Audio Processing**: Extract metadata, generate waveforms
2. **Image Processing**: Generate album art thumbnails
3. **Virus Scanning**: Security validation
4. **Batch Uploads**: Multiple file support
5. **Resume Uploads**: Handle network interruptions
6. **Direct Uploads**: High-volume optimization
7. **CDN Integration**: Faster file delivery

## 📋 Testing Checklist

- [ ] File selection and validation
- [ ] Upload progress tracking
- [ ] Real-time updates via Ably
- [ ] Database record creation
- [ ] Error handling scenarios
- [ ] Authentication requirements
- [ ] File type restrictions
- [ ] Size limit enforcement
- [ ] UI refresh after upload
- [ ] Track display in library

---

This system provides a robust, user-friendly music upload experience with real-time feedback and secure cloud storage integration. 🎵✨

---

## 04-music-upload.md

# Phase 4: Music Upload & Track Management System

## 🎯 Objective

Implement a comprehensive music upload system with advanced track editing capabilities, metadata management, and file protection features. Artists can upload audio files, edit track details, configure privacy settings, and apply advanced protection measures.

## 📋 Prerequisites

- Phase 1, 2, & 3 completed successfully
- Enhanced database schema with comprehensive Track model
- AWS S3 account and credentials configured
- File upload and metadata management dependencies installed
- HeroUI components for advanced form interfaces

## 🚀 Step-by-Step Implementation

### 1. Enhanced Database Schema

The Track model has been significantly enhanced with comprehensive metadata and file protection fields:

```prisma
model Track {
  id              String    @id @default(cuid())
  title           String
  filePath        String    // Store only the file path, not full URL
  uniqueUrl       String    @unique // Unique URL for each track
  coverImageUrl   String?
  albumArtwork    String?   // Album artwork image

  // Basic Metadata
  genre           String?
  album           String?
  artist          String?   // Can be different from profile artist name
  composer        String?
  year            Int?
  releaseDate     DateTime?
  bpm             Int?      // Beats per minute
  isrc            String?   // International Standard Recording Code
  description     String?   @db.Text
  lyrics          String?   @db.Text

  // Technical Details
  duration        Int?      // Duration in seconds
  fileSize        Int?      // File size in bytes
  bitrate         Int?      // Audio bitrate
  sampleRate      Int?      // Audio sample rate
  channels        Int?      // Audio channels (1=mono, 2=stereo)

  // Privacy & Access Control
  isPublic        Boolean   @default(true)
  isDownloadable  Boolean   @default(false)
  isExplicit      Boolean   @default(false)

  // File Protection
  watermarkId     String?   // Unique watermark identifier
  copyrightInfo   String?   @db.Text
  licenseType     String?   // e.g., "All Rights Reserved", "Creative Commons"
  distributionRights String? @db.Text

  // Analytics
  playCount       Int       @default(0)
  likeCount       Int       @default(0)
  downloadCount   Int       @default(0)
  shareCount      Int       @default(0)

  // Relationships
  artistProfileId String
  artistProfile   ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  playEvents      PlayEvent[]
  smartLinks      SmartLink[]

  @@map("tracks")
}
```

### 2. Track Editing Components

#### `src/components/track/TrackEditForm.tsx`

A comprehensive form component for editing track metadata with:

- **Basic Information**: Title, artist, album, genre, description
- **Advanced Metadata**: Composer, year, release date, BPM, ISRC, lyrics
- **Privacy Controls**: Public/private, downloadable, explicit content
- **Copyright Management**: License types, copyright info, distribution rights
- **File Protection Settings**: Watermarking, geo-blocking, time restrictions, device limits

#### `src/components/track/TrackEditModal.tsx`

Modal wrapper for easy integration of the track edit form.

#### `src/components/track/TrackProtectionSettings.tsx`

Advanced protection settings component with:

- **Audio Watermarking**: Invisible tracking markers
- **Geographic Blocking**: Country-based access restrictions
- **Time Restrictions**: Time-based access controls
- **Device Limits**: Mobile/desktop access controls
- **Streaming Limits**: Concurrent streams, daily/weekly limits

### 3. File Protection System

#### `src/lib/file-protection.ts`

Comprehensive file protection utilities including:

- **Watermark Generation**: Unique identifiers for tracking
- **Access Validation**: Multi-layered access control
- **DRM Tokens**: Time-limited access tokens
- **Blockchain Hashing**: Copyright protection
- **Geo-blocking**: Country-based restrictions
- **Device Management**: Device type and limit controls

### 4. API Endpoints

#### `src/app/api/tracks/create/route.ts`

Enhanced track creation with full metadata support.

#### `src/app/api/tracks/update/route.ts`

Comprehensive track update functionality with validation.

### 5. Install File Upload Dependencies

```bash
# File handling and validation
yarn add multer @types/multer
yarn add formidable @types/formidable
yarn add music-metadata
yarn add @aws-sdk/client-s3
yarn add @aws-sdk/s3-request-presigner

# Audio processing
yarn add ffmpeg-static
yarn add fluent-ffmpeg @types/fluent-ffmpeg

# File type validation
yarn add file-type
yarn add mime-types @types/mime-types
```

### 2. AWS S3 Configuration

#### `src/lib/s3.ts`

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Config = {
  bucket: process.env.AWS_S3_BUCKET!,
  region: process.env.AWS_REGION!,
};

export class S3Service {
  // Upload file to S3
  static async uploadFile(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  // Generate presigned URL for direct upload
  static async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  // Generate presigned URL for file access
  static async generateAccessUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }
}
```

### 3. File Upload Utilities

#### `src/lib/upload-utils.ts`

```typescript
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { FileTypeResult } from 'file-type';
import { fileTypeFromBuffer } from 'file-type';

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ProcessedAudioFile {
  filePath: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  originalName: string;
}

export class UploadUtils {
  // Validate file type
  static async validateAudioFile(file: UploadedFile): Promise<boolean> {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/m4a',
    ];

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return false;
    }

    // Check file extension
    const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(
      file.buffer
    );
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      return false;
    }

    return true;
  }

  // Validate file size (max 50MB)
  static validateFileSize(size: number): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return size <= maxSize;
  }

  // Save file to temporary directory
  static async saveTempFile(file: UploadedFile): Promise<string> {
    const tempDir = tmpdir();
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(tempDir, fileName);

    await writeFile(filePath, file.buffer);
    return filePath;
  }

  // Get audio duration
  static async getAudioDuration(filePath: string): Promise<number> {
    try {
      const duration = await getAudioDurationInSeconds(filePath);
      return Math.round(duration);
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  // Generate unique S3 key
  static generateS3Key(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    return `uploads/${userId}/${timestamp}-${sanitizedName}.${extension}`;
  }

  // Clean up temporary file
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  // Process uploaded audio file
  static async processAudioFile(
    file: UploadedFile,
    userId: string
  ): Promise<ProcessedAudioFile> {
    // Validate file
    if (!this.validateAudioFile(file)) {
      throw new Error('Invalid audio file type');
    }

    if (!this.validateFileSize(file.size)) {
      throw new Error('File size too large (max 50MB)');
    }

    // Save to temp directory
    const tempFilePath = await this.saveTempFile(file);

    // Get audio duration
    const duration = await this.getAudioDuration(tempFilePath);

    return {
      filePath: tempFilePath,
      duration,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }
}
```

### 4. Upload API Route

#### `src/app/api/upload/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { S3Service } from '@/lib/s3';
import { UploadUtils } from '@/lib/upload-utils';
import { trackSchema } from '@/lib/validations';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is artist or admin
    if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only artists can upload tracks' },
        { status: 403 }
      );
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowEmptyFiles: false,
      filter: part => {
        return (
          part.mimetype?.includes('audio/') || part.mimetype?.includes('image/')
        );
      },
    });

    const [fields, files] = await form.parse(request);

    // Extract metadata
    const metadata = {
      title: fields.title?.[0] || '',
      genre: fields.genre?.[0] || '',
      album: fields.album?.[0] || '',
      description: fields.description?.[0] || '',
      isExplicit: fields.isExplicit?.[0] === 'true',
      releaseDate: fields.releaseDate?.[0]
        ? new Date(fields.releaseDate[0])
        : null,
    };

    // Validate metadata
    const validatedMetadata = trackSchema.parse(metadata);

    // Get audio file
    const audioFile = files.audio?.[0];
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Get cover image (optional)
    const coverImage = files.coverImage?.[0];

    // Process audio file
    const audioBuffer = readFileSync(audioFile.filepath);
    const processedAudio = await UploadUtils.processAudioFile(
      {
        originalname: audioFile.originalFilename || 'audio.mp3',
        buffer: audioBuffer,
        mimetype: audioFile.mimetype || 'audio/mpeg',
        size: audioFile.size || 0,
      },
      session.user.id
    );

    // Upload audio to S3
    const audioKey = UploadUtils.generateS3Key(
      processedAudio.originalName,
      session.user.id
    );
    const audioUrl = await S3Service.uploadFile(
      audioBuffer,
      audioKey,
      processedAudio.mimeType
    );

    // Upload cover image if provided
    let coverImageUrl: string | undefined;
    if (coverImage) {
      const coverBuffer = readFileSync(coverImage.filepath);
      const coverKey = UploadUtils.generateS3Key(
        coverImage.originalFilename || 'cover.jpg',
        session.user.id
      );
      coverImageUrl = await S3Service.uploadFile(
        coverBuffer,
        coverKey,
        coverImage.mimetype || 'image/jpeg'
      );
    }

    // Create track in database
    const track = await prisma.track.create({
      data: {
        title: validatedMetadata.title,
        artistId: session.user.id,
        fileUrl: audioUrl,
        coverImageUrl,
        genre: validatedMetadata.genre,
        album: validatedMetadata.album,
        description: validatedMetadata.description,
        duration: processedAudio.duration,
        isExplicit: validatedMetadata.isExplicit,
        releaseDate: validatedMetadata.releaseDate,
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Clean up temp files
    await UploadUtils.cleanupTempFile(processedAudio.filePath);
    if (coverImage) {
      await UploadUtils.cleanupTempFile(coverImage.filepath);
    }

    return NextResponse.json(
      {
        message: 'Track uploaded successfully',
        track,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tracks
    const tracks = await prisma.track.findMany({
      where: { artistId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Track Management API

#### `src/app/api/tracks/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { S3Service } from '@/lib/s3';
import { trackSchema } from '@/lib/validations';

// Get track by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update track
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the track or is admin
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = trackSchema.parse(body);

    const updatedTrack = await prisma.track.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ track: updatedTrack });
  } catch (error) {
    console.error('Error updating track:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the track or is admin
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from S3
    if (track.fileUrl) {
      const key = track.fileUrl.split('/').pop();
      if (key) {
        await S3Service.deleteFile(key);
      }
    }

    if (track.coverImageUrl) {
      const key = track.coverImageUrl.split('/').pop();
      if (key) {
        await S3Service.deleteFile(key);
      }
    }

    // Delete from database
    await prisma.track.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Upload Form Component

#### `src/components/forms/UploadTrackForm.tsx`

```typescript
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface UploadFormData {
  title: string
  genre: string
  album: string
  description: string
  isExplicit: boolean
  releaseDate: string
}

export default function UploadTrackForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    genre: '',
    album: '',
    description: '',
    isExplicit: false,
    releaseDate: '',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file')
        return
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }

      setAudioFile(file)
      setError('')
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setError('Cover image must be less than 5MB')
        return
      }

      setCoverImage(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setError('Please select an audio file')
      return
    }

    if (!formData.title || !formData.genre) {
      setError('Title and genre are required')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formDataToSend = new FormData()

      // Add metadata
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value.toString())
        }
      })

      // Add files
      formDataToSend.append('audio', audioFile)
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage)
      }

      const response = await fetch('/api/upload/track', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/artist/dashboard?message=Track uploaded successfully!`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Upload failed')
      }
    } catch (error) {
      setError('An error occurred during upload')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      genre: '',
      album: '',
      description: '',
      isExplicit: false,
      releaseDate: '',
    })
    setAudioFile(null)
    setCoverImage(null)
    setError('')
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600">
          Only artists can upload tracks.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Upload New Track
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File *
          </label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required
          />
          {audioFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image (Optional)
          </label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {coverImage && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {coverImage.name} ({(coverImage.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Track Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Track Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter track title"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
            Genre *
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Select a genre</option>
            <option value="Amapiano">Amapiano</option>
            <option value="Gqom">Gqom</option>
            <option value="Afro House">Afro House</option>
            <option value="Kwaito">Kwaito</option>
            <option value="Afro Pop">Afro Pop</option>
            <option value="Afro Soul">Afro Soul</option>
            <option value="Deep House">Deep House</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="R&B">R&B</option>
            <option value="Pop">Pop</option>
            <option value="Electronic">Electronic</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Album */}
        <div>
          <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-2">
            Album
          </label>
          <input
            type="text"
            id="album"
            name="album"
            value={formData.album}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter album name"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter track description"
          />
        </div>

        {/* Release Date */}
        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
            Release Date
          </label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            value={formData.releaseDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Explicit Content */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isExplicit"
            name="isExplicit"
            checked={formData.isExplicit}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isExplicit" className="ml-2 block text-sm text-gray-700">
            This track contains explicit content
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUploading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Track'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
```

### 7. Track List Component

#### `src/components/music/TrackList.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'

interface Track {
  id: string
  title: string
  artist: {
    id: string
    name: string
    image: string | null
  }
  coverImageUrl: string | null
  genre: string
  album: string | null
  duration: number
  playCount: number
  likeCount: number
  isPublished: boolean
  createdAt: string
}

interface TrackListProps {
  tracks: Track[]
  showActions?: boolean
  onTrackUpdate?: (trackId: string, updates: Partial<Track>) => void
  onTrackDelete?: (trackId: string) => void
}

export default function TrackList({
  tracks,
  showActions = false,
  onTrackUpdate,
  onTrackDelete
}: TrackListProps) {
  const { data: session } = useSession()
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Track>>({})

  const handleEdit = (track: Track) => {
    setEditingTrack(track.id)
    setEditForm({
      title: track.title,
      genre: track.genre,
      album: track.album,
    })
  }

  const handleSave = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const result = await response.json()
        onTrackUpdate?.(trackId, result.track)
        setEditingTrack(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating track:', error)
    }
  }

  const handleDelete = async (trackId: string) => {
    if (confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/tracks/${trackId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          onTrackDelete?.(trackId)
        }
      } catch (error) {
        console.error('Error deleting track:', error)
      }
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracks found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {track.coverImageUrl ? (
                <img
                  src={track.coverImageUrl}
                  alt={`${track.title} cover`}
                  className="w-16 h-16 rounded-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Cover</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {track.title}
                </h3>
                {!track.isPublished && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                by {track.artist.name}
              </p>

              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>{track.genre}</span>
                {track.album && <span>• {track.album}</span>}
                <span>• {formatDuration(track.duration)}</span>
                <span>• {track.playCount} plays</span>
                <span>• {track.likeCount} likes</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && session?.user &&
             (session.user.id === track.artist.id || session.user.role === 'ADMIN') && (
              <div className="flex items-center space-x-2">
                {editingTrack === track.id ? (
                  <>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Title"
                    />
                    <select
                      value={editForm.genre || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="Pop">Pop</option>
                      <option value="Rock">Rock</option>
                      <option value="Hip-Hop">Hip-Hop</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Classical">Classical</option>
                      <option value="Country">Country</option>
                      <option value="R&B">R&B</option>
                      <option value="Alternative">Alternative</option>
                      <option value="Indie">Indie</option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      onClick={() => handleSave(track.id)}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTrack(null)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(track)}
                      className="px-3 py-1 bg-secondary-500 text-white text-sm rounded hover:bg-secondary-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 8. Upload Page

#### `src/app/(dashboard)/artist/upload/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UploadTrackForm from '@/components/forms/UploadTrackForm'

export default async function UploadPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Upload New Track
          </h1>
          <p className="mt-2 text-gray-600">
            Share your music with the world. Upload your track and add all the details.
          </p>
        </div>

        <UploadTrackForm />
      </div>
    </div>
  )
}
```

### 9. Environment Variables Update

Add to `.env.local`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name_here

# File Upload Limits
MAX_FILE_SIZE=52428800
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac,audio/ogg,audio/m4a
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

## 🎵 Enhanced Upload Flow & User Experience

### Post-Upload Track Editing

After successful file upload, the system automatically presents a comprehensive track editing interface:

1. **Success Notification**: Green-themed success card with uploaded filename
2. **Track Edit Form**: Comprehensive metadata editing form appears
3. **Post-Upload Options**:
   - "View Music Library" - Navigate to library tab
   - "Upload Another Track" - Reset form for another upload

### Track Management Features

#### Library Integration

- **Edit Button**: Each track in the library has an edit button
- **Real-time Updates**: Changes reflect immediately in the UI
- **Bulk Operations**: Future support for bulk track management

#### Metadata Management

- **25+ Fields**: Comprehensive metadata including technical details
- **Validation**: Real-time form validation with helpful error messages
- **Auto-generation**: Unique URLs and watermarks generated automatically

### File Protection Features

#### Privacy Controls

- **Public/Private**: Control track visibility
- **Download Permissions**: Configurable download access
- **Explicit Content**: Mark tracks with explicit content warnings

#### Advanced Protection

- **Audio Watermarking**: Invisible tracking markers
- **Geographic Blocking**: Country-based access restrictions
- **Time Restrictions**: Time-based access controls
- **Device Limits**: Mobile/desktop access controls
- **Streaming Limits**: Concurrent streams, daily/weekly limits

#### Copyright Management

- **License Types**: Multiple license options (All Rights Reserved, Creative Commons, etc.)
- **Copyright Information**: Detailed copyright and distribution rights
- **Blockchain Hashing**: Copyright protection via blockchain

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **File upload works** - Can upload audio files successfully
2. **S3 integration functional** - Files stored in cloud storage
3. **Metadata management** - Track information saved correctly
4. **File validation** - Invalid files rejected appropriately
5. **Track CRUD operations** - Create, read, update, delete working
6. **Authorization working** - Only artists can upload tracks
7. **File cleanup** - Temporary files removed after upload
8. **Track editing** - Edit form works with all metadata fields
9. **File protection** - Protection settings save and apply correctly
10. **Privacy controls** - Public/private and download settings work
11. **Unique URLs** - Each track gets a unique, trackable URL
12. **Post-upload flow** - Success notifications and edit form appear

### Test Commands:

```bash
# Test file upload
# 1. Login as artist
# 2. Navigate to upload page
# 3. Upload audio file with metadata
# 4. Verify file appears in track list

# Test track management
# 1. Edit track metadata
# 2. Delete track
# 3. Verify S3 cleanup

# Test authorization
# 1. Try uploading as regular user
# 2. Verify access denied
```

## 🚨 Common Issues & Solutions

### Issue: File upload fails

**Solution**: Check AWS credentials, verify S3 bucket permissions, ensure file size limits

### Issue: Audio duration not detected

**Solution**: Install ffmpeg, verify audio file format support

### Issue: S3 upload errors

**Solution**: Verify bucket CORS settings, check IAM permissions

### Issue: Form validation errors

**Solution**: Ensure all required fields are filled, check file type validation

## 📝 Notes

- Implement proper error handling for large file uploads
- Consider implementing chunked uploads for very large files
- Add progress indicators for better user experience
- Implement file type validation on both client and server
- Consider adding audio format conversion for better compatibility

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 5: Music Streaming Interface](./05-music-streaming.md)

---

## 04-track-editing-protection.md

# Track Editing & File Protection System

## 🎯 Objective

Implement a comprehensive track editing system with advanced metadata management and file protection features. This system allows artists to edit track details, configure privacy settings, and apply sophisticated protection measures to their music.

## 📋 Features Overview

### 🎵 Track Editing Capabilities

#### Basic Metadata

- **Title** (Required)
- **Artist** - Can differ from profile artist name
- **Album** - Album name
- **Genre** - Music genre selection
- **Description** - Track description
- **Lyrics** - Full song lyrics

#### Advanced Metadata

- **Composer** - Track composer
- **Year** - Release year
- **Release Date** - Specific release date
- **BPM** - Beats per minute
- **ISRC** - International Standard Recording Code
- **Technical Details** - Duration, file size, bitrate, sample rate, channels

#### Privacy & Access Control

- **Public/Private** - Control track visibility
- **Downloadable** - Allow/disallow downloads (auto-disabled for private tracks)
- **Explicit Content** - Mark tracks with explicit content warnings

### 🔒 File Protection Features

#### Audio Watermarking

- **Invisible Markers** - Embed tracking markers in audio files
- **Unique Identifiers** - Generate unique watermark IDs
- **Tracking** - Monitor unauthorized distribution

#### Geographic Protection

- **Country Blocking** - Block access from specific countries
- **Region Restrictions** - Control geographic distribution
- **IP-based Filtering** - Restrict access by location

#### Time-based Controls

- **Time Restrictions** - Limit access to specific time periods
- **Timezone Support** - Multiple timezone configurations
- **Scheduled Access** - Set start/end times for content availability

#### Device Management

- **Device Type Control** - Allow/block mobile vs desktop access
- **Device Limits** - Maximum number of devices per user
- **Platform Restrictions** - Control access by device type

#### Streaming Limits

- **Concurrent Streams** - Maximum simultaneous streams
- **Daily Limits** - Maximum plays per day
- **Weekly Limits** - Maximum plays per week
- **User-based Limits** - Per-user streaming restrictions

#### Copyright Protection

- **License Types** - Multiple licensing options
- **Copyright Information** - Detailed copyright details
- **Distribution Rights** - Custom distribution restrictions
- **Blockchain Hashing** - Copyright protection via blockchain

## 🏗️ Architecture

### Database Schema

```prisma
model Track {
  id              String    @id @default(cuid())
  title           String
  filePath        String
  uniqueUrl       String    @unique
  coverImageUrl   String?
  albumArtwork    String?

  // Basic Metadata
  genre           String?
  album           String?
  artist          String?
  composer        String?
  year            Int?
  releaseDate     DateTime?
  bpm             Int?
  isrc            String?
  description     String?   @db.Text
  lyrics          String?   @db.Text

  // Technical Details
  duration        Int?
  fileSize        Int?
  bitrate         Int?
  sampleRate      Int?
  channels        Int?

  // Privacy & Access Control
  isPublic        Boolean   @default(true)
  isDownloadable  Boolean   @default(false)
  isExplicit      Boolean   @default(false)

  // File Protection
  watermarkId     String?
  copyrightInfo   String?   @db.Text
  licenseType     String?
  distributionRights String? @db.Text

  // Analytics
  playCount       Int       @default(0)
  likeCount       Int       @default(0)
  downloadCount   Int       @default(0)
  shareCount      Int       @default(0)

  // Relationships
  artistProfileId String
  artistProfile   ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  playEvents      PlayEvent[]
  smartLinks      SmartLink[]

  @@map("tracks")
}
```

### Component Structure

```
src/components/track/
├── TrackEditForm.tsx           # Main editing form
├── TrackEditModal.tsx          # Modal wrapper
└── TrackProtectionSettings.tsx # Protection settings

src/lib/
└── file-protection.ts          # Protection utilities

src/app/api/tracks/
├── create/route.ts             # Track creation
└── update/route.ts             # Track updates
```

## 🚀 Implementation Details

### TrackEditForm Component

A comprehensive form component with:

- **Form Validation** - Real-time validation with error messages
- **Auto-generation** - Unique URLs and watermarks
- **Privacy Logic** - Auto-disables downloads for private tracks
- **Section Organization** - Organized into logical sections
- **Responsive Design** - Works on all device sizes

### TrackProtectionSettings Component

Advanced protection configuration with:

- **Watermarking Controls** - Enable/disable audio watermarking
- **Geographic Settings** - Country selection for blocking
- **Time Controls** - Time-based access restrictions
- **Device Management** - Device type and limit controls
- **Streaming Limits** - Concurrent and daily/weekly limits

### File Protection Utilities

Comprehensive protection system with:

- **Watermark Generation** - Create unique tracking identifiers
- **Access Validation** - Multi-layered access control
- **DRM Tokens** - Time-limited access tokens
- **Blockchain Hashing** - Copyright protection
- **Geo-blocking** - Country-based restrictions

## 🎨 User Experience

### Upload Flow

1. **File Upload** - User uploads audio file
2. **Success Notification** - Green success card appears
3. **Track Edit Form** - Comprehensive editing form opens
4. **Metadata Entry** - User fills in track details
5. **Protection Settings** - Configure advanced protection
6. **Save & Continue** - Track saved with all settings

### Library Management

1. **Track List** - View all uploaded tracks
2. **Edit Button** - Click to edit any track
3. **Real-time Updates** - Changes reflect immediately
4. **Bulk Operations** - Future support for multiple tracks

### Protection Features

1. **Privacy Controls** - Simple public/private toggles
2. **Download Settings** - Control download permissions
3. **Advanced Protection** - Comprehensive protection options
4. **Copyright Management** - License and rights management

## 🔧 API Endpoints

### Track Creation

```typescript
POST /api/tracks/create
{
  title: string;
  filePath: string;
  artist?: string;
  album?: string;
  genre?: string;
  // ... all metadata fields
  isPublic: boolean;
  isDownloadable: boolean;
  isExplicit: boolean;
  protectionSettings: ProtectionSettings;
}
```

### Track Updates

```typescript
PUT / api / tracks / update;
{
  trackId: string;
  // ... updated fields
}
```

## 🛡️ Security Features

### Access Control

- **User Authentication** - Only authenticated users can edit
- **Ownership Validation** - Users can only edit their own tracks
- **Admin Override** - Admins can edit any track

### Data Validation

- **Form Validation** - Client-side validation
- **Server Validation** - Server-side validation
- **Type Safety** - TypeScript type checking

### Protection Measures

- **Watermarking** - Invisible tracking markers
- **Access Logging** - Track all access attempts
- **Rate Limiting** - Prevent abuse
- **Encryption** - Secure data transmission

## 📊 Analytics & Monitoring

### Track Analytics

- **Play Counts** - Track play statistics
- **Download Counts** - Download tracking
- **Share Counts** - Social sharing metrics
- **Geographic Data** - Location-based analytics

### Protection Monitoring

- **Access Attempts** - Track all access attempts
- **Violation Detection** - Detect unauthorized access
- **Usage Patterns** - Analyze usage patterns
- **Security Alerts** - Alert on suspicious activity

## 🧪 Testing

### Unit Tests

- **Form Validation** - Test all validation rules
- **API Endpoints** - Test all API functionality
- **Protection Logic** - Test protection features
- **Error Handling** - Test error scenarios

### Integration Tests

- **Upload Flow** - Test complete upload process
- **Edit Flow** - Test track editing process
- **Protection Features** - Test protection functionality
- **User Permissions** - Test access control

### Performance Tests

- **Large Files** - Test with large audio files
- **Concurrent Users** - Test with multiple users
- **Database Performance** - Test database queries
- **API Response Times** - Test API performance

## 🚀 Future Enhancements

### Advanced Features

- **Bulk Editing** - Edit multiple tracks at once
- **Template System** - Save and reuse track templates
- **Auto-tagging** - AI-powered metadata suggestions
- **Version Control** - Track edit history

### Protection Enhancements

- **Blockchain Integration** - Full blockchain copyright protection
- **AI Detection** - AI-powered unauthorized use detection
- **Fingerprinting** - Audio fingerprinting technology
- **Legal Integration** - Integration with legal systems

### User Experience

- **Mobile App** - Native mobile applications
- **Offline Editing** - Offline track editing capabilities
- **Collaboration** - Multi-user track editing
- **Workflow Management** - Track approval workflows

## 📝 Notes

- All components are fully reusable and can be integrated into different views
- The system is designed to be extensible for future features
- Protection features are configurable per track
- The system supports both simple and advanced protection needs
- All user interactions are logged for analytics and security

---
