import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getToolBySlug, getAllTools } from '@/lib/tools/registry';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import LearnHeader from '@/components/layout/LearnHeader';
import { getLinksTo } from '@/lib/services/graph-service';
import { prisma } from '@/lib/db';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTools().map(t => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const url = absoluteUrl(`/tools/${slug}`);
  const ogImage = absoluteUrl('/og-tools.png');

  return {
    metadataBase: new URL(SITE_URL),
    title: `${tool.name} | Flemoji Tools`,
    description: tool.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${tool.name} | Flemoji Tools`,
      description: tool.description,
      type: 'website',
      url,
      siteName: 'Flemoji',
      images: [{ url: ogImage, width: 1200, height: 630, alt: tool.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} | Flemoji Tools`,
      description: tool.description,
      site: '@flemoji',
      images: [ogImage],
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  royalties: 'Royalties',
  finance: 'Finance',
  distribution: 'Distribution',
  promotion: 'Promotion',
};

async function getRelatedArticles(toolSlug: string) {
  try {
    const links = await getLinksTo('TOOL', toolSlug, 'ARTICLE', 'REFERENCES');
    if (links.length === 0) return [];
    const articleIds = links.map(l => l.fromId);
    const rows = await prisma.article.findMany({
      where: { id: { in: articleIds }, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        readTime: true,
      },
    });
    return articleIds
      .map(id => rows.find(r => r.id === id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);
  } catch {
    return [];
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(`/tools/${slug}`),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ZAR',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Flemoji',
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/main_logo.png'),
      },
    },
    inLanguage: 'en-ZA',
    keywords: tool.features.join(', '),
  };

  // ── Fullscreen layout (e.g. Split Sheet) ──────────────────────────────────
  if (tool.fullscreen) {
    return (
      <div className='flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-900'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LearnHeader />
        <div className='flex-1 overflow-hidden'>
          <ToolRenderer slug={slug} />
        </div>
      </div>
    );
  }

  const relatedArticles = await getRelatedArticles(slug);

  // ── Standard layout ───────────────────────────────────────────────────────
  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LearnHeader />

      {/* Gradient accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${tool.gradient}`} />

      <div className='max-w-3xl mx-auto px-4 sm:px-6 py-10'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-8'>
          <Link
            href='/'
            className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href='/tools'
            className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
          >
            Tools
          </Link>
          <span>/</span>
          <span className='text-gray-600 dark:text-gray-300 font-medium'>
            {tool.name}
          </span>
        </nav>

        {/* Tool header */}
        <div className='flex items-center gap-4 mb-8'>
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
          >
            <span className='text-3xl leading-none'>
              {tool.category === 'royalties'
                ? '⚖️'
                : tool.category === 'finance'
                  ? '📊'
                  : tool.category === 'distribution'
                    ? '🚀'
                    : '📣'}
            </span>
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5'>
              {CATEGORY_LABELS[tool.category]}
            </p>
            <h1 className='font-poppins text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight'>
              {tool.name}
            </h1>
            <p className='text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed'>
              {tool.tagline}
            </p>
          </div>
        </div>

        {/* Tool */}
        <div className='p-5 sm:p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm'>
          <ToolRenderer slug={slug} />
        </div>

        {/* Description */}
        <div className='mt-6 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
          <div className='px-5 py-4 bg-gray-50 dark:bg-slate-800/60'>
            <h2 className='text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2'>
              About this tool
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed'>
              {tool.description}
            </p>
          </div>
          <div className='px-5 py-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-2'>
            {tool.features.map(f => (
              <span
                key={f}
                className='inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/50 rounded-full px-2.5 py-1'
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${tool.gradient} flex-shrink-0`}
                />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className='mt-6 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
            <div className='px-5 py-3.5 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700'>
              <h2 className='text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
                Related reading
              </h2>
            </div>
            <ul className='divide-y divide-gray-100 dark:divide-slate-700'>
              {relatedArticles.map(article => (
                <li key={article.id}>
                  <Link
                    href={`/learn/${article.slug}`}
                    className='flex items-start justify-between gap-4 px-5 py-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug'>
                        {article.title}
                      </p>
                      {article.excerpt && (
                        <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1'>
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                    <span className='flex-shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap'>
                      {article.readTime} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Back to tools */}
        <div className='mt-8 flex items-center justify-between'>
          <Link
            href='/tools'
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
            All tools
          </Link>
          <Link
            href='/learn'
            className='text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline'
          >
            Browse all articles →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className='border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-10'>
        <div className='max-w-3xl mx-auto px-6 py-8'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <Link href='/'>
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={120}
                height={32}
                className='h-8 w-auto dark:brightness-0 dark:invert'
              />
            </Link>
            <div className='flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500'>
              <Link
                href='/learn'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
              >
                Learn
              </Link>
              <Link
                href='/tools'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
              >
                Tools
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
