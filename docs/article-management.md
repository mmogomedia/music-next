# Article Management System

Flemoji's article management system provides a full hub-and-spoke SEO content cluster structure for music education content. Articles are managed by admins through a WYSIWYG editor, auto-published to the timeline as `NEWS_ARTICLE` posts, have standalone public SEO pages, and are semantically indexed with pgvector for AI-powered search.

---

## Architecture Overview

```
Admin WYSIWYG Editor (TipTap)
         │
         ▼
  ArticleManagement UI ──► /api/admin/articles
         │                        │
         │                        ▼
         │              article-service.ts
         │               ┌────────┴────────┐
         │               ▼                 ▼
         │         prisma.article    prisma.timelinePost
         │               │
         │               ▼ (on publish)
         │         enqueueArticleEmbedding()
         │               │
         │               ▼
         │         OpenAI text-embedding-3-small
         │               │
         │               ▼
         │         articles.embedding (pgvector)
         │
         ▼
  /articles/[slug]  ◄───  AI chat (searchArticlesTool)
  (public SEO page)         │
                            ▼
                   searchArticlesBySemantic()
```

### Hub-and-Spoke Clustering

Each `ArticleCluster` is a topic hub. Articles within a cluster are either:

- **PILLAR** — the comprehensive main article on the topic (one per cluster)
- **SPOKE** — focused sub-articles exploring specific aspects

On `/articles/[slug]`, the sidebar shows the full cluster with PILLAR at the top and all SPOKEs listed below, highlighting the current article.

---

## Data Models

### `ArticleCluster`

| Field            | Type            | Description                                 |
| ---------------- | --------------- | ------------------------------------------- |
| `id`             | `String`        | CUID primary key                            |
| `name`           | `String`        | Display name (e.g. "Music Royalties Guide") |
| `slug`           | `String`        | URL-safe unique slug                        |
| `description`    | `String?`       | Optional summary                            |
| `coverImageUrl`  | `String?`       | Cluster cover image                         |
| `targetKeywords` | `String[]`      | SEO keyword targets                         |
| `status`         | `ArticleStatus` | DRAFT \| PUBLISHED \| ARCHIVED              |
| `articles`       | `Article[]`     | All articles in this cluster                |

### `Article`

| Field                | Type            | Description                                      |
| -------------------- | --------------- | ------------------------------------------------ |
| `id`                 | `String`        | CUID primary key                                 |
| `title`              | `String`        | Article title                                    |
| `slug`               | `String`        | URL-safe unique slug (auto-generated from title) |
| `body`               | `String` (Text) | Markdown content                                 |
| `excerpt`            | `String?`       | Short description for previews / meta            |
| `coverImageUrl`      | `String?`       | OG image / page banner                           |
| `seoTitle`           | `String?`       | `<title>` override (defaults to `title`)         |
| `metaDescription`    | `String?`       | Meta description (max 160 chars)                 |
| `targetKeywords`     | `String[]`      | SEO keyword targets                              |
| `clusterId`          | `String?`       | FK to ArticleCluster                             |
| `clusterRole`        | `ClusterRole`   | PILLAR \| SPOKE                                  |
| `readTime`           | `Int`           | Auto-calculated minutes (~200 wpm)               |
| `status`             | `ArticleStatus` | DRAFT \| PUBLISHED \| ARCHIVED                   |
| `publishedAt`        | `DateTime?`     | Set when first published                         |
| `authorId`           | `String`        | FK to User                                       |
| `timelinePostId`     | `String?`       | FK to auto-created TimelinePost                  |
| `embedding`          | `vector(1536)?` | OpenAI text-embedding-3-small                    |
| `embeddingUpdatedAt` | `DateTime?`     | When embedding was last generated                |

### Enums

```prisma
enum ArticleStatus { DRAFT  PUBLISHED  ARCHIVED }
enum ClusterRole   { PILLAR  SPOKE }
```

---

## Service Layer (`src/lib/services/article-service.ts`)

