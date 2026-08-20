/**
 * Phase 6 dry run: what the articles-platform import WOULD write.
 *
 *   npx dotenv -e .env.local -- npx tsx scripts/migration-dry-run.ts
 *   … --json          every mapped article
 *   … --slug=x        one article, in full
 *
 * READ-ONLY BY CONSTRUCTION. The only Prisma calls here are `findMany`. It
 * imports the mapper, which is pure, and prints. There is deliberately no
 * `--apply` flag and no write path to switch on — the point of a dry run is
 * that running it cannot be what breaks the corpus, and a flag away from a
 * live write is not that.
 *
 * It answers the questions a column map cannot: how many articles carry a
 * SPOKE role they never earned, how many references would be dropped as
 * unusable, whether any slug collides. Those are properties of the DATA, and
 * a correct mapping says nothing about them.
 */

import { PrismaClient } from '@prisma/client';
import {
  mapFlemojiArticle,
  type FlemojiArticleRow,
} from '@/lib/migrate/flemoji-to-articles';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const onlySlug = args
  .find(a => a.startsWith('--slug='))
  ?.slice('--slug='.length);

async function main() {
  const rows = await prisma.article.findMany({
    where: onlySlug ? { slug: onlySlug } : undefined,
    include: {
      author: { select: { name: true, email: true } },
      cluster: { select: { slug: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!rows.length) {
    console.log(
      onlySlug ? `No article with slug "${onlySlug}".` : 'No articles found.'
    );
    return;
  }

  const mapped = rows.map(r => {
    const input: FlemojiArticleRow = {
      slug: r.slug,
      title: r.title,
      body: r.body,
      excerpt: r.excerpt,
      coverImageUrl: r.coverImageUrl,
      seoTitle: r.seoTitle,
      metaDescription: r.metaDescription,
      targetKeywords: r.targetKeywords,
      primaryKeyword: r.primaryKeyword,
      internalLinks: r.internalLinks,
      toolSlugs: r.toolSlugs,
      ctaText: r.ctaText,
      ctaLink: r.ctaLink,
      clusterId: r.clusterId,
      clusterRole: r.clusterRole,
      readTime: r.readTime,
      status: r.status,
      publishedAt: r.publishedAt,
      scheduledAt: r.scheduledAt,
      socialImages: r.socialImages,
      references: r.references,
      timelinePostId: r.timelinePostId,
      embeddingUpdatedAt: r.embeddingUpdatedAt,
      // `authorId` is non-null with a Cascade, so it always resolves — but a
      // User may have no `name`, and email is not a byline.
      authorName: r.author?.name ?? null,
      clusterSlug: r.cluster?.slug ?? null,
    };
    return { source: r, out: mapFlemojiArticle(input) };
  });

  if (onlySlug || asJson) {
    console.log(
      JSON.stringify(
        onlySlug ? mapped[0]!.out : mapped.map(m => m.out),
        null,
        2
      )
    );
    if (onlySlug) return;
  }

  // `_m` not `m`: this names a parameter inside a TYPE annotation, so it is
  // never bound — and no-unused-vars requires unused args to be _-prefixed.
  const count = (p: (_m: (typeof mapped)[number]) => boolean) =>
    mapped.filter(p).length;
  const line = (label: string, n: number) =>
    console.log(`  ${label.padEnd(46)}${String(n).padStart(5)}`);

  console.log(
    `\nFlemoji → articles platform, dry run over ${mapped.length} article(s)\n`
  );

  console.log('Status');
  for (const s of ['draft', 'published', 'archived'] as const)
    line(
      s,
      count(m => m.out.status === s)
    );

  console.log('\nClusters — the rule this migration turns on');
  line(
    'in a cluster, role carried',
    count(m => m.out.cluster !== null)
  );
  line(
    '  …as pillar',
    count(m => m.out.cluster?.role === 'pillar')
  );
  line(
    '  …as spoke',
    count(m => m.out.cluster?.role === 'spoke')
  );
  // THE number to look at. Every one of these carries SPOKE in the database
  // because the column is non-null with a default, and none of them chose it.
  // A column-to-column copy would import each as a spoke and hand it a
  // ~1,000-word SEO target it was never written to meet.
  line(
    'NO cluster → role dropped (was SPOKE)',
    count(m => m.out.cluster === null)
  );
  line(
    '  …of those, source said PILLAR',
    count(m => m.out.cluster === null && m.source.clusterRole === 'PILLAR')
  );
  line(
    'clusterId set but slug unresolved',
    count(m => m.source.clusterId !== null && m.out.cluster === null)
  );

  console.log('\nCarried');
  line(
    'with a hero image (coverImageUrl)',
    count(m => m.out.heroImageUrl !== null)
  );
  line(
    'with an author name',
    count(m => m.out.authorName !== null)
  );
  line(
    'with keywords',
    count(m => m.out.keywords.length > 0)
  );
  line(
    'with internal links',
    count(m => m.out.internalLinks.length > 0)
  );
  line(
    'scheduled for future publish',
    count(m => m.out.scheduledFor !== null)
  );
  line(
    'had an embedding (timestamp only)',
    count(m => {
      const f = m.out.extras.flemoji as
        | { embeddingUpdatedAt?: string }
        | undefined;
      return f?.embeddingUpdatedAt !== undefined;
    })
  );

  console.log('\nNeeds a human before the real import');

  const bySlug = new Map<string, number>();
  for (const m of mapped)
    bySlug.set(m.out.slug, (bySlug.get(m.out.slug) ?? 0) + 1);
  const dupes = [...bySlug.entries()].filter(([, n]) => n > 1);
  line('duplicate slugs', dupes.length);

  const emptyBody = mapped.filter(m => m.out.markdown.trim() === '');
  line('empty body', emptyBody.length);

  const noAuthor = mapped.filter(m => m.out.authorName === null);
  line('author has no name (imports unattributed)', noAuthor.length);

  // References is a free Json column, so entries that survived one app version
  // may be unusable now. A dropped citation is silent at import time.
  let refsIn = 0;
  let refsOut = 0;
  for (const m of mapped) {
    if (Array.isArray(m.source.references))
      refsIn += m.source.references.length;
    refsOut += m.out.references?.length ?? 0;
  }
  line('references kept / found', refsOut);
  if (refsIn !== refsOut)
    console.log(
      `    ! ${refsIn - refsOut} reference(s) dropped as unusable (no url)`
    );

  line(
    "provenance 'unknown' (all, by design)",
    count(m => m.out.provenance === 'unknown')
  );

  for (const [slug, n] of dupes)
    console.log(`    ! slug "${slug}" appears ${n}×`);
  for (const m of emptyBody) console.log(`    ! empty body: ${m.out.slug}`);

  console.log('\nNothing was written.\n');
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
