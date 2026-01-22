'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Brand Section */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-4'>
              Flemoji
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Your music streaming platform for South African artists and music
              lovers.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-4'>
              Legal
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/privacy'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/terms'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-4'>
              Contact & Support
            </h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='mailto:tatenda@flemoji.com'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                >
                  tatenda@flemoji.com
                </a>
              </li>
              <li>
                <a
                  href='mailto:support@flemoji.com'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                >
                  support@flemoji.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-8 pt-8 border-t border-gray-200 dark:border-slate-700'>
          <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
            © {new Date().getFullYear()} Flemoji (Pty) Ltd. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
