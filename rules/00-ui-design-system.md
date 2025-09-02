# UI/UX Design System & Guidelines

## 🎯 Objective
Establish a comprehensive design system and UI/UX guidelines that ensure consistency, accessibility, and modern design across all phases of the Flemoji music streaming platform.

## 📋 Design Principles

### **1. Mobile-First Approach**
- Design for mobile devices first, then enhance for larger screens
- Touch-friendly interface with minimum 44px touch targets
- Optimized for one-handed use on mobile devices
- Progressive enhancement for desktop features

### **2. Accessibility First**
- WCAG 2.1 AA compliance for all components
- High contrast ratios (4.5:1 minimum for normal text)
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators and proper ARIA labels

### **3. Performance Optimized**
- Fast loading times (< 3 seconds on 3G)
- Smooth animations (60fps)
- Optimized images and assets
- Lazy loading for non-critical content
- Minimal bundle size impact

### **4. User-Centric Design**
- Intuitive navigation and user flows
- Clear visual hierarchy
- Consistent interaction patterns
- Immediate feedback for user actions
- Error prevention and recovery

## 🎨 Design System

### **Color Palette**

#### **Primary Colors**
```css
/* Green - Main brand color */
--primary-50: #f0fdf4
--primary-100: #dcfce7
--primary-200: #bbf7d0
--primary-300: #86efac
--primary-400: #4ade80
--primary-500: #22c55e  /* Main primary */
--primary-600: #16a34a
--primary-700: #15803d
--primary-800: #166534
--primary-900: #14532d
--primary-950: #052e16
```

#### **Secondary Colors**
```css
/* Yellow - Secondary actions */
--secondary-50: #fefce8
--secondary-100: #fef9c3
--secondary-200: #fef08a
--secondary-300: #fde047
--secondary-400: #facc15
--secondary-500: #eab308  /* Main secondary */
--secondary-600: #ca8a04
--secondary-700: #a16207
--secondary-800: #854d0e
--secondary-900: #713f12
--secondary-950: #422006
```

#### **Accent Colors**
```css
/* Blue - Additional variety */
--accent-50: #f0f9ff
--accent-100: #e0f2fe
--accent-200: #bae6fd
--accent-300: #7dd3fc
--accent-400: #38bdf8
--accent-500: #0ea5e9  /* Main accent */
--accent-600: #0284c7
--accent-700: #0369a1
--accent-800: #075985
--accent-900: #0c4a6e
--accent-950: #082f49
```

#### **Neutral Colors**
```css
/* Gray scale for text and backgrounds */
--gray-50: #f8fafc
--gray-100: #f1f5f9
--gray-200: #e2e8f0
--gray-300: #cbd5e1
--gray-400: #94a3b8
--gray-500: #64748b
--gray-600: #475569
--gray-700: #334155
--gray-800: #1e293b
--gray-900: #0f172a
--gray-950: #020617
```

### **Typography**

#### **Font Families**
```css
/* Primary font - Inter */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace font - JetBrains Mono */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

#### **Font Scale**
```css
/* Headings */
--text-6xl: 3.75rem;    /* 60px - Hero titles */
--text-5xl: 3rem;       /* 48px - Page titles */
--text-4xl: 2.25rem;    /* 36px - Section titles */
--text-3xl: 1.875rem;   /* 30px - Subsection titles */
--text-2xl: 1.5rem;     /* 24px - Card titles */
--text-xl: 1.25rem;     /* 20px - Large text */
--text-lg: 1.125rem;    /* 18px - Body large */
--text-base: 1rem;      /* 16px - Body text */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Caption text */
```

#### **Font Weights**
```css
--font-thin: 100;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### **Spacing System**

#### **Spacing Scale**
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### **Border Radius**

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Fully rounded */
```

### **Shadows**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-glow: 0 0 20px rgba(34, 197, 94, 0.3);
--shadow-glow-secondary: 0 0 20px rgba(234, 179, 8, 0.3);
```

## 🧩 Component Guidelines

### **Buttons**

#### **Primary Button**
```typescript
<Button 
  color="primary" 
  size="lg" 
  className="font-semibold"
>
  Primary Action
</Button>
```

