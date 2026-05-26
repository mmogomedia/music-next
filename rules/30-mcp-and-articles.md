# MCP Capability & Article System

This guide describes two tightly-related parts of Flemoji: the **article
system** (the content Flemoji publishes) and the **MCP capability** (the
authenticated surface that lets an external control plane — Picasite — manage
that content over the Model Context Protocol). It is the source of truth that
Flemoji's own `docs_*` MCP tools serve, so it is kept truthful to the shipped
code.

## Overview

Picasite is a separate CMS being built into a control plane that manages
external websites over MCP. Flemoji is the first managed site. Flemoji exposes
an MCP server so Picasite can read Flemoji's docs to ground itself, then create,
schedule, and publish articles (with hero and social images), while both sides
keep a 1:1 state mirror via a change webhook. Picasite performs all AI
generation (article text, hero image, social images) and pushes the finished
assets to Flemoji; Flemoji owns storage, scheduling, publishing, and change
events.

## The Article System

### The `Article` model

Articles are long-form, SEO-oriented content stored in the `Article` Prisma
model (`prisma/schema.prisma`). Key fields:

- `id`, `title`, `slug` (`@unique`) — slug is auto-derived from the title via
  `slugify()` when not supplied.
- `body` (`Text`, markdown), `excerpt`, `coverImageUrl` (an R2 key/URL).
- SEO fields: `seoTitle`, `metaDescription`, `targetKeywords[]`,
  `primaryKeyword`.
- Content-graph fields: `internalLinks[]` (slugs to cross-link),
  `toolSlugs[]` (interactive tools embedded below the body), `ctaText`,
  `ctaLink`.
- Clustering: `clusterId` + `clusterRole` (`PILLAR` | `SPOKE`).
- `readTime` — auto-computed from the body word count.
- `status` — `ArticleStatus` (`DRAFT` | `PUBLISHED` | `ARCHIVED`, default
  `DRAFT`), and `publishedAt`.
- `scheduledAt` — when an article is queued to auto-publish (MCP scheduling).
- `socialImages` (`Json`) — an array of `{ platform, key, url, alt? }` for
  ingested social-card images (MCP ingest).
- `embedding` — a pgvector `vector(1536)` used for semantic search, refreshed
  asynchronously after publish.
- `authorId`, `timelinePostId` (`@unique`), `createdAt`, `updatedAt`.

### Statuses

- **DRAFT** — created but not public; the default for new articles.
- **PUBLISHED** — live; has a `publishedAt` and a linked timeline post.
- **ARCHIVED** — soft-deleted; hidden from public listings.

### Clusters

`ArticleCluster` groups related articles around a topic for SEO. A cluster
carries its own `name`, `slug`, `description`/`about`/`goal`, keyword sets
(`primaryKeywords`, `secondaryKeywords`, `longTailKeywords`), `audience`, and
`status`. Each article references at most one cluster and plays a `clusterRole`
of `PILLAR` (the hub article) or `SPOKE` (a supporting article).

### Versioning

Every save through `updateArticle()` (when a `savedById` is supplied) first
snapshots the current article state into `ArticleVersion` with an
auto-incrementing per-article `version` number. History is capped at the most
recent **50** versions (`VERSION_LIMIT`); older snapshots are pruned. Any prior
version can be restored via `restoreArticleVersion()`, which itself snapshots
the current state before applying the older content.

### Publishing → TimelinePost + embedding

`publishArticle()` (`src/lib/services/article-service.ts`) performs the publish
side-effects atomically from the caller's perspective:

1. Rejects an already-published article with a `409` error.
2. Recomputes `readTime`.
3. Creates a linked `TimelinePost` of type `NEWS_ARTICLE` (author type
   `ADMIN`), carrying the article's title, excerpt, cover image, and a
   `content` payload (`articleId`, `slug`, `readTime`, `isInternal: true`).
4. Updates the article to `PUBLISHED`, sets `publishedAt`, and links
   `timelinePostId`.
