import Image from 'next/image';
import Link from 'next/link';
import { constructFileUrl } from '@/lib/url-utils';
import type { Article, ArticleCluster } from '@/types/articles';
import { artworkGradient, CONTAINER, SECTION_PADDING } from './tokens';
import SectionHeading from './SectionHeading';

export type LearnArticle = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

interface HomeLearnSectionProps {
  /** Most prominent guide — the cluster pillar when there is one. */
  featured: LearnArticle | null;
  /** Up to four supporting guides listed beside the featured card. */
  rest: LearnArticle[];
}

export default function HomeLearnSection({
  featured,
  rest,
}: HomeLearnSectionProps) {
  return (
    <section
      id='learn'
      className={`scroll-mt-20 bg-white dark:bg-slate-900 ${SECTION_PADDING}`}
    >
      <div className={CONTAINER}>
        <SectionHeading
          number='01'
          eyebrow='Learning material'
          title='Learn how the music business actually works.'
          blurb='Written for people releasing music on their own — no jargon, no gatekeeping.'
          action={{ label: 'All topics →', href: '/learn' }}
        />

        {!featured ? (
          <div className='mt-10 rounded-3xl border border-[#ECEBF3] bg-[#FBFAFF] px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-800/40'>
            <p className='font-jakarta text-lg font-bold text-[#0F1222] dark:text-white'>
              The first guides are on their way.
            </p>
            <p className='mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#5B5F73] dark:text-gray-400'>
              Royalties, splits and distribution — written for independent South
              African artists. Check back shortly.
            </p>
          </div>
        ) : (
          <div className='mt-10 grid gap-6 lg:grid-cols-2'>
            <FeaturedGuide article={featured} />

            <div className='flex flex-col gap-3'>
              {rest.map((article, i) => (
                <CompactGuide key={article.id} article={article} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedGuide({ article }: { article: LearnArticle }) {
  const cover = constructFileUrl(article.coverImageUrl);

  return (
    <Link
      href={`/${article.slug}`}
      className='group block overflow-hidden rounded-[20px] border border-[#ECEBF3] bg-white text-[#0F1222] shadow-[0_2px_14px_rgba(15,18,34,.05)] transition-shadow hover:shadow-[0_12px_34px_rgba(15,18,34,.12)] dark:border-slate-700 dark:bg-slate-800 dark:text-white'
    >
      <div
        className='relative flex aspect-[16/10] items-center justify-center'
        style={cover ? undefined : { background: artworkGradient(0) }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            sizes='(max-width: 1024px) 100vw, 660px'
          />
        ) : (
          <span
            aria-hidden
            className='font-jakarta text-[clamp(4.5rem,9vw,8rem)] font-extrabold leading-none text-white/40'
          >
            {article.title.charAt(0)}
          </span>
        )}
        {article.cluster && (
          <span className='absolute bottom-4 left-4 rounded-lg bg-[#0F1222]/55 px-3 py-1.5 text-xs font-semibold text-white'>
            {article.cluster.name}
          </span>
        )}
      </div>

      <div className='px-6 pb-7 pt-6'>
        <div className='mb-3 text-xs font-bold uppercase tracking-[.1em] text-[#7C3AED] dark:text-purple-400'>
          {article.clusterRole === 'PILLAR' ? 'Start here' : 'Latest guide'}
        </div>
        <div className='font-jakarta text-[clamp(1.375rem,2.2vw,1.75rem)] font-extrabold leading-tight tracking-[-.028em]'>
          {article.title}
        </div>
        {article.excerpt && (
          <p className='mt-3 text-[15.5px] leading-relaxed text-[#5B5F73] text-pretty dark:text-gray-400'>
            {article.excerpt}
          </p>
        )}
        <div className='mt-5 flex items-center gap-2.5 text-[13.5px] text-[#8B8FA3]'>
          {article.cluster && (
            <>
              <span>{article.cluster.name}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </Link>
  );
}

function CompactGuide({
  article,
  index,
}: {
  article: LearnArticle;
  index: number;
}) {
  return (
    <Link
      href={`/${article.slug}`}
      className='flex items-center gap-4 rounded-2xl border border-[#ECEBF3] bg-white p-5 text-[#0F1222] transition-colors hover:border-[#D7CCFB] hover:bg-[#FBFAFF] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-purple-700 dark:hover:bg-slate-800/60'
    >
      <span
        aria-hidden
        className='flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl font-jakarta text-[15px] font-extrabold text-white/90'
        style={{ background: artworkGradient(index + 1) }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className='flex-1'>
        <span className='block font-jakarta text-[17px] font-bold leading-snug tracking-[-.015em]'>
          {article.title}
        </span>
        <span className='mt-1.5 block text-[13.5px] text-[#8B8FA3]'>
          {article.cluster ? `${article.cluster.name} · ` : ''}
          {article.readTime} min
        </span>
      </span>
    </Link>
  );
}
