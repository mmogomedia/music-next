import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { getArticles, getClusters } from '@/lib/services/article-service';
import { constructFileUrl } from '@/lib/url-utils';
import { format } from 'date-fns';
import LearnHeader from '@/components/layout/LearnHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { authOptions } from '@/lib/auth';
import type {
  Article,
  ArticleCluster,
  ClusterWithCount,
} from '@/types/articles';
import { absoluteUrl } from '@/lib/utils/site-url';

export const dynamic = 'force-dynamic';

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clusters = await getClusters();
  const cluster = clusters.find(c => c.slug === slug);
  if (!cluster) return {};

  const title = `${cluster.name} | Learn | Flemoji`;
  const description =
    cluster.description ??
    `Music industry guides about ${cluster.name} for independent South African artists.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/learn/topic/${cluster.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/learn/topic/${cluster.slug}`),
      siteName: 'Flemoji',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@flemoji',
    },
  };
}

// ── Gradient placeholder ───────────────────────────────────────────────────────

function GradientPlaceholder({
  letter,
  large = false,
}: {
  letter: string;
  large?: boolean;
}) {
  return (
    <div className='absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center'>
      <span
        className={`text-white/20 font-black select-none font-poppins ${large ? 'text-8xl' : 'text-7xl'}`}
      >
        {letter}
      </span>
    </div>
  );
}

// ── Single topic view ──────────────────────────────────────────────────────────

function SingleTopicView({
  cluster,
  articles,
}: {
  cluster: ClusterWithCount;
  articles: ArticleWithClusterName[];
}) {
  const pillar = articles.find(a => a.clusterRole === 'PILLAR');
  const spokes = articles.filter(a => a.clusterRole !== 'PILLAR');

  if (articles.length === 0) {
    return (
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
          No articles in this topic yet.
        </p>
        <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>
          Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href='/learn'
        className='inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-8'
      >
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
            d='M15 19l-7-7 7-7'
          />
        </svg>
        All topics
      </Link>

      {/* Cluster header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-[10px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400'>
            Topic
          </span>
          {cluster.audience && (
            <>
              <span className='text-gray-300 dark:text-slate-600'>·</span>
              <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                For: {cluster.audience}
              </span>
            </>
          )}
        </div>
        <h1 className='font-poppins text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2'>
          {cluster.name}
        </h1>
        {cluster.description && (
          <p className='text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed'>
            {cluster.description}
          </p>
        )}
      </div>

      {/* Pillar article — featured */}
      {pillar && (
        <Link
          href={`/learn/${pillar.slug}`}
          className='group flex flex-col sm:flex-row gap-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 mb-6'
        >
          {/* Cover */}
          <div className='relative sm:w-72 h-48 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-slate-700 overflow-hidden'>
            {constructFileUrl(pillar.coverImageUrl) ? (
              <Image
                src={constructFileUrl(pillar.coverImageUrl)!}
                alt={pillar.title}
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-500'
              />
            ) : (
              <GradientPlaceholder letter={pillar.title.charAt(0)} large />
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
            <h2 className='font-poppins text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-3'>
              {pillar.title}
            </h2>
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
                  <span className='text-gray-300 dark:text-slate-600'>·</span>
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
        <>
          {pillar && (
            <h3 className='text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4'>
              More in this topic
            </h3>
          )}
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
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [clusters, session] = await Promise.all([
    getClusters(),
    getServerSession(authOptions),
  ]);

  const cluster = clusters.find(c => c.slug === slug);
  if (!cluster) notFound();

  const { articles } = await getArticles({
    status: 'PUBLISHED',
    clusterId: cluster.id,
    limit: 100,
  });

  const isAdmin = session?.user?.role === 'ADMIN';

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
                <Link href='/learn'>
                  <Image
                    src='/main_logo.png'
                    alt='Flemoji'
                    width={160}
                    height={44}
                    className='h-10 w-auto brightness-0 invert'
                    priority
                  />
                </Link>
              </div>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                {cluster.audience ?? 'Music Education'}
              </div>
              <h1 className='font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4'>
                {cluster.name}
              </h1>
              {cluster.description && (
                <p className='text-blue-100/80 text-lg leading-relaxed max-w-md line-clamp-2'>
                  {cluster.description}
                </p>
              )}
            </div>

            <div className='flex gap-6 md:flex-col md:gap-4 md:text-right'>
              <div>
                <p className='text-3xl font-extrabold text-white'>
                  {articles.length}
                </p>
                <p className='text-blue-200/70 text-sm'>
                  {articles.length === 1 ? 'Guide' : 'Guides'}
                </p>
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

      {/* ── Sibling cluster nav ── */}
      <div className='border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm'>
        <div className='max-w-5xl mx-auto px-6'>
          <div className='flex items-center gap-2'>
            {/* Cluster pills */}
            <div
              className='flex gap-1 overflow-x-auto py-3 flex-1'
              style={{ scrollbarWidth: 'none' }}
            >
              <Link
                href='/learn'
                className='flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
              >
                ← All topics
              </Link>
              {clusters.map(c => {
                const isActive = c.id === cluster.id;
                const hasArticles = c._count.articles > 0;
                if (!hasArticles && !isAdmin) return null;
                return (
                  <span key={c.id}>
                    {hasArticles ? (
                      <Link
                        href={`/learn/topic/${c.slug}`}
                        className={`flex-shrink-0 block px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                        }`}
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className='flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-gray-300 dark:text-slate-600 cursor-not-allowed'>
                        {c.name}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Right: admin button + grid toggle */}
            <div className='flex-shrink-0 flex items-center gap-2 py-3 pl-3 border-l border-gray-100 dark:border-slate-800 ml-1'>
              {isAdmin && (
                <Link
                  href='/admin/articles?tab=clusters'
                  className='flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap'
                >
                  + New Topic
                </Link>
              )}
              <Link
                href='/learn?view=grid'
                title='Grid view'
                className='p-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              >
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
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className='max-w-5xl mx-auto px-6 py-10'>
        <SingleTopicView
          cluster={cluster}
          articles={articles as ArticleWithClusterName[]}
        />
      </div>

      <PublicFooter />
    </div>
  );
}
