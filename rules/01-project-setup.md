# Phase 1: Project Setup & Foundation

## 🎯 Objective
Set up the foundational Next.js project with all necessary dependencies, configuration, and basic project structure for the music streaming platform.

## 📋 Prerequisites
- Node.js 18+ installed
- Git repository initialized
- Code editor (VS Code recommended)
- Terminal access

## 🚀 Step-by-Step Implementation

### 1. Initialize Next.js Project

```bash
# Create new Next.js project with TypeScript
npx create-next-app@latest flemoji-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project directory
cd flemoji-next

# Install additional dependencies
yarn add @prisma/client @auth/prisma-adapter
yarn add -D prisma @types/node
```

### 2. Install Core Dependencies

```bash
# Authentication
yarn add next-auth

# Database & ORM
yarn add @prisma/client
yarn add -D prisma

# File handling & validation
yarn add multer @types/multer
yarn add zod

# UI Components & Styling
yarn add @heroui/react @heroui/theme
yarn add @heroui/system
yarn add next-themes
yarn add framer-motion
yarn add clsx tailwind-merge

# Audio handling
yarn add howler @types/howler

# Date handling
yarn add date-fns

# Form handling
yarn add react-hook-form @hookform/resolvers
```

### 3. Project Structure Setup

Create the following folder structure:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── artist/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── tracks/
│   │   ├── upload/
│   │   └── stripe/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   └── music/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   └── validations.ts
├── types/
│   └── index.ts
└── hooks/
    └── use-audio.ts
```

### 4. Configuration Files

#### Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost', 'your-s3-bucket.s3.amazonaws.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Tailwind Configuration (`tailwind.config.ts`)
```typescript
import type { Config } from 'tailwindcss'
import { heroui } from '@heroui/react'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom theme colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
          DEFAULT: '#eab308',
          foreground: '#000000',
        },
        // Music streaming specific colors
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          DEFAULT: '#0ea5e9',
          foreground: '#ffffff',
        },
        // Dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-secondary': '0 0 20px rgba(234, 179, 8, 0.3)',
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
            DEFAULT: '#22c55e',
            foreground: '#ffffff',
          },
          secondary: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
            950: '#422006',
            DEFAULT: '#eab308',
            foreground: '#000000',
          },
          accent: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#082f49',
            DEFAULT: '#0ea5e9',
            foreground: '#ffffff',
          },
          background: '#ffffff',
          foreground: '#0f172a',
          content1: '#ffffff',
          content2: '#f8fafc',
          content3: '#f1f5f9',
          content4: '#e2e8f0',
          default: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            DEFAULT: '#64748b',
            foreground: '#ffffff',
          },
          focus: '#22c55e',
        },
      },
      dark: {
        colors: {
          primary: {
            50: '#052e16',
            100: '#14532d',
            200: '#15803d',
            300: '#16a34a',
            400: '#22c55e',
            500: '#4ade80',
            600: '#86efac',
            700: '#bbf7d0',
            800: '#dcfce7',
            900: '#f0fdf4',
            950: '#f0fdf4',
            DEFAULT: '#4ade80',
            foreground: '#052e16',
          },
          secondary: {
            50: '#422006',
            100: '#713f12',
            200: '#a16207',
            300: '#ca8a04',
            400: '#eab308',
            500: '#facc15',
            600: '#fde047',
            700: '#fef08a',
            800: '#fef9c3',
            900: '#fefce8',
            950: '#fefce8',
            DEFAULT: '#facc15',
            foreground: '#422006',
          },
          accent: {
            50: '#082f49',
            100: '#0c4a6e',
            200: '#075985',
            300: '#0369a1',
            400: '#0284c7',
            500: '#0ea5e9',
            600: '#38bdf8',
            700: '#7dd3fc',
            800: '#bae6fd',
            900: '#e0f2fe',
            950: '#f0f9ff',
            DEFAULT: '#0ea5e9',
            foreground: '#082f49',
          },
          background: '#0f172a',
          foreground: '#f8fafc',
          content1: '#0f172a',
          content2: '#1e293b',
          content3: '#334155',
          content4: '#475569',
          default: {
            50: '#0f172a',
            100: '#1e293b',
            200: '#334155',
            300: '#475569',
            400: '#64748b',
            500: '#94a3b8',
            600: '#cbd5e1',
            700: '#e2e8f0',
            800: '#f1f5f9',
            900: '#f8fafc',
            DEFAULT: '#475569',
            foreground: '#f8fafc',
          },
          focus: '#4ade80',
        },
      },
    },
  })],
}

export default config
```

### 5. Environment Variables Setup

Create `.env.local` file:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flemoji_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Spotify API (for future integration)
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
```

### 6. Basic Utility Functions

#### `src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
```

#### `src/lib/validations.ts`
```typescript
import { z } from "z"

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const trackSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  genre: z.string().min(1, "Genre is required"),
  album: z.string().optional(),
  description: z.string().optional(),
})

