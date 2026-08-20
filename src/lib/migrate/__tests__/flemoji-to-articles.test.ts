import {
  mapFlemojiArticle,
  mapClusterRole,
  mapReferences,
  mapStatus,
  type FlemojiArticleRow,
} from '@/lib/migrate/flemoji-to-articles';

/**
 * Every assertion guards a rule a plausible column-to-column copy gets wrong,
 * and each wrong answer is invisible from the outside: an ungrouped article
 * silently scored as a spoke, a published article that no "published" filter
 * returns, a broken citation on a live page. The import runs once against a
 * live corpus — there is no second pass where the mistake surfaces as an error.
 */

const base: FlemojiArticleRow = {
  slug: 'mixing-vocals',
  title: 'Mixing vocals',
  body: '# Mixing vocals\n\nBody.',
  excerpt: 'How to sit a vocal in a mix.',
  coverImageUrl: 'https://cdn.test/cover.jpg',
  seoTitle: 'Mixing vocals — a practical guide',
  metaDescription: 'Sit a vocal in a mix.',
  targetKeywords: ['mixing', 'vocals'],
  primaryKeyword: 'mixing vocals',
  internalLinks: ['compression-basics'],
  toolSlugs: [],
  ctaText: null,
  ctaLink: null,
  clusterId: null,
  clusterRole: 'SPOKE',
  readTime: 7,
  status: 'PUBLISHED',
  publishedAt: new Date('2026-02-01T00:00:00Z'),
  scheduledAt: null,
  socialImages: null,
  references: null,
  timelinePostId: null,
  embeddingUpdatedAt: null,
};

const row = (over: Partial<FlemojiArticleRow> = {}): FlemojiArticleRow => ({
  ...base,
  ...over,
});

describe('cluster role — the rule that would import the bug', () => {
  it('an article in NO cluster has NO role, despite the source saying SPOKE', () => {
    // Flemoji declares `clusterRole @default(SPOKE)`, non-null, so "not in a
    // cluster" is unrepresentable at the source: every loose article carries
    // SPOKE whether or not anyone chose it. Copying the column hands each one
    // a ~1,000-word SEO target it was never written to meet.
    expect(
      mapClusterRole(row({ clusterId: null, clusterRole: 'SPOKE' }))
    ).toBeNull();
    expect(
      mapClusterRole(row({ clusterId: null, clusterRole: 'PILLAR' }))
    ).toBeNull();
    expect(mapFlemojiArticle(row()).cluster).toBeNull();
  });

  it('an article IN a cluster keeps its role, lower-cased', () => {
    expect(
      mapFlemojiArticle(
        row({ clusterId: 'c1', clusterSlug: 'mixing', clusterRole: 'PILLAR' })
      ).cluster
    ).toEqual({ slug: 'mixing', role: 'pillar' });
    expect(
      mapFlemojiArticle(
        row({ clusterId: 'c1', clusterSlug: 'mixing', clusterRole: 'SPOKE' })
      ).cluster
    ).toEqual({ slug: 'mixing', role: 'spoke' });
  });

  it('a clusterId the caller could not resolve yields no cluster, not a half one', () => {
    // Better to leave it unclustered and visible than to write a membership
    // pointing at a slug that does not exist on the target.
    expect(
      mapFlemojiArticle(row({ clusterId: 'c1', clusterSlug: null })).cluster
    ).toBeNull();
  });
});

describe('status — same meanings, different case', () => {
  it('maps each source value', () => {
    expect(mapStatus(row({ status: 'DRAFT' }))).toBe('draft');
    expect(mapStatus(row({ status: 'PUBLISHED' }))).toBe('published');
    expect(mapStatus(row({ status: 'ARCHIVED' }))).toBe('archived');
  });

  it('fails CLOSED to draft on anything unrecognised', () => {
    // An unmapped value would not throw; it would land as a string the target
    // does not know, and every "published" filter would skip the article.
    // Publishing by accident is the worse direction, so the fallback is draft.
    expect(mapStatus(row({ status: 'SOMETHING_NEW' as never }))).toBe('draft');
  });
});

