import Image from 'next/image';
import Link from 'next/link';
import { CONTAINER } from './tokens';

const COLUMNS = [
  {
    heading: 'Learn',
    links: [
      { label: 'All guides', href: '/learn?view=grid' },
      { label: 'Topics', href: '/learn' },
    ],
  },
  {
    heading: 'Tools',
    links: [
      { label: 'Split sheets', href: '/tools/split-sheet' },
      { label: 'Revenue predictor', href: '/tools/revenue-predictor' },
      { label: 'All tools', href: '/tools' },
    ],
  },
  {
    heading: 'Streaming',
    links: [
      { label: 'Listen now', href: '/stream' },
      { label: 'Submit music', href: '/submissions' },
      { label: 'Timeline', href: '/timeline' },
    ],
  },
] as const;

export default function HomeFooter() {
  return (
    <footer className='border-t border-[#ECEBF3] bg-white px-5 py-10 sm:px-8 md:py-13 lg:px-12 dark:border-slate-800 dark:bg-slate-900'>
      <div className={`${CONTAINER} flex flex-wrap justify-between gap-10`}>
        <div className='max-w-xs'>
          <Link href='/' className='inline-block'>
            <Image
              src='/main_logo.png'
              alt='Flemoji'
              width={140}
              height={38}
              className='h-6 w-auto dark:brightness-0 dark:invert'
            />
          </Link>
          <p className='mt-4 text-[14.5px] leading-relaxed text-[#8B8FA3] dark:text-gray-500'>
            Learning material, music tools and a stream for independent South
            African artists.
          </p>
        </div>

        <div className='flex flex-wrap gap-8 sm:gap-12 lg:gap-18'>
          {COLUMNS.map(column => (
            <div key={column.heading} className='flex flex-col gap-3'>
              <div className='text-xs font-bold uppercase tracking-[.1em] text-[#0F1222] dark:text-white'>
                {column.heading}
              </div>
              {column.links.map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  className='text-[14.5px] text-[#5B5F73] transition-colors hover:text-[#7C3AED] dark:text-gray-400 dark:hover:text-purple-400'
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`${CONTAINER} mt-9 border-t border-[#ECEBF3] pt-6 text-[13.5px] text-[#9CA0B3] dark:border-slate-800 dark:text-gray-500`}
      >
        © {new Date().getFullYear()} Flemoji. Made in South Africa.
      </div>
    </footer>
  );
}