5. Fires a fire-and-forget embedding refresh (`enqueueArticleEmbedding`) so the
   article becomes semantically searchable.

### Admin API routes

The article system is exposed to the Flemoji admin UI under
`src/app/api/admin/articles/`, all gated on `session.user.role === 'ADMIN'`:

- `route.ts` — `GET` (paginated list with status/cluster filters + search),
  `POST` (create; Zod-validated; auto-slugify).
- `[id]/route.ts` — `GET`, `PATCH` (partial update, snapshots a version when
  `savedById` is given), `DELETE` (soft-delete → `ARCHIVED`, or hard-delete
  with the `x-hard-delete: 1` header).
- `[id]/publish/route.ts` — `POST` (runs `publishArticle()`).
- `ai-generate/route.ts` — SSE; Azure OpenAI tool-use; generates article text
  only.

## The MCP Capability

The MCP server lets Picasite operate the article system programmatically over
the Model Context Protocol, governed by a fixed **Interface Contract v1**
(`src/lib/mcp/contract.ts`). Tool names and I/O shapes are contractual.

### Connecting (OAuth 2.1, one-click)

Picasite connects with MCP OAuth 2.1, exactly like adding an MCP server in
Claude:

- Discovery documents are served at `/.well-known/oauth-protected-resource`
  and `/.well-known/oauth-authorization-server`.
- The server supports Dynamic Client Registration (RFC 7591) and the
  Authorization Code + PKCE flow, with a consent/authorize screen backed by
  Flemoji's existing NextAuth login.
- Tokens are **scoped**, **revocable**, **rate-limited**, and **audit-logged**.
  The recognised scopes are `docs:read`, `articles:read`, and
  `articles:write`.
- A **static-token fallback** (an admin-minted scoped token) is available for
  non-OAuth clients.

Every tool call passes through `wrapTool`, which enforces per-client rate
limiting, scope checks, error mapping, and audit logging uniformly.

### Tool surface

**Docs tools** (scope `docs:read`) — let a client ground itself in this
documentation:

- `docs_overview()` → `{ sections: [{ id, title, summary }] }`
- `docs_search({ query })` → `{ hits: [{ id, title, snippet, score }] }`
- `docs_get_guide({ id })` → `{ id, title, markdown }`

**Article tools** (scope `articles:read` / `articles:write`) — map the
contract's canonical article shape onto the `Article` model (e.g.
`coverImageKey` ↔ `coverImageUrl`, `keywords[]` ↔ `targetKeywords[]`):

- `list_articles({ status?, page?, q? })` →
  `{ articles: [ArticleSummary], total, page, pages }`
