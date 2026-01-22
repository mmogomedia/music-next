# Claude.md - Flemoji Next Development Guide

This document provides AI assistants and developers with comprehensive guidelines for working on the Flemoji Next codebase.

## Project Overview

Flemoji Next is an AI-powered music discovery and artist promotion platform built with Next.js 15. It combines music streaming, artist profiles, playlist curation, social timeline features, and intelligent music recommendations powered by Claude AI and LangChain.

**Key Features:**

- AI-powered music discovery and recommendations
- Artist profile management with analytics
- Playlist submission and curation workflow
- Social timeline with posts, likes, comments, and follows
- Smart and Quick links for multi-platform distribution
- Real-time music player with advanced queue management
- Admin dashboard for content moderation
- Role-based access control (USER, ARTIST, ADMIN)

## Technology Stack

### Core Framework

- **Next.js 15.5.7** with App Router
- **React 19.1.1** (client and server components)
- **TypeScript 5.5.4** (strict mode)
- **Node.js >=16.14.0**

### Database & ORM

- **PostgreSQL** (primary database)
- **Prisma 5.22.0** (ORM with migrations)

### Authentication

- **NextAuth 4.24.11** with JWT strategy
- **bcryptjs 2.4.3** for password hashing
- Supports Google OAuth and credentials authentication

### UI & Styling

- **TailwindCSS 3.4.0** with PostCSS
- **HeroUI 2.4.5** (component library)
- **Framer Motion 12.23.12** (animations)
- **@heroicons/react 2.1.5** (icons)

### AI & Intelligence

- **@anthropic-ai/sdk 0.63.0** (Claude AI)
- **LangChain 1.0.2** with multiple providers (Anthropic, OpenAI, Google GenAI)

### Additional Libraries

- **Zod 4.1.12** (schema validation)
- **Ably 2.12.0** (real-time messaging)
- **date-fns 4.1.0** (date utilities)
- **Resend 6.4.2** (email)
- **AWS S3** (file storage)
- **music-metadata 11.10.0** (audio metadata extraction)

### Testing & Quality

- **Jest 30.1.3** with jsdom
- **React Testing Library** (component testing)
- **ESLint 8.57.0** (linting)
- **Prettier 3.6.2** (formatting)
- **Husky 9.1.7** (git hooks)

## Code Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth routes (login, register, verify-email)
│   ├── (chat)/            # Chat interface
│   ├── (classic)/         # Classic layout routes
│   ├── api/               # API endpoints (RESTful)
│   ├── admin/             # Admin dashboard
│   ├── artist/            # Public artist profiles
│   ├── artist-profile/    # Artist profile management
│   ├── dashboard/         # User dashboard
│   ├── profile/           # Profile management
│   ├── quick/             # Quick links landing pages
│   ├── smart/             # Smart links landing pages
│   ├── submissions/       # Track submissions
│   └── timeline/          # Social timeline
├── components/            # React components (organized by feature)
│   ├── ai/               # AI chat and recommendations
│   ├── artist/           # Artist-specific components
│   ├── auth/             # Authentication forms
│   ├── dashboard/        # Dashboard components
│   ├── landing/          # Landing page components
│   ├── layout/           # Layout components (header, footer, nav)
│   ├── music/            # Music player and playback
│   ├── providers/        # Context providers
│   ├── timeline/         # Timeline/social feed
│   ├── track/            # Track management
│   └── ui/               # Reusable UI components
├── contexts/             # React Context for global state
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities and services
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client singleton
│   ├── services/         # Service layer (music, playlist, artist, analytics)
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
├── styles/               # Global CSS
└── types/                # TypeScript type definitions
```

## Coding Conventions

### TypeScript

**Always use strict typing:**

```typescript
// Good
interface TrackCardProps {
  track: Track;
  onPlay: (trackId: string) => void;
  isPlaying?: boolean;
}

// Bad - avoid 'any'
function updateTrack(data: any) {}
```

**Use Zod for runtime validation:**

```typescript
import { z } from 'zod';

const trackSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  audioUrl: z.string().url('Invalid audio URL'),
  artistIds: z.array(z.string()).min(1, 'At least one artist required'),
});