#### **Secondary Button**
```typescript
<Button 
  color="secondary" 
  variant="bordered" 
  size="lg"
>
  Secondary Action
</Button>
```

#### **Button Sizes**
- `sm`: 32px height - For compact spaces
- `md`: 40px height - Default size
- `lg`: 48px height - Prominent actions
- `xl`: 56px height - Hero CTAs

### **Cards**

#### **Track Card**
```typescript
<Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardBody className="p-4">
    <div className="flex items-center gap-4">
      <Image
        src={track.coverImageUrl}
        alt={track.title}
        width={64}
        height={64}
        className="rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{track.title}</h3>
        <p className="text-foreground/60 text-sm truncate">{track.artist}</p>
      </div>
      <Button isIconOnly color="primary" size="sm">
        <PlayIcon className="w-4 h-4" />
      </Button>
    </div>
  </CardBody>
</Card>
```

### **Navigation**

#### **Header Navigation**
- Sticky positioning for easy access
- Mobile-first responsive design
- Clear visual hierarchy
- Accessible keyboard navigation
- Theme toggle prominently placed

#### **Sidebar Navigation** (Dashboard)
- Collapsible on mobile
- Active state indicators
- Icon + text labels
- Grouped by functionality
- Consistent spacing

### **Forms**

#### **Input Fields**
```typescript
<Input
  type="email"
  label="Email"
  placeholder="Enter your email"
  variant="bordered"
  size="lg"
  isRequired
  errorMessage={errors.email}
/>
```

#### **Form Validation**
- Real-time validation feedback
- Clear error messages
- Success states for completed fields
- Accessible error announcements

### **Loading States**

#### **Skeleton Loading**
```typescript
<Skeleton className="rounded-lg">
  <div className="h-4 w-3/5 rounded-lg bg-default-200"></div>
</Skeleton>
```

#### **Spinner Loading**
```typescript
<Spinner size="lg" color="primary" />
```

## 📱 Responsive Design

### **Breakpoints**
```css
/* Mobile First */
--breakpoint-xs: 475px;   /* Small phones */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Large laptops */
--breakpoint-2xl: 1536px; /* Desktops */
--breakpoint-3xl: 1920px; /* Large screens */
```

### **Grid System**
```typescript
// Mobile: 1 column
<div className="grid grid-cols-1 gap-4">

// Tablet: 2 columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
```

### **Container Sizes**
```typescript
// Page containers
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Content containers
<div className="max-w-4xl mx-auto px-4 sm:px-6">

// Narrow containers
<div className="max-w-2xl mx-auto px-4 sm:px-6">
```

## 🎭 Animation Guidelines

### **Transition Timing**
```css
--duration-fast: 150ms;    /* Micro-interactions */
--duration-normal: 300ms;  /* Standard transitions */
--duration-slow: 500ms;    /* Page transitions */
--duration-slower: 800ms;  /* Complex animations */
```

### **Easing Functions**
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### **Animation Types**
- **Fade In**: For content appearing
- **Slide Up**: For modals and dropdowns
- **Scale In**: For buttons and interactive elements
- **Float**: For decorative elements
- **Pulse**: For loading states

## 🎵 Music-Specific Components

### **Audio Player**
- Fixed bottom position on mobile
- Collapsible on desktop
- Visual feedback for play/pause
- Progress bar with seek functionality
- Volume control
- Track information display

### **Track List**
- Consistent card layout
- Play button on hover
- Like/favorite functionality
- Add to playlist options
- Artist information
- Duration display

### **Artist Profile**
- Hero section with cover image
- Bio and social links
- Track grid layout
- Follow/unfollow button
- Statistics display

### **Playlist Interface**
- Drag and drop reordering
- Bulk selection
- Search and filter
- Share functionality
- Collaborative features

## 🌙 Dark Mode Guidelines

### **Color Adaptations**
- Invert primary colors for better contrast
- Adjust background colors for readability
- Maintain brand color relationships
- Ensure sufficient contrast ratios

### **Component Adaptations**
- Adjust shadow intensities
- Modify border colors
- Update image overlays
- Adapt icon colors

