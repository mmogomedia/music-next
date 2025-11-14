import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Flemoji',
  description: 'Privacy Policy for Flemoji Music Streaming Platform',
};

export default function PrivacyPage() {
  const lastUpdated = '2025-01-13';

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 md:p-12'>
          <h1 className='text-4xl font-bold mb-4 text-gray-900 dark:text-white'>
            Privacy Policy
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-8'>
            Last updated: {lastUpdated}
          </p>

          <div className='mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              <strong>Data Controller:</strong> Flemoji (Pty) Ltd
              <br />
              <strong>Compliance:</strong> This Privacy Policy complies with the
              Protection of Personal Information Act (POPIA) of South Africa and
              the General Data Protection Regulation (GDPR) for international
              users.
            </p>
          </div>

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
                  href='#information-we-collect'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  2. Information We Collect
                </a>
              </li>
              <li>
                <a
                  href='#how-we-use'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  3. How We Use Your Information
                </a>
              </li>
              <li>
                <a
                  href='#data-sharing'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  4. Data Sharing
                </a>
              </li>
              <li>
                <a
                  href='#data-security'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  5. Data Security
                </a>
              </li>
              <li>
                <a
                  href='#your-rights'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  6. Your Rights
                </a>
              </li>
              <li>
                <a
                  href='#cookies'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  7. Cookies & Tracking
                </a>
              </li>
              <li>
                <a
                  href='#children'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  8. Children&apos;s Privacy
                </a>
              </li>
              <li>
                <a
                  href='#international-transfers'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  9. International Transfers
                </a>
              </li>
              <li>
                <a
                  href='#data-retention'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  10. Data Retention
                </a>
              </li>
              <li>
                <a
                  href='#changes'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  11. Changes to Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href='#contact'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  12. Contact & Complaints
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
                At Flemoji, we are committed to protecting your privacy and
                personal information. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our music streaming platform.
              </p>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                This policy applies to all users of Flemoji, including visitors,
                registered users, and artists. By using our Service, you agree
                to the collection and use of information in accordance with this
                policy.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                <strong>Effective Date:</strong> {lastUpdated}
              </p>
            </section>

            <section id='information-we-collect' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                2. Information We Collect
              </h2>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                2.1 Personal Information
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We collect information that you provide directly to us:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  password (hashed), profile picture
                </li>
                <li>
                  <strong>Profile Information:</strong> Artist name, bio, genre
                  preferences, location
                </li>
                <li>
                  <strong>Payment Information:</strong> Billing address, payment
                  method details (processed securely through third-party payment
                  processors)
                </li>
                <li>
                  <strong>Content:</strong> Music tracks, playlists, comments,
                  and other content you upload
                </li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                2.2 Usage Data
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We automatically collect information about how you use Flemoji:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Listening history and preferences</li>
                <li>Play counts, likes, shares, and downloads</li>
                <li>Search queries and interactions</li>
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                2.3 Cookies and Tracking
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                We use cookies and similar technologies to enhance your
                experience, analyze usage, and assist with marketing efforts.
                See Section 7 for more details.
              </p>
            </section>

            <section id='how-we-use' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                3. How We Use Your Information
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We use the information we collect for the following purposes:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>Service Provision:</strong> To provide, maintain, and
                  improve our music streaming service
                </li>
                <li>
                  <strong>Account Management:</strong> To create and manage your
                  account, process transactions, and send service-related
                  communications
                </li>
                <li>
                  <strong>Personalization:</strong> To personalize your
                  experience, recommend music, and customize content
                </li>
                <li>
                  <strong>Analytics:</strong> To analyze usage patterns, improve
                  our service, and develop new features
                </li>
                <li>
                  <strong>Communication:</strong> To send you updates,
                  newsletters, and promotional materials (with your consent)
                </li>
                <li>
                  <strong>Legal Compliance:</strong> To comply with legal
                  obligations and protect our rights
                </li>
                <li>
                  <strong>Security:</strong> To detect, prevent, and address
                  security issues and fraudulent activity
                </li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                3.1 Legal Basis (GDPR)
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                For users in the European Union, we process your personal data
                based on: (1) your consent, (2) performance of a contract, (3)
                our legitimate interests, or (4) compliance with legal
                obligations.
              </p>
            </section>

            <section id='data-sharing' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                4. Data Sharing
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.1 Service Providers
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We may share information with third-party service providers who
                perform services on our behalf, such as:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Payment processors</li>
                <li>Cloud hosting and storage providers</li>
                <li>Email service providers</li>
                <li>Analytics and marketing services</li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.2 Legal Requirements
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We may disclose your information if required by law, court
                order, or government regulation, or to protect our rights,
                property, or safety.
              </p>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                4.3 Business Transfers
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>
                In the event of a merger, acquisition, or sale of assets, your
                information may be transferred to the acquiring entity.
              </p>
            </section>

            <section id='data-security' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                5. Data Security
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We implement appropriate technical and organizational measures
                to protect your personal information:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>Encryption:</strong> Data transmitted over the
                  internet is encrypted using SSL/TLS
                </li>
                <li>
                  <strong>Secure Storage:</strong> Personal data is stored on
                  secure servers with access controls
                </li>
                <li>
                  <strong>Password Protection:</strong> Passwords are hashed
                  using industry-standard algorithms
                </li>
                <li>
                  <strong>Access Controls:</strong> Limited access to personal
                  data on a need-to-know basis
                </li>
                <li>
                  <strong>Regular Audits:</strong> We conduct regular security
                  assessments and updates
                </li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                However, no method of transmission over the internet or
                electronic storage is 100% secure. While we strive to protect
                your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section id='your-rights' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                6. Your Rights
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Under POPIA and GDPR, you have the following rights regarding
                your personal information:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>Right to Access:</strong> Request a copy of your
                  personal data
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request correction of
                  inaccurate or incomplete data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your
                  personal data (subject to legal requirements)
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Request
                  limitation of how we process your data
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Request transfer
                  of your data to another service
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing based
                  on legitimate interests
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Withdraw consent
                  for data processing where applicable
                </li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                To exercise these rights, please contact us at{' '}
                <a
                  href='mailto:tatenda@flemoji.com'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  tatenda@flemoji.com
                </a>
                . We will respond to your request within 30 days.
              </p>
            </section>

            <section id='cookies' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                7. Cookies & Tracking
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We use cookies and similar tracking technologies to:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Remember your preferences and settings</li>
                <li>Authenticate your account</li>
                <li>Analyze usage and improve our service</li>
                <li>Provide personalized content and recommendations</li>
                <li>Measure the effectiveness of marketing campaigns</li>
              </ul>
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                7.1 Cookie Types
              </h3>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>Essential Cookies:</strong> Required for the service
                  to function
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  users interact with our service
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Used to deliver relevant
                  advertisements
                </li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                You can control cookies through your browser settings. However,
                disabling certain cookies may affect the functionality of our
                service.
              </p>
            </section>

            <section id='children' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                8. Children&apos;s Privacy
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Flemoji is not intended for children under the age of 13. We do
                not knowingly collect personal information from children under
                13.
              </p>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                If you are a parent or guardian and believe your child has
                provided us with personal information, please contact us
                immediately. We will delete such information upon verification.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                For users between 13 and 18, we recommend parental supervision
                and consent when using our service.
              </p>
            </section>

            <section id='international-transfers' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                9. International Transfers
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                Your information may be transferred to and processed in
                countries outside of South Africa, including the United States
                and European Union, where our service providers are located.
              </p>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We ensure that appropriate safeguards are in place to protect
                your data, including:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  Standard contractual clauses approved by data protection
                  authorities
                </li>
                <li>Compliance with applicable data protection laws</li>
                <li>Regular security assessments of service providers</li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                By using Flemoji, you consent to the transfer of your
                information as described in this policy.
              </p>
            </section>

            <section id='data-retention' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                10. Data Retention
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We retain your personal information for as long as necessary to:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain security and prevent fraud</li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                When you delete your account, we will delete or anonymize your
                personal information, except where we are required to retain it
                for legal purposes.
              </p>
              <p className='text-gray-700 dark:text-gray-300'>
                Some information, such as aggregated analytics data, may be
                retained indefinitely in anonymized form.
              </p>
            </section>

            <section id='changes' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                11. Changes to Privacy Policy
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or legal requirements. We will notify
                you of material changes by:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>Email notification to your registered email address</li>
                <li>Prominent notice on our website</li>
                <li>
                  Updating the &quot;Last updated&quot; date at the top of this
                  policy
                </li>
              </ul>
              <p className='text-gray-700 dark:text-gray-300'>
                Your continued use of Flemoji after changes become effective
                constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section id='contact' className='mb-8'>
              <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                12. Contact & Complaints
              </h2>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                If you have questions, concerns, or wish to exercise your rights
                regarding this Privacy Policy, please contact us:
              </p>
              <div className='bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-4'>
                <p className='text-gray-700 dark:text-gray-300 mb-2'>
                  <strong>Data Protection Officer:</strong>
                </p>
                <p className='text-gray-700 dark:text-gray-300 mb-2'>
                  <strong>Email:</strong>{' '}
                  <a
                    href='mailto:tatenda@flemoji.com'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    tatenda@flemoji.com
                  </a>
                </p>
                <p className='text-gray-700 dark:text-gray-300 mb-2'>
                  <strong>Support Email:</strong>{' '}
                  <a
                    href='mailto:tatenda@flemoji.com'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    tatenda@flemoji.com
                  </a>
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
              <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
                12.1 Complaints
              </h3>
              <p className='text-gray-700 dark:text-gray-300 mb-4'>
                If you are not satisfied with how we handle your personal
                information, you have the right to lodge a complaint with:
              </p>
              <ul className='list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300 space-y-2'>
                <li>
                  <strong>South Africa:</strong> Information Regulator (POPIA)
                  <br />
                  Website:{' '}
                  <a
                    href='https://www.justice.gov.za/inforeg/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    https://www.justice.gov.za/inforeg/
                  </a>
                </li>
                <li>
                  <strong>European Union:</strong> Your local data protection
                  authority
                </li>
              </ul>
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
