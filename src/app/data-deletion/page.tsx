import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/utils/site-url';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - Flemoji',
  description:
    'How to request deletion of your personal information from Flemoji.',
  alternates: { canonical: absoluteUrl('/data-deletion') },
};

export default function DataDeletionPage() {
  const lastUpdated = '2026-08-13';

  return (
    <div className='min-h-screen bg-white dark:bg-white'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white dark:bg-white rounded-3xl border border-gray-200 dark:border-gray-200 shadow-2xl p-8 md:p-12'>
          <div className='text-center mb-8'>
            <Link href='/' className='inline-block mb-4'>
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={200}
                height={60}
                priority
                className='h-12 w-auto mx-auto dark:brightness-0 dark:invert'
              />
            </Link>
          </div>
          <h1 className='text-4xl font-bold mb-4 text-gray-900'>
            Data Deletion Instructions
          </h1>
          <p className='text-gray-600 mb-8'>Last updated: {lastUpdated}</p>

          <div className='mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-800'>
              <strong>Data Controller:</strong> Flemoji (Pty) Ltd
              <br />
              You have the right to ask us to delete the personal information we
              hold about you. This page explains how to do that and what happens
              next.
            </p>
          </div>

          <div className='prose prose-lg max-w-none'>
            <section id='how-to-request' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900'>
                1. How to request deletion
              </h2>
              <p className='text-gray-700 dark:text-gray-700 mb-4'>
                Send an email to{' '}
                <a
                  href='mailto:tatenda@flemoji.com?subject=Data%20deletion%20request'
                  className='text-blue-600 dark:text-blue-600 hover:underline'
                >
                  tatenda@flemoji.com
                </a>{' '}
                with the subject line <strong>Data deletion request</strong>.
              </p>
              <p className='text-gray-700 dark:text-gray-700 mb-4'>
                Send it from the email address registered to your Flemoji
                account. We use that to confirm the request is genuinely yours —
                we will never delete an account on the say-so of a third party.
                If you can no longer access that address, tell us and we will
                ask you for another way to verify your identity.
              </p>
              <p className='text-gray-700 dark:text-gray-700'>
                You do not need to give a reason.
              </p>
            </section>

            <section id='what-is-deleted' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900'>
                2. What gets deleted
              </h2>
              <p className='text-gray-700 dark:text-gray-700 mb-4'>
                On a verified request we delete the personal information
                associated with your account, including:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-700 space-y-2'>
                <li>Your account record, name and email address</li>
                <li>
                  Profile information, including any artist profile and social
                  links you added
                </li>
                <li>Content you uploaded, and files stored on your behalf</li>
                <li>
                  Any identifiers we received from a third-party sign-in
                  provider when you connected your account
                </li>
              </ul>
            </section>

            <section id='timeline' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900'>
                3. How long it takes
              </h2>
              <p className='text-gray-700 dark:text-gray-700 mb-4'>
                We acknowledge deletion requests within 7 days and complete them
                within 30 days of verifying your identity. If a request is going
                to take longer than that, we will tell you why before the 30
                days are up.
              </p>
            </section>

            <section id='what-we-retain' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900'>
                4. What we may keep, and why
              </h2>
              <p className='text-gray-700 dark:text-gray-700 mb-4'>
                Deletion is not always absolute. We may retain limited
                information where the law requires it or where we have no way to
                identify you in it:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-700 space-y-2'>
                <li>
                  Records we are legally obliged to keep, such as transaction
                  records required for tax and accounting purposes
                </li>
                <li>
                  Information needed to resolve a live dispute or enforce our
                  agreements
                </li>
                <li>
                  Aggregated or anonymised analytics that can no longer be
                  linked back to you
                </li>
              </ul>
              <p className='text-gray-700 dark:text-gray-700'>
                Anything retained on these grounds is kept only for as long as
                the reason for keeping it applies.
              </p>
            </section>

            <section id='related' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-900'>
                5. Related information
              </h2>
              <p className='text-gray-700 dark:text-gray-700'>
                For the full picture of what we collect and why, see our{' '}
                <Link
                  href='/privacy'
                  className='text-blue-600 dark:text-blue-600 hover:underline'
                >
                  Privacy Policy
                </Link>
                . If you are not satisfied with how we handle your request, the
                complaints section of that policy explains how to escalate to
                the Information Regulator in South Africa or your local data
                protection authority.
              </p>
            </section>
          </div>

          <div className='mt-12 pt-8 border-t border-gray-200 dark:border-gray-200'>
            <p className='text-sm text-gray-600 dark:text-gray-600 text-center'>
              © {new Date().getFullYear()} Flemoji. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