## ♿ Accessibility Standards

### **Color Contrast**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum

### **Keyboard Navigation**
- Tab order follows visual hierarchy
- Skip links for main content
- Escape key closes modals
- Arrow keys for menu navigation

### **Screen Reader Support**
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Alt text for all images

## 📊 Performance Guidelines

### **Image Optimization**
- WebP format with fallbacks
- Responsive images with srcset
- Lazy loading for below-fold content
- Optimized file sizes

### **Animation Performance**
- Use transform and opacity for animations
- Avoid animating layout properties
- Respect prefers-reduced-motion
- Hardware acceleration where possible

### **Bundle Optimization**
- Code splitting for routes
- Tree shaking for unused code
- Dynamic imports for heavy components
- Optimized font loading

## 🔧 Implementation Guidelines

### **UI Folder Structure**

#### **Complete Project Structure**
```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── artist/
│   │   └── admin/
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # All React components
│   ├── ui/                       # Base UI components (Hero UI)
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── card/
│   │   │   ├── Card.tsx
│   │   │   ├── CardHeader.tsx
│   │   │   ├── CardBody.tsx
│   │   │   └── index.ts
│   │   ├── input/
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   └── index.ts
│   │   ├── modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── ModalHeader.tsx
│   │   │   ├── ModalBody.tsx
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── index.ts
│   │   ├── data-display/
│   │   │   ├── Table.tsx
│   │   │   ├── List.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   └── index.ts              # Export all UI components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Container.tsx
│   │   ├── PageWrapper.tsx
│   │   └── index.ts
│   ├── music/                    # Music-specific components
│   │   ├── player/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── VolumeControl.tsx
│   │   │   └── index.ts
│   │   ├── track/
│   │   │   ├── TrackCard.tsx
│   │   │   ├── TrackList.tsx
│   │   │   ├── TrackItem.tsx
│   │   │   ├── TrackGrid.tsx
│   │   │   └── index.ts
│   │   ├── artist/
│   │   │   ├── ArtistCard.tsx
│   │   │   ├── ArtistProfile.tsx
│   │   │   ├── ArtistGrid.tsx
│   │   │   └── index.ts
│   │   ├── playlist/
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── PlaylistGrid.tsx
│   │   │   ├── PlaylistItem.tsx
│   │   │   └── index.ts
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── forms/                    # Form components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── index.ts
│   │   ├── music/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── TrackForm.tsx
│   │   │   ├── PlaylistForm.tsx
│   │   │   └── index.ts
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── auth/                     # Authentication components
│   │   ├── AuthGuard.tsx
│   │   ├── ProtectedButton.tsx
│   │   ├── RoleGuard.tsx
│   │   ├── LoginButton.tsx
│   │   └── index.ts
│   ├── dashboard/                # Dashboard components
│   │   ├── artist/
│   │   │   ├── ArtistDashboard.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentTracks.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── TrackManagement.tsx
│   │   │   └── index.ts
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── ContentModeration.tsx
│   │   │   ├── SystemAnalytics.tsx
│   │   │   └── index.ts
│   │   ├── user/
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── PlaylistManager.tsx
│   │   │   ├── FavoriteTracks.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── analytics/                # Analytics components
│   │   ├── charts/
│   │   │   ├── PlayChart.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── AudienceChart.tsx
│   │   │   └── index.ts
│   │   ├── metrics/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── MetricGrid.tsx
│   │   │   ├── TrendIndicator.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── subscription/             # Subscription components
│   │   ├── PricingCard.tsx
│   │   ├── PricingGrid.tsx
│   │   ├── SubscriptionStatus.tsx
│   │   ├── BillingHistory.tsx
│   │   └── index.ts
│   ├── smart-links/              # Smart links components
│   │   ├── SmartLinkCard.tsx
│   │   ├── SmartLinkForm.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── LinkPreview.tsx
│   │   └── index.ts
│   ├── providers/                # Context providers
│   │   ├── HeroUIProvider.tsx
│   │   ├── SessionProvider.tsx
│   │   ├── AudioProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── index.ts
│   ├── common/                   # Shared/common components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   └── index.ts                  # Export all components
├── lib/                          # Utility libraries
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── validations.ts
│   ├── constants.ts
│   └── hooks/
│       ├── use-audio.ts
│       ├── use-theme.ts
│       ├── use-local-storage.ts
│       └── index.ts
├── types/                        # TypeScript type definitions
│   ├── index.ts
│   ├── auth.ts
│   ├── music.ts
│   ├── user.ts
│   └── api.ts
├── styles/                       # Global styles and themes
│   ├── globals.css
│   ├── components.css
│   ├── utilities.css
│   └── themes/
│       ├── light.css
│       ├── dark.css
│       └── custom.css
└── public/                       # Static assets
    ├── images/
    │   ├── logos/
    │   ├── icons/
    │   ├── covers/
    │   └── avatars/
    ├── audio/
    │   └── samples/
    └── favicon.ico
```

