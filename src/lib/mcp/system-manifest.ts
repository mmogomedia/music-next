/**
 * `describe_article_system` manifest builder.
 *
 * This is the CENTERPIECE of MCP v2: a single, machine-readable description of
 * Flemoji's entire article system — its data model (articles + clusters), the
 * pillar/spoke SEO methodology, the publish/scheduling/versioning lifecycle, the
 * embeddable-tool catalogue, and a runnable worked example. One AI call to
 * `describe_article_system()` should be enough for any MCP client (Picasite,
 * Claude, any chat) to plan and create complete, correct content without a human
 * pre-explaining the model.
 *
 * GENERATED FROM THE LIVE CONTRACT + REGISTRY so it can never drift:
 *   - field NAMES + enums + required-ness come from the Zod schemas in
 *     `contract.ts` (`ArticleCanonicalV2Schema`, `ClusterCanonicalSchema`) and
 *     the canonical field-order constants (`CANONICAL_ARTICLE_FIELDS_V2`,
 *     `CANONICAL_CLUSTER_FIELDS`).
 *   - the embeddable tool taxonomy comes from `@/lib/tools/registry`
 *     `getAllTools()`.
 *   - the contract version comes from `MCP_CONTRACT_VERSION_LATEST`.
 *
 * Only the per-field human DESCRIPTIONS, the `mapsTo` column hints, the
 * methodology prose, and the worked example are hand-authored — all kept in the
 * well-commented constants below. They are TRUTHFUL to the schema/registry; when
 * a field is added to the contract it shows up here automatically (with a
 * fallback description), and the typed maps below should be updated to describe
 * it properly.
 */

import { z } from 'zod';
import {
  ArticleCanonicalV2Schema,
  ClusterCanonicalSchema,
  ArticleStatusSchema,
  ClusterRoleSchema,
  CANONICAL_ARTICLE_FIELDS_V2,
  CANONICAL_CLUSTER_FIELDS,
  MCP_CONTRACT_VERSION_LATEST,
  type DescribeArticleSystemOutput,
} from './contract';
import { getAllTools } from '@/lib/tools/registry';

// ---------------------------------------------------------------------------
// Field-descriptor shape used in the manifest's `entities.*.fields[]`.
// ---------------------------------------------------------------------------

/**
 * How a field is written:
 *  - `ai`      — the MCP client may set it (create/update/plan).
 *  - `derived` — Flemoji computes it; read-only (e.g. readTime, timestamps).
 *  - `managed` — set only by a lifecycle op (e.g. publishedAt by publish).
 */
type Writable = 'ai' | 'derived' | 'managed';

interface ManifestField {
  /** Canonical field name (matches the contract schema key). */
  name: string;
  /** Coarse type tag for the AI: string | number | boolean | string[] | datetime | object[] | enum. */
  type: string;
  /** Whether a value is required when this field is AI-writable. */
  required: boolean;
  /** Who may write the field. */
  writable: Writable;
  /** Allowed values when the field is an enum. */
  enum?: string[];
  /** Human-readable explanation of the field + how an AI should choose its value. */
  description: string;
  /** The underlying Flemoji column (or "derived"/note) this canonical field maps to. */
  mapsTo: string;
}

// ---------------------------------------------------------------------------
// Hand-authored per-field metadata. Keyed by canonical field name. Kept here
// (not in the schema) so descriptions can be genuinely instructive without
// bloating the contract. KEEP TRUTHFUL to ArticleCanonicalV2Schema / Prisma.
// ---------------------------------------------------------------------------

interface FieldDoc {
  description: string;
  mapsTo: string;
}

