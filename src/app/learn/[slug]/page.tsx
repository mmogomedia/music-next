import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleBySlug, getArticles } from '@/lib/services/article-service';
import { constructFileUrl } from '@/lib/url-utils';
import { format } from 'date-fns';
import { serializeJsonLd } from '@/lib/utils/seo';
import LearnHeader from '@/components/layout/LearnHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import ReadingProgress from '@/components/learn/ReadingProgress';
import ShareButton from '@/components/learn/ShareButton';
import DownloadArticleButton from '@/components/learn/DownloadArticleButton';
import { getToolBySlug } from '@/lib/tools/registry';
import { ToolSummaryCard } from '@/components/tools/ToolSummaryCard';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

// Revalidate every hour so edits publish quickly without full SSR on every request
export const revalidate = 3600;

// Pre-build all published article pages at deploy time
export async function generateStaticParams() {
  try {
    const { articles } = await getArticles({
      status: 'PUBLISHED',
      limit: 1000,
    });
    return articles.map(a => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractHeadings(markdown: string) {
  const re = /^(#{2,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    headings.push({
      level: m[1].length,
      text: m[2].trim(),
      id: slugify(m[2].trim()),
    });
  }
  return headings;
}

// Custom ReactMarkdown components that add anchor IDs to headings
const mdComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === 'string' ? children : String(children ?? '');
    return (
      <h2 id={slugify(text)} {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text =
      typeof children === 'string' ? children : String(children ?? '');
    return (
      <h3 id={slugify(text)} {...props}>
        {children}
      </h3>
    );
  },
};

// ── metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: LearnPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (article.status !== 'PUBLISHED') return {};

    const title = article.seoTitle || article.title;
    const description = article.metaDescription || article.excerpt || '';
    const keywords = [
      ...(article.primaryKeyword ? [article.primaryKeyword] : []),
      ...article.targetKeywords,
    ].join(', ');

    const canonicalUrl = absoluteUrl(`/learn/${slug}`);
    const ogImageUrl = article.coverImageUrl
      ? constructFileUrl(article.coverImageUrl)
      : absoluteUrl('/learn/opengraph-image');

    return {
      title: `${title} | Flemoji Learn`,
      description,
      keywords: keywords || undefined,
      authors: [{ name: article.author.name ?? 'Flemoji Editorial' }],
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Flemoji',
        type: 'article',
        publishedTime: article.publishedAt?.toISOString(),
        modifiedTime: article.updatedAt?.toISOString(),
        authors: [article.author.name ?? 'Flemoji Editorial'],
        section: article.cluster?.name ?? 'Music Industry',
        tags: article.targetKeywords,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: '@flemoji',
        images: [ogImageUrl],
      },
    };
  } catch {
    return {};
  }
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function LearnArticlePage({ params }: LearnPageProps) {
  const { slug } = await params;
  let article;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    notFound();
  }

  if (article.status !== 'PUBLISHED') notFound();

  const coverImageUrl = constructFileUrl(article.coverImageUrl);
  const clusterArticles = article.cluster?.articles ?? [];
  const pillar = clusterArticles.find(a => a.clusterRole === 'PILLAR');
  const spokes = clusterArticles.filter(a => a.clusterRole === 'SPOKE');
  const allSorted = [...(pillar ? [pillar] : []), ...spokes];

  const ctaHeadline = article.ctaText || 'Grow your music career with Flemoji';
  const ctaHref = article.ctaLink || '/';
  const headings = extractHeadings(article.body);
  const hasInternalLinks = article.internalLinkArticles.length > 0;

  // Prev / next within cluster (sorted order)
  const currentIdx = allSorted.findIndex(a => a.slug === article.slug);
  const prevArticle = currentIdx > 0 ? allSorted[currentIdx - 1] : null;
  const nextArticle =
    currentIdx < allSorted.length - 1 ? allSorted[currentIdx + 1] : null;

  const ogImageUrl = article.coverImageUrl
    ? constructFileUrl(article.coverImageUrl)
    : absoluteUrl('/learn/opengraph-image');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt || '',
    image: ogImageUrl,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author.name ?? 'Flemoji Editorial',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Flemoji',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo_symbol.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/learn/${article.slug}`),
    },
    keywords: article.targetKeywords.join(', '),
    timeRequired: `PT${article.readTime}M`,
    inLanguage: 'en-ZA',
    ...(article.cluster && {
      articleSection: article.cluster.name,
      isPartOf: {
        '@type': 'WebPageElement',
        name: article.cluster.name,
        url: `${SITE_URL}/learn?cluster=${article.cluster.id}`,
      },
    }),
  };

  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      {/* JSON-LD structured data for search engines */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ReadingProgress />
      <LearnHeader />

      {/* ── Article image banner ── */}
      {coverImageUrl ? (
        <div
          className='relative w-full overflow-hidden bg-slate-900'
          style={{ height: '340px' }}
        >
          <Image
            src={coverImageUrl}
            alt={article.title}
            fill
            className='object-cover opacity-60'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent' />

          {/* Overlay content */}
          <div className='absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8'>
            <nav className='flex items-center gap-1.5 text-[11px] text-white/50 mb-3'>
              <Link href='/' className='hover:text-white/80 transition-colors'>
                Home
              </Link>
              <span>/</span>
              <Link
                href='/learn'
                className='hover:text-white/80 transition-colors'
              >
                Learn
              </Link>
              {article.cluster && (
                <>
                  <span>/</span>
                  <Link
                    href={`/learn?cluster=${article.cluster.id}`}
                    className='hover:text-white/80 transition-colors'
                  >
                    {article.cluster.name}
                  </Link>
                </>
              )}
            </nav>

            {article.clusterRole === 'PILLAR' && (
              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full uppercase tracking-widest mb-3'>
                ★ Pillar Guide
              </span>
            )}

            <h1 className='font-poppins text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3'>
              {article.title}
            </h1>

            <div className='flex flex-wrap items-center gap-2.5 text-xs text-white/60'>
              <span className='font-semibold text-white/90'>
                {article.author.name ?? 'Flemoji Editorial'}
              </span>
              {article.publishedAt && (
                <>
                  <span>·</span>
                  <span>
                    {format(new Date(article.publishedAt), 'd MMM yyyy')}
                  </span>
                </>
              )}
              <span>·</span>
              <span className='flex items-center gap-1'>
                <svg
                  className='w-3.5 h-3.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {article.readTime} min read
              </span>
              {article.primaryKeyword && (
                <span className='px-2 py-0.5 bg-white/10 border border-white/15 text-white/80 rounded-full font-medium'>
                  {article.primaryKeyword}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Gradient banner — no cover image */
        <div
          className='relative overflow-hidden bg-gradient-to-br from-blue-700 via-purple-700 to-purple-800'
          style={{ paddingTop: '3rem', paddingBottom: '2.5rem' }}
        >
          <div
            className='absolute inset-0 opacity-[0.06]'
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className='relative max-w-7xl mx-auto px-4 sm:px-6'>
            <nav className='flex items-center gap-1.5 text-[11px] text-white/50 mb-4'>
              <Link href='/' className='hover:text-white/80 transition-colors'>
                Home
              </Link>
              <span>/</span>
              <Link
                href='/learn'
                className='hover:text-white/80 transition-colors'
              >
                Learn
              </Link>
              {article.cluster && (
                <>
                  <span>/</span>
                  <Link
                    href={`/learn?cluster=${article.cluster.id}`}
                    className='hover:text-white/80 transition-colors'
                  >
                    {article.cluster.name}
                  </Link>
                </>
              )}
            </nav>

            {article.clusterRole === 'PILLAR' && (
              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full uppercase tracking-widest mb-4'>
                ★ Pillar Guide
              </span>
            )}

            <h1 className='font-poppins text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4 max-w-3xl'>
              {article.title}
            </h1>

            <div className='flex flex-wrap items-center gap-2.5 text-xs text-white/60'>
              <span className='font-semibold text-white/90'>
                {article.author.name ?? 'Flemoji Editorial'}
              </span>
              {article.publishedAt && (
                <>
                  <span>·</span>
                  <span>
                    {format(new Date(article.publishedAt), 'd MMM yyyy')}
                  </span>
                </>
              )}
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-10'>
        <div className='flex gap-8 lg:gap-10'>
          {/* ── Left sidebar: In this series ── */}
          {article.cluster && allSorted.length > 0 && (
            <aside className='hidden lg:block w-56 xl:w-60 flex-shrink-0'>
              <div className='sticky top-20 space-y-5'>
                <Link
                  href='/learn'
                  className='flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
                >
                  <svg
                    className='w-3.5 h-3.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                  </svg>
                  All topics
                </Link>

                <div className='bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl p-4'>
                  <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1'>
                    Series
                  </p>
                  <h3 className='font-poppins font-bold text-gray-900 dark:text-white text-sm leading-snug mb-4'>
                    {article.cluster.name}
                  </h3>

                  <ul className='space-y-1'>
                    {allSorted.map((a, i) => {
                      const isCurrent = a.slug === article.slug;
                      return (
                        <li key={a.id}>
                          <Link
                            href={`/learn/${a.slug}`}
                            className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs leading-snug transition-colors ${
                              isCurrent
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isCurrent
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className='flex-1'>{a.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Progress tracker */}
                <div className='px-4 py-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-purple-800/30 rounded-2xl'>
                  <p className='text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1'>
                    Your progress
                  </p>
                  <p className='text-xs text-purple-600/70 dark:text-purple-400/60'>
                    Article {currentIdx + 1} of {allSorted.length}
                  </p>
                  <div className='mt-2 h-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500'
                      style={{
                        width: `${Math.round(((currentIdx + 1) / allSorted.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ── Main content ── */}
          <article className='flex-1 min-w-0'>
            {/* Key takeaways */}
            {article.excerpt && (
              <div className='mb-8 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0'>
                    <svg
                      className='w-3 h-3 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <p className='text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest'>
                    What you&apos;ll learn
                  </p>
                </div>
                <p className='text-sm text-blue-800 dark:text-blue-200 leading-relaxed'>
                  {article.excerpt}
                </p>
              </div>
            )}

            {/* Prose body */}
            <div
              className='prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-poppins prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-slate-800 prose-h2:pb-2
              prose-h3:text-base prose-h3:mt-6 prose-h3:text-gray-800 dark:prose-h3:text-gray-100
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
              prose-li:text-gray-700 dark:prose-li:text-gray-300
              prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-img:rounded-2xl prose-img:shadow-lg
              prose-blockquote:border-purple-400 prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-900/10 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
              prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:bg-purple-50 dark:prose-code:bg-purple-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:text-sm
              prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:shadow-lg prose-pre:rounded-2xl
              prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-table:text-sm prose-th:bg-gray-50 dark:prose-th:bg-slate-800 prose-th:text-gray-700 dark:prose-th:text-gray-300'
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents}
              >
                {article.body}
              </ReactMarkdown>
            </div>

            {/* Continue Learning — internal links */}
            {hasInternalLinks && (
              <div className='mt-12 pt-8 border-t border-gray-100 dark:border-slate-800'>
                <p className='text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4'>
                  Continue Learning
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {article.internalLinkArticles.map(linked => (
                    <Link
                      key={linked.slug}
                      href={`/learn/${linked.slug}`}
                      className='group flex flex-col p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200'
                    >
                      <p className='text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 leading-snug transition-colors'>
                        {linked.title}
                      </p>
                      {linked.excerpt && (
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed flex-1'>
                          {linked.excerpt}
                        </p>
                      )}
                      <span className='mt-3 text-xs font-semibold text-purple-500 dark:text-purple-400'>
                        {linked.readTime} min read →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Prev / Next navigation */}
            {(prevArticle || nextArticle) && (
              <div className='mt-10 pt-8 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-4'>
                {prevArticle ? (
                  <Link
                    href={`/learn/${prevArticle.slug}`}
                    className='group flex flex-col p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-purple-200 dark:hover:border-purple-700 transition-colors'
                  >
                    <span className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1'>
                      <svg
                        className='w-3 h-3'
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
                      Previous
                    </span>
                    <span className='text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 leading-snug transition-colors line-clamp-2'>
                      {prevArticle.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextArticle ? (
                  <Link
                    href={`/learn/${nextArticle.slug}`}
                    className='group flex flex-col p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-purple-200 dark:hover:border-purple-700 transition-colors text-right'
                  >
                    <span className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1'>
                      Next
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    </span>
                    <span className='text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 leading-snug transition-colors line-clamp-2'>
                      {nextArticle.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}

            {/* Interactive Tools */}
            {(() => {
              const tools = (
                article.resolvedToolSlugs ??
                article.toolSlugs ??
                []
              )
                .map(slug => getToolBySlug(slug))
                .filter(Boolean);
              if (!tools.length) return null;
              return (
                <div className='mt-12 pt-8 border-t border-gray-100 dark:border-slate-800'>
                  <div className='flex items-center gap-2 mb-6'>
                    <div className='w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                      <svg
                        className='w-3 h-3 text-white'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2.5}
                          d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                        />
                      </svg>
                    </div>
                    <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
                      Interactive Tools
                    </p>
                  </div>
                  <div
                    className={`grid gap-5 ${tools.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'}`}
                  >
                    {tools.map(tool => (
                      <ToolSummaryCard key={tool!.slug} tool={tool!} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Share row */}
            <div className='mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4'>
              <ShareButton title={article.title} />
              <DownloadArticleButton slug={article.slug} />
            </div>

            {/* CTA */}
            <div className='mt-10 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 p-8 text-white shadow-xl shadow-purple-500/20 dark:shadow-purple-900/30'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between'>
                <div className='max-w-sm'>
                  <Image
                    src='/logo_symbol.png'
                    alt='Flemoji'
                    width={40}
                    height={40}
                    className='h-9 w-9 rounded-xl mb-4 brightness-0 invert'
                  />
                  <p className='font-poppins text-xl font-extrabold leading-tight mb-2'>
                    {ctaHeadline}
                  </p>
                  <p className='text-blue-100/80 text-sm leading-relaxed'>
                    Discover and promote South African music. Join thousands of
                    independent artists already on Flemoji.
                  </p>
                </div>
                <Link
                  href={ctaHref}
                  className='flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg'
                >
                  Explore Flemoji
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
                      d='M17 8l4 4m0 0l-4 4m4-4H3'
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </article>

          {/* ── Right sidebar: Table of Contents ── */}
          {headings.length > 0 && (
            <aside className='hidden xl:block w-48 flex-shrink-0'>
              <div className='sticky top-20'>
                <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3'>
                  On this page
                </p>
                <ul className='space-y-1'>
                  {headings.map(h => (
                    <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                      <a
                        href={`#${h.id}`}
                        className='block text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 py-0.5 leading-snug transition-colors line-clamp-2'
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>

                <div className='mt-6 pt-4 border-t border-gray-100 dark:border-slate-800'>
                  <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1'>
                    Read time
                  </p>
                  <p className='text-xs text-gray-600 dark:text-gray-400 font-semibold'>
                    {article.readTime} min
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