#### **Component Organization Principles**

##### **1. Feature-Based Grouping**
```
components/
├── music/           # All music-related components
├── auth/            # All authentication components
├── dashboard/       # All dashboard components
└── analytics/       # All analytics components
```

##### **2. Component Type Grouping**
```
components/
├── ui/              # Base UI components (Hero UI)
├── layout/          # Layout components
├── forms/           # Form components
└── common/          # Shared components
```

##### **3. Nested Component Structure**
```
components/music/player/
├── AudioPlayer.tsx      # Main player component
├── PlayerControls.tsx   # Control buttons
├── ProgressBar.tsx      # Progress indicator
├── VolumeControl.tsx    # Volume slider
├── index.ts            # Export all components
└── __tests__/          # Component tests
    ├── AudioPlayer.test.tsx
    └── PlayerControls.test.tsx
```

#### **File Naming Conventions**

##### **Components**
```typescript
// PascalCase for component files
TrackCard.tsx
AudioPlayer.tsx
UserDashboard.tsx

// kebab-case for utility files
format-duration.ts
audio-utils.ts
validation-helpers.ts
```

##### **Index Files**
```typescript
// components/music/index.ts
export { default as TrackCard } from './track/TrackCard'
export { default as AudioPlayer } from './player/AudioPlayer'
export { default as ArtistCard } from './artist/ArtistCard'

// Re-export with barrel exports
export * from './track'
export * from './player'
export * from './artist'
```

##### **Storybook Files**
```typescript
// TrackCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import TrackCard from './TrackCard'

const meta: Meta<typeof TrackCard> = {
  title: 'Music/TrackCard',
  component: TrackCard,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    track: {
      id: '1',
      title: 'Sample Track',
      artist: { name: 'Sample Artist' },
      duration: 180,
    },
  },
}
```

#### **Import/Export Patterns**

##### **Component Imports**
```typescript
// Preferred: Named imports from index files
import { TrackCard, AudioPlayer, ArtistCard } from '@/components/music'

// Alternative: Direct imports for specific components
import TrackCard from '@/components/music/track/TrackCard'
import AudioPlayer from '@/components/music/player/AudioPlayer'
```

##### **Type Imports**
```typescript
// Import types from dedicated type files
import type { Track, Artist, Playlist } from '@/types/music'
import type { User, Session } from '@/types/auth'
```

##### **Utility Imports**
```typescript
// Import utilities from lib folder
import { formatDuration, formatFileSize } from '@/lib/utils'
import { useAudio } from '@/lib/hooks/use-audio'
```

#### **Component Structure Template**

##### **Standard Component File**
```typescript
// components/music/track/TrackCard.tsx
'use client'

import { useState } from 'react'
import { Card, CardBody, Button } from '@/components/ui'
import { PlayIcon, HeartIcon } from '@heroicons/react/24/outline'
import type { Track } from '@/types/music'

interface TrackCardProps {
  track: Track
  onPlay?: (track: Track) => void
  onLike?: (track: Track) => void
  className?: string
}

export default function TrackCard({ 
  track, 
  onPlay, 
  onLike, 
  className 
}: TrackCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handlePlay = () => {
    onPlay?.(track)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.(track)
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardBody className="p-4">
        {/* Component content */}
      </CardBody>
    </Card>
  )
}
```

