# Flemoji MCP v2 — Full Article-System Self-Description & Content Planning

> **For the Claude/AI session implementing this:** Implement this document
> **exactly**. It is self-contained. Work on the **`develop`** branch only
> (music-next/Flemoji rule: never `main`, never ad-hoc branches; base a feature
> branch off `develop` and target `develop` in PRs). Do not commit unless the
> user explicitly asks. This builds **on top of the already-shipped MCP v1**
> (`src/lib/mcp/**`, `src/app/api/mcp/**`) — extend it, do not rewrite it.

## Why this exists

The shipped MCP (v1) exposes a deliberately thin slice of Flemoji's article
system: 12 canonical article fields + a flat list/get/create/update/delete/
publish + image ingest + scheduling. It does **not** model **clusters**, the
**pillar/spoke** SEO methodology, internal-linking, keyword tiers, embeddable
tools, or several article fields — and it does not *describe itself* in a way an
AI can reason about.

The goal of v2 is: **any MCP client (Picasite, Claude, any AI chat) can connect,
ask one question, and understand Flemoji's entire article system well enough to
plan and create complete, correct content** — a full topic cluster (one pillar +
several spokes), internally linked, keyword-tiered, scheduled, and published —
without a human pre-explaining the model. The MCP becomes **self-describing +
fully CRUD-capable + plan-aware**.

