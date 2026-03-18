# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Flemoji is a Next.js-based music streaming platform built with TypeScript, featuring artist profiles, track management, playlist curation, smart links, and AI-powered music discovery.

## Common Commands

### Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

### Code Quality

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check formatting
yarn format:check

# Type checking
yarn typecheck

# Run all checks at once
yarn check-all

# Fix linting and formatting
yarn fix-all
```

### Database Management

```bash
# Generate Prisma client
yarn prisma:generate

# Run database migrations
yarn prisma:migrate

# Push schema to database (dev only)
yarn db:push

# Open Prisma Studio
yarn db:studio

# Seed database
yarn db:seed

# Create admin account
yarn create-admin

# Setup database
yarn setup-db
```

### Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate test coverage
yarn test:coverage
```

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials + OAuth
- **Styling**: Tailwind CSS + HeroUI component library
- **File Storage**: Cloudflare R2 (S3-compatible)
- **AI/LLM**: LangChain with Anthropic, OpenAI, and Google Gemini
- **Real-time**: Ably for live updates

### Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Auth route group (login, register)
│   ├── (chat)/       # AI chat interface
│   ├── (classic)/    # Classic UI routes
│   ├── admin/        # Admin dashboard
│   ├── artist/       # Artist-specific routes
│   ├── dashboard/    # User/artist dashboards
│   ├── profile/      # Profile creation/management
│   └── api/          # API route handlers
├── components/       # React components
│   ├── ai/           # AI-related components
│   ├── artist/       # Artist profile components
│   ├── auth/         # Authentication components
│   ├── dashboard/    # Dashboard components
│   ├── landing/      # Landing page components
│   ├── music/        # Music player components
│   ├── track/        # Track management components
│   └── ui/           # Reusable UI components
├── lib/              # Utility libraries
│   ├── ai/           # AI/LLM utilities
│   ├── services/     # Business logic services
│   ├── utils/        # Helper functions
│   └── validations/  # Zod validation schemas
├── hooks/            # Custom React hooks
├── contexts/         # React Context providers
└── types/            # TypeScript type definitions
```

### Key Architectural Patterns

#### Centralized API Client

The codebase uses a centralized API client (`src/lib/api-client.ts`) for all HTTP requests:

- **Never use direct `fetch()` calls** - always use the API client
- Provides automatic authentication, error handling, and timeout management
- Organized by feature area: `api.playlists.*`, `api.admin.*`, `api.upload.*`

**Example:**

```typescript
import { api } from '@/lib/api-client';

// Instead of fetch()
const playlists = await api.playlists.getTopTen();
const newPlaylist = await api.admin.createPlaylist(data);
```

#### Authentication & Authorization

- NextAuth.js handles authentication with session-based auth
- Three user roles: `USER`, `ARTIST`, `ADMIN`
- Middleware (`middleware.ts`) enforces route-based access control
- Admin login credentials (dev): `dev@dev.com` / `dev`

#### Database Schema Key Concepts

- **User Model**: Base user with role-based access
- **ArtistProfile Model**: Separate from User, supports unclaimed profiles
- **Track Model**: Multi-artist support with `primaryArtistIds` and `featuredArtistIds` arrays
- **Event Models**: Separate tables for plays, likes, shares, downloads (analytics)
- **Aggregated Stats**: Daily/Weekly/Monthly/Yearly stats tables for performance
- **Genre & Skill Taxonomy**: Hierarchical genre system and artist skills

#### File Storage Pattern

- Files stored in Cloudflare R2 (S3-compatible)
- **Store file keys (paths) in database, not full URLs**
- Use `constructFileUrl()` from `src/lib/url-utils.ts` to build display URLs
- Centralized image upload utility: `uploadImageToR2()` from `src/lib/image-upload.ts`

**Example:**

```typescript
import { uploadImageToR2 } from '@/lib/image-upload';
import { constructFileUrl } from '@/lib/url-utils';

// Upload and store key
const imageKey = await uploadImageToR2(file);
await prisma.track.create({ data: { coverImageUrl: imageKey } });