export type TrackInput = z.infer<typeof trackSchema>;
```

### React Components

**Use functional components with hooks:**

```typescript
'use client'; // Add directive when client-side features needed

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function ComponentName() {
  const { data: session } = useSession();
  const [state, setState] = useState<Type>(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return <div>Content</div>;
}
```

**Component organization:**

1. Import statements (external first, then internal)
2. Type/interface definitions
3. Component function
4. Hooks (useState, useEffect, useContext, custom hooks)
5. Event handlers
6. Helper functions
7. Return JSX

**Use 'use client' directive sparingly:**

- Only add when component needs client-side features (useState, useEffect, event handlers)
- Server components by default are preferred for better performance
- Keep server components for data fetching when possible

### Custom Hooks Pattern

**Follow the established pattern:**

```typescript
export function useResource() {
  const { data: session } = useSession();
  const [data, setData] = useState<Type | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/resource');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    clearError: () => setError(null),
  };
}
```

### API Routes

**Follow the established pattern:**

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic with Prisma
    const data = await prisma.resource.findMany({
      where: { userId: session.user.id },
      include: { relatedModel: true },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}
```

**API Route Conventions:**

- Always use `getServerSession(authOptions)` for authentication
- Return proper HTTP status codes (401, 403, 404, 500)
- Use consistent error response format: `{ error: string }`
- Add `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` for data routes
- Log errors with `console.error()` (console.log is not allowed by ESLint)

### Service Layer

**Use the service layer for shared business logic:**

```typescript
// src/lib/services/resource-service.ts
import { prisma } from '@/lib/db';

export async function getResourcesByUser(userId: string) {
  return prisma.resource.findMany({
    where: { userId },
    include: { relatedModel: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createResource(data: ResourceInput) {
  return prisma.resource.create({
    data,
    include: { relatedModel: true },
  });
}
```

**Benefits:**

- Shared between API routes and AI agents
- Centralized database logic
- Easier to test and maintain

## Database Patterns

### Prisma Client Usage

**Always use the singleton instance:**

```typescript
import { prisma } from '@/lib/db';

// Good
const users = await prisma.user.findMany();

// Bad - don't create new PrismaClient instances
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient(); // DON'T DO THIS
```

### Query Patterns

**Include related data efficiently:**

```typescript
// Include related models
const track = await prisma.track.findUnique({
  where: { id: trackId },
  include: {
    artists: true,
    genre: true,
    playlists: true,
  },
});

// Select specific fields to reduce payload
const tracks = await prisma.track.findMany({
  select: {
    id: true,
    title: true,
    audioUrl: true,
    artists: {
      select: {
        id: true,
        artistName: true,
        profileImage: true,
      },
    },
  },
});
```

**Use transactions for multi-step operations:**

```typescript
await prisma.$transaction(async tx => {
  const track = await tx.track.create({ data: trackData });
  await tx.playEvent.create({
    data: { trackId: track.id, userId, source: 'playlist' },
  });
});
```

### Multi-Artist Support

**Always handle both primary and featured artists:**

```typescript
// When creating/updating tracks
const track = await prisma.track.create({
  data: {
    title: 'Song Title',
    primaryArtistIds: [artistId1, artistId2], // Ordered array
    featuredArtistIds: [artistId3], // Featured artists
    // Legacy field for backwards compatibility
    artistId: artistId1,
  },
});

// When querying tracks with artist info
const tracks = await prisma.track.findMany({
  include: {
    artists: {
      where: {
        id: { in: track.primaryArtistIds },
      },
    },
  },
});
```

## Authentication & Authorization

### Session Management

**Always check authentication in API routes:**

```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Use role-based authorization:**

```typescript
// Check for specific role
if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Check for multiple roles
if (!['ARTIST', 'ADMIN'].includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Client-Side Authentication

**Use useSession hook:**

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function ProtectedComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Protected content for {session.user.name}</div>;
}
```

### Middleware Pattern

**Public routes are defined in middleware.ts:**

```typescript
const publicRoutes = ['/', '/browse', '/login', '/register', '/about'];
const publicApiRoutes = ['/api/auth', '/api/health', '/api/tracks/public'];
```

**Don't modify middleware without understanding:**

- The middleware handles authentication redirects
- Role-based access control for /admin and /artist routes
- Public routes bypass authentication
- API routes return 401, page routes redirect to /login

## Music Player Context

### Global Music Player State

**Use MusicPlayerContext for playback:**

```typescript
'use client';

