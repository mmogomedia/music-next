import React from 'react';
import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import BProgressProvider from '@/components/ui/BProgressProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_URL } from '@/lib/utils/site-url';
import { serializeJsonLd } from '@/lib/utils/seo';
import { getSiteProfile } from '@/lib/services/site-profile-service';

// Optimize font loading - only essential weights for faster FCP
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: false, // Load after Inter
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false, // Load last
  variable: '--font-jetbrains-mono',
});

// Title + description come from the editable SiteProfile (get_site_profile /
// set_site_profile MCP tools) so a connected AI client can manage them; they
// fall back to the previous static values until the profile is edited.
export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSiteProfile();
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: 'Flemoji',
      // OG image is auto-discovered from src/app/opengraph-image.tsx
      locale: 'en_ZA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@flemoji',
    },
    appleWebApp: {
      capable: true,
      title: 'Flemoji',
    },
    other: {
      // Resource hints for performance
      'dns-prefetch':
        'https://asset.flemoji.com, https://audio.flemoji.com, https://profile-images.flemoji.com',
      'apple-mobile-web-app-title': 'Flemoji',
    },
  };
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Flemoji',
  url: SITE_URL,
  description:
    'AI-powered South African music discovery and artist promotion platform.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Flemoji',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://www.instagram.com/flemoji',
    'https://www.tiktok.com/@flemoji',
    'https://twitter.com/flemoji',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@flemoji.com',
    contactType: 'customer support',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`dark ${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <a href='#content' className='skip-link'>
          Skip to content
        </a>
        <BProgressProvider />
        <SessionProvider>
          <MusicPlayerProvider>
            <ToastProvider>
              <HeroUIProviderWrapper>
                <main id='content'>{children}</main>
              </HeroUIProviderWrapper>
            </ToastProvider>
          </MusicPlayerProvider>
        </SessionProvider>
        {/* Analytics moved to bottom - loaded after page content with defer */}
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics gaId='G-19MJR1SM8W' />
      </body>
    </html>
  );
}
