/**
 * The Learn directory.
 *
 * Two modes:
 *   /learn           → landing-page hub (marketing feel, topic browse, value props)
 *   /learn?view=grid → paginated article grid with cluster filters
 *
 * Individual guides live at `/:slug` and topics at `/topic/:slug`.
 */
import Image from 'next/image';
import Link from 'next/link';
import { constructFileUrl } from '@/lib/url-utils';
import { format } from 'date-fns';
import LearnHeader from '@/components/layout/LearnHeader';
import {
  BRAND_GRADIENT,
  CONTAINER,
  GRID_OVERLAY,
} from '@/components/home/tokens';
import type {
  Article,
  ArticleCluster,
  ClusterWithCount,
} from '@/types/articles';

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

// ── Cluster card (hub view) ────────────────────────────────────────────────────

function ClusterCard({ cluster }: { cluster: ClusterWithCount }) {
  const isEmpty = cluster._count.articles === 0;
  const cover = constructFileUrl(cluster.coverImageUrl);

  const inner = (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all dark:bg-slate-800 ${
        isEmpty
          ? 'border-gray-100 opacity-70 dark:border-slate-700'
          : 'border-gray-100 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 dark:border-slate-700 dark:hover:border-purple-700'
      }`}
    >
      <div className='relative h-44 flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600'>
        {cover ? (
          <Image
            src={cover}
            alt={cluster.name}
            fill
            className={`object-cover ${!isEmpty ? 'transition-transform duration-500 group-hover:scale-105' : ''}`}
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='select-none font-poppins text-8xl font-black text-white/15'>
              {cluster.name.charAt(0)}
            </span>
          </div>
        )}
        {cluster.audience && (
          <span className='absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm'>
            For: {cluster.audience}
          </span>
        )}
      </div>

      <div className='flex flex-1 flex-col p-5'>
        <h3 className='mb-2 font-poppins text-lg font-bold leading-snug text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400'>
          {cluster.name}
        </h3>
        {cluster.description && (
          <p className='line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400'>
            {cluster.description}
          </p>
        )}
        <div className='mt-4 flex items-center justify-between border-t border-gray-50 pt-3 dark:border-slate-700'>
          <span className='text-xs tabular-nums text-gray-400'>
            {cluster._count.articles}{' '}
            {cluster._count.articles === 1 ? 'guide' : 'guides'}
          </span>
          {isEmpty ? (
            <span className='text-[11px] italic text-gray-400'>
              Coming soon
            </span>
          ) : (
            <span className='text-[11px] font-semibold text-purple-600 group-hover:underline dark:text-purple-400'>
              Explore →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isEmpty) return inner;
  return (
    <Link href={`/topic/${cluster.slug}`} className='block h-full'>
      {inner}
    </Link>
  );
}

// ── Article card (grid view) ───────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleWithClusterName }) {
  const cover = constructFileUrl(article.coverImageUrl);
  return (
    <Link
      href={`/${article.slug}`}
      className='group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700'
    >
      <div className='relative h-44 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-700'>
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700'>
            <span className='select-none font-poppins text-7xl font-black text-white/20'>
              {article.title.charAt(0)}
            </span>
          </div>
        )}
        {article.clusterRole === 'PILLAR' && (
          <span className='absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm'>
            ★ Pillar Guide
          </span>
        )}
        {article.cluster && (
          <span className='absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm'>
            {article.cluster.name}
          </span>
        )}
      </div>
      <div className='flex flex-1 flex-col p-5'>
        <h3 className='mb-2 line-clamp-2 font-poppins text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400'>
          {article.title}
        </h3>
        {article.excerpt && (
          <p className='line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400'>
            {article.excerpt}
          </p>
        )}
        <div className='mt-4 flex items-center justify-between border-t border-gray-50 pt-3 dark:border-slate-700'>
          <div className='flex items-center gap-2 text-[11px] text-gray-400'>
            {article.publishedAt && (
              <span>{format(new Date(article.publishedAt), 'd MMM yyyy')}</span>
            )}
            <span>·</span>
            <span>{article.readTime} min read</span>
          </div>
          <span className='text-[11px] font-semibold text-purple-500 group-hover:underline dark:text-purple-400'>
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Landing sections (hub view) ────────────────────────────────────────────────

/**
 * Landing hero — purple brand-gradient band that mirrors the Claude Design
 * canvas "Flemoji Learn Page". The copy pitch is money, not education
 * ("Learn how the music business really pays"). The right-side "Start here"
 * card fronts the flagship cluster with its top three chapters — real
 * article rows if published articles exist, placeholder rows otherwise so
 * the page still reads finished before content lands.
 */
const HERO_TOPICS = [
  { label: 'Royalties', href: '/learn?view=grid' },
  { label: 'Split sheets', href: '/tools/split-sheet' },
  { label: 'Distribution', href: '/learn?view=grid' },
  { label: 'Playlisting', href: '/learn?view=grid' },
] as const;

const PLACEHOLDER_CHAPTERS = [
  { title: 'How royalties actually get paid in South Africa', minutes: 12 },
  { title: 'Agree the splits before anyone leaves the studio', minutes: 8 },
  { title: 'Registering works: SAMRO, CAPASSO, SAMPRA', minutes: 14 },
] as const;

function LandingHero({
  total,
  clusters,
  articles,
}: {
  total: number;
  clusterCount: number;
  clusters: ClusterWithCount[];
  articles: ArticleWithClusterName[];
}) {
  const flagship = clusters[0];
  const chapters =
    articles.length > 0
      ? articles.slice(0, 3).map(a => ({
          title: a.title,
          minutes: a.readTime ?? 8,
          href: `/${a.slug}`,
        }))
      : PLACEHOLDER_CHAPTERS.map(c => ({ ...c, href: '/learn?view=grid' }));
  const flagshipHref = flagship
    ? `/topic/${flagship.slug}`
    : '/learn?view=grid';
  const flagshipCount = flagship?._count.articles ?? total;

  return (
    <section
      className='relative overflow-hidden px-5 pb-24 pt-16 sm:px-8 md:pt-20 md:pb-32 lg:px-12'
      style={{ background: BRAND_GRADIENT }}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={GRID_OVERLAY}
      />

      <div
        className={`${CONTAINER} relative grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-14`}
      >
        <div>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[.14] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-white'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
            Flemoji Learn · Free
          </span>

          <h1 className='mt-6 font-jakarta text-[clamp(2.75rem,6.5vw,5.5rem)] font-extrabold leading-[.96] tracking-[-.035em] text-white text-balance'>
            Learn how the music business{' '}
            <span className='text-[#F6C4DC]'>really pays.</span>
          </h1>

          <p className='mt-6 max-w-xl text-[clamp(1.0625rem,1.4vw,1.1875rem)] leading-relaxed text-white/80'>
            Short, plain-language guides on royalties, splits, streaming and
            distribution — each one paired with a free tool that does the
            paperwork. Built for independent South African artists.
          </p>

          <div className='mt-10 flex flex-wrap items-center gap-3.5'>
            <Link
              href='/learn?view=grid'
              className='inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[#5B3BF0] shadow-[0_10px_30px_rgba(15,18,34,.18)] transition-colors hover:bg-[#F3EEFF]'
            >
              Browse guides
              <span aria-hidden>↗</span>
            </Link>
            <a
              href='#how-it-works'
              className='inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/[.10] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20'
            >
              How it works
            </a>
          </div>

          <div className='mt-10 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-white/70'>
            <span className='text-[11px] font-bold uppercase tracking-[.16em] text-white/55'>
              Topics
            </span>
            {HERO_TOPICS.map((t, i) => (
              <span key={t.label} className='inline-flex items-center gap-2'>
                {i > 0 && (
                  <span aria-hidden className='text-white/30'>
                    ·
                  </span>
                )}
                <Link
                  href={t.href}
                  className='font-medium text-white/85 underline-offset-4 hover:text-white hover:underline'
                >
                  {t.label}
                </Link>
              </span>
            ))}
          </div>
        </div>

        <StartHereCard
          clusterName={
            flagship?.name ?? 'Music royalties for independent artists'
          }
          clusterBlurb={
            flagship?.description ??
            'Who is holding your money, and how to claim it.'
          }
          count={flagshipCount}
          href={flagshipHref}
          chapters={chapters}
        />
      </div>
    </section>
  );
}

function StartHereCard({
  clusterName,
  clusterBlurb,
  count,
  href,
  chapters,
}: {
  clusterName: string;
  clusterBlurb: string;
  count: number;
  href: string;
  chapters: Array<{ title: string; minutes: number; href: string }>;
}) {
  const countLabel =
    count === 0
      ? 'coming soon'
      : `${count} guide${count === 1 ? '' : 's'} · free`;
  return (
    <aside className='w-full rounded-3xl bg-white p-7 shadow-[0_40px_100px_-30px_rgba(15,18,34,.4)] dark:bg-slate-900 sm:p-8'>
      <div className='flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[.16em] text-slate-400 dark:text-slate-500'>
        <span>Start here</span>
        <span className='text-right normal-case tracking-normal font-medium text-slate-500 dark:text-slate-400'>
          {countLabel}
        </span>
      </div>

      <h2 className='mt-4 font-jakarta text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[26px]'>
        {clusterName}
      </h2>
      <p className='mt-2 line-clamp-2 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400'>
        {clusterBlurb}
      </p>

      <ol className='mt-6 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800'>
        {chapters.map((ch, i) => (
          <li key={i}>
            <Link
              href={ch.href}
              className='group flex items-start gap-4 py-4 -mx-1 px-1 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40'
            >
              <span className='shrink-0 pt-0.5 font-mono text-xs font-medium text-slate-400 tabular-nums'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className='flex-1 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-[#5B3BF0] dark:text-white dark:group-hover:text-purple-300'>
                {ch.title}
              </span>
              <span className='shrink-0 pt-0.5 text-xs text-slate-400 tabular-nums'>
                {ch.minutes} min
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={href}
        className='mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-[#5B3BF0] transition-colors hover:text-[#4025B8] dark:border-slate-800 dark:text-purple-300'
      >
        Open the cluster
        <span aria-hidden>→</span>
      </Link>
    </aside>
  );
}

const VALUE_PROPS = [
  {
    title: 'Written for South Africa',
    body: 'ISRC prefixes, SAMRO, CAPASSO, local distributors — the details that generic articles skip.',
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.7}
        d='M12 2C7 8 7 16 12 22M12 2c5 6 5 14 0 20M2 12h20'
      />
    ),
  },
  {
    title: 'Plain language',
    body: 'If your uncle can read it, we shipped it. Diagrams and worked examples over legalese.',
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.7}
        d='M4 6h16M4 12h10M4 18h16'
      />
    ),
  },
  {
    title: 'Guides + tools together',
    body: 'Every guide links to the free tool that does the work — split sheets, royalty splits, quick estimates.',
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.7}
        d='M10.325 4.317a2 2 0 013.35 0l.618 1.01a2 2 0 001.928 1.02l1.18-.135a2 2 0 011.949 2.812l-.503 1.089a2 2 0 000 1.774l.503 1.089a2 2 0 01-1.949 2.812l-1.18-.135a2 2 0 00-1.928 1.02l-.618 1.01a2 2 0 01-3.35 0l-.618-1.01a2 2 0 00-1.928-1.02l-1.18.135a2 2 0 01-1.949-2.812l.503-1.089a2 2 0 000-1.774l-.503-1.089a2 2 0 011.949-2.812l1.18.135a2 2 0 001.928-1.02l.618-1.01z'
      />
    ),
  },
  {
    title: 'Free forever',
    body: 'No signup wall, no paywall. Read anything, share anything, without an account.',
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.7}
        d='M12 8v8m-3-4h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    ),
  },
];

const VALUE_PROP_TOKENS = [
  { badge: 'SA', tint: 'bg-amber-100 text-amber-700' },
  { badge: null, tint: 'bg-purple-100 text-purple-700' },
  { badge: null, tint: 'bg-purple-100 text-purple-700' },
  { badge: null, tint: 'bg-purple-100 text-purple-700' },
] as const;

function ValueProps() {
  return (
    <section className='bg-slate-950 px-5 py-14 sm:px-8 lg:px-12'>
      <div className={CONTAINER}>
        <ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {VALUE_PROPS.map((vp, i) => {
            const t = VALUE_PROP_TOKENS[i];
            return (
              <li
                key={vp.title}
                className='flex flex-col gap-3 rounded-2xl bg-slate-900/70 p-5 ring-1 ring-white/[.06]'
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${t.tint}`}
                >
                  {t.badge ?? (
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {vp.icon}
                    </svg>
                  )}
                </span>
                <h3 className='font-jakarta text-[15px] font-bold text-white'>
                  {vp.title}
                </h3>
                <p className='text-[13px] leading-relaxed text-slate-400'>
                  {vp.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function TopicsSection({ clusters }: { clusters: ClusterWithCount[] }) {
  return (
    <section
      id='topics'
      className='scroll-mt-20 bg-gray-50 px-5 py-16 dark:bg-slate-950 sm:px-8 md:py-24 lg:px-12'
    >
      <div className={CONTAINER}>
        <div className='mb-10 flex flex-wrap items-end justify-between gap-4'>
          <div className='max-w-2xl'>
            <p className='text-xs font-bold uppercase tracking-[.14em] text-purple-600 dark:text-purple-400'>
              Browse by topic
            </p>
            <h2 className='mt-3 font-jakarta text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl'>
              Pick a corner of the industry.
            </h2>
          </div>
          <Link
            href='/learn?view=grid'
            className='shrink-0 rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-400 dark:hover:bg-slate-800'
          >
            See all guides →
          </Link>
        </div>

        {clusters.length === 0 ? (
          <EmptyState message='Topics are being organised.' />
        ) : (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {clusters.map(c => (
              <ClusterCard key={c.id} cluster={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Pick a topic',
    body: 'Royalties, distribution, promotion — start where you have questions.',
  },
  {
    n: '02',
    title: 'Read the guide',
    body: 'Short, worked examples with SA context. Five to ten minutes.',
  },
  {
    n: '03',
    title: 'Use the tool',
    body: 'Every guide links to a free tool that does the paperwork for you.',
  },
];

function HowItWorks() {
  return (
    <section
      id='how-it-works'
      className='scroll-mt-20 bg-white px-5 py-16 dark:bg-slate-900 sm:px-8 md:py-24 lg:px-12'
    >
      <div className={CONTAINER}>
        <div className='mb-10 max-w-2xl'>
          <p className='text-xs font-bold uppercase tracking-[.14em] text-purple-600 dark:text-purple-400'>
            How it works
          </p>
          <h2 className='mt-3 font-jakarta text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl'>
            Three steps. That&apos;s it.
          </h2>
        </div>

        <ol className='grid gap-6 md:grid-cols-3'>
          {STEPS.map(step => (
            <li
              key={step.n}
              className='relative rounded-2xl border border-gray-100 bg-white p-7 dark:border-slate-700 dark:bg-slate-800'
            >
              <span className='font-jakarta text-6xl font-black text-purple-100 dark:text-purple-900/40'>
                {step.n}
              </span>
              <h3 className='mt-4 font-jakarta text-lg font-bold text-gray-900 dark:text-white'>
                {step.title}
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400'>
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LatestArticles({ articles }: { articles: ArticleWithClusterName[] }) {
  if (articles.length === 0) return null;
  return (
    <section className='bg-gray-50 px-5 py-16 dark:bg-slate-950 sm:px-8 md:py-24 lg:px-12'>
      <div className={CONTAINER}>
        <div className='mb-10 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='text-xs font-bold uppercase tracking-[.14em] text-purple-600 dark:text-purple-400'>
              Fresh
            </p>
            <h2 className='mt-3 font-jakarta text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl'>
              Latest guides.
            </h2>
          </div>
          <Link
            href='/learn?view=grid'
            className='shrink-0 text-sm font-semibold text-purple-600 hover:underline dark:text-purple-400'
          >
            All guides →
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {articles.slice(0, 3).map(a => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section
      className='relative overflow-hidden px-5 py-16 sm:px-8 md:py-24 lg:px-12'
      style={{ background: BRAND_GRADIENT }}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={GRID_OVERLAY}
      />
      <div className={`${CONTAINER} relative text-center`}>
        <h2 className='mx-auto max-w-2xl font-jakarta text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
          Ready to take the admin off your plate?
        </h2>
        <p className='mx-auto mt-4 max-w-xl text-lg text-white/80'>
          Read a guide, then run the tool. Free, no signup — start with the one
          most artists skip.
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-3.5'>
          <Link
            href='/tools/split-sheet'
            className='rounded-xl bg-white px-7 py-4 text-base font-bold text-[#5B3BF0] shadow-[0_10px_30px_rgba(15,18,34,.18)] transition-colors hover:bg-[#F3EEFF]'
          >
            Try the split sheet →
          </Link>
          <Link
            href='/learn?view=grid'
            className='rounded-xl border border-white/35 bg-white/[.14] px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/25'
          >
            Browse guides
          </Link>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className='rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800'>
      <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-900/20'>
        <svg
          className='h-6 w-6 text-purple-600 dark:text-purple-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.7}
            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
          />
        </svg>
      </div>
      <p className='font-semibold text-gray-700 dark:text-gray-200'>
        {message}
      </p>
      <p className='mt-1 text-sm text-gray-400'>Check back soon.</p>
    </div>
  );
}

// ── Grid view (filter bar + article grid) ─────────────────────────────────────

function GridView({
  articles,
  clusters,
  clusterId,
  isAdmin,
  page,
  pages,
}: {
  articles: ArticleWithClusterName[];
  clusters: ClusterWithCount[];
  clusterId?: string;
  isAdmin: boolean;
  page: number;
  pages: number;
}) {
  const activeCluster = clusters.find(c => c.id === clusterId);

  return (
    <>
      <div className='sticky top-0 z-10 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95'>
        <div className={`${CONTAINER} px-5 sm:px-8 lg:px-12`}>
          <div className='flex items-center gap-2'>
            <div
              className='flex flex-1 gap-1 overflow-x-auto py-3'
              style={{ scrollbarWidth: 'none' }}
            >
              <Link
                href='/learn?view=grid'
                className={`flex-shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  !clusterId
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-purple-900/10 dark:hover:text-purple-400'
                }`}
              >
                All articles
              </Link>
              {clusters.map(c => (
                <Link
                  key={c.id}
                  href={`/learn?view=grid&cluster=${c.id}`}
                  className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                    clusterId === c.id
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-purple-900/10 dark:hover:text-purple-400'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <div className='ml-1 flex flex-shrink-0 items-center gap-2 border-l border-gray-100 py-3 pl-3 dark:border-slate-800'>
              {isAdmin && (
                <Link
                  href='/admin/articles?tab=clusters'
                  className='whitespace-nowrap rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-700'
                >
                  + New Topic
                </Link>
              )}
              <Link
                href='/learn'
                title='Landing hub'
                className='rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-300'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={`${CONTAINER} px-5 py-10 sm:px-8 lg:px-12`}>
        {activeCluster && (
          <div className='mb-8'>
            <h1 className='font-poppins text-2xl font-bold text-gray-900 dark:text-white'>
              {activeCluster.name}
            </h1>
            {activeCluster.description && (
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                {activeCluster.description}
              </p>
            )}
          </div>
        )}

        {articles.length === 0 ? (
          <EmptyState message='No articles published yet.' />
        ) : (
          <>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {pages > 1 && (
              <div className='mt-14 flex items-center justify-center gap-3'>
                {page > 1 && (
                  <Link
                    href={`/learn?view=grid${clusterId ? `&cluster=${clusterId}` : ''}&page=${page - 1}`}
                    className='rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-purple-300 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:border-purple-700 dark:hover:bg-slate-800'
                  >
                    ← Previous
                  </Link>
                )}
                <span className='text-sm text-gray-400'>
                  {page} / {pages}
                </span>
                {page < pages && (
                  <Link
                    href={`/learn?view=grid${clusterId ? `&cluster=${clusterId}` : ''}&page=${page + 1}`}
                    className='rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-purple-300 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:border-purple-700 dark:hover:bg-slate-800'
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface LearnDirectoryProps {
  articles: ArticleWithClusterName[];
  clusters: ClusterWithCount[];
  /** Total published articles, shown in the hero counter. */
  total: number;
  /** Total pages for the current filter, used by the grid pagination. */
  pages: number;
  page: number;
  clusterId?: string;
  isGridView: boolean;
  isAdmin: boolean;
}

export default function LearnDirectory({
  articles,
  clusters,
  total,
  pages,
  page,
  clusterId,
  isGridView,
  isAdmin,
}: LearnDirectoryProps) {
  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      <LearnHeader />

      {isGridView ? (
        <GridView
          articles={articles}
          clusters={clusters}
          clusterId={clusterId}
          isAdmin={isAdmin}
          page={page}
          pages={pages}
        />
      ) : (
        <>
          <LandingHero
            total={total}
            clusterCount={clusters.length}
            clusters={clusters}
            articles={articles}
          />
          <ValueProps />
          <TopicsSection clusters={clusters} />
          <HowItWorks />
          <LatestArticles articles={articles} />
          <CtaBanner />
        </>
      )}

      <LearnFooter />
    </div>
  );
}

function LearnFooter() {
  return (
    <footer className='border-t border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900'>
      <div className={`${CONTAINER} px-5 py-10 sm:px-8 lg:px-12`}>
        <div className='flex flex-col items-center justify-between gap-6 sm:flex-row'>
          <div className='flex flex-col items-center gap-3 sm:items-start'>
            <Link href='/'>
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={140}
                height={38}
                className='h-9 w-auto dark:brightness-0 dark:invert'
              />
            </Link>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              Music industry education for South African artists.
            </p>
          </div>

          <div className='flex flex-col items-center gap-3 sm:items-end'>
            <div className='flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500'>
              <Link
                href='/'
                className='transition-colors hover:text-purple-600 dark:hover:text-purple-400'
              >
                Home
              </Link>
              <Link
                href='/stream'
                className='transition-colors hover:text-purple-600 dark:hover:text-purple-400'
              >
                Streaming
              </Link>
              <Link
                href='/tools'
                className='transition-colors hover:text-purple-600 dark:hover:text-purple-400'
              >
                Tools
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