/** Article field docs — one entry per name in CANONICAL_ARTICLE_FIELDS_V2 (+ derived/managed). */
const ARTICLE_FIELD_DOCS: Record<string, FieldDoc> = {
  // ── v1 ai-writable core ────────────────────────────────────────────────
  title: {
    description:
      'The article headline. Write it as a clear, specific, keyword-aware title — it drives the slug (when slug is omitted) and the default <title>/SEO title.',
    mapsTo: 'Article.title',
  },
  slug: {
    description:
      'URL-safe identifier, unique across all articles. Omit on create to auto-generate from the title (lowercased, hyphenated). Other articles reference this value in their internalLinks[]. Avoid changing it after publish (breaks links).',
    mapsTo: 'Article.slug',
  },
  body: {
    description:
      'Full article content in Markdown (GFM). This is the substance of the page; readTime is computed from it and it is embedded for semantic search. Use headings, lists, and links; embed tools via toolSlugs[] rather than inline.',
    mapsTo: 'Article.body',
  },
  excerpt: {
    description:
      'Short summary/teaser (1-3 sentences) shown in listings, cards, and link previews. Optional; falls back to the start of the body when blank.',
    mapsTo: 'Article.excerpt',
  },
  seoTitle: {
    description:
      'Optional override for the HTML <title> / search-result title. Keep under ~60 characters and front-load the primaryKeyword. Falls back to title when blank.',
    mapsTo: 'Article.seoTitle',
  },
  metaDescription: {
    description:
      'Optional meta description for search snippets/social previews. Aim for ~150-160 characters, include the primaryKeyword naturally, and make it compelling.',
    mapsTo: 'Article.metaDescription',
  },
  keywords: {
    description:
      'Target keyword phrases this article should rank for (broad set). These feed the embedding/SEO; the single most important one belongs in primaryKeyword.',
    mapsTo: 'Article.targetKeywords[]',
  },
  coverImageKey: {
    description:
      'R2 object key (or URL) of the hero/cover image. Obtain a key by uploading via the ingest_image tool (kind="hero") and pass the returned key here.',
    mapsTo: 'Article.coverImageUrl',
  },
  socialImages: {
    description:
      'Per-platform social share images, each { platform, key, url, alt? }. Generate keys via ingest_image (kind="social"). Optional.',
    mapsTo: 'Article.socialImages (Json)',
  },
  scheduledAt: {
    description:
      'ISO-8601 datetime to auto-publish at, or null for none. A daily cron publishes DRAFT articles whose scheduledAt is due. Set this instead of calling publish when you want future release.',
    mapsTo: 'Article.scheduledAt',
  },
  status: {
    description:
      'Lifecycle state: DRAFT (editable, not public), PUBLISHED (live), ARCHIVED (soft-deleted). Create as DRAFT and publish explicitly (or via scheduledAt); do not set PUBLISHED directly to go live — use the publish op so the timeline post + embedding are created.',
    mapsTo: 'Article.status',
  },
  // ── v2 ai-writable additions ───────────────────────────────────────────
  primaryKeyword: {
    description:
      "The single most important SEO keyword/phrase for this article — the one term you most want it to rank for. Should also appear in keywords[]. For a PILLAR this is the cluster's head term; for a SPOKE it is a specific long-tail variation.",
    mapsTo: 'Article.primaryKeyword',
  },
  internalLinks: {
    description:
      "Slugs of sibling articles to cross-link to. This is how the pillar/spoke graph is wired: every SPOKE should include the PILLAR's slug, and may add lateral links to related spokes. Every slug here MUST resolve to an existing (or co-created) article.",
    mapsTo: 'Article.internalLinks[]',
  },
  toolSlugs: {
    description:
      'Slugs of interactive tools to embed in the article (e.g. "split-sheet", "revenue-predictor"). Each must exist in the tool catalogue — call list_tools_catalog to discover valid slugs and pick ones relevant to the topic.',
    mapsTo: 'Article.toolSlugs[]',
  },
  ctaText: {
    description:
      'Optional custom call-to-action label that overrides the default site CTA. Pair with ctaLink. Use to point readers at a relevant next step (e.g. "Submit your track").',
    mapsTo: 'Article.ctaText',
  },
  ctaLink: {
    description:
      'Optional destination URL/path for the custom CTA. Only used when ctaText is set.',
    mapsTo: 'Article.ctaLink',
  },
  clusterId: {
    description:
      'Id of the parent ArticleCluster this article belongs to, or null for a standalone article. Set this to attach an article to a topic cluster. When planning a whole cluster, create the cluster first (or use apply_content_plan, which wires it for you).',
    mapsTo: 'Article.clusterId',
  },
  clusterRole: {
    description:
      'Role within its cluster: PILLAR (the single comprehensive hub article) or SPOKE (a focused supporting article). Exactly one PILLAR per cluster; everything else is a SPOKE. Defaults to SPOKE.',
    mapsTo: 'Article.clusterRole',
  },
  // ── derived / managed (read-only; not in CANONICAL_ARTICLE_FIELDS_V2) ───
  readTime: {
    description:
      'Estimated reading time in minutes, auto-computed from the body (~200 words/min, min 1). Read-only — never set it.',
    mapsTo: 'Article.readTime (derived)',
  },
  id: {
    description: 'Stable unique identifier assigned by Flemoji. Read-only.',
    mapsTo: 'Article.id (derived)',
  },
  createdAt: {
    description: 'Creation timestamp (ISO-8601). Read-only.',
    mapsTo: 'Article.createdAt (derived)',
  },
  updatedAt: {
    description: 'Last-modified timestamp (ISO-8601). Read-only.',
    mapsTo: 'Article.updatedAt (derived)',
  },
  publishedAt: {
    description:
      'When the article went live (ISO-8601) or null while unpublished. Set automatically by the publish op / scheduled-publish cron — read-only to clients.',
    mapsTo: 'Article.publishedAt (managed by publish)',
  },
};

