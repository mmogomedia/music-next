import Link from 'next/link';
import Image from 'next/image';

export default function PublicFooter() {
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
                className='h-9 w-auto dark:brightness-0 dark:invert'
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
                href='/tools'
                className='hover:text-purple-600 dark:hover:text-purple-400 transition-colors'
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