// Display URL construction
const displayUrl = constructFileUrl(imageKey);
```

## Development Rules & Guidelines

### Code Style & Standards

- TypeScript strict mode is enabled - all code must be fully typed
- ESLint + Prettier enforce code quality and formatting
- **Never use `console.log()`** - only `console.warn()` and `console.error()` are allowed
- Component-based architecture with React hooks (no class components)
- Prefer server components over client components where possible

### Design System

- **No gradients** - use solid colors only
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance required
- HeroUI components for consistent UI
- Tailwind CSS utility classes for styling
- Import paths use `@/*` alias for `src/*`

### Database Best Practices

- Always use Prisma Client for database operations
- Use transactions for multi-step operations
- Leverage Prisma's relation loading to prevent N+1 queries
- Index frequently queried fields (already defined in schema)
- Use `.env.local` for database URLs (never commit secrets)

### API Development

- API routes in `src/app/api/`
- Use centralized error handling from `src/lib/api-error-handler.ts`
- Validate all inputs with Zod schemas from `src/lib/validations/`
- Return consistent response format: `{ data, success, error, status }`
- Implement rate limiting for public endpoints

### Testing Approach

- Jest + React Testing Library for unit/integration tests
- Test files: `*.test.ts` or `*.test.tsx` or in `__tests__/` directories
- Focus on business logic and critical user flows
- Mock external services (S3, email, etc.)

## Important Implementation Notes

### Multi-Artist Track System

Tracks support multiple artists via array fields:

- `primaryArtistIds`: Ordered array of main artists
- `featuredArtistIds`: Featured/collaborating artists
- Legacy `artist` and `artistProfileId` fields maintained for backward compatibility

### Playlist Management

- Dynamic playlist system with `PlaylistTypeDefinition` model
- Types: GENRE, FEATURED, TOP_TEN, PROVINCE
- Submission workflow: PENDING → APPROVED/REJECTED/SHORTLISTED
- Admin-managed with role-based access

### Analytics & Event Tracking

- Separate event tables for granular tracking (plays, likes, shares, downloads)
- Background jobs aggregate events into stats tables
- AI search events tracked separately with conversation context
- All events capture session, source, and user agent data

### AI Features

- Conversational music discovery using LangChain
- Multi-model support (Anthropic, OpenAI, Google)
- Conversation memory and preference tracking
- AI search events update track `aiSearchCount`

### Role-Based Redirect System

- Admin users bypass profile creation, go directly to `/admin/dashboard`
- Regular users go through profile selection/creation flow
- Middleware enforces role-based route access

## Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 (S3-compatible)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_ENDPOINT="..."
R2_PUBLIC_URL="..."

# AI/LLM (optional)
ANTHROPIC_API_KEY="..."
OPENAI_API_KEY="..."
GOOGLE_API_KEY="..."

# Email (Resend)
RESEND_API_KEY="..."

# Stripe (optional, for premium features)
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
```

## Working with Rules

This codebase has extensive documentation in the `rules/` directory:

- **rules/README.md**: Development phases overview
- **rules/00-ui-design-system.md**: Complete design system and UI guidelines
- **rules/25-api-client-and-utilities.md**: API client architecture and usage
- **rules/02-authentication-setup.md**: Auth implementation details
- **rules/12-admin-dashboard.md**: Admin features and workflows

When implementing features, always check if relevant rules exist in `rules/`.

## Common Patterns

### Creating a New API Route

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your logic here
    const data = await prisma.model.findMany();

    return NextResponse.json({ data, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
```

### Using the API Client in Components

```typescript
'use client';

import { api } from '@/lib/api-client';
import { useState, useEffect } from 'react';

export default function ExampleComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.playlists.getTopTen();
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Render logic
}
```

### Database Queries with Relations

```typescript
import { prisma } from '@/lib/db';

// Efficient query with relations
const track = await prisma.track.findUnique({
  where: { id: trackId },
  include: {
    user: { select: { name: true, email: true } },
    playEvents: {
      where: { timestamp: { gte: last7Days } },
      orderBy: { timestamp: 'desc' },
    },
  },
});
```

## Troubleshooting

### Database Issues

- Run `yarn prisma:generate` after schema changes
- Use `yarn db:push` in development for quick schema updates
- Use `yarn prisma:migrate` for production-ready migrations
- Check `.env.local` for correct `DATABASE_URL`

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma client: `yarn prisma:generate`
- Check for TypeScript errors: `yarn typecheck`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set in `.env.local`
- Check `NEXTAUTH_URL` matches your development URL
- Admin account may need to be created: `yarn create-admin`

## Performance Considerations

- Use Next.js Image component for all images
- Implement pagination for large data sets
- Use React Server Components for data fetching when possible
- Leverage Prisma's connection pooling
- Stats aggregation runs as background jobs (see `src/lib/aggregation-jobs.ts`)
- Consider caching strategies for frequently accessed data
