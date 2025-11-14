import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions - Flemoji',
  description: 'Terms and Conditions for Flemoji Music Streaming Platform',
};

export default function TermsPage() {
  const lastUpdated = '2025-01-13';

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 md:p-12'>
          <h1 className='text-4xl font-bold mb-4 text-gray-900 dark:text-white'>
            Terms & Conditions
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-8'>
            Last updated: {lastUpdated}
          </p>

          <nav className='mb-8 pb-8 border-b border-gray-200 dark:border-slate-700'>
            <h2 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
              Table of Contents
            </h2>
            <ul className='space-y-2 text-sm'>
              <li>
                <a
                  href='#introduction'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  1. Introduction
                </a>
              </li>
              <li>
                <a
                  href='#acceptance'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  2. Acceptance of Terms
                </a>
              </li>
              <li>
                <a
                  href='#accounts'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  3. User Accounts
                </a>
              </li>
              <li>
                <a
                  href='#content'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  4. Content & Intellectual Property
                </a>
              </li>
              <li>
                <a
                  href='#conduct'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  5. User Conduct
                </a>
              </li>
              <li>
                <a
                  href='#music'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  6. Music Upload & Distribution
                </a>
              </li>
              <li>
                <a
                  href='#payment'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  7. Payment & Subscriptions
                </a>
              </li>
              <li>
                <a
                  href='#privacy'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  8. Privacy
                </a>
              </li>
              <li>
                <a
                  href='#termination'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  9. Termination
                </a>
              </li>
              <li>
                <a
                  href='#disclaimers'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  10. Disclaimers
                </a>
              </li>
              <li>
                <a
                  href='#liability'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  11. Limitation of Liability
                </a>
              </li>
              <li>
                <a
                  href='#governing-law'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  12. Governing Law
                </a>
              </li>
              <li>
                <a
                  href='#changes'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  13. Changes to Terms
                </a>
              </li>
              <li>
                <a
                  href='#contact'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  14. Contact Information
                </a>
              </li>
            </ul>
          </nav>

          <div className='prose prose-lg dark:prose-invert max-w-none'>
            <section id='introduction' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                1. Introduction
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Welcome to Flemoji, a music streaming platform dedicated to
                showcasing South African music and connecting artists with music
                lovers. These Terms & Conditions (&quot;Terms&quot;) govern your
                access to and use of the Flemoji platform, including our
                website, mobile applications, and services (collectively, the
                &quot;Service&quot;).
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                By accessing or using Flemoji, you agree to be bound by these
                Terms. If you disagree with any part of these Terms, you may not
                access the Service.
              </p>
            </section>

            <section id='acceptance' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                2. Acceptance of Terms
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                By creating an account, accessing, or using Flemoji, you
                acknowledge that you have read, understood, and agree to be
                bound by these Terms and our Privacy Policy. If you do not agree
                to these Terms, you must not use the Service.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                These Terms apply to all users of the Service, including without
                limitation users who are browsers, artists, content creators,
                and contributors of content.
              </p>
            </section>

            <section id='accounts' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                3. User Accounts
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                3.1 Registration
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                To access certain features of Flemoji, you must register for an
                account. You agree to:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Provide accurate, current, and complete information</li>
                <li>
                  Maintain and update your information to keep it accurate
                </li>
                <li>Maintain the security of your password and account</li>
                <li>
                  Accept all responsibility for activities under your account
                </li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                3.2 Account Security
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account. Flemoji is not liable for any loss or damage arising
                from your failure to protect your account information.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                3.3 Account Eligibility
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                You must be at least 13 years old to use Flemoji. If you are
                under 18, you represent that you have your parent&apos;s or
                guardian&apos;s permission to use the Service.
              </p>
            </section>

            <section id='content' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                4. Content & Intellectual Property
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.1 User Content
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                You retain ownership of any content you upload, post, or
                transmit through Flemoji (&quot;User Content&quot;). By
                uploading User Content, you grant Flemoji a worldwide,
                non-exclusive, royalty-free license to use, reproduce,
                distribute, and display your User Content in connection with the
                Service.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.2 Platform Content
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                All content on Flemoji, including but not limited to text,
                graphics, logos, and software, is the property of Flemoji or its
                content suppliers and is protected by South African and
                international copyright laws.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.3 Copyright
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                You may not reproduce, distribute, modify, or create derivative
                works from any content on Flemoji without express written
                permission from the copyright owner.
              </p>
            </section>

            <section id='conduct' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                5. User Conduct
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                You agree not to use Flemoji to:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  Upload content that infringes on intellectual property rights
                </li>
                <li>Upload illegal, harmful, or offensive content</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the Service</li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                </li>
                <li>
                  Use automated systems to access the Service without permission
                </li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                Violation of these rules may result in immediate termination of
                your account and legal action.
              </p>
            </section>

            <section id='music' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                6. Music Upload & Distribution
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                6.1 Artist Responsibilities
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Artists who upload music to Flemoji represent and warrant that:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  They own or have the necessary rights to the uploaded content
                </li>
                <li>The content does not infringe on any third-party rights</li>
                <li>
                  They have obtained all necessary licenses and permissions
                </li>
                <li>The content complies with all applicable laws</li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                6.2 Licensing
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                By uploading music, you grant Flemoji a non-exclusive license to
                stream, distribute, and promote your music through the platform.
                You retain all ownership rights to your music.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                6.3 Royalties
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                Royalty payments, if applicable, will be governed by separate
                agreements between Flemoji and artists. Flemoji reserves the
                right to modify royalty structures with reasonable notice.
              </p>
            </section>

            <section id='payment' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                7. Payment & Subscriptions
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                7.1 Premium Features
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Flemoji may offer premium features or subscriptions. By
                subscribing, you agree to pay the fees specified at the time of
                purchase.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                7.2 Billing
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Subscription fees are billed in advance on a recurring basis.
                You authorize Flemoji to charge your payment method for all fees
                incurred.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                7.3 Refunds
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                Refund policies are determined on a case-by-case basis. Contact
                support for refund requests. Refunds are subject to our refund
                policy and applicable law.
              </p>
            </section>

            <section id='privacy' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                8. Privacy
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Your use of Flemoji is also governed by our{' '}
                <Link
                  href='/privacy'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  Privacy Policy
                </Link>
                . Please review our Privacy Policy to understand how we collect,
                use, and protect your information.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                By using Flemoji, you consent to the collection and use of your
                information as described in our Privacy Policy.
              </p>
            </section>

            <section id='termination' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                9. Termination
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                9.1 Termination by You
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                You may terminate your account at any time by contacting support
                or using account settings, if available.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                9.2 Termination by Us
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Flemoji reserves the right to suspend or terminate your account
                immediately, without prior notice, for any violation of these
                Terms or for any other reason we deem necessary.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                9.3 Effect of Termination
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                Upon termination, your right to use the Service will immediately
                cease. We may delete your account and content, though some
                information may be retained as required by law.
              </p>
            </section>

            <section id='disclaimers' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                10. Disclaimers
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                OR IMPLIED. FLEMOJI DOES NOT WARRANT THAT THE SERVICE WILL BE
                UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                Flemoji does not guarantee the accuracy, completeness, or
                usefulness of any content on the Service. You use the Service at
                your own risk.
              </p>
            </section>

            <section id='liability' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                11. Limitation of Liability
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLEMOJI SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                Flemoji&apos;s total liability for any claims arising from or
                related to the Service shall not exceed the amount you paid to
                Flemoji in the 12 months preceding the claim.
              </p>
            </section>

            <section id='governing-law' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                12. Governing Law
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                These Terms shall be governed by and construed in accordance
                with the laws of the Republic of South Africa, without regard to
                its conflict of law provisions.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                Any disputes arising from these Terms or the Service shall be
                subject to the exclusive jurisdiction of the courts of South
                Africa.
              </p>
            </section>

            <section id='changes' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                13. Changes to Terms
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Flemoji reserves the right to modify these Terms at any time. We
                will notify users of material changes by email or through a
                notice on the Service.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                Your continued use of the Service after changes become effective
                constitutes acceptance of the modified Terms. If you do not
                agree to the changes, you must stop using the Service.
              </p>
            </section>

            <section id='contact' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                14. Contact Information
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                If you have any questions about these Terms, please contact us:
              </p>
              <div className='bg-gray-50 dark:bg-slate-700 p-4 rounded-lg'>
                <p className='text-gray-700 dark:text-gray-300 mb-2'>
                  <strong>Email:</strong> tatenda@flemoji.com
                </p>
                <p className='text-gray-700 dark:text-gray-300'>
                  <strong>Website:</strong>{' '}
                  <Link
                    href='/'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    https://flemoji.com
                  </Link>
                </p>
              </div>
            </section>
          </div>

          <div className='mt-12 pt-8 border-t border-gray-200 dark:border-slate-700'>
            <p className='text-sm text-gray-600 dark:text-gray-400 text-center'>
              © {new Date().getFullYear()} Flemoji. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
