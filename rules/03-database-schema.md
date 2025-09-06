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
