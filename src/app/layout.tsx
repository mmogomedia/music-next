import type { Metadata } from 'next'
import './globals.css'
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider'
import Header from '@/components/layout/Header'

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <HeroUIProviderWrapper>
          <Header />
          {children}
        </HeroUIProviderWrapper>
      </body>
    </html>
  )
}