### Pure Utilities

#### `slugify(text: string): string`

Converts a title to a URL-safe slug: lowercased, special chars stripped, spaces replaced with hyphens, max 80 chars.

```typescript
slugify('Music Royalties: A Complete Guide'); // → 'music-royalties-a-complete-guide'
```

#### `calculateReadTime(markdown: string): number`

Estimates reading time in minutes based on a ~200 wpm rate (minimum 1 minute).

```typescript
calculateReadTime(body); // → 4  (for ~800 word article)
```

### Cluster CRUD

```typescript
getClusters(): Promise<ClusterWithCount[]>
createCluster(data: CreateClusterInput): Promise<ArticleCluster>
updateCluster(id: string, data: Partial<CreateClusterInput>): Promise<ArticleCluster>
deleteCluster(id: string): Promise<void>
// throws { statusCode: 409 } if cluster has articles
```

### Article CRUD

```typescript
getArticles(opts: GetArticlesOptions): Promise<{ articles, total, page, pages }>
getArticleById(id: string): Promise<Article>
getArticleBySlug(slug: string): Promise<ArticleWithCluster>
createArticle(data: CreateArticleInput, authorId: string): Promise<Article>
updateArticle(id: string, data: Partial<CreateArticleInput>): Promise<Article>
```

#### `GetArticlesOptions`

| Field       | Type                                   | Default | Description                                |
| ----------- | -------------------------------------- | ------- | ------------------------------------------ |
| `status`    | `'DRAFT' \| 'PUBLISHED' \| 'ARCHIVED'` | —       | Filter by status                           |
| `clusterId` | `string`                               | —       | Filter by cluster                          |
| `page`      | `number`                               | `1`     | Pagination page                            |
| `limit`     | `number`                               | `20`    | Items per page                             |
| `search`    | `string`                               | —       | Search in title/excerpt (case-insensitive) |

### Publish Flow

```typescript
publishArticle(id: string, adminUserId: string): Promise<Article>
```

**Steps:**

1. Fetch article (throws if not found or already published)
2. Calculate `readTime` from `article.body`
3. Create `TimelinePost` with:
   - `postType: 'NEWS_ARTICLE'`, `authorType: 'ADMIN'`
   - `content: { articleId, slug, readTime: '${n} min read', isInternal: true }`
4. Update article: `status → PUBLISHED`, `publishedAt`, `readTime`, `timelinePostId`
5. Fire-and-forget: generate OpenAI embedding → store in `articles.embedding`

The embedding step is non-blocking — the article is published regardless of embedding success.

### Semantic Search

```typescript
searchArticlesBySemantic(
  query: string,
  options?: { limit?: number; minSimilarity?: number }
): Promise<Article[]>
```

Embeds the query using `text-embedding-3-small` then finds the nearest published articles by cosine similarity (`<=>` operator). Results with `similarity < minSimilarity` (default 0.25) are filtered out.

**Returns** articles sorted by descending similarity with fields: `id`, `title`, `slug`, `excerpt`, `coverImageUrl`, `readTime`, `publishedAt`, `clusterRole`, `cluster`.

---

## API Reference

### Admin Routes (require `ADMIN` role)

#### `GET /api/admin/articles`

Returns paginated article list (includes cluster and author info).

**Query params:** `status`, `clusterId`, `page`, `limit`, `search`

**Response:**

```json
{
  "articles": [...],
  "total": 12,
  "page": 1,
  "pages": 1
}
```

#### `POST /api/admin/articles`

Creates a new draft article. Slug is auto-generated from title if omitted.

**Body (Zod validated):**

```json
{
  "title": "How CAPASSO Works",
  "body": "# Introduction\n\n...",
  "excerpt": "A guide to CAPASSO royalties",
  "coverImageUrl": "https://...",
  "seoTitle": "CAPASSO Explained",
  "metaDescription": "...",
  "targetKeywords": ["CAPASSO", "royalties"],
  "clusterId": "cluster-cuid",
  "clusterRole": "SPOKE"
}
```

