# Timeline Feature Specification

## Overview

A **standalone** social media-style timeline feature that displays music posts from artists, news articles from admins and publishers, advertisements, featured content, release promotions, and video content. This will be a separate page/route (e.g., `/timeline` or `/feed`) with its own interface, real-time updates, filtering capabilities, and mobile-first design.

**Note**: This is a standalone feature on its own page, separate from the existing chat interface.

## Table of Contents

1. [Best Practices](#best-practices)
2. [Content Types](#content-types)
3. [Database Schema](#database-schema)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Real-Time Implementation](#real-time-implementation)
6. [UI/UX Design](#uiux-design)
7. [Implementation Plan](#implementation-plan)
8. [API Endpoints](#api-endpoints)
9. [Security & Performance](#security--performance)

---

## Best Practices

### Social Media Timeline Best Practices

Based on industry standards from Twitter, Instagram, Facebook, and TikTok:

1. **Feed Ranking Algorithm**
   - **Relevance Score**: Combine engagement (likes, comments, shares), recency, and user preferences
   - **Personalization**: Weight content from followed artists/publishers higher
   - **Diversity**: Ensure mix of content types (not all music, not all news)
   - **Quality Signals**: Boost content with high engagement rates, not just raw counts

2. **Infinite Scroll**
   - Load 20-30 items initially
   - Load next batch when user scrolls to 80% of current content
   - Implement virtual scrolling for performance (react-window or similar)
   - Cache loaded items to prevent re-fetching

3. **Real-Time Updates**
   - Use Server-Sent Events (SSE) for new posts (already implemented pattern in codebase)
   - Polling fallback for browsers that don't support SSE
   - Debounce updates to prevent UI flicker
   - Show "New posts available" banner instead of auto-inserting

4. **Content Moderation**
   - Pre-moderate all posts before appearing in timeline
   - Flag system for user-reported content
   - Admin review queue for flagged content
   - Shadow-banning for repeat offenders

5. **Performance Optimization**
   - Lazy load images and videos
   - Progressive image loading (blur-up technique)
   - Code splitting for different renderers
   - Memoization of expensive computations
   - Database indexing on frequently queried fields

6. **Mobile-First Considerations**
   - Touch-friendly interactions (swipe actions)
   - Optimized image sizes for mobile networks
   - Bottom sheet modals for actions
   - Pull-to-refresh functionality
   - Sticky header with filters

---

## Content Types

### 1. Music Post (`music_post`)

- **Source**: Logged-in artists
- **Content**: Track preview, artwork, description, release info
- **Actions**: Play, Like, Share, Comment, Add to Playlist, View Artist
- **Metadata**: Genre, BPM, Release date, Featured artists

### 1a. Song (`song`)

- **Source**: Logged-in artists
- **Content**: Song URL (external streaming link), artwork, description, song title
- **Actions**: Play (via songURL), Like, Share, Comment, Add to Playlist, View Artist
- **Metadata**: Song URL, Artist name, Genre, Duration, Release date
- **Note**: Similar to music_post but uses external songURL instead of internal track

### 2. News Article (`news_article`)

- **Source**: Admins and users with publishing profiles
- **Content**: Title, excerpt, featured image, full article link
- **Actions**: Read more, Share, Bookmark, Comment
- **Metadata**: Category, Tags, Author, Publish date

### 3. Advertisement (`advertisement`)

- **Source**: Admin-managed campaigns
- **Content**: Banner image/video, CTA button, target URL
- **Actions**: Click-through, Dismiss, Report
- **Metadata**: Campaign ID, Target audience, Impressions, Clicks

### 4. Featured Content (`featured_content`)

- **Source**: Admin-curated
- **Content**: Playlist, Album, Artist spotlight, Event promotion
- **Actions**: View, Play, Follow, Share
- **Metadata**: Featured until date, Priority level

### 5. Release Promotion (`release_promo`)

- **Source**: Artists (pre-release or new release)
- **Content**: Album/EP artwork, tracklist preview, pre-save links
- **Actions**: Pre-save, Share, Set Reminder, View Details
- **Metadata**: Release date, Pre-order availability, Streaming links

### 6. Video Content (`video_content`)

- **Source**: Artists, Publishers, Admins
- **Content**: Video player, thumbnail, description
- **Actions**: Play, Like, Comment, Share, Save
- **Metadata**: Duration, Video type (music video, interview, behind-the-scenes)

### 7. Event Announcement (`event_announcement`) [Suggested]

- **Source**: Artists, Event organizers
- **Content**: Event poster, date/time, venue, ticket link
- **Actions**: Get Tickets, Share, Set Reminder, Add to Calendar
- **Metadata**: Event date, Location, Ticket availability

### 8. Poll/Question (`poll`) [Suggested]

- **Source**: Artists, Publishers
- **Content**: Question, multiple choice options, live results
- **Actions**: Vote, Share, View Results
- **Metadata**: End date, Vote count, Results visibility

---

## Database Schema

### Core Tables

#### `timeline_posts`

Main table for all timeline entries (polymorphic design)

```prisma
model TimelinePost {
  id              String    @id @default(cuid())
  postType        PostType  // music_post, news_article, ad, featured_content, release_promo, video_content, event, poll
  authorId        String    // User ID (artist, admin, publisher)
  authorType      AuthorType @default(ARTIST) // ARTIST, ADMIN, PUBLISHER

  // Polymorphic content (JSONB for flexibility)
  content         Json      // Type-specific content structure

  // Common fields
  title           String?
  description     String?
  coverImageUrl   String?
  videoUrl        String?

  // Engagement metrics
  likeCount       Int       @default(0)
  commentCount    Int       @default(0)
  shareCount      Int       @default(0)
  viewCount       Int       @default(0)

  // Status & moderation
  status          PostStatus @default(DRAFT) // DRAFT, PENDING, PUBLISHED, ARCHIVED, FLAGGED
  isPinned        Boolean   @default(false)
  isFeatured      Boolean   @default(false)
  featuredUntil   DateTime?

  // Scheduling
  publishedAt     DateTime?
  scheduledFor    DateTime?
  expiresAt       DateTime?

  // Ranking
  relevanceScore  Float     @default(0.0) // Calculated score for feed ranking
  priority        Int       @default(0) // Higher = more important

  // Relations
  author          User      @relation("TimelinePostAuthor", fields: [authorId], references: [id])
  likes           TimelinePostLike[]
  comments        TimelinePostComment[]
  shares          TimelinePostShare[]
  views           TimelinePostView[]
  tags            TimelinePostTag[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("timeline_posts")
  @@index([postType, status, publishedAt])
  @@index([authorId, status])
  @@index([isFeatured, featuredUntil])
  @@index([relevanceScore])
  @@index([publishedAt])
}

enum PostType {
  MUSIC_POST
  SONG
  NEWS_ARTICLE
  ADVERTISEMENT
  FEATURED_CONTENT
  RELEASE_PROMO
  VIDEO_CONTENT
  EVENT_ANNOUNCEMENT
  POLL
}

enum AuthorType {
  ARTIST
  ADMIN
  PUBLISHER
}

enum PostStatus {
  DRAFT
  PENDING
  PUBLISHED
  ARCHIVED
  FLAGGED
  DELETED
}
```

#### `timeline_post_likes`

Track user likes on posts

```prisma
model TimelinePostLike {
  id        String       @id @default(cuid())
  postId    String
  userId    String
  post      TimelinePost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User         @relation("TimelinePostLikes", fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime     @default(now())

  @@unique([postId, userId])
  @@map("timeline_post_likes")
  @@index([postId])
  @@index([userId])
}
```

#### `timeline_post_comments`

Nested comments on posts

```prisma
model TimelinePostComment {
  id            String                @id @default(cuid())
  postId        String
  userId        String
  parentId      String? // For nested replies
  content       String
  isEdited      Boolean               @default(false)
  editedAt      DateTime?
  likeCount     Int                   @default(0)

  post          TimelinePost          @relation(fields: [postId], references: [id], onDelete: Cascade)
  user          User                  @relation("TimelinePostComments", fields: [userId], references: [id], onDelete: Cascade)
  parent        TimelinePostComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies       TimelinePostComment[] @relation("CommentReplies")
  likes         TimelineCommentLike[]

  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  @@map("timeline_post_comments")
  @@index([postId, createdAt])
  @@index([parentId])
}
```

#### `timeline_post_shares`

Track shares (for analytics and preventing duplicate shares)

```prisma
model TimelinePostShare {
  id        String       @id @default(cuid())
  postId    String
  userId    String
  platform  String?      // internal, twitter, facebook, etc.
  post      TimelinePost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User         @relation("TimelinePostShares", fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime     @default(now())

  @@map("timeline_post_shares")
  @@index([postId])
  @@index([userId])
}
```

#### `timeline_post_views`

Track views for analytics (optional, can be aggregated)

```prisma
model TimelinePostView {
  id        String       @id @default(cuid())
  postId    String
  userId    String?
  post      TimelinePost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User?        @relation("TimelinePostViews", fields: [userId], references: [id], onDelete: SetNull)
  viewedAt  DateTime     @default(now())

  @@map("timeline_post_views")
  @@index([postId, viewedAt])
}
```

#### `timeline_post_tags`

Tags for filtering and discovery

```prisma
model TimelinePostTag {
  id        String       @id @default(cuid())
  postId    String
  tag       String       // e.g., "amapiano", "news", "exclusive"
  post      TimelinePost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, tag])
  @@map("timeline_post_tags")
  @@index([tag])
}
```

#### `timeline_follows`

Follow relationships (artists, publishers)

```prisma
model TimelineFollow {
  id          String   @id @default(cuid())
  followerId  String   // User following
  followingId String   // User/Artist being followed
  createdAt   DateTime @default(now())

  follower    User     @relation("TimelineFollows", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("TimelineFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("timeline_follows")
  @@index([followerId])
  @@index([followingId])
}
```

#### `timeline_feed_cache`

Pre-computed feed for users (optional optimization)

```prisma
model TimelineFeedCache {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  score     Float    // Relevance score for this user
  position  Int      // Position in feed
  cachedAt  DateTime @default(now())
  expiresAt DateTime // When to refresh this entry

  user      User     @relation("TimelineFeedCache", fields: [userId], references: [id], onDelete: Cascade)
  post      TimelinePost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("timeline_feed_cache")
  @@index([userId, score, cachedAt])
  @@index([expiresAt])
}
```

#### `timeline_ads`

Advertisement campaigns

```prisma
model TimelineAd {
  id              String   @id @default(cuid())
  campaignId      String
  title           String
  description     String?
  imageUrl        String?
  videoUrl        String?
  ctaText         String
  ctaUrl          String
  targetAudience  Json?    // Targeting criteria (age, location, interests)
  budget          Float?
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean  @default(true)

  posts           TimelinePost[] // Ads are also timeline posts

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("timeline_ads")
  @@index([isActive, startDate, endDate])
}
```

### User Model Extensions

Add to existing `User` model:

```prisma
model User {
  // ... existing fields ...

  timelinePosts        TimelinePost[]          @relation("TimelinePostAuthor")
  timelinePostLikes    TimelinePostLike[]      @relation("TimelinePostLikes")
  timelinePostComments TimelinePostComment[]    @relation("TimelinePostComments")
  timelinePostShares   TimelinePostShare[]     @relation("TimelinePostShares")
  timelinePostViews    TimelinePostView[]      @relation("TimelinePostViews")
  timelineFollows      TimelineFollow[]        @relation("TimelineFollows")
  timelineFollowing    TimelineFollow[]        @relation("TimelineFollowing")
  timelineFeedCache    TimelineFeedCache[]     @relation("TimelineFeedCache")

  canPublishNews       Boolean                 @default(false) // For publishers
}
```

---

## Architecture & Design Patterns

### Renderer Pattern (Similar to AI Response Renderers)

Following the existing pattern in `src/components/ai/response-renderers/`:

#### Structure

```
src/app/timeline/
├── page.tsx                        # Main timeline page route
└── components/
    └── TimelinePage.tsx            # Page component

src/components/timeline/
├── TimelineContainer.tsx          # Main container (like ResponseRenderer)
├── TimelineRenderer.tsx            # Registry-based renderer switcher
├── renderers/
│   ├── index.tsx                  # Registry and main renderer
│   ├── music-post-renderer.tsx
│   ├── news-article-renderer.tsx
│   ├── advertisement-renderer.tsx
│   ├── featured-content-renderer.tsx
│   ├── release-promo-renderer.tsx
│   ├── video-content-renderer.tsx
│   ├── event-announcement-renderer.tsx
│   └── poll-renderer.tsx
├── components/
│   ├── TimelinePostCard.tsx      # Base card component
│   ├── PostActions.tsx            # Like, Comment, Share buttons
│   ├── CommentSection.tsx         # Comments UI
│   ├── PostHeader.tsx              # Author info, timestamp
│   └── PostFooter.tsx              # Actions footer
└── hooks/
    ├── useTimelineFeed.ts          # Fetch and manage feed
    ├── useTimelineRealtime.ts      # SSE connection for updates
    ├── usePostInteractions.ts      # Like, comment, share
    └── useInfiniteScroll.ts        # Infinite scroll logic
```

#### Timeline Registry Pattern

```typescript
// src/lib/timeline/timeline-registry.ts
export interface TimelinePostHandler<T extends TimelinePost> {
  component: React.ComponentType<TimelinePostRendererProps<T>>;
  schema: z.ZodSchema;
  metadata: {
    description: string;
    category: string;
    priority: number;
  };
}

class TimelinePostRegistry {
  private handlers = new Map<PostType, TimelinePostHandler<any>>();

  register<T extends TimelinePost>(
    postType: PostType,
    handler: TimelinePostHandler<T>
  ): void {
    this.handlers.set(postType, handler);
  }

  get(postType: PostType): TimelinePostHandler<any> | undefined {
    return this.handlers.get(postType);
  }

  isRegistered(postType: PostType): boolean {
    return this.handlers.has(postType);
  }
}

export const timelineRegistry = new TimelinePostRegistry();
```

#### Example Renderers

```typescript
// src/components/timeline/renderers/music-post-renderer.tsx
interface MusicPostRendererProps {
  post: TimelinePost & { content: MusicPostContent };
  onPlay?: (trackId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function MusicPostRenderer({
  post,
  onPlay,
  onLike,
  onComment,
  onShare,
}: MusicPostRendererProps) {
  const { track, description, releaseInfo } = post.content;

  return (
    <TimelinePostCard post={post}>
      <PostHeader author={post.author} timestamp={post.publishedAt} />
      <div className="music-post-content">
        <TrackPreview track={track} onPlay={onPlay} />
        {description && <p>{description}</p>}
        {releaseInfo && <ReleaseInfo info={releaseInfo} />}
      </div>
      <PostFooter
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </TimelinePostCard>
  );
}

// src/components/timeline/renderers/song-renderer.tsx
interface SongRendererProps {
  post: TimelinePost & { content: SongContent; songUrl: string };
  onPlay?: (songUrl: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function SongRenderer({
  post,
  onPlay,
  onLike,
  onComment,
  onShare,
}: SongRendererProps) {
  const { songTitle, artistName, description, artwork, genre, duration } = post.content;

  return (
    <TimelinePostCard post={post}>
      <PostHeader author={post.author} timestamp={post.publishedAt} />
      <div className="song-content">
        <SongPreview
          songUrl={post.songUrl}
          title={songTitle}
          artist={artistName}
          artwork={artwork}
          genre={genre}
          duration={duration}
          onPlay={onPlay}
        />
        {description && <p>{description}</p>}
      </div>
      <PostFooter
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />
    </TimelinePostCard>
  );
}
```

### Service Layer Pattern

```typescript
// src/lib/services/timeline-service.ts
export class TimelineService {
  static async getFeed(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      filters?: PostType[];
      sortBy?: 'relevance' | 'recent' | 'trending';
    }
  ): Promise<{ posts: TimelinePost[]; nextCursor: string | null }> {
    // Fetch and rank posts
  }

  static async createPost(
    authorId: string,
    postType: PostType,
    content: any
  ): Promise<TimelinePost> {
    // Create new post
  }

  static async calculateRelevanceScore(
    post: TimelinePost,
    userId: string
  ): Promise<number> {
    // Calculate relevance based on:
    // - User follows author
    // - Post engagement
    // - Post recency
    // - User preferences
  }
}
```

---

## Real-Time Implementation

### Server-Sent Events (SSE)

Following the existing pattern in `/api/ai/chat/stream` and `/api/dashboard/activity/stream`:

#### API Endpoint

```typescript
// src/app/api/timeline/stream/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      let lastPostId: string | null = null;

      const sendEvent = (data: any) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE event:', error);
        }
      };

      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 30000);

      // Poll for new posts every 5 seconds
      const pollInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const newPosts = await TimelineService.getNewPosts(
            session.user.id,
            lastPostId
          );

          if (newPosts.length > 0) {
            sendEvent({
              type: 'new_posts',
              count: newPosts.length,
              posts: newPosts,
            });
            lastPostId = newPosts[0].id;
          }
        } catch (error) {
          console.error('Error polling for new posts:', error);
        }
      }, 5000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

#### Client Hook

```typescript
// src/hooks/useTimelineRealtime.ts
export function useTimelineRealtime(userId: string) {
  const [newPosts, setNewPosts] = useState<TimelinePost[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/timeline/stream`);

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('new_posts', event => {
      const data = JSON.parse(event.data);
      setNewPosts(prev => [...data.posts, ...prev]);
    });

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return { newPosts, isConnected, clearNewPosts: () => setNewPosts([]) };
}
```

---

## UI/UX Design

### Standalone Page Layout

The timeline will be accessible at `/timeline` or `/feed` route with its own dedicated page layout.

### Mobile-First Layout

```
┌─────────────────────────────┐
│  [← Back] Timeline [Search] │ ← Sticky Header
│  [Filter] [All|Music|News]   │ ← Filter Bar
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 🎵 Music Post         │  │
│  │ Artist Name • 2h      │  │
│  │ [Track Preview]      │  │
│  │ [Like] [Comment] [Share]│
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📰 News Article       │  │
│  │ Publisher • 5h        │  │
│  │ [Article Preview]    │  │
│  │ [Read More] [Share]  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🎬 Video Content     │  │
│  │ Artist • 1d          │  │
│  │ [Video Player]       │  │
│  │ [Like] [Comment]     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📢 Advertisement      │  │
│  │ [Ad Banner]           │  │
│  │ [CTA Button] [Dismiss]│
│  └───────────────────────┘  │
│                             │
│        [Loading...]         │
│                             │
└─────────────────────────────┘
```

### Filter Bar

- **All** | **Music** | **News** | **Videos** | **Featured**
- Sticky at top, swipeable on mobile
- Active filter highlighted
- Count badges for each category

### Search Integration

- Search bar in header
- Search across posts, articles, artists
- Recent searches dropdown
- Search suggestions (autocomplete)

### Navigation & Links

- Standalone page accessible via main navigation (e.g., `/timeline` or `/feed`)
- Optional: "Chat with Artist" button on posts (opens chat interface in separate context)
- Optional: Share posts to chat (if user wants to discuss in chat)

### Standalone Page

- Timeline will be on its own route (e.g., `/timeline` or `/feed`)
- Separate navigation entry in main menu
- Can link to/from chat interface but operates independently
- Optional: Quick access to chat from timeline posts (opens chat in new context)

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

1. **Database Schema**
   - [ ] Create Prisma migration for timeline tables
   - [ ] Add indexes for performance
   - [ ] Seed test data

2. **Core Services**
   - [ ] `TimelineService` - CRUD operations
   - [ ] `TimelineFeedService` - Feed generation and ranking
   - [ ] `TimelineInteractionService` - Likes, comments, shares

3. **Base Components**
   - [ ] `TimelineContainer` - Main container
   - [ ] `TimelinePostCard` - Base card component
   - [ ] `PostHeader` - Author and timestamp
   - [ ] `PostFooter` - Actions

### Phase 2: Renderers (Week 2-3)

1. **Renderer System**
   - [ ] Create timeline registry (similar to response registry)
   - [ ] Implement base renderer interface
   - [ ] Create renderers for each post type:
     - [ ] Music Post Renderer
     - [ ] News Article Renderer
     - [ ] Advertisement Renderer
     - [ ] Featured Content Renderer
     - [ ] Release Promo Renderer
     - [ ] Video Content Renderer

### Phase 3: Real-Time & Interactions (Week 3-4)

1. **Real-Time Updates**
   - [ ] SSE endpoint for new posts
   - [ ] Client hook for SSE connection
   - [ ] "New posts" banner UI

2. **Interactions**
   - [ ] Like/unlike functionality
   - [ ] Comment system (nested comments)
   - [ ] Share functionality
   - [ ] View tracking

### Phase 4: Feed Algorithm & Filtering (Week 4-5)

1. **Feed Ranking**
   - [ ] Relevance score calculation
   - [ ] Personalization based on follows
   - [ ] Engagement-based ranking
   - [ ] Feed cache system (optional)

2. **Filtering**
   - [ ] Filter by post type
   - [ ] Filter by followed users
   - [ ] Sort options (recent, trending, relevance)

### Phase 5: Mobile Optimization (Week 5-6)

1. **Mobile UI**
   - [ ] Responsive layouts
   - [ ] Touch interactions (swipe actions)
   - [ ] Bottom sheet modals
   - [ ] Pull-to-refresh
   - [ ] Infinite scroll optimization

2. **Performance**
   - [ ] Image lazy loading
   - [ ] Virtual scrolling
   - [ ] Code splitting
   - [ ] Memoization

### Phase 6: Page Setup & Navigation (Week 6-7)

1. **Standalone Page**
   - [ ] Create `/timeline` or `/feed` route
   - [ ] Add navigation entry in main menu/sidebar
   - [ ] Set up page layout and structure
   - [ ] Optional: Link to chat from posts (opens chat in separate context)

### Phase 7: Advanced Features (Week 7-8)

1. **Content Creation**
   - [ ] Post creation UI for artists
   - [ ] News article editor for publishers
   - [ ] Video upload
   - [ ] Image upload with cropping

2. **Admin Features**
   - [ ] Ad campaign management
   - [ ] Content moderation queue
   - [ ] Analytics dashboard
   - [ ] Featured content curation

---

## API Endpoints

### Timeline Feed

```
GET /api/timeline/feed
Query params:
  - limit: number (default: 20)
  - cursor: string (pagination)
  - filters: PostType[] (optional)
  - sortBy: 'relevance' | 'recent' | 'trending'
Response: { posts: TimelinePost[], nextCursor: string | null }
```

### Real-Time Stream

```
GET /api/timeline/stream
Response: SSE stream with new posts
```

### Post Operations

```
POST /api/timeline/posts
Body: { postType, content, scheduledFor? }
Response: TimelinePost

GET /api/timeline/posts/:id
Response: TimelinePost

PUT /api/timeline/posts/:id
Body: { content, status? }
Response: TimelinePost

DELETE /api/timeline/posts/:id
Response: { success: boolean }
```

### Interactions

```
POST /api/timeline/posts/:id/like
Response: { liked: boolean, likeCount: number }

POST /api/timeline/posts/:id/comments
Body: { content, parentId? }
Response: TimelinePostComment

POST /api/timeline/posts/:id/share
Body: { platform? }
Response: { success: boolean, shareCount: number }

POST /api/timeline/posts/:id/view
Response: { success: boolean }
```

### Follows

```
POST /api/timeline/follows
Body: { followingId }
Response: { success: boolean }

DELETE /api/timeline/follows/:followingId
Response: { success: boolean }

GET /api/timeline/follows
Response: { following: User[], followers: User[] }
```

### Search

```
GET /api/timeline/search
Query params:
  - q: string (search query)
  - type?: PostType
  - limit?: number
Response: { posts: TimelinePost[], articles: NewsArticle[], artists: Artist[] }
```

---

## Security & Performance

### Security

1. **Authentication & Authorization**
   - All endpoints require authentication
   - Role-based access (artists can only create music posts)
   - Publishers need `canPublishNews` permission
   - Admins can manage all content

2. **Content Moderation**
   - Pre-moderate all posts before publishing
   - Rate limiting on post creation
   - Spam detection (repeated posts)
   - Profanity filtering

3. **Data Validation**
   - Validate all input with Zod schemas
   - Sanitize user-generated content
   - Image/video size limits
   - URL validation for external links

### Performance

1. **Database Optimization**
   - Composite indexes on frequently queried fields
   - Partitioning for large tables (optional)
   - Connection pooling
   - Query optimization (avoid N+1)

2. **Caching Strategy**
   - Redis cache for feed rankings (see Redis Setup section below)
   - CDN for images and videos
   - Client-side caching with SWR/React Query
   - Feed cache table for pre-computed feeds

---

## Redis Setup on Vercel

### Overview

**Important**: Vercel does not provide Redis as a built-in service. You need to use an external Redis provider. The most popular options for Vercel deployments are:

1. **Upstash Redis** (Recommended for Vercel)
   - Serverless Redis with pay-per-use pricing
   - Built-in Vercel integration
   - Free tier available
   - Auto-scaling

2. **Redis Cloud** (Redis Labs)
   - Managed Redis service
   - Fixed pricing tiers
   - High performance

3. **AWS ElastiCache**
   - Enterprise-grade
   - More complex setup
   - Better for high-traffic applications

### Recommended: Upstash Redis

#### Why Upstash?

- **Serverless**: Perfect for Vercel's serverless architecture
- **Vercel Integration**: Native integration with Vercel
- **Free Tier**: 10,000 commands/day free
- **Auto-scaling**: Handles traffic spikes automatically
- **Global**: Low latency worldwide

#### Setup Steps

1. **Create Upstash Account**
   - Go to https://upstash.com/
   - Sign up with GitHub (recommended for Vercel integration)

2. **Create Redis Database**
   - Click "Create Database"
   - Choose "Regional" or "Global" (Global recommended for better latency)
   - Select region closest to your Vercel deployment
   - Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

3. **Add to Vercel Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     ```
     UPSTASH_REDIS_REST_URL=your-rest-url
     UPSTASH_REDIS_REST_TOKEN=your-rest-token
     ```
   - Or use Upstash Vercel Integration (automatic):
     - In Upstash dashboard, go to "Integrations" → "Vercel"
     - Connect your Vercel account
     - Select your project
     - Environment variables will be added automatically

4. **Install Upstash Redis Client**

```bash
yarn add @upstash/redis
```

5. **Create Redis Client**

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Test connection
export async function testRedisConnection() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}
```

6. **Usage Examples**

```typescript
// Cache feed rankings
import { redis } from '@/lib/redis';

// Set cache
await redis.set(
  `timeline:feed:${userId}`,
  JSON.stringify(feedPosts),
  { ex: 300 } // Expire in 5 minutes
);

// Get cache
const cached = await redis.get(`timeline:feed:${userId}`);
if (cached) {
  return JSON.parse(cached as string);
}

// Increment counter (for engagement metrics)
await redis.incr(`timeline:post:${postId}:views`);

// Set with expiration (for rate limiting)
await redis.setex(`rate_limit:${userId}`, 3600, '1');

// Check if exists
const exists = await redis.exists(`timeline:post:${postId}`);
```

### Alternative: Redis Cloud Setup

If you prefer Redis Cloud:

1. **Create Account**
   - Go to https://redis.com/cloud/
   - Sign up and create a database

2. **Get Connection Details**
   - Copy Redis URL (format: `redis://default:password@host:port`)

3. **Add to Vercel**

   ```
   REDIS_URL=redis://default:password@host:port
   ```

4. **Install Redis Client**

```bash
yarn add redis
```

5. **Create Redis Client**

```typescript
// src/lib/redis.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', err => console.error('Redis Client Error', err));

// Connect (call this in your app initialization)
await redisClient.connect();

export { redisClient as redis };
```

**Note**: Redis Cloud requires a persistent connection, which can be challenging with Vercel's serverless functions. Upstash's REST API is better suited for serverless.

### Redis Use Cases for Timeline

1. **Feed Caching**

   ```typescript
   // Cache user's personalized feed
   const cacheKey = `timeline:feed:${userId}:${filters}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const feed = await generateFeed(userId, filters);
   await redis.setex(cacheKey, 300, JSON.stringify(feed)); // 5 min cache
   return feed;
   ```

2. **Relevance Score Caching**

   ```typescript
   // Cache calculated relevance scores
   const scoreKey = `timeline:score:${postId}:${userId}`;
   const cachedScore = await redis.get(scoreKey);
   if (cachedScore) return parseFloat(cachedScore);

   const score = await calculateRelevanceScore(postId, userId);
   await redis.setex(scoreKey, 600, score.toString()); // 10 min cache
   return score;
   ```

3. **Rate Limiting**

   ```typescript
   // Rate limit post creation
   const key = `rate_limit:post:create:${userId}`;
   const count = await redis.incr(key);
   if (count === 1) {
     await redis.expire(key, 3600); // 1 hour window
   }
   if (count > 10) {
     throw new Error('Rate limit exceeded');
   }
   ```

4. **Real-Time Metrics**

   ```typescript
   // Track views in real-time
   await redis.incr(`timeline:post:${postId}:views`);
   await redis.zincrby('timeline:trending', 1, postId);
   ```

5. **Session/State Management**
   ```typescript
   // Store user's filter preferences
   await redis.setex(
     `timeline:prefs:${userId}`,
     86400, // 24 hours
     JSON.stringify({ filters: ['music', 'news'], sortBy: 'recent' })
   );
   ```

### Best Practices

1. **Always Set Expiration**: Use `setex` or `expire` to prevent memory bloat
2. **Use JSON for Complex Data**: Serialize objects before storing
3. **Handle Errors Gracefully**: Redis failures shouldn't break your app
4. **Monitor Usage**: Upstash provides a dashboard for monitoring
5. **Use Appropriate TTLs**:
   - Feed cache: 5-10 minutes
   - Scores: 10-30 minutes
   - Rate limits: 1 hour
   - User preferences: 24 hours

### Environment Variables

Add to `.env.local` (development) and Vercel (production):

```bash
# Upstash Redis (Recommended)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# OR Redis Cloud (Alternative)
REDIS_URL=redis://default:password@host:port
```

### Testing Redis Connection

```typescript
// src/app/api/health/route.ts
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    await redis.ping();
    return Response.json({ redis: 'connected' });
  } catch (error) {
    return Response.json({ redis: 'disconnected' }, { status: 503 });
  }
}
```

3. **Frontend Optimization**
   - Code splitting by renderer type
   - Lazy loading images and videos
   - Virtual scrolling for long feeds
   - Memoization of expensive components
   - Debouncing search and filters

4. **Real-Time Optimization**
   - Batch SSE updates (don't send every single post)
   - Debounce view tracking
   - Aggregate analytics (don't store every view)

---

## Additional Considerations

### Analytics

- Track engagement metrics (likes, comments, shares, views)
- A/B testing for feed algorithms
- User behavior tracking (time spent, scroll depth)
- Content performance analytics

### Accessibility

- ARIA labels for screen readers
- Keyboard navigation
- Focus management
- Color contrast compliance
- Alt text for images

### Internationalization

- Multi-language support for news articles
- Localized date/time formatting
- RTL support for Arabic/Hebrew
- Currency formatting for ads

### Testing

- Unit tests for services
- Integration tests for API endpoints
- E2E tests for timeline interactions
- Performance tests for feed generation
- Load testing for real-time updates

---

## Success Metrics

1. **Engagement**
   - Average likes per post
   - Comment rate
   - Share rate
   - Time spent on timeline

2. **Performance**
   - Feed load time < 1s
   - Time to first post < 500ms
   - Real-time update latency < 5s

3. **User Satisfaction**
   - Daily active users on timeline
   - Return rate
   - Content creation rate (artists posting)

---

## Future Enhancements

1. **AI-Powered Features**
   - Personalized feed recommendations
   - Auto-generated post captions
   - Content suggestions for artists
   - Sentiment analysis for comments

2. **Social Features**
   - Direct messaging between users
   - Story feature (24-hour posts)
   - Live streaming integration
   - Collaborative playlists

3. **Monetization**
   - Sponsored posts
   - Artist promotion tools
   - Premium features (analytics, scheduling)
   - Subscription tiers

---

## References

- Existing codebase patterns:
  - `src/components/ai/response-renderers/` - Renderer pattern
  - `src/app/api/ai/chat/stream/route.ts` - SSE implementation
  - `src/lib/ai/response-registry.ts` - Registry pattern
  - `src/types/ai-responses.ts` - Type definitions

- Industry best practices:
  - Twitter Timeline Algorithm
  - Instagram Feed Ranking
  - Facebook News Feed
  - TikTok For You Page
