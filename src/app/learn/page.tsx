import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticles, getClusters } from '@/lib/services/article-service';
import { constructFileUrl } from '@/lib/url-utils';
import { format } from 'date-fns';
import LearnHeader from '@/components/layout/LearnHeader';
import type {
  Article,
  ArticleCluster,
  ClusterWithCount,
} from '@/types/articles';
import { absoluteUrl } from '@/lib/utils/site-url';

export const dynamic = 'force-dynamic';

const TITLE =
  'Music Industry Guides for Independent South African Artists | Flemoji';
const DESCRIPTION =
  'Free music industry guides for independent South African artists — royalties, streaming, distribution, promotion, and more.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/learn') },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl('/learn'),
    siteName: 'Flemoji',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@flemoji',
  },
};

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

// ── Article card (grid view) ──────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleWithClusterName }) {
  const cover = constructFileUrl(article.coverImageUrl);
  return (
    <Link
      href={`/learn/${article.slug}`}
      className='group flex flex-col bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300'
    >
      {/* Cover */}
      <div className='relative h-44 overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0'>
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-500'
          />
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center'>
            <span className='text-white/20 text-7xl font-black select-none font-poppins'>
              {article.title.charAt(0)}
            </span>
          </div>
        )}
        {article.clusterRole === 'PILLAR' && (
          <span className='absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-full uppercase tracking-wider shadow-sm'>
            ★ Pillar Guide
          </span>
        )}
        {article.cluster && (
          <span className='absolute bottom-3 left-3 px-2 py-0.5 text-[10px] font-semibold bg-black/50 text-white rounded-md backdrop-blur-sm'>
            {article.cluster.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className='flex flex-col flex-1 p-5'>
        <h2 className='font-poppins text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2 line-clamp-2'>
          {article.title}
        </h2>
        {article.excerpt && (
          <p className='text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1'>
            {article.excerpt}
          </p>
        )}
        <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-slate-700'>
          <div className='flex items-center gap-2 text-[11px] text-gray-400'>
            {article.publishedAt && (
              <span>{format(new Date(article.publishedAt), 'd MMM yyyy')}</span>
            )}
            <span>·</span>
            <span>{article.readTime} min read</span>
          </div>
          <span className='text-[11px] font-semibold text-purple-500 dark:text-purple-400 group-hover:underline'>
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Cluster view ──────────────────────────────────────────────────────────────

function ClusterView({
  clusters,
  articles,
}: {
  clusters: ClusterWithCount[];
  articles: ArticleWithClusterName[];
}) {
  // Group articles by clusterId
  const byCluster = new Map<string, ArticleWithClusterName[]>();
  const unclustered: ArticleWithClusterName[] = [];

  for (const article of articles) {
    if (!article.clusterId) {
      unclustered.push(article);
    } else {
      if (!byCluster.has(article.clusterId))
        byCluster.set(article.clusterId, []);
      byCluster.get(article.clusterId)!.push(article);
    }
  }

  // Sort articles within each cluster: pillar first, then by publishedAt
  byCluster.forEach(arts => {
    arts.sort((a, b) => {
      if (a.clusterRole === 'PILLAR') return -1;
      if (b.clusterRole === 'PILLAR') return 1;
      return (
        new Date(a.publishedAt ?? 0).getTime() -
        new Date(b.publishedAt ?? 0).getTime()
      );
    });
  });

  const activeClusters = clusters.filter(
    c => (byCluster.get(c.id)?.length ?? 0) > 0
  );

  if (activeClusters.length === 0 && unclustered.length === 0) {
    return (
      <div className='text-center py-24'>
        <p className='text-gray-400 dark:text-gray-500 font-medium'>
          No articles published yet.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-14'>
      {activeClusters.map(cluster => {
        const clusterArticles = byCluster.get(cluster.id) ?? [];
        const pillar = clusterArticles.find(a => a.clusterRole === 'PILLAR');
        const spokes = clusterArticles.filter(a => a.clusterRole !== 'PILLAR');

        return (
          <section key={cluster.id}>
            {/* Cluster header */}
            <div className='flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-[10px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400'>
                    Topic
                  </span>
                  {cluster.audience && (
                    <>
                      <span className='text-gray-300 dark:text-slate-600'>
                        ·
                      </span>
                      <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                        For: {cluster.audience}
                      </span>
                    </>
                  )}
                </div>
                <h2 className='font-poppins text-xl font-bold text-gray-900 dark:text-white'>
                  {cluster.name}
                </h2>
                {cluster.description && (
                  <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl'>
                    {cluster.description}
                  </p>
                )}
              </div>
              <span className='flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 tabular-nums'>
                {clusterArticles.length}{' '}
                {clusterArticles.length === 1 ? 'article' : 'articles'}
              </span>
            </div>

            {/* Pillar article — featured */}
            {pillar && (
              <Link
                href={`/learn/${pillar.slug}`}
                className='group flex flex-col sm:flex-row gap-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 mb-5'
              >
                {/* Cover */}
                <div className='relative sm:w-72 h-48 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-slate-700'>
                  {constructFileUrl(pillar.coverImageUrl) ? (
                    <Image
                      src={constructFileUrl(pillar.coverImageUrl)!}
                      alt={pillar.title}
                      fill
                      className='object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                  ) : (
                    <div className='absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center'>
                      <span className='text-white/20 text-8xl font-black select-none font-poppins'>
                        {pillar.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className='absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-full uppercase tracking-wider shadow-sm'>
                    ★ Pillar Guide
                  </span>
                </div>

                {/* Content */}
                <div className='flex flex-col flex-1 p-6'>
                  <p className='text-[10px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-2'>
                    Start here
                  </p>
                  <h3 className='font-poppins text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-3'>
                    {pillar.title}
                  </h3>
                  {pillar.excerpt && (
                    <p className='text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1'>
                      {pillar.excerpt}
                    </p>
                  )}
                  <div className='flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-slate-700'>
                    <span className='text-xs text-gray-400'>
                      {pillar.readTime} min read
                    </span>
                    {pillar.publishedAt && (
                      <>
                        <span className='text-gray-300 dark:text-slate-600'>
                          ·
                        </span>
                        <span className='text-xs text-gray-400'>
                          {format(new Date(pillar.publishedAt), 'd MMM yyyy')}
                        </span>
                      </>
                    )}
                    <span className='ml-auto text-xs font-semibold text-purple-500 dark:text-purple-400 group-hover:underline'>
                      Read guide →
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Spoke articles — compact grid */}
            {spokes.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {spokes.map(spoke => {
                  const cover = constructFileUrl(spoke.coverImageUrl);
                  return (
                    <Link
                      key={spoke.id}
                      href={`/learn/${spoke.slug}`}
                      className='group flex gap-4 p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200'
                    >
                      {/* Thumbnail */}
                      <div className='relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700'>
                        {cover ? (
                          <Image
                            src={cover}
                            alt={spoke.title}
                            fill
                            className='object-cover'
                          />
                        ) : (
                          <div className='absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                            <span className='text-white/30 text-xl font-black select-none font-poppins'>
                              {spoke.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-sm font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-1'>
                          {spoke.title}
                        </h3>
                        <p className='text-[11px] text-gray-400 dark:text-gray-500'>
                          {spoke.readTime} min read
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* Unclustered articles */}
      {unclustered.length > 0 && (
        <section>
          <div className='mb-6 pb-4 border-b border-gray-100 dark:border-slate-800'>
            <h2 className='font-poppins text-xl font-bold text-gray-900 dark:text-white'>
              More Articles
            </h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {unclustered.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LearnIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string; page?: string; view?: string }>;
}) {
  const { cluster, page: pageParam, view } = await searchParams;
  const page = Number(pageParam ?? 1);
  const clusterId = cluster ?? undefined;
  const isClusterView = view === 'clusters';

  const [{ articles, total, pages }, clusters] = await Promise.all([
    isClusterView
      ? getArticles({ status: 'PUBLISHED', limit: 200 }) // all articles for grouping
      : getArticles({ status: 'PUBLISHED', clusterId, page, limit: 12 }),
    getClusters(),
  ]);

  const activeCluster = clusters.find(c => c.id === clusterId);

  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      <LearnHeader />

      {/* ── Hero ── */}
      <section className='relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700'>
        <div
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className='relative max-w-5xl mx-auto px-6 py-14 md:py-20'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-8'>
            <div className='max-w-xl'>
              <div className='mb-6'>
                <Image
                  src='/main_logo.png'
                  alt='Flemoji'
                  width={160}
                  height={44}
                  className='h-10 w-auto brightness-0 invert'
                  priority
                />
              </div>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                Music Education
              </div>
              <h1 className='font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4'>
                Learn the music
                <br className='hidden sm:block' /> business
              </h1>
              <p className='text-blue-100/80 text-lg leading-relaxed max-w-md'>
                Practical guides on royalties, streaming, distribution, and
                growing your music career — written for independent South
                African artists.
              </p>
            </div>

            <div className='flex gap-6 md:flex-col md:gap-4 md:text-right'>
              <div>
                <p className='text-3xl font-extrabold text-white'>{total}</p>
                <p className='text-blue-200/70 text-sm'>Articles</p>
              </div>
              <div>
                <p className='text-3xl font-extrabold text-white'>
                  {clusters.length}
                </p>
                <p className='text-blue-200/70 text-sm'>Topics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter bar + view toggle ── */}
      <div className='border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm'>
        <div className='max-w-5xl mx-auto px-6'>
          <div className='flex items-center gap-2'>
            {/* Cluster filter tabs (only in grid view) */}
            <div
              className='flex gap-1 overflow-x-auto py-3 flex-1'
              style={{ scrollbarWidth: 'none' }}
            >
              {!isClusterView && (
                <>
                  <Link
                    href='/learn'
                    className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      !clusterId
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                    }`}
                  >
                    All topics
                  </Link>
                  {clusters.map(c => (
                    <Link
                      key={c.id}
                      href={`/learn?cluster=${c.id}`}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        clusterId === c.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </>
              )}
              {isClusterView && (
                <span className='flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 py-1.5 px-1'>
                  Browse by topic
                </span>
              )}
            </div>

            {/* View toggle */}
            <div className='flex-shrink-0 flex items-center gap-1 py-3 pl-2 border-l border-gray-100 dark:border-slate-800 ml-1'>
              <Link
                href='/learn'
                title='Grid view'
                className={`p-1.5 rounded-lg transition-colors ${
                  !isClusterView
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {/* Grid icon */}
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
                  />
                </svg>
              </Link>
              <Link
                href='/learn?view=clusters'
                title='Cluster view'
                className={`p-1.5 rounded-lg transition-colors ${
                  isClusterView
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {/* Folder/layers icon */}
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className='max-w-5xl mx-auto px-6 py-10'>
        {isClusterView ? (
          <ClusterView
            clusters={clusters}
            articles={articles as ArticleWithClusterName[]}
          />
        ) : (
          <>
            {activeCluster && (
              <div className='mb-8'>
                <h2 className='font-poppins text-xl font-bold text-gray-900 dark:text-white'>
                  {activeCluster.name}
                </h2>
                {activeCluster.description && (
                  <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    {activeCluster.description}
                  </p>
                )}
              </div>
            )}

            {articles.length === 0 ? (
              <div className='text-center py-24'>
                <div className='w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-7 h-7 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <p className='text-gray-400 dark:text-gray-500 font-medium'>
                  No articles published yet.
                </p>
                <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>
                  Check back soon.
                </p>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {(articles as ArticleWithClusterName[]).map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className='flex items-center justify-center gap-3 mt-14'>
                    {page > 1 && (
                      <Link
                        href={`/learn?${clusterId ? `cluster=${clusterId}&` : ''}page=${page - 1}`}
                        className='px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors'
                      >
                        ← Previous
                      </Link>
                    )}
                    <span className='text-sm text-gray-400'>
                      {page} / {pages}
                    </span>
                    {page < pages && (
                      <Link
                        href={`/learn?${clusterId ? `cluster=${clusterId}&` : ''}page=${page + 1}`}
                        className='px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors'
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <LearnFooter />
    </div>
  );
}

function LearnFooter() {
  return (
    <footer className='border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16'>
      <div className='max-w-5xl mx-auto px-6 py-10'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-6'>
          <div className='flex flex-col items-center sm:items-start gap-3'>
            <Link href='/'>
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={140}
                height={38}
                className='h-9 w-auto'
              />
            </Link>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              Music industry education for South African artists.
            </p>
          </div>

          <div className='flex flex-col items-center sm:items-end gap-3'>
            <div className='flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500'>
              <Link
                href='/'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
              >
                Home
              </Link>
              <Link
                href='/learn'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
              >
                Learn
              </Link>
              <Link
                href='/timeline'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
              >
                Timeline
              </Link>
            </div>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              © {new Date().getFullYear()} Flemoji. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