/** Cluster field docs — one entry per name in CANONICAL_CLUSTER_FIELDS (+ derived). */
const CLUSTER_FIELD_DOCS: Record<string, FieldDoc> = {
  name: {
    description:
      'Human-readable cluster name (the topic theme), e.g. "Music distribution for SA artists". Shown in cluster listings.',
    mapsTo: 'ArticleCluster.name',
  },
  slug: {
    description:
      'URL-safe unique cluster identifier. Omit on create to auto-generate from the name.',
    mapsTo: 'ArticleCluster.slug',
  },
  description: {
    description:
      'Short summary of what the cluster covers. Optional; used in listings and as planning context.',
    mapsTo: 'ArticleCluster.description',
  },
  about: {
    description:
      "Longer narrative describing the cluster's scope and angle. Optional; richer than description.",
    mapsTo: 'ArticleCluster.about',
  },
  goal: {
    description:
      'The business/SEO goal of the cluster (what success looks like, e.g. "rank for distribution head terms and convert to signups"). Optional but valuable planning context.',
    mapsTo: 'ArticleCluster.goal',
  },
  coverImageKey: {
    description:
      'R2 key/URL of the cluster cover image (upload via ingest_image). Optional.',
    mapsTo: 'ArticleCluster.coverImageUrl',
  },
  primaryKeywords: {
    description:
      'Tier-1 head keywords for the cluster — the broad, high-intent terms the PILLAR should target. These anchor the whole cluster.',
    mapsTo: 'ArticleCluster.primaryKeywords[]',
  },
  secondaryKeywords: {
    description:
      'Tier-2 supporting keywords — mid-intent terms the SPOKEs collectively target.',
    mapsTo: 'ArticleCluster.secondaryKeywords[]',
  },
  longTailKeywords: {
    description:
      'Tier-3 long-tail keywords — specific, lower-volume phrases that map well to individual SPOKE articles.',
    mapsTo: 'ArticleCluster.longTailKeywords[]',
  },
  audience: {
    description:
      'Who the cluster is written for (e.g. "independent South African artists releasing their first single"). Optional; steers tone and examples.',
    mapsTo: 'ArticleCluster.audience',
  },
  status: {
    description:
      'Cluster lifecycle state: DRAFT, PUBLISHED, or ARCHIVED. Independent of the statuses of its member articles.',
    mapsTo: 'ArticleCluster.status',
  },
  // ── derived (read-only; not in CANONICAL_CLUSTER_FIELDS) ────────────────
  targetKeywords: {
    description:
      'Combined, de-duplicated keyword set across all three tiers. Read-only — computed by Flemoji.',
    mapsTo: 'ArticleCluster.targetKeywords (derived/combined)',
  },
  id: {
    description: 'Stable unique cluster identifier. Read-only.',
    mapsTo: 'ArticleCluster.id (derived)',
  },
  createdAt: {
    description: 'Creation timestamp (ISO-8601). Read-only.',
    mapsTo: 'ArticleCluster.createdAt (derived)',
  },
  updatedAt: {
    description: 'Last-modified timestamp (ISO-8601). Read-only.',
    mapsTo: 'ArticleCluster.updatedAt (derived)',
  },
};

