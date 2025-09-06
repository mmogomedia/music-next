import type { Metadata } from 'next'
import './globals.css'
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider'
import SessionProvider from '@/components/providers/SessionProvider'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Flemoji Music Streaming Platform',
  description: 'Listen, upload, and share music with Flemoji.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body>
        <a href="#content" className="skip-link">Skip to content</a>
        <SessionProvider>
          <HeroUIProviderWrapper>
            <AppLayout>
              <main id="content">{children}</main>
            </AppLayout>
          </HeroUIProviderWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