##### **Index File Pattern**
```typescript
// components/music/track/index.ts
export { default as TrackCard } from './TrackCard'
export { default as TrackList } from './TrackList'
export { default as TrackItem } from './TrackItem'
export { default as TrackGrid } from './TrackGrid'

// Export types if needed
export type { TrackCardProps } from './TrackCard'
```

#### **Testing Structure**
```
components/
├── music/
│   └── track/
│       ├── TrackCard.tsx
│       ├── TrackCard.test.tsx
│       ├── TrackCard.stories.tsx
│       └── __tests__/
│           ├── TrackCard.test.tsx
│           ├── TrackCard.integration.test.tsx
│           └── fixtures/
│               └── trackData.ts
```

#### **Asset Organization**
```
public/
├── images/
│   ├── logos/
│   │   ├── flemoji-logo.svg
│   │   ├── flemoji-logo-dark.svg
│   │   └── flemoji-icon.png
│   ├── icons/
│   │   ├── music-note.svg
│   │   ├── play-button.svg
│   │   └── pause-button.svg
│   ├── covers/
│   │   ├── default-cover.jpg
│   │   └── placeholder-cover.jpg
│   └── avatars/
│       ├── default-avatar.png
│       └── placeholder-avatar.png
├── audio/
│   └── samples/
│       ├── sample-track.mp3
│       └── notification-sound.mp3
└── favicon.ico
```

This folder structure ensures:
- **Clear organization** by feature and component type
- **Easy navigation** and component discovery
- **Consistent naming** conventions
- **Scalable architecture** that grows with the project
- **Separation of concerns** between UI, logic, and data
- **Easy testing** with dedicated test files
- **Storybook integration** for component documentation

### **Naming Conventions**
- Components: PascalCase (`TrackCard.tsx`)
- Files: kebab-case for utilities (`format-duration.ts`)
- CSS classes: kebab-case (`track-card`)
- Variables: camelCase (`isPlaying`)

### **Props Interface**
```typescript
interface ComponentProps {
  // Required props first
  title: string
  artist: string
  
  // Optional props with defaults
  isPlaying?: boolean
  size?: 'sm' | 'md' | 'lg'
  
  // Event handlers
  onPlay?: () => void
  onLike?: () => void
  
  // Styling
  className?: string
}
```

## 📝 Usage Examples

### **Creating a New Component**
1. Follow the component structure guidelines
2. Use the design system tokens
3. Implement responsive design
4. Add accessibility features
5. Include loading and error states
6. Write comprehensive props interface
7. Add proper TypeScript types

### **Theme Customization**
1. Update colors in `tailwind.config.ts`
2. Test in both light and dark modes
3. Verify contrast ratios
4. Update component variants if needed
5. Test across all breakpoints

## 🔗 Integration with Phases

This design system should be referenced in all phases:
- **Phase 1**: Project setup with design system
- **Phase 2**: Authentication forms and layouts
- **Phase 3**: Database-driven UI components
- **Phase 4**: File upload interfaces
- **Phase 5**: Music player components
- **Phase 6**: User interface components
- **Phase 7**: Artist dashboard layouts
- **Phase 8**: Analytics visualization
- **Phase 9**: Smart link interfaces
- **Phase 10**: Subscription and payment UI
- **Phase 11**: Premium feature interfaces
- **Phase 12**: Admin dashboard layouts
- **Phase 13**: Moderation interfaces
- **Phase 14**: Testing UI components
- **Phase 15**: Production optimization

## 📚 Resources

### **Design Tools**
- Figma for design mockups
- Hero UI documentation
- Tailwind CSS documentation
- Framer Motion examples

### **Accessibility Tools**
- axe DevTools
- WAVE Web Accessibility Evaluator
- Color contrast checkers
- Screen reader testing

### **Performance Tools**
- Lighthouse audits
- WebPageTest
- Bundle analyzer
- Performance monitoring

This design system ensures consistency, accessibility, and modern design across the entire Flemoji platform while providing clear guidelines for implementation and maintenance.