// ---------------------------------------------------------------------------
// Schema introspection helpers — derive type/required/enum from a Zod object.
// ---------------------------------------------------------------------------

/** Peel optionals/nullables/defaults off a Zod type to reach the inner type. */
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  for (;;) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap() as z.ZodTypeAny;
      continue;
    }
    if (current instanceof z.ZodDefault) {
      current = current._def.innerType as z.ZodTypeAny;
      continue;
    }
    return current;
  }
}

/** True when a value is required (not optional, nullable, or defaulted). */
function isRequired(schema: z.ZodTypeAny): boolean {
  return !(
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  );
}

/**
 * Detect a `z.string().datetime()` schema. In Zod v4 the datetime constraint is
 * recorded as a `format: 'datetime'` on the string's internal definition (and/or
 * on a `string_format` check). We inspect both via a structurally-typed view of
 * `_def` so we don't reach for `any`.
 */
function isDatetimeString(schema: z.ZodString): boolean {
  const def = schema._def as {
    format?: string;
    checks?: Array<{ format?: string; def?: { format?: string } }>;
  };
  if (def.format === 'datetime') return true;
  const checks = def.checks ?? [];
  return checks.some(
    c => c.format === 'datetime' || c.def?.format === 'datetime'
  );
}

/** Coarse type tag + optional enum values for a Zod field. */
function describeType(schema: z.ZodTypeAny): { type: string; enum?: string[] } {
  const inner = unwrap(schema);

  if (inner instanceof z.ZodEnum) {
    return { type: 'enum', enum: inner.options as string[] };
  }
  if (inner instanceof z.ZodArray) {
    const element = unwrap(inner.element as z.ZodTypeAny);
    if (element instanceof z.ZodObject) return { type: 'object[]' };
    if (element instanceof z.ZodEnum) {
      return { type: 'enum[]', enum: element.options as string[] };
    }
    return { type: 'string[]' };
  }
  if (inner instanceof z.ZodNumber) return { type: 'number' };
  if (inner instanceof z.ZodBoolean) return { type: 'boolean' };
  if (inner instanceof z.ZodString) {
    return isDatetimeString(inner) ? { type: 'datetime' } : { type: 'string' };
  }
  return { type: 'string' };
}

/** Look up a field's hand-authored doc, with a safe fallback. */
function docFor(
  name: string,
  docs: Record<string, FieldDoc>,
  entity: string
): FieldDoc {
  return (
    docs[name] ?? {
      description: `${entity} field "${name}".`,
      mapsTo: `${entity}.${name}`,
    }
  );
}

/**
 * Build a ManifestField from a schema field, with an explicit `writable`
 * override (the schema can't express ai/derived/managed — that's contract
 * policy, captured by which constant a field came from).
 */