- `get_article({ id?, slug? })` → the full article plus a per-field `hashes`
  map (sha256 of each canonical field's normalized value) and a combined
  `contentHash`, for sync and optimistic concurrency.
- `create_article({ ...canonical fields })` → `{ id, contentHash }`
- `update_article({ id, patch, baseHash? })` → `{ id, contentHash }`. When
  `baseHash` no longer matches the current `contentHash`, the call fails with a
  `conflict` (409-style) error carrying the current field hashes.
- `delete_article({ id, hard? })` → `{ id, status }` (soft-delete to
  `ARCHIVED` by default; `hard: true` removes the row).

**Image ingest** (scope `articles:write`):

- `ingest_image({ bytesBase64? | url?, kind: "hero" | "social", alt? })` →
  `{ key, url }`. Stores the image into R2 and returns the stored key and
  public URL. A `hero` image becomes the article's `coverImageKey`; `social`
  images attach to `socialImages[]`.

**Scheduling & publishing** (scope `articles:write`) — Flemoji owns scheduling:

- `set_schedule({ id, scheduledAt | null })` → `{ id, scheduledAt }`. A cron
  route publishes due articles through the existing publish path.
- `publish_article({ id })` → `{ id, status, publishedAt }`. Runs the same
  `publishArticle()` side-effects (TimelinePost + embedding) as the admin
  publish route.

### Contract v2 — clusters, full fields, self-description & planning

The MCP negotiates its contract via the `x-contract-version` header, which
accepts **`1` or `2`**. v1 clients are unaffected; a client that sends `2` gets
the additional surface below. v2 adds the scopes `clusters:read` and
`clusters:write`.

**Self-description (scope `docs:read`)** — the one call that teaches an AI the
whole system:

- `describe_article_system()` → a structured manifest generated from the live
  schema + tools registry (so it can't drift): every `Article` and
  `ArticleCluster` field with its type, whether it is `ai`-writable / `derived` /
  `managed`, a description, and its column mapping; the pillar/spoke methodology;
  internal-linking and SEO keyword-tier rules; the publish pipeline; the
  embeddable tools catalog; worked example cluster plans; and constraints.
- `list_tools_catalog()` → `{ tools: [{ slug, name, category, description }] }` —
  the interactive tools an article may embed via `toolSlugs[]`.
- `search_articles({ query, limit? })` → semantic (pgvector) search over existing
  articles. (`articles:read`)
- `suggest_internal_links({ id? | draftBody?, limit? })` → scored sibling-article
  suggestions for wiring `internalLinks[]`. (`articles:read`)

**Cluster tools** — full CRUD over `ArticleCluster`, mapping a canonical cluster
shape (`coverImageKey` ↔ `coverImageUrl`; `targetKeywords` is a derived,
read-only combined list):

- `list_clusters({ status?, q? })` → `{ clusters: [ClusterSummary] }` (`clusters:read`)
- `get_cluster({ id?, slug? })` → the cluster plus its `members[]`
  (`{ articleId, slug, title, clusterRole, status }`) and per-field `hashes` +
  `contentHash`. (`clusters:read`)
- `create_cluster(...)` / `update_cluster({ id, patch, baseHash? })` /
  `delete_cluster({ id })` (`clusters:write`). `update_cluster` honors optimistic
  concurrency (409 on `baseHash` mismatch); `delete_cluster` unassigns member
  articles (never hard-deletes them).

**Full-field articles (v2)** — under contract v2 the article tools read and write
every ai-writable field: `primaryKeyword`, `internalLinks[]`, `toolSlugs[]`,
`ctaText`, `ctaLink`, `clusterId`, `clusterRole` (in addition to the v1 fields).
Per-field hashing covers this extended set for v2 clients while v1 hashes are
preserved unchanged.

**Content planning (`articles:write` + `clusters:write`)** — plan and create a
whole topic cluster in one go:

- `validate_content_plan({ cluster?, articles: [DraftArticle], links? })` →
  `{ ok, issues: [{ level, code, message, path? }], normalized? }` — a dry-run
  (no writes) that checks slug collisions, internal-link resolution, exactly one
  `PILLAR` per cluster, required fields, `toolSlugs` existence, and schedule
  sanity.
- `apply_content_plan({ cluster?, articles, links? })` →
  `{ clusterId?, articles: [{ id, slug, contentHash }], created, updated }` —
  validates first (writes nothing on any `error`), then upserts the cluster +
  articles by slug, wiring `clusterId`/`clusterRole`/`internalLinks` and
  schedules, emitting the appropriate webhooks.

### Change webhook (Flemoji → Picasite)

On article create/update/publish/delete, Flemoji POSTs an HMAC-signed body to
the registered client's webhook URL so Picasite's mirror stays in sync:

```
{ siteId, event: "article.created|updated|published|deleted",
  articleId, slug, contentHash, changedFields: [...], at }
```

The signature is computed with the client's shared secret and sent in the
`X-Flemoji-Signature` header. `contentHash` and `changedFields` are computed
consistently with `get_article`'s per-field hashing so both sides can detect
exactly which canonical fields changed.

Under contract v2, cluster changes emit the same signed envelope shape with
`event: "cluster.created|updated|deleted"` and `clusterId`/`slug`/`contentHash`/
`changedFields`, so a cluster-aware mirror stays 1:1 as well.