describe('references — a free Json column, narrowed not cast', () => {
  it('drops entries with no usable url', () => {
    // A citation that cannot be followed is not a citation, and carrying it
    // puts a broken "Sources" row on a published page.
    const refs = mapReferences(
      row({
        references: [
          { url: 'https://a.test', title: 'A' },
          { title: 'no url' },
          { url: '   ' },
          null,
          'nope',
        ],
      })
    );
    expect(refs).toEqual([{ url: 'https://a.test', title: 'A' }]);
  });

  it('keeps only known keys, and returns null rather than an empty array', () => {
    expect(
      mapReferences(row({ references: [{ url: 'https://a.test', junk: 1 }] }))
    ).toEqual([{ url: 'https://a.test' }]);
    expect(mapReferences(row({ references: [] }))).toBeNull();
    expect(mapReferences(row({ references: { not: 'an array' } }))).toBeNull();
    expect(mapReferences(row())).toBeNull();
  });
});

describe('provenance is never inferred', () => {
  it('is unknown even when the row looks machine-made', () => {
    // `references` being present means research was gathered, not that a model
    // wrote the prose. An editor claims it later.
    expect(
      mapFlemojiArticle(row({ references: [{ url: 'https://a.test' }] }))
        .provenance
    ).toBe('unknown');
    expect(mapFlemojiArticle(row()).provenance).toBe('unknown');
  });
});

describe('field mapping', () => {
  it('renames body, coverImageUrl, targetKeywords and scheduledAt', () => {
    const m = mapFlemojiArticle(
      row({ scheduledAt: new Date('2026-05-01T00:00:00Z') })
    );
    expect(m.markdown).toBe('# Mixing vocals\n\nBody.');
    expect(m.heroImageUrl).toBe('https://cdn.test/cover.jpg');
    expect(m.keywords).toEqual(['mixing', 'vocals']);
    expect(m.scheduledFor).toEqual(new Date('2026-05-01T00:00:00Z'));
  });

  it('carries authorName only when the caller resolved it', () => {
    expect(mapFlemojiArticle(row()).authorName).toBeNull();
    expect(mapFlemojiArticle(row({ authorName: 'Tawanike' })).authorName).toBe(
      'Tawanike'
    );
  });

  it('NEVER emits readTime — the target derives it', () => {
    // `readTimeMinutes` is omitted from ArticlePatch, so it cannot be set
    // through the port. Better anyway: a stored read time goes stale the
    // moment a body is edited, and Flemoji's defaults to 0.
    expect(
      JSON.stringify(mapFlemojiArticle(row({ readTime: 7 })))
    ).not.toContain('readTime');
  });

  it("does not mutate the source row's arrays", () => {
    const keywords = ['mixing'];
    const links = ['a'];
    mapFlemojiArticle(row({ targetKeywords: keywords, internalLinks: links }));
    expect(keywords).toEqual(['mixing']);
    expect(links).toEqual(['a']);
  });
});

describe('extras', () => {
  it('carries the Flemoji-only columns', () => {
    const m = mapFlemojiArticle(
      row({
        toolSlugs: ['bpm'],
        timelinePostId: 't1',
        socialImages: [{ platform: 'ig' }],
      })
    );
    expect(m.extras.flemoji).toEqual({
      toolSlugs: ['bpm'],
      timelinePostId: 't1',
      socialImages: [{ platform: 'ig' }],
    });
  });

  it('records that an embedding existed, WITHOUT the vector', () => {
    // The target's Article has no embedding field, so the vector has nowhere
    // to go through the port; stuffing 1536 floats into extras would bloat
    // every row for something no consumer can read. The timestamp is what an
    // audit of the import needs.
    const m = mapFlemojiArticle(
      row({ embeddingUpdatedAt: new Date('2026-01-09T00:00:00Z') })
    );
    expect(m.extras.flemoji).toEqual({
      embeddingUpdatedAt: '2026-01-09T00:00:00.000Z',
    });
    expect(JSON.stringify(m)).not.toContain('embedding"');
  });

  it('is an empty object when there is nothing Flemoji-specific to carry', () => {
    expect(mapFlemojiArticle(row()).extras).toEqual({});
  });
});
