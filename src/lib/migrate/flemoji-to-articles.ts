/**
 * Flemoji `Article` → the portable articles-plugin shape.
 *
 * PURE. No Prisma, no I/O. A caller hands in a row it already read and gets
 * back a plain object describing what to write. The dangerous half of a
 * migration is the write and none of it is here; the WRONG half is the
 * mapping, and all of it is.
 *
 * The column map comes from the platform plan. Four of its rules were decided
 * against THIS schema rather than inherited, because a faithful
 * column-to-column copy gets each one wrong in a way nothing downstream would
 * report — see `mapClusterRole`, `mapStatus`, `mapReferences` and the
 * `readTime` note.
 *
 * MIRRORED target shape, not imported: installing @pic-a-site/articles-core
 * here is a separate decision with registry-auth and build consequences, and
 * this mapping is useful before it. Field names are identical so the swap is
 * a delete, not a rewrite.
 */

export type ArticleStatus = "idea" | "draft" | "staged" | "published" | "archived";
export type ClusterRole = "pillar" | "spoke";
export type Provenance =
  | "unknown"
  | "human"
  | "ai_assisted"
  | "ai_generated"
  | "ai_generated_human_reviewed";

export interface ArticleReference {
  url: string;
  title?: string;
  snippet?: string;
  accessedAt?: string;
  source?: string;
}

/** The Flemoji row as read. Relations arrive pre-resolved. */
export interface FlemojiArticleRow {
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  targetKeywords: string[];
  primaryKeyword: string | null;
  internalLinks: string[];
  toolSlugs: string[];
  ctaText: string | null;
  ctaLink: string | null;
  clusterId: string | null;
  /** Non-null in the source, WITH a SPOKE default — see mapClusterRole. */
  clusterRole: "PILLAR" | "SPOKE";
  readTime: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
  scheduledAt: Date | null;
  socialImages: unknown;
  references: unknown;
  timelinePostId: string | null;
  embeddingUpdatedAt: Date | null;
  /** Resolved from `authorId` by the caller — this mapper does no lookups. */
  authorName?: string | null;
  /** Resolved from `clusterId` by the caller. Clusters are unique by slug. */
  clusterSlug?: string | null;
}

export interface MappedArticle {
  slug: string;
  title: string;
  markdown: string;
  excerpt: string | null;
  status: ArticleStatus;
  provenance: Provenance;
  seoTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  primaryKeyword: string | null;
  internalLinks: string[];
  heroImageUrl: string | null;
  authorName: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  references: ArticleReference[] | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  /** Null when the article belongs to no cluster. Role travels with it. */
  cluster: { slug: string; role: ClusterRole } | null;
  extras: Record<string, unknown>;
}

/* ──────────────────────────── the decisions ──────────────────────────── */

/**
 * AN ARTICLE IN NO CLUSTER HAS NO ROLE.
 *
 * This is the single most important line in the file. Flemoji declares
 * `clusterRole ClusterRole @default(SPOKE)` — non-null with a default — so
 * "not in a cluster" is UNREPRESENTABLE at the source: every loose article
 * carries `SPOKE` in the database whether or not anyone chose it. The plugin
 * made the column nullable precisely to fix that.
 *
 * Copy the column across and you import the bug rather than the data: every
 * ungrouped article silently claims to be a spoke, which hands it a
 * ~1,000-word SEO target it was never written to meet and scores it against
 * that target forever after. Nothing errors; the numbers just quietly become
 * wrong for most of the corpus.
 *
 * So the role is derived from the CLUSTER, not from the column.
 */
export function mapClusterRole(row: FlemojiArticleRow): ClusterRole | null {
  if (!row.clusterId) return null;
  return row.clusterRole === "PILLAR" ? "pillar" : "spoke";
}

export function mapCluster(row: FlemojiArticleRow): { slug: string; role: ClusterRole } | null {
  const role = mapClusterRole(row);
  if (!role || !row.clusterSlug) return null;
  return { slug: row.clusterSlug, role };
}

/**
 * The two status vocabularies differ in CASE, not in meaning.
 *
 * Flemoji: DRAFT | PUBLISHED | ARCHIVED. The plugin: idea | draft | staged |
 * published | archived. An unmapped value would not throw — it would land as
 * a string the target does not recognise, and every filter that asks for
 * "published" would quietly skip the article. Mapping is explicit and total;
 * anything unrecognised fails CLOSED to `draft`, because publishing something
 * by accident is the worse direction of the two.
 *
 * `idea` and `staged` have no source value and are never produced here.
 */