export type UserFormData = z.infer<typeof userSchema>
export type TrackFormData = z.infer<typeof trackSchema>
```

### 7. Basic Types

#### `src/types/index.ts`
```typescript
export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'artist' | 'admin'
  isPremium: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Track {
  id: string
  title: string
  artistId: string
  artist: User
  fileUrl: string
  coverImageUrl?: string
  genre: string
  album?: string
  duration: number
  playCount: number
  createdAt: Date
  updatedAt: Date
}

export interface PlayEvent {
  id: string
  trackId: string
  userId?: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface SmartLink {
  id: string
  trackId: string
  track: Track
  slug: string
  platformLinks: PlatformLink[]
  clickCount: number
  createdAt: Date
}

export interface PlatformLink {
  id: string
  smartLinkId: string
  platform: 'spotify' | 'apple-music' | 'youtube' | 'soundcloud'
  url: string
  clickCount: number
}
```

### 8. Hero UI Provider Setup

#### `src/components/providers/HeroUIProvider.tsx`
```typescript
'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

interface HeroUIProviderProps {
  children: ReactNode
}

export default function HeroUIProviderWrapper({ children }: HeroUIProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      themes={['light', 'dark']}
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  )
}
```

#### `src/components/layout/Header.tsx`
```typescript
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Switch,
  useTheme
} from '@heroui/react'
import { useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { 
  MusicNoteIcon, 
  Bars3Icon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useNextTheme()
  const { isDark } = useTheme()

  const menuItems = [
    { name: 'Browse', href: '/browse' },
    { name: 'Artists', href: '/artists' },
    { name: 'Search', href: '/search' },
  ]

  return (
    <Navbar 
      onMenuOpenChange={setIsMenuOpen}
      className="bg-background/80 backdrop-blur-md border-b border-divider"
      maxWidth="full"
      position="sticky"
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <MusicNoteIcon className="w-8 h-8 text-primary" />
            <p className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Flemoji
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.name}>
            <Link 
              href={item.href}
              className="text-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        {/* Theme Toggle */}
        <NavbarItem>
          <Switch
            isSelected={isDark}
            onValueChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            size="sm"
            color="primary"
            thumbIcon={({ isSelected, className }) =>
              isSelected ? (
                <MoonIcon className={className} />
              ) : (
                <SunIcon className={className} />
              )
            }
          />
        </NavbarItem>

        {session ? (
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={session.user?.name || 'User'}
                  size="sm"
                  src={session.user?.image || undefined}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{session.user?.email}</p>
                </DropdownItem>
                <DropdownItem key="dashboard" startContent={<UserIcon className="w-4 h-4" />}>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownItem>
                {session.user?.role === 'ARTIST' && (
                  <DropdownItem key="artist" startContent={<MusicNoteIcon className="w-4 h-4" />}>
                    <Link href="/artist/dashboard">Artist Dashboard</Link>
                  </DropdownItem>
                )}
                <DropdownItem key="settings" startContent={<Cog6ToothIcon className="w-4 h-4" />}>
                  <Link href="/settings">Settings</Link>
                </DropdownItem>
                <DropdownItem 
                  key="logout" 
                  color="danger" 
                  startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                  onPress={() => signOut()}
                >
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <>
            <NavbarItem className="hidden lg:flex">
              <Link href="/login">
                <Button variant="light" color="default">
                  Login
                </Button>
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/register">
                <Button color="primary" variant="solid">
                  Sign Up
                </Button>
              </Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link
              href={item.href}
              className="w-full text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {!session && (
          <>
            <NavbarMenuItem>
              <Link
                href="/login"
                className="w-full text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Link
                href="/register"
                className="w-full text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </Navbar>
  )
}
```

### 9. Root Layout Update

#### `src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider'
import SessionProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flemoji - Music Streaming Platform',
  description: 'Discover and stream music from independent artists',
  keywords: ['music', 'streaming', 'artists', 'discovery', 'playlist'],
  authors: [{ name: 'Flemoji Team' }],
  creator: 'Flemoji',
  publisher: 'Flemoji',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flemoji.com'),
  openGraph: {
    title: 'Flemoji - Music Streaming Platform',
    description: 'Discover and stream music from independent artists',
    url: 'https://flemoji.com',
    siteName: 'Flemoji',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Flemoji Music Streaming Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flemoji - Music Streaming Platform',
    description: 'Discover and stream music from independent artists',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <HeroUIProviderWrapper>
            <div className="min-h-screen bg-background text-foreground">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </HeroUIProviderWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
```

### 10. Homepage

#### `src/app/page.tsx`
```typescript
import Link from 'next/link'
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Chip,
  Divider,
  Image,
  Spacer
} from '@heroui/react'
import { 
  PlayIcon, 
  MusicalNoteIcon, 
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function Home() {
  const features = [
    {
      icon: <MusicalNoteIcon className="w-8 h-8" />,
      title: "Discover Music",
      description: "Explore thousands of tracks from independent artists worldwide"
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Connect Artists",
      description: "Follow your favorite artists and get notified of new releases"
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Track Analytics",
      description: "Detailed insights and performance metrics for artists"
    }
  ]

  const stats = [
    { label: "Artists", value: "10K+" },
    { label: "Tracks", value: "100K+" },
    { label: "Plays", value: "1M+" },
    { label: "Users", value: "50K+" }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-primary-950 dark:via-background dark:to-secondary-950" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-800 rounded-full opacity-20 animate-float" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-200 dark:bg-secondary-800 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-accent-200 dark:bg-accent-800 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Chip 
              color="primary" 
              variant="flat" 
              startContent={<SparklesIcon className="w-4 h-4" />}
              className="mb-6"
            >
              Welcome to the Future of Music
            </Chip>
            
            <h1 className="text-5xl sm:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Flemoji
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-foreground/80 max-w-4xl mx-auto mb-8 leading-relaxed">
              Discover and stream music from independent artists. Upload your music, 
              share it with the world, and track your success across all platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                as={Link}
                href="/browse"
                color="primary"
                size="lg"
                className="w-full sm:w-auto"
                endContent={<PlayIcon className="w-5 h-5" />}
              >
                Start Listening
              </Button>
              <Button
                as={Link}
                href="/register"
                color="secondary"
                variant="bordered"
                size="lg"
                className="w-full sm:w-auto"
                endContent={<ArrowRightIcon className="w-5 h-5" />}
              >
                Join as Artist
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-content2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-foreground/60">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose Flemoji?
            </h2>
            <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
              Experience the next generation of music streaming with powerful features 
              designed for both listeners and artists.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center pb-2">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold">
                      {feature.title}
                    </h3>
                  </CardHeader>
                  <CardBody className="text-center">
                    <p className="text-foreground/60">
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Start Your Musical Journey?
            </h2>
            <p className="text-xl text-foreground/60 mb-8">
              Join thousands of artists and listeners who are already part of the Flemoji community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                href="/register"
                color="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Get Started Free
              </Button>
              <Button
                as={Link}
                href="/browse"
                color="default"
                variant="bordered"
                size="lg"
                className="w-full sm:w-auto"
              >
                Explore Music
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:
1. **Project runs without errors** - `yarn dev` starts successfully
2. **Homepage displays correctly** - Shows modern Hero UI design with animations
3. **Theme system working** - Light/dark mode toggle functions properly
4. **Hero UI components render** - All components display without errors
5. **Mobile responsiveness** - Design adapts to different screen sizes
6. **TypeScript compilation** - No type errors
7. **ESLint passes** - `yarn lint` runs without errors
8. **File structure** - All folders and files created as specified

### Test Commands:
```bash
# Start development server
yarn dev

# Check TypeScript compilation
yarn build

# Run linting
yarn lint

# Check for type errors
npx tsc --noEmit

# Test theme switching
# 1. Click theme toggle in header
# 2. Verify colors change between light/dark
# 3. Check that theme persists on page refresh

# Test mobile responsiveness
# 1. Open browser dev tools
# 2. Test different screen sizes (mobile, tablet, desktop)
# 3. Verify navigation menu works on mobile
# 4. Check that all components scale properly
```

## 🚨 Common Issues & Solutions

### Issue: TypeScript compilation errors
**Solution**: Ensure all dependencies are properly installed and types are available

### Issue: Tailwind CSS not working
**Solution**: Check that `globals.css` imports Tailwind directives and `tailwind.config.ts` is properly configured

### Issue: ESLint errors
**Solution**: Run `yarn lint --fix` to auto-fix formatting issues

## 🎨 Theme System

### **Color Palette**
- **Primary**: Green (`#22c55e`) - Main brand color for buttons, links, and accents
- **Secondary**: Yellow (`#eab308`) - Secondary actions and highlights
- **Accent**: Blue (`#0ea5e9`) - Additional accent color for variety
- **Neutral**: Gray scale for text, backgrounds, and borders

### **Theme Features**
- **Light/Dark Mode**: Automatic theme switching with system preference detection
- **Consistent Colors**: All components use the same color tokens
- **Easy Customization**: Change colors in one place (tailwind.config.ts) and entire theme updates
- **Accessibility**: High contrast ratios and proper color combinations
- **Mobile-First**: Responsive design that works on all screen sizes

### **Component System**
- **Hero UI Components**: Modern, accessible components with built-in theming
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-first approach with breakpoints
- **Consistent Spacing**: Standardized spacing and sizing system

## 📝 Notes
- **Color Scheme**: Green and yellow as primary colors per user preferences
- **Mobile-First**: All components designed for mobile devices first
- **Theme-Based**: Easy color customization through centralized theme configuration
- **Modern Design**: Clean, professional look with smooth animations
- **Accessibility**: WCAG compliant with proper contrast ratios
- **Performance**: Optimized for fast loading and smooth interactions
- **Foundation**: This phase establishes the UI foundation for all subsequent features
- **Version Control**: All configuration files should be committed
- **Environment**: Variables should NOT be committed (only `.env.example`)

## 🔗 Next Phase
Once this phase is complete and tested, proceed to [Phase 2: Authentication Setup](./02-authentication-setup.md)
