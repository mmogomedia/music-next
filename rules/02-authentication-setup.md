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
