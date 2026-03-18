import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticles, getClusters } from '@/lib/services/article-service';
import { constructFileUrl } from '@/lib/url-utils';
import { format } from 'date-fns';
import LearnHeader from '@/components/layout/LearnHeader';
import type { Article, ArticleCluster } from '@/types/articles';
import { absoluteUrl } from '@/lib/utils/site-url';

export const dynamic = 'force-dynamic';

const TITLE = 'Learn | Flemoji';
const DESCRIPTION =
  'Music industry guides for independent South African artists — royalties, streaming, distribution, promotion, and more.';

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
    images: [
      {
        url: absoluteUrl('/og-learn.png'),
        width: 1200,
        height: 630,
        alt: 'Flemoji Learn — Music industry guides for South African artists',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@flemoji',
    images: [absoluteUrl('/og-learn.png')],
  },
};

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

export default async function LearnIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string; page?: string }>;
}) {
  const { cluster, page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const clusterId = cluster ?? undefined;

  const [{ articles, total, pages }, clusters] = await Promise.all([
    getArticles({ status: 'PUBLISHED', clusterId, page, limit: 12 }),
    getClusters(),
  ]);

  const activeCluster = clusters.find(c => c.id === clusterId);

  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      <LearnHeader />

      {/* ── Hero ── */}
      <section className='relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700'>
        {/* Subtle pattern overlay */}
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
              {/* Logo */}
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

            {/* Stats */}
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

      {/* ── Cluster filter tabs ── */}
      <div className='border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm'>
        <div className='max-w-5xl mx-auto px-6'>
          <div
            className='flex gap-1 overflow-x-auto py-3'
            style={{ scrollbarWidth: 'none' }}
          >
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
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className='max-w-5xl mx-auto px-6 py-10'>
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
              {(articles as ArticleWithClusterName[]).map(article => {
                const cover = constructFileUrl(article.coverImageUrl);
                return (
                  <Link
                    key={article.id}
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

                      {/* Pillar badge */}
                      {article.clusterRole === 'PILLAR' && (
                        <span className='absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-full uppercase tracking-wider shadow-sm'>
                          ★ Pillar Guide
                        </span>
                      )}

                      {/* Cluster tag */}
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
                            <span>
                              {format(
                                new Date(article.publishedAt),
                                'd MMM yyyy'
                              )}
                            </span>
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
              })}
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