function fieldFromSchema(
  name: string,
  schema: z.ZodTypeAny,
  writable: Writable,
  docs: Record<string, FieldDoc>,
  entity: string
): ManifestField {
  const { type, enum: enumValues } = describeType(schema);
  const doc = docFor(name, docs, entity);
  return {
    name,
    type,
    // Derived/managed fields are read-only, so "required" is meaningless → false.
    required: writable === 'ai' ? isRequired(schema) : false,
    writable,
    ...(enumValues ? { enum: enumValues } : {}),
    description: doc.description,
    mapsTo: doc.mapsTo,
  };
}

// ---------------------------------------------------------------------------
// Entity field builders (article + cluster).
// ---------------------------------------------------------------------------

function buildArticleFields(): ManifestField[] {
  const shape = ArticleCanonicalV2Schema.shape as Record<string, z.ZodTypeAny>;
  const fields: ManifestField[] = [];

  // ai-writable canonical fields, in the contract's stable hashing order.
  // publishedAt is in CANONICAL_ARTICLE_FIELDS_V2 but is lifecycle-managed.
  for (const name of CANONICAL_ARTICLE_FIELDS_V2) {
    const schema = shape[name];
    if (!schema) continue;
    const writable: Writable = name === 'publishedAt' ? 'managed' : 'ai';
    fields.push(
      fieldFromSchema(name, schema, writable, ARTICLE_FIELD_DOCS, 'Article')
    );
  }

  // Derived, read-only fields not present on the input schema.
  fields.push({
    name: 'readTime',
    type: 'number',
    required: false,
    writable: 'derived',
    description: ARTICLE_FIELD_DOCS.readTime.description,
    mapsTo: ARTICLE_FIELD_DOCS.readTime.mapsTo,
  });
  for (const name of ['id', 'createdAt', 'updatedAt'] as const) {
    const doc = ARTICLE_FIELD_DOCS[name];
    fields.push({
      name,
      type: name === 'id' ? 'string' : 'datetime',
      required: false,
      writable: 'derived',
      description: doc.description,
      mapsTo: doc.mapsTo,
    });
  }

  return fields;
}