This is governed by **Interface Contract v2** (below). Picasite's half is built
to the same contract (see Picasite's `plans/flemoji-mcp-v2-content-planning.md`).
Implement Flemoji's side to match it **exactly**.

---

## Interface Contract v2 (DO NOT DEVIATE)

- **Versioning:** keep the `x-contract-version` header. The MCP route MUST accept
  **`1` AND `2`** (v1 clients keep working unchanged). When a client sends `2`,
  the v2 tools + extended fields are available; when `1`, behave exactly as today.
  Reject any other value with a clear error. Advertise `2` as the current version
  from `describe_article_system` and the discovery docs.
- **Auth / security:** unchanged transport (Streamable-HTTP) + OAuth 2.1 + static
  token. Add scopes **`clusters:read`**, **`clusters:write`** (and keep
  `docs:read`, `articles:read`, `articles:write`). Every tool stays scope-checked,
  rate-limited, audited (`McpAuditLog`).

### Canonical Article shape — v2 (full coverage)
Extend the v1 canonical shape (`src/lib/mcp/contract.ts`) with every remaining
AI-relevant `Article` column. Each field is tagged **writable** = `ai`
(client may set), `derived` (computed by Flemoji, read-only), or `managed`
(set only by lifecycle ops, read-only):

| canonical field | ↔ Article column | writable | notes |
|---|---|---|---|
| title, slug, body, excerpt, seoTitle, metaDescription | same | ai | v1 |
| keywords[] | targetKeywords[] | ai | v1 |
| coverImageKey | coverImageUrl | ai | v1 |
| socialImages[] | socialImages (Json) | ai | v1 |
| scheduledAt, status, publishedAt | same | ai/managed | v1 (publishedAt managed) |
| **primaryKeyword** | primaryKeyword | ai | the single most important SEO keyword |
| **internalLinks[]** | internalLinks[] | ai | **slugs** of sibling articles to cross-link |
| **toolSlugs[]** | toolSlugs[] | ai | embeddable tool slugs (see `list_tools_catalog`) |
| **ctaText, ctaLink** | ctaText, ctaLink | ai | custom CTA |
| **clusterId** | clusterId | ai | parent cluster (nullable) |
| **clusterRole** | clusterRole | ai | `PILLAR` \| `SPOKE` (default SPOKE) |
| **readTime** | readTime | derived | auto-computed; read-only |
| **id, createdAt, updatedAt** | same | derived | read-only |

`get_article` returns all of these plus the per-field `hashes` + `contentHash`
(extend `CANONICAL_ARTICLE_FIELDS` to include the new **ai-writable** fields so
hashing/concurrency cover them; do NOT hash derived/managed fields).

### Canonical Cluster shape — v2 (new)
Map onto `ArticleCluster`: `id, name, slug, description, about, goal,
coverImageKey (↔coverImageUrl), primaryKeywords[], secondaryKeywords[],
longTailKeywords[], targetKeywords[] (derived/combined, read-only), audience,
status, createdAt, updatedAt`. `get_cluster` also returns
`members: [{ articleId, slug, title, clusterRole, status }]`.

### New MCP tools Flemoji MUST expose (names + I/O are contractual)
**Clusters** (scopes as noted):
- `list_clusters({ status?, q? })` → `{ clusters: [ClusterSummary] }` — `clusters:read`
- `get_cluster({ id?, slug? })` → `Cluster` with `members[]` + per-field `hashes` — `clusters:read`
- `create_cluster({ ...canonical cluster fields })` → `{ id, contentHash }` — `clusters:write`
- `update_cluster({ id, patch, baseHash? })` → `{ id, contentHash }` (optimistic concurrency → 409 with current hashes) — `clusters:write`
- `delete_cluster({ id })` → `{ id, status }` (unassigns members; never hard-deletes articles) — `clusters:write`

**System self-description (the centerpiece — `docs:read`):**
- `describe_article_system()` → a single structured, machine-readable manifest
  (shape below) that fully explains the content model + methodology + taxonomy +
  worked examples. This is the one call an AI makes to "understand everything."
- `list_tools_catalog()` → `{ tools: [{ slug, name, category, description }] }` —
  the embeddable `toolSlugs` an article may reference (from
  `@/lib/tools/registry` `getAllTools()`).
- `validate_content_plan({ cluster?, articles: [DraftArticle], links? })` →
  `{ ok, issues: [{ level:"error"|"warn", code, message, path }], normalized }` —
  a **dry-run** validator (no writes): slug collisions, internal-link targets
  resolve, exactly one PILLAR per cluster, spokes reference the pillar, required
  fields present, keyword coverage, scheduledAt sanity. Lets an AI plan with
  confidence before writing.
- `suggest_internal_links({ id? | draftBody?, limit? })` →
  `{ suggestions: [{ slug, title, score, reason }] }` — semantic suggestions via
  `searchArticlesBySemantic` (pgvector) — `articles:read`.
- `search_articles({ query, limit? })` → `{ hits: [ArticleSummary + score] }` —
  semantic search over existing articles — `articles:read`.

**Plan execution (transactional — `clusters:write` + `articles:write`):**
- `apply_content_plan({ cluster?, articles: [CanonicalArticle], links? })` →
  `{ clusterId?, articles: [{ id, slug, contentHash }], created:[ids], updated:[ids] }`
  — creates/updates a whole cluster + pillar + spokes + internal links + schedules
  in ONE call. Idempotent by slug (create if new, update if slug exists, honoring
  `baseHash` when supplied). Runs the same validation as `validate_content_plan`
  first and aborts atomically on any `error` (Prisma `$transaction`). Emits the
  appropriate webhooks per affected entity.

**Article tools (v2 extension):** `create_article`/`update_article`/`get_article`/
`list_articles` accept & return the new canonical fields above; `get_article`'s
`hashes` cover the extended ai-writable set.

### `describe_article_system()` output (contractual shape)
```jsonc
{
  "contractVersion": 2,
  "entities": {
    "article": {
      "fields": [{ "name","type","required","writable","enum?","description","mapsTo" }],
      "lifecycle": { "statuses": ["DRAFT","PUBLISHED","ARCHIVED"],
        "publish": "status→PUBLISHED, publishedAt=now, creates NEWS_ARTICLE TimelinePost, enqueues pgvector embedding",
        "scheduling": "set scheduledAt; a daily cron auto-publishes due articles",
        "versioning": "every update snapshots an ArticleVersion (up to 50)" }
    },
    "cluster": { "fields": [...], "roles": ["PILLAR","SPOKE"],
      "rule": "a cluster has exactly one PILLAR and many SPOKEs" }
  },
  "methodology": {
    "pillarSpoke": "Plain-language explanation of the pillar/spoke model …",
    "internalLinking": "Spokes link up to the pillar and laterally to siblings via internalLinks[] (slugs) …",
    "seoKeywordTiers": { "primaryKeyword": "...", "primaryKeywords": "...", "secondaryKeywords": "...", "longTailKeywords": "..." },
    "embeddableTools": "Articles may embed interactive tools by toolSlugs[] — see list_tools_catalog",
    "ctas": "Optional ctaText/ctaLink override the default CTA"
  },
  "taxonomy": { "articleStatuses": [...], "clusterRoles": [...], "tools": [ /* list_tools_catalog */ ] },
  "examples": [{
    "description": "A 1-pillar + 4-spoke cluster on 'Music distribution for SA artists'",
    "plan": { "cluster": { ... }, "articles": [ { "clusterRole":"PILLAR", ... }, { "clusterRole":"SPOKE", "internalLinks":["pillar-slug"], ... } ] }
  }],
  "constraints": ["slug unique", "internalLinks must resolve to existing slugs", "exactly one PILLAR per cluster", "toolSlugs must exist in catalog"],
  "tools": [{ "name","scopes","risk":"read|write","description","inputSchema" }]
}
```

### Change webhook v2 (Flemoji → Picasite)
Keep v1 article events; ADD cluster + membership events so the mirror stays 1:1:
`cluster.created|updated|deleted`, and on article cluster membership change emit
`article.updated` with `clusterId`/`clusterRole` in `changedFields`. Same
HMAC `X-Flemoji-Signature` + `{ siteId, event, <id>, slug?, contentHash,
changedFields, at }` envelope. Per-registered-client `webhookUrl`.

---

## What already exists in Flemoji (reuse — do NOT rebuild)
- **MCP v1**: `src/lib/mcp/{contract,crypto,auth}.ts`, `src/lib/mcp/tools/{types,docs,articles,images,scheduling}.ts`, `src/lib/mcp/{articles-service,webhook}.ts`, `src/app/api/mcp/route.ts` (+ `oauth/*`, `.well-known/*`). Extend these.
- **Cluster CRUD** (reuse): `src/lib/services/article-service.ts` → `getClusters`, `getClusterById`, `createCluster`, `updateCluster`, `deleteCluster`, `slugify`, `calculateReadTime`, `enqueueArticleEmbedding`, `searchArticlesBySemantic`.
- **Tools registry**: `src/lib/tools/registry.ts` → `getAllTools()`, `getToolBySlug()`, `getToolsByCategory()` (source for `list_tools_catalog`/`toolSlugs`).
- **Schema** (no new article/cluster columns needed — all fields already exist): `Article` (primaryKeyword, internalLinks[], toolSlugs[], ctaText, ctaLink, clusterId, clusterRole, readTime, scheduledAt, socialImages, embedding…) and `ArticleCluster` (description, about, goal, primary/secondary/longTail keywords, audience, status).
- **Docs index**: `scripts/generate-mcp-docs-index.mjs` + `src/lib/mcp/tools/docs.ts` + `rules/30-mcp-and-articles.md`.

## What's missing (this plan adds it)
Cluster tools, full-field article coverage, `describe_article_system`,
`list_tools_catalog`, `validate_content_plan`, `suggest_internal_links`,
`search_articles`, `apply_content_plan`, the two new scopes, v2 contract
negotiation, and cluster webhooks. **No DB migration required** (fields exist) —
unless you choose to add a `clusters:*`-only audit nuance.

---

## Phases

### V2-0 — Contract & negotiation
- In `contract.ts`: add `MCP_CONTRACT_VERSIONS = [1,2]`, extend `MCP_SCOPES` with `clusters:read`/`clusters:write`, extend the canonical article schema with the new ai-writable fields, add `CANONICAL_ARTICLE_FIELDS_V2`, add cluster Zod schemas + `DraftArticle`/`ContentPlan`/`ValidationResult`/`DescribeSystem` schemas. Keep v1 exports intact.
- In `route.ts`: accept header `1` or `2`; thread the negotiated version into `McpToolContext`; only register v2 tools when version=2. **Verify:** v1 inspector still works; v2 client sees the new tools.

### V2-1 — Cluster tools
- New `src/lib/mcp/cluster-service.ts` (mirror `articles-service.ts`): map `ArticleCluster`↔canonical, per-field hashing, reuse `getClusters/createCluster/updateCluster/deleteCluster`, emit cluster webhooks. New `src/lib/mcp/tools/clusters.ts` exporting `registerClusterTools` (list/get/create/update/delete). Register in `route.ts`. **Verify:** create→get(members)→update(stale baseHash→409)→list.

### V2-2 — Full-field article coverage
- Extend `articles-service.ts` mapping (`mapArticleToCanonical`/`canonicalToArticleData`) + tool schemas to read/write primaryKeyword, internalLinks, toolSlugs, ctaText, ctaLink, clusterId, clusterRole. Hash the extended ai-writable set. **Verify:** create an article with clusterId+internalLinks+toolSlugs; get_article returns them; contentHash stable across re-reads.

### V2-3 — Self-description & planning-support tools
- `src/lib/mcp/system-manifest.ts` builds the `describe_article_system` payload **from the contract + registry at runtime** (so it can't drift): field tables from the Zod schemas, taxonomy from enums, `tools` from the registered tool set, `embeddableTools` from `getAllTools()`, plus the hand-written `methodology`/`examples` (keep these in one well-commented constant). Implement `describe_article_system`, `list_tools_catalog`, `search_articles` (via `searchArticlesBySemantic`), `suggest_internal_links`. New `src/lib/mcp/tools/system.ts`. **Verify:** `describe_article_system()` returns every Article+Cluster field with correct `writable` tags and a runnable example plan; `suggest_internal_links` returns scored slugs.

### V2-4 — Validation & transactional plan apply
- `validate_content_plan` (pure, no writes) in a new `src/lib/mcp/plan-service.ts`; `apply_content_plan` runs validation then a Prisma `$transaction` creating/updating cluster + articles + links + schedule, idempotent by slug, honoring `baseHash`, emitting webhooks after commit. New `src/lib/mcp/tools/plan.ts`. **Verify:** a full 1-pillar+3-spoke plan applies atomically; re-applying is a no-op/update; an invalid plan (dangling internal link, two pillars) is rejected with precise issues and writes nothing.

### V2-5 — Docs + cluster webhooks
- Update `rules/30-mcp-and-articles.md` to describe clusters + the full model + v2 tools (so `docs_*` stays truthful). Add cluster events to `webhook.ts`. Regenerate the docs index. **Verify:** `docs_search("cluster")` returns the updated guide; editing a cluster emits a signed `cluster.updated` webhook.

---

## Guardrails
- Branch **`develop`** only; extend v1 (never break it); reuse `article-service`/`registry`/`searchArticlesBySemantic` — do not duplicate business logic. No destructive schema changes (all columns already exist).
- Keep tool names + I/O **exactly** as in Contract v2. Scope, rate-limit, and audit every tool. `describe_article_system` must be generated from the live schema/registry so docs can't drift from reality.
- `apply_content_plan` must be atomic (transaction) and idempotent; never partially apply.

## End-to-end verification
1. A fresh AI client sends `x-contract-version: 2`, calls `describe_article_system()` once, and can enumerate the full model (clusters, pillar/spoke, all fields, linking, keyword tiers, toolSlugs, publish pipeline).
2. It drafts a cluster plan, `validate_content_plan` passes, `apply_content_plan` creates the pillar + spokes with internal links + schedule atomically.
3. `get_cluster` shows the pillar + spokes; `get_article` shows internalLinks/toolSlugs/clusterRole with stable hashes.
4. Cron publishes a scheduled spoke → `article.published` webhook; editing the cluster → `cluster.updated` webhook. v1 clients continue to work throughout.