export function mapStatus(row: FlemojiArticleRow): ArticleStatus {
  switch (row.status) {
    case "PUBLISHED":
      return "published";
    case "ARCHIVED":
      return "archived";
    case "DRAFT":
      return "draft";
    default:
      return "draft";
  }
}

/**
 * Provenance is NEVER inferred.
 *
 * Flemoji has no source column. Much of this corpus was drafted through its
 * MCP tooling and some was not, and nothing in the row distinguishes them —
 * `references` being present means research was gathered, not that a model
 * wrote the prose. An editor claims it later. A provenance that lies is worse
 * than an empty one.
 */
export function mapProvenance(_row: FlemojiArticleRow): Provenance {
  return "unknown";
}

/**
 * `references` is a free `Json?` column, so it can hold anything a past
 * version of the app happened to write. Narrowed entry by entry rather than
 * cast through: an entry with no usable `url` is dropped, because a citation
 * that cannot be followed is not a citation, and carrying it would put a
 * broken "Sources" row on a published page.
 */
export function mapReferences(row: FlemojiArticleRow): ArticleReference[] | null {
  if (!Array.isArray(row.references)) return null;
  const out: ArticleReference[] = [];
  for (const raw of row.references) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.url !== "string" || r.url.trim() === "") continue;
    const ref: ArticleReference = { url: r.url };
    if (typeof r.title === "string") ref.title = r.title;
    if (typeof r.snippet === "string") ref.snippet = r.snippet;
    if (typeof r.accessedAt === "string") ref.accessedAt = r.accessedAt;
    if (typeof r.source === "string") ref.source = r.source;
    out.push(ref);
  }
  return out.length ? out : null;
}

/**
 * What the platform deliberately does not model, plus one thing it cannot
 * carry.
 *
 * `toolSlugs`, `timelinePostId` and `socialImages` are Flemoji-specific and
 * ride in `extras` — the documented escape hatch, so nobody ever again adds a
 * column one site uses.
 *
 * `embeddingUpdatedAt` is recorded WITHOUT its vector, and that asymmetry is
 * deliberate. The target's `Article` has no embedding field at all, so a
 * 1536-float vector has nowhere to go through the port; stuffing it into
 * `extras` JSON would bloat every row for something no consumer can read.
 * Recording the timestamp keeps the FACT that a vector existed and when,
 * which is what an audit of the import needs — the vector itself gets
 * recomputed on the target's own metered path.
 *
 * NOTE what is deliberately absent: `readTime`. The target derives
 * `readTimeMinutes` from the body and omits it from `ArticlePatch`, so it
 * cannot be set through the port. That is the better outcome anyway — a
 * stored read time goes stale the moment a body is edited, and Flemoji's
 * defaults to 0.
 */
export function mapExtras(row: FlemojiArticleRow): Record<string, unknown> {
  const flemoji: Record<string, unknown> = {};
  if (row.toolSlugs.length) flemoji.toolSlugs = [...row.toolSlugs];
  if (row.timelinePostId) flemoji.timelinePostId = row.timelinePostId;
  if (row.socialImages != null) flemoji.socialImages = row.socialImages;
  if (row.embeddingUpdatedAt) flemoji.embeddingUpdatedAt = row.embeddingUpdatedAt.toISOString();
  return Object.keys(flemoji).length ? { flemoji } : {};
}

/** The whole mapping, one row in, one plain object out. */
export function mapFlemojiArticle(row: FlemojiArticleRow): MappedArticle {
  return {
    slug: row.slug,
    title: row.title,
    markdown: row.body,
    excerpt: row.excerpt,
    status: mapStatus(row),
    provenance: mapProvenance(row),
    seoTitle: row.seoTitle,
    metaDescription: row.metaDescription,
    keywords: [...row.targetKeywords],
    primaryKeyword: row.primaryKeyword,
    internalLinks: [...row.internalLinks],
    heroImageUrl: row.coverImageUrl,
    authorName: row.authorName ?? null,
    ctaText: row.ctaText,
    ctaLink: row.ctaLink,
    references: mapReferences(row),
    publishedAt: row.publishedAt,
    scheduledFor: row.scheduledAt,
    cluster: mapCluster(row),
    extras: mapExtras(row),
  };
}