function buildClusterFields(): ManifestField[] {
  const shape = ClusterCanonicalSchema.shape as Record<string, z.ZodTypeAny>;
  const fields: ManifestField[] = [];

  for (const name of CANONICAL_CLUSTER_FIELDS) {
    const schema = shape[name];
    if (!schema) continue;
    fields.push(
      fieldFromSchema(name, schema, 'ai', CLUSTER_FIELD_DOCS, 'ArticleCluster')
    );
  }

  // Derived, read-only fields.
  fields.push({
    name: 'targetKeywords',
    type: 'string[]',
    required: false,
    writable: 'derived',
    description: CLUSTER_FIELD_DOCS.targetKeywords.description,
    mapsTo: CLUSTER_FIELD_DOCS.targetKeywords.mapsTo,
  });
  for (const name of ['id', 'createdAt', 'updatedAt'] as const) {
    const doc = CLUSTER_FIELD_DOCS[name];
    fields.push({
      name,
      type: name === 'id' ? 'string' : 'datetime',
      required: false,
      writable: 'derived',
      description: doc.description,
      mapsTo: doc.mapsTo,
    });
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Hand-written methodology, constraints, and the v2 tool catalogue. These are
// prose/policy that can't be derived from a schema; keep them accurate.
// ---------------------------------------------------------------------------

const METHODOLOGY = {
  pillarSpoke:
    'Flemoji organises SEO content into topic clusters. Each cluster has exactly one PILLAR — a broad, comprehensive hub article targeting the head keyword — and many SPOKE articles, each covering one specific sub-topic in depth. Spokes funnel authority and readers to the pillar; the pillar gives an overview and links out to every spoke. Plan a cluster as: pick the head topic (pillar) and 3-8 focused sub-topics (spokes).',
  internalLinking:
    "Articles cross-link via internalLinks[], which holds the SLUGS of sibling articles. The rule: every SPOKE must list the PILLAR's slug, and the PILLAR should list each SPOKE's slug; spokes may also link laterally to closely related spokes. Every slug in internalLinks[] must resolve to a real (or co-created) article. Use suggest_internal_links to discover semantically related existing articles to link to.",
  seoKeywordTiers: {
    primaryKeyword:
      'On an ARTICLE: the single most important keyword for that page (Article.primaryKeyword). Put the cluster head term on the pillar and a specific long-tail term on each spoke.',
    primaryKeywords:
      'On the CLUSTER: tier-1 head keywords the pillar targets (ArticleCluster.primaryKeywords[]).',
    secondaryKeywords:
      'On the CLUSTER: tier-2 supporting keywords spread across the spokes (ArticleCluster.secondaryKeywords[]).',
    longTailKeywords:
      'On the CLUSTER: tier-3 long-tail keywords that map to individual spoke articles (ArticleCluster.longTailKeywords[]).',
  },
  embeddableTools:
    'Articles can embed interactive tools by listing their slugs in toolSlugs[]. Discover valid slugs (and their categories/descriptions) with list_tools_catalog; pick tools relevant to the article topic (e.g. a royalties article embeds "split-sheet"). Every slug must exist in the catalogue.',
  ctas: 'Each article uses the site-wide default call-to-action unless you set ctaText (and ctaLink) to override it with a topic-specific next step.',
} as const;

const CONSTRAINTS = [
  'slug is unique across all articles; omit on create to auto-generate from the title.',
  'cluster slug is unique across all clusters.',
  "every entry in an article's internalLinks[] must resolve to an existing or co-created article slug.",
  'a cluster has exactly one PILLAR and many SPOKEs.',
  'every slug in toolSlugs[] must exist in the tool catalogue (list_tools_catalog).',
  'do not set status=PUBLISHED directly to go live — use the publish op (or scheduledAt) so the timeline post + embedding are created.',
  'readTime, id, createdAt, updatedAt are derived; publishedAt is lifecycle-managed — never set them.',
] as const;

/**
 * The v2 MCP tool surface. Hand-listed to match the contract exactly (names,
 * scopes, and read/write risk). Kept accurate alongside the registrars in
 * `src/lib/mcp/tools/*`.
 */
const V2_TOOLS: ReadonlyArray<{
  name: string;
  scopes: string[];
  risk: 'read' | 'write';
  description: string;
}> = [
  // System / self-description (docs:read).
  {
    name: 'describe_article_system',
    scopes: ['docs:read'],
    risk: 'read',
    description:
      'Return this manifest: the full article + cluster model, methodology, taxonomy, constraints, a worked example, and the v2 tool list. Call once to understand everything.',
  },
  {
    name: 'list_tools_catalog',
    scopes: ['docs:read'],
    risk: 'read',
    description:
      'List the embeddable interactive tools ({ slug, name, category, description }) that an article may reference via toolSlugs[].',
  },
  {
    name: 'search_articles',
    scopes: ['articles:read'],
    risk: 'read',
    description:
      'Semantic (pgvector) search over existing published articles; returns article summaries with a relevance score.',
  },
  {
    name: 'suggest_internal_links',
    scopes: ['articles:read'],
    risk: 'read',
    description:
      'Suggest sibling articles to link to, by semantic similarity to an existing article (id) or a draft body (draftBody). Returns scored { slug, title, reason }.',
  },
  // Article CRUD (v2-extended fields).
  {
    name: 'list_articles',
    scopes: ['articles:read'],
    risk: 'read',
    description: 'List articles (status filter, pagination, text search).',
  },
  {
    name: 'get_article',
    scopes: ['articles:read'],
    risk: 'read',
    description:
      'Fetch one article by id or slug as the canonical-v2 shape with per-field hashes + contentHash.',
  },
  {
    name: 'create_article',
    scopes: ['articles:write'],
    risk: 'write',
    description: 'Create an article from canonical-v2 fields.',
  },
  {
    name: 'update_article',
    scopes: ['articles:write'],
    risk: 'write',
    description:
      'Patch an article (optimistic concurrency via baseHash → 409 on conflict).',
  },
  {
    name: 'delete_article',
    scopes: ['articles:write'],
    risk: 'write',
    description: 'Soft-delete (ARCHIVED) or hard-delete an article.',
  },
  {
    name: 'publish_article',
    scopes: ['articles:write'],
    risk: 'write',
    description:
      'Publish an article: status→PUBLISHED, publishedAt, NEWS_ARTICLE timeline post, embedding.',
  },
  // Cluster CRUD.
  {
    name: 'list_clusters',
    scopes: ['clusters:read'],
    risk: 'read',
    description: 'List clusters (status filter, text search).',
  },
  {
    name: 'get_cluster',
    scopes: ['clusters:read'],
    risk: 'read',
    description:
      'Fetch one cluster by id or slug with members[] + per-field hashes + contentHash.',
  },
  {
    name: 'create_cluster',
    scopes: ['clusters:write'],
    risk: 'write',
    description: 'Create a cluster from canonical cluster fields.',
  },
  {
    name: 'update_cluster',
    scopes: ['clusters:write'],
    risk: 'write',
    description:
      'Patch a cluster (optimistic concurrency via baseHash → 409 on conflict).',
  },
  {
    name: 'delete_cluster',
    scopes: ['clusters:write'],
    risk: 'write',
    description:
      'Delete a cluster (unassigns members; never hard-deletes articles).',
  },
  // Planning (dry-run validate + transactional apply).
  {
    name: 'validate_content_plan',
    scopes: ['articles:read', 'clusters:read'],
    risk: 'read',
    description:
      'Dry-run validate a content plan (no writes): slug collisions, link resolution, one-PILLAR rule, required fields. Returns { ok, issues, normalized }.',
  },
  {
    name: 'apply_content_plan',
    scopes: ['articles:write', 'clusters:write'],
    risk: 'write',
    description:
      'Atomically create/update a whole cluster + pillar + spokes + internal links + schedule in one transaction. Idempotent by slug.',
  },
];

// ---------------------------------------------------------------------------
// A runnable worked example: a 1-PILLAR + 3-SPOKE cluster. Shaped to match the
// ContentPlan the planning tools accept (cluster + articles[] with clusterRole,
// internalLinks wiring spokes→pillar and the pillar→spokes). Real field values.
// ---------------------------------------------------------------------------

const PILLAR_SLUG = 'music-distribution-for-sa-artists';
const SPOKE_DSP_SLUG = 'best-distributors-south-africa';
const SPOKE_ROYALTIES_SLUG = 'how-streaming-royalties-work-south-africa';
const SPOKE_RELEASE_SLUG = 'release-day-checklist-independent-artists';

const WORKED_EXAMPLE = {
  description:
    'A 1-pillar + 3-spoke topic cluster on "Music distribution for South African artists". Pass `plan` to validate_content_plan, then apply_content_plan.',
  plan: {
    cluster: {
      name: 'Music distribution for SA artists',
      slug: 'music-distribution-sa',
      description:
        'Everything an independent South African artist needs to get their music onto streaming platforms and get paid.',
      goal: 'Rank for music-distribution head terms in SA and convert readers to track submissions.',
      audience:
        'Independent South African artists releasing music on a budget.',
      primaryKeywords: [
        'music distribution south africa',
        'distribute music sa',
      ],
      secondaryKeywords: ['music distributors', 'upload music to spotify'],
      longTailKeywords: [
        'best music distributor south africa',
        'how do streaming royalties work',
        'release day checklist',
      ],
      status: 'DRAFT',
    },
    articles: [
      {
        clusterRole: 'PILLAR',
        title:
          'Music Distribution for South African Artists: The Complete Guide',
        slug: PILLAR_SLUG,
        primaryKeyword: 'music distribution south africa',
        keywords: ['music distribution south africa', 'distribute music sa'],
        excerpt:
          'A complete, SA-focused guide to getting your music onto Spotify, Apple Music and more — and getting paid.',
        body: '# Music Distribution for South African Artists\n\nA complete overview of how distribution works, what it costs, and how royalties flow. See the deep-dives linked below.',
        // Pillar links down to every spoke.
        internalLinks: [
          SPOKE_DSP_SLUG,
          SPOKE_ROYALTIES_SLUG,
          SPOKE_RELEASE_SLUG,
        ],
        toolSlugs: ['revenue-predictor'],
        status: 'DRAFT',
      },
      {
        clusterRole: 'SPOKE',
        title: 'The Best Music Distributors for South African Artists',
        slug: SPOKE_DSP_SLUG,
        primaryKeyword: 'best music distributor south africa',
        keywords: ['best music distributor south africa', 'music distributors'],
        excerpt:
          'Compare the distributors that work best for SA artists on fees, payout speed, and platform reach.',
        body: '# The Best Music Distributors for South African Artists\n\nA comparison of distributor options for SA artists.',
        // Every spoke links up to the pillar.
        internalLinks: [PILLAR_SLUG],
        status: 'DRAFT',
      },
      {
        clusterRole: 'SPOKE',
        title: 'How Streaming Royalties Work for South African Artists',
        slug: SPOKE_ROYALTIES_SLUG,
        primaryKeyword: 'how do streaming royalties work',
        keywords: ['streaming royalties south africa', 'spotify payout'],
        excerpt:
          'Understand per-stream payouts, splits, and how to estimate what you will earn.',
        body: '# How Streaming Royalties Work\n\nAn explainer on per-stream rates and splits, with a calculator.',
        internalLinks: [PILLAR_SLUG, SPOKE_DSP_SLUG],
        toolSlugs: ['revenue-predictor', 'split-sheet'],
        status: 'DRAFT',
      },
      {
        clusterRole: 'SPOKE',
        title: 'Release-Day Checklist for Independent Artists',
        slug: SPOKE_RELEASE_SLUG,
        primaryKeyword: 'release day checklist',
        keywords: ['release day checklist', 'music release plan'],
        excerpt: 'Everything to line up before, on, and after release day.',
        body: '# Release-Day Checklist\n\nA step-by-step checklist for a smooth release.',
        internalLinks: [PILLAR_SLUG],
        // Scheduled to auto-publish later via the daily cron.
        scheduledAt: '2026-06-01T08:00:00.000Z',
        status: 'DRAFT',
      },
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Public builder.
// ---------------------------------------------------------------------------

/**
 * Assemble the `describe_article_system` payload from the live contract schemas
 * + the tool registry. Pure (no I/O) and synchronous; safe to call per request.
 */
export function buildSystemManifest(): DescribeArticleSystemOutput {
  const articleFields = buildArticleFields();
  const clusterFields = buildClusterFields();
  const catalogTools = getAllTools().map(t => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    description: t.description,
  }));

  return {
    contractVersion: MCP_CONTRACT_VERSION_LATEST,
    entities: {
      article: {
        fields: articleFields,
        lifecycle: {
          statuses: ArticleStatusSchema.options,
          publish:
            'status→PUBLISHED, publishedAt=now, creates a NEWS_ARTICLE TimelinePost, and enqueues a pgvector embedding of the article.',
          scheduling:
            'set scheduledAt (ISO-8601); a daily cron auto-publishes DRAFT articles whose scheduledAt is due.',
          versioning:
            'every update snapshots an ArticleVersion (history retained, newest first).',
        },
      },
      cluster: {
        fields: clusterFields,
        roles: ClusterRoleSchema.options,
        rule: 'a cluster has exactly one PILLAR and many SPOKEs.',
      },
    },
    methodology: METHODOLOGY,
    taxonomy: {
      articleStatuses: ArticleStatusSchema.options,
      clusterRoles: ClusterRoleSchema.options,
      tools: catalogTools,
    },
    examples: [WORKED_EXAMPLE],
    constraints: CONSTRAINTS,
    tools: V2_TOOLS,
  };
}