import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export function TrackCard({ track }) {
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicPlayer();

  const handlePlay = () => {
    playTrack(track, 'playlist', playlistId);
  };

  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <button onClick={isCurrentTrack && isPlaying ? pauseTrack : handlePlay}>
      {isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
```

**Always include source tracking:**

```typescript
// Sources: 'landing' | 'playlist' | 'search' | 'direct' | 'share'
playTrack(track, 'playlist', playlistId);
playTrack(track, 'search', searchQuery);
playTrack(track, 'landing');
```

**Key Methods:**

- `playTrack(track, source, context?)` - Play a track with source tracking
- `pauseTrack()` - Pause current track
- `resumeTrack()` - Resume paused track
- `skipToNext()` - Skip to next track in queue
- `skipToPrevious()` - Skip to previous track
- `seekTo(time)` - Seek to specific time
- `setQueue(tracks)` - Set queue with tracks
- `addToQueue(track)` - Add track to queue
- `toggleShuffle()` - Toggle shuffle mode
- `toggleRepeat()` - Cycle repeat modes (off, all, one)

## AI Integration

### Using Services in AI Agents

**Import and use service layer:**

```typescript
import { searchTracks, getTrackById } from '@/lib/services/music-service';
import { getTrendingTracks } from '@/lib/services/analytics-service';

// In AI agent tool
const results = await searchTracks({
  query: userQuery,
  genres: ['Hip-Hop', 'Rap'],
  limit: 10,
});
```

### AI Response Rendering

**Use established response renderers:**

- `track-list-renderer.tsx` - For track lists
- `artist-renderer.tsx` - For artist profiles
- `search-results-renderer.tsx` - For search results
- `quick-link-track-renderer.tsx` - For quick links

**Add new renderers following the pattern:**

```typescript
'use client';

export function CustomRenderer({ data }) {
  return (
    <div className="custom-response">
      {/* Render AI response data */}
    </div>
  );
}
```

## Testing

### Test Structure

**Colocate tests in **tests** folders:**

```
src/
├── lib/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.test.ts
├── components/
│   ├── track/
│   │   ├── TrackCard.tsx
│   │   └── __tests__/
│   │       └── TrackCard.test.tsx
```

### Testing API Routes

**Mock Prisma and dependencies:**

```typescript
import { GET } from '@/app/api/tracks/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  prisma: {
    track: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('GET /api/tracks', () => {
  it('should return tracks for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    (prisma.track.findMany as jest.Mock).mockResolvedValue([
      { id: 'track-1', title: 'Test Track' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Test Track');
  });
});
```

### Testing Components

**Use React Testing Library:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackCard } from '../TrackCard';

describe('TrackCard', () => {
  it('should render track information', () => {
    const track = {
      id: 'track-1',
      title: 'Test Track',
      artists: [{ id: 'artist-1', artistName: 'Test Artist' }],
    };

    render(<TrackCard track={track} />);

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });
});
```

### Coverage Requirements

**Minimum 70% coverage across all metrics:**

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Run tests with coverage:

```bash
yarn test:coverage
```

## Styling & UI

### TailwindCSS Usage

**Use utility classes:**

```typescript
<div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
</div>
```

**Use clsx for conditional classes:**

```typescript
import clsx from 'clsx';

<button
  className={clsx(
    'px-4 py-2 rounded-lg transition-colors',
    isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Click me
</button>
```

**Use HeroUI components:**

```typescript
import { Button, Card, Input } from '@heroui/react';

<Card>
  <Input label="Email" type="email" />
  <Button color="primary">Submit</Button>
</Card>
```

### Responsive Design

**Use Tailwind responsive prefixes:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## Build & Deployment

### Build Process

```bash
# Development
yarn dev

# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Formatting
yarn format
yarn format:check

# Run all checks
yarn check-all

# Fix all issues
yarn fix-all

# Build
yarn build
```

### Pre-commit Hooks

**Husky runs automatically:**

- ESLint with auto-fix on staged files
- Prettier formatting on staged files
- TypeScript type checking (via check-all script)

**Never skip pre-commit hooks unless absolutely necessary.**

### Database Migrations

**Development:**

```bash
yarn db:push          # Push schema changes without migration
yarn prisma:migrate   # Create migration with name
yarn db:studio        # Open Prisma Studio
```

**Production:**

```bash
yarn migrate:prod     # Run migrations on production
```

### Environment Variables

**Required environment variables:**

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET_NAME=

# Anthropic AI
ANTHROPIC_API_KEY=

# Email (Resend)
RESEND_API_KEY=

# Ably (Real-time)
ABLY_API_KEY=

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Important Rules & Don'ts

### Code Quality

**DO:**

- Write type-safe TypeScript code
- Use Zod for input validation
- Follow the established patterns and conventions
- Write tests for new features
- Use the service layer for business logic
- Keep components focused and single-purpose
- Use meaningful variable and function names
- Add error handling to async operations

**DON'T:**

- Use `any` type unless absolutely necessary
- Use `console.log()` (use `console.error()` or `console.warn()`)
- Create new PrismaClient instances (use the singleton)
- Skip authentication checks in API routes
- Modify core authentication logic without thorough testing
- Bypass middleware authentication
- Hard-code configuration values (use environment variables)
- Commit sensitive data (.env files)

### Database

**DO:**

- Use Prisma migrations for schema changes
- Include related data efficiently with `include` or `select`
- Use transactions for multi-step operations
- Handle both primary and featured artists
- Add proper indexes for query performance

**DON'T:**

- Modify the database schema directly without migrations
- Use raw SQL unless absolutely necessary
- Skip error handling on database operations
- Create N+1 query problems (use include/select efficiently)
- Ignore the multi-artist pattern (use both primaryArtistIds and featuredArtistIds)

### Security

**DO:**

- Always authenticate API requests
- Use role-based authorization
- Validate all user inputs with Zod
- Use bcrypt for password hashing
- Implement rate limiting for sensitive endpoints
- Use HTTPS in production

**DON'T:**

- Trust user input without validation
- Store passwords in plain text
- Expose sensitive data in API responses
- Skip authorization checks
- Return detailed error messages to clients (leak implementation details)

### Performance

**DO:**

- Use server components when possible
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize images (use Next.js Image component)
- Use dynamic imports for large components
- Implement loading states for async operations

**DON'T:**

- Fetch all data at once without pagination
- Create unnecessary client components
- Load large libraries in client components
- Skip loading states (causes poor UX)
- Over-fetch data (select only needed fields)

## Key Patterns to Follow

### 1. Multi-Artist Track Pattern

**Always handle multiple artists:**

```typescript
const track = await prisma.track.create({
  data: {
    title: 'Song Title',
    primaryArtistIds: [artist1.id, artist2.id],
    featuredArtistIds: [artist3.id],
    artistId: artist1.id, // Legacy field
  },
});
```

### 2. Analytics Event Pattern

**Track user interactions:**

```typescript
await prisma.playEvent.create({
  data: {
    trackId: track.id,
    userId: session.user.id,
    source: 'playlist',
    sourceId: playlistId,
    completionPercentage: 85,
    playedAt: new Date(),
  },
});
```

### 3. Service Layer Pattern

**Use services for shared logic:**

```typescript
// API Route
import { searchTracks } from '@/lib/services/music-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  const tracks = await searchTracks({ query, limit: 20 });
  return NextResponse.json(tracks);
}
```

### 4. Custom Hook Pattern

**Encapsulate data fetching and state:**

```typescript
export function useArtistProfile() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    /* ... */
  };
  const updateProfile = async data => {
    /* ... */
  };

  return { profile, loading, fetchProfile, updateProfile };
}
```

### 5. Timeline Feed Pattern

**Use feed cache for performance:**

```typescript
// Check feed cache first
const cachedPosts = await prisma.timelineFeedCache.findMany({
  where: {
    userId,
    expiresAt: { gt: new Date() },
  },
  orderBy: { position: 'asc' },
});

if (cachedPosts.length > 0) {
  return cachedPosts.map(cache => cache.post);
}

// Generate new feed if cache expired
const posts = await generateTimelineFeed(userId);
```

## Getting Help

### Documentation Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [HeroUI Documentation](https://www.heroui.com)
- [Anthropic Claude API](https://docs.anthropic.com)

### Debugging

**Enable Prisma logging:**

```typescript
// In .env
DATABASE_LOG_LEVEL = info;

// Prisma will log queries in development
```

**Check API logs:**

```typescript
console.error('Error details:', {
  error: error.message,
  userId: session?.user?.id,
  timestamp: new Date().toISOString(),
});
```

**Use Next.js debugging:**

```bash
# Run with debug mode
NODE_OPTIONS='--inspect' yarn dev
```

## Summary

This is a well-architected, production-ready codebase with:

- Type-safe throughout with TypeScript
- Clean separation of concerns (services, components, hooks)
- Comprehensive authentication and authorization
- AI-first design with LangChain integration
- Advanced music player with queue management
- Social features with timeline and engagement
- Strong emphasis on testing and code quality
- Performance optimizations (caching, image optimization)

**When in doubt:**

1. Look at existing patterns in the codebase
2. Use the service layer for business logic
3. Follow TypeScript best practices
4. Write tests for new features
5. Run `yarn check-all` before committing
6. Ask for clarification rather than assuming

---

_Last Updated: 2026-01-15_
