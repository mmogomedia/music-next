"use client"

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

interface HeroUIProviderProps {
  children: ReactNode
}

export default function HeroUIProviderWrapper({ children }: HeroUIProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" themes={["light", "dark"]}>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  )
}