**Response:** `201 { article }`

#### `GET /api/admin/articles/[id]`

Returns single article with cluster and author.

#### `PATCH /api/admin/articles/[id]`

Partial update. All fields optional.

#### `DELETE /api/admin/articles/[id]`

Archives the article (sets `status: 'ARCHIVED'`). Non-destructive.

#### `POST /api/admin/articles/[id]/publish`

Publishes the article. Creates a `TimelinePost` automatically and triggers embedding.

**Error responses:**

- `409` if article is already published
- `404` if article not found

#### `GET /api/admin/clusters`

Returns all clusters with article counts.

#### `POST /api/admin/clusters`

Creates a new cluster. Slug auto-generated from name if omitted.

#### `GET /api/admin/clusters/[id]`

Returns single cluster.

#### `PATCH /api/admin/clusters/[id]`

Partial update.

#### `DELETE /api/admin/clusters/[id]`

Deletes cluster. Returns `409` if articles exist within the cluster.

---

### Public Routes (no authentication required)

#### `GET /api/articles`

Returns published articles without their body content.

**Query params:** `clusterId`, `page`, `limit`, `search`

#### `GET /api/articles/[slug]`

Returns a full published article including `body`, `author`, and `cluster.articles` (all PUBLISHED cluster siblings, ordered PILLAR first).

Returns `404` for unpublished or non-existent articles.

---

## Public Article Pages

### `src/app/articles/[slug]/page.tsx`

Server component with:

- `generateMetadata()` — sets `<title>`, `<meta name="description">`, Open Graph, Twitter Card, and `rel="canonical"` from article SEO fields
- Full-width cover image banner
- `ReactMarkdown` + `remark-gfm` body (GFM tables, checklists, autolinks)
- `@tailwindcss/typography` `prose` class for body styling (dark mode via `dark:prose-invert`)
- Cluster sidebar (sticky, shows PILLAR + all SPOKEs, highlights current article)
- CTA block linking back to the main app

---

## Admin UI

### Accessing the Admin UI

Navigate to `/admin/dashboard/content` (requires ADMIN role). The page shows two tabs:

1. **Articles** — table with title, cluster, role badge, status badge, read time, publish date, and actions (Edit / Publish / Archive)
2. **Clusters** — card grid with name, article count, status, Edit and Delete actions

### Creating an Article

1. Click **New Article**
2. Fill in Title (required) — slug auto-generates
3. Add Excerpt, Cover Image URL, Cluster assignment and Role
4. Fill in SEO Title and Meta Description (160-char counter)
5. Add Target Keywords (type + Enter, click × to remove)
6. Write content in the **TipTap WYSIWYG editor**
7. Click **Save Draft** or **Publish**

### WYSIWYG Editor Toolbar

| Button       | Action                                                |
| ------------ | ----------------------------------------------------- |
| **B**        | Bold                                                  |
| _I_          | Italic                                                |
| H1 / H2 / H3 | Headings                                              |
| • —          | Bullet list                                           |
| 1. —         | Ordered list                                          |
| `</>`        | Inline code                                           |
| "            | Blockquote                                            |
| —            | Horizontal rule                                       |
| 🖼           | Upload image (uses `/api/upload/image`, stores in R2) |

Content is stored as Markdown. Images inserted via the editor are uploaded to R2 and embedded as `![](url)` nodes.

### Publishing

Click **Publish** in the article form, or click the ✓ icon in the articles table for a DRAFT article.

On publish:

- A `TimelinePost` with `postType: NEWS_ARTICLE` is created and appears in the social timeline
- The article's `status` changes to `PUBLISHED`
- An OpenAI embedding is queued in the background for semantic search

---

## AI Integration

### `search_articles` Tool

Registered in `src/lib/ai/tools/article-tools.ts` and exported from `src/lib/ai/tools/index.ts`.

