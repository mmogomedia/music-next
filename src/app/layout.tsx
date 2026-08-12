import React from 'react';
import type { Metadata } from 'next';
import {
  Inter,
  Poppins,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
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

// Display face for the marketing landing page (`/`). Self-hosted by next/font,
// so it costs no extra network round-trip to Google.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: false,
  variable: '--font-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false, // Load last
  variable: '--font-jetbrains-mono',
});

// ── Search Console / analytics configuration ─────────────────────────────────

/** Search Console HTML-tag verification token. Unset = no meta tag emitted. */
const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

/** GA4 measurement id. Overridable so staging can point at its own property. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-19MJR1SM8W';

/**
 * Only send analytics from the real production deployment.
 *
 * Without this the GA tag fired on localhost and on every Vercel preview,
 * writing dev traffic into the production property and corrupting session and
 * acquisition numbers. On Vercel, NEXT_PUBLIC_VERCEL_ENV is one of
 * production | preview | development; off-Vercel we fall back to NODE_ENV.
 */
const IS_PRODUCTION_DEPLOYMENT = process.env.NEXT_PUBLIC_VERCEL_ENV
  ? process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production';

const ANALYTICS_ENABLED =
  IS_PRODUCTION_DEPLOYMENT && Boolean(GA_MEASUREMENT_ID);

// Title + description come from the editable SiteProfile (get_site_profile /
// set_site_profile MCP tools) so a connected AI client can manage them; they
// fall back to the previous static values until the profile is edited.
export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSiteProfile();
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    // Search Console's HTML-tag verification. Set
    // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token Google gives you;
    // omitted entirely when unset, so this never emits an empty meta tag.
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
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

// NOTE: no `potentialAction`/SearchAction here. It used to declare a sitelinks
// searchbox at `/search?q=`, but no such route exists — the URL 404s. Declaring
// an action the site can't perform is an invalid structured-data claim. Re-add
// it (and only then) if a real /search page ships.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Flemoji',
  url: SITE_URL,
  description:
    'AI-powered South African music discovery and artist promotion platform.',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Flemoji',
  url: SITE_URL,
  // /logo.png does not exist in public/ — main_logo.png is the real wordmark.
  logo: `${SITE_URL}/main_logo.png`,
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
      // globals.css sets `scroll-behavior: smooth` on <html>. Next.js 15 silently
      // overrode that during route transitions so navigations jumped to the top
      // instantly; Next.js 16 no longer does unless this attribute is present.
      // Without it every route change smooth-scrolls, which reads as a UX regression.
      data-scroll-behavior='smooth'
      className={`dark ${inter.variable} ${poppins.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
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
        {/* Analytics moved to bottom - loaded after page content with defer.
            Vercel's own components self-disable outside production; the GA tag
            does not, so it is gated explicitly. */}
        <SpeedInsights />
        <Analytics />
        {ANALYTICS_ENABLED && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}