**Trigger keywords:** royalties, CAPASSO, SAMRO, streaming income, music rights, distribution, ISRC, metadata, how to get paid

**Schema:**

```typescript
{
  query: string,  // The topic or question
  limit?: number  // Default 5
}
```

**Returns:**

```json
{
  "articles": [
    {
      "id": "...",
      "title": "How CAPASSO Works",
      "slug": "how-capasso-works",
      "excerpt": "...",
      "readTime": 4,
      "url": "/articles/how-capasso-works",
      "cluster": "Music Royalties Guide"
    }
  ],
  "count": 3
}
```

### HelpAgent Integration

`HelpAgent` (`src/lib/ai/agents/help-agent.ts`) automatically invokes `searchArticlesTool` when it detects music business/industry questions (royalties, CAPASSO, SAMRO, ISRC, distribution, etc.) and returns relevant article links in the response.

---

## Timeline Integration

When an article is published, it creates a `TimelinePost` with:

```json
{
  "postType": "NEWS_ARTICLE",
  "content": {
    "articleId": "...",
    "slug": "how-capasso-works",
    "readTime": "4 min read",
    "isInternal": true
  }
}
```

`NewsArticleRenderer` reads `content.isInternal`:

- `true` → uses `<Link href="/articles/[slug]">` (client-side navigation)
- `false` / absent → uses `<a href target="_blank">` (external link)

This is fully backwards-compatible — old timeline posts without `isInternal` continue to render as external links.

---

## Semantic Embeddings

### How it works

On publish, `buildArticleEmbeddingText()` constructs a rich plain-text string:

```
{title} {excerpt} Topics: {keywords}. {first 1500 chars of body (markdown stripped)}
```

This is passed to OpenAI's `text-embedding-3-small` model (1536 dimensions) and stored in `articles.embedding` via raw SQL (pgvector `::vector(1536)` cast).

A HNSW index (`articles_embedding_hnsw_idx`) is created on the column for fast approximate nearest-neighbour search.

### Search query flow

```
user query string
     │
     ▼
embedText(query)  →  1536-dim query vector
     │
     ▼
SELECT id, 1 - (embedding <=> queryVec) AS similarity
FROM articles WHERE embedding IS NOT NULL AND status = 'PUBLISHED'
ORDER BY embedding <=> queryVec LIMIT 50
     │
     ▼
filter(similarity >= 0.25).slice(0, limit)
     │
     ▼
prisma.article.findMany({ where: { id: { in: ids } } })
     │
     ▼
sort by descending similarity
```

---

## Types (`src/types/articles.ts`)

```typescript
ArticleCluster; // Base cluster type
ClusterWithCount; // Cluster + _count.articles
Article; // Base article type
ArticleWithCluster; // Article + cluster (with articles[]) + author
CreateArticleInput; // Input for create/update
CreateClusterInput; // Input for cluster create/update
```

---

## Environment Variables

| Variable                    | Required                    | Description                      |
| --------------------------- | --------------------------- | -------------------------------- |
| `OPENAI_API_KEY`            | For embeddings              | Used by `text-embedding-3-small` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | For image uploads in editor | Base URL for R2 public bucket    |

---

## Testing

Run all tests: `yarn test`
Run with coverage: `yarn test:coverage`

Test files are colocated in `__tests__/` subdirectories next to the source files they test.

Key test files:

- `src/lib/services/__tests__/article-service.test.ts` — unit tests for service functions
- `src/app/api/admin/articles/__tests__/route.test.ts` — admin articles API
- `src/app/api/admin/articles/[id]/__tests__/route.test.ts` — single article admin API
- `src/app/api/admin/articles/[id]/publish/__tests__/route.test.ts` — publish endpoint
- `src/app/api/admin/clusters/__tests__/route.test.ts` — cluster admin API
- `src/app/api/articles/__tests__/route.test.ts` — public articles API
- `src/lib/ai/tools/__tests__/article-tools.test.ts` — AI search tool
