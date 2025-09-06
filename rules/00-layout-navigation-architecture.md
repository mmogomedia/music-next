# Layout & Navigation Architecture

## 🎯 Objective

Define the responsive layout system, navigation patterns, and component interactions for the Flemoji music streaming platform, ensuring consistent user experience across all devices and authentication states.

## 📱 Layout System Overview

### **Responsive Layout Strategy**

- **Mobile-First Design**: Optimized for mobile devices with progressive enhancement
- **Breakpoint**: 1024px (lg) - switches between mobile header and desktop sidebar
- **Fixed Elements**: Sidebar (desktop) and music player (all devices)
- **Content Adaptation**: Main content adjusts based on available space

## 🏗️ Component Architecture

### **AppLayout Component**

**Purpose**: Main layout wrapper that orchestrates the entire application layout

**Responsibilities**:

- Screen size detection and responsive behavior
- Navigation component selection (sidebar vs mobile header)
- Main content area positioning and spacing
- Music player integration
- Authentication state management

**Implementation**:

```typescript
// src/components/layout/AppLayout.tsx
export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Music Player - always show */}
        <MusicPlayer />
      </div>
    </div>
  )
}
```

### **Sidebar Component (Desktop)**

**Purpose**: Fixed desktop navigation with authentication-aware content

**Positioning**:

- **Position**: Fixed left sidebar
- **Width**: 256px (w-64)
- **Z-index**: 30 (below music player)
- **Height**: Full viewport height

**Content Structure**:

```
┌─────────────────────────────────┐
│ Logo Section                    │
│ - Brand logo + name             │
│ - Theme toggle button           │
├─────────────────────────────────┤
│ MENU Section                    │
│ - Explore                       │
│ - Albums                        │
│ - Genres                        │
│ - Artist                        │
│ - Dashboard                     │
├─────────────────────────────────┤
│ ACCOUNT Section (if not logged) │
│ - Login                         │
│ - Sign Up                       │
├─────────────────────────────────┤
│ [Spacer - flex-1]               │
├─────────────────────────────────┤
│ User Profile (if logged in)     │
│ - Avatar + name                 │
│ - Dropdown menu                 │
└─────────────────────────────────┘
```

**Authentication Behavior**:

- **Non-authenticated**: Shows MENU + ACCOUNT sections
- **Authenticated**: Shows MENU + User Profile sections
- **Bottom Padding**: 80px to account for music player

### **MobileHeader Component (Mobile)**

**Purpose**: Top navigation bar for mobile devices

**Positioning**:

- **Position**: Fixed top header
- **Height**: 64px
- **Z-index**: 40 (above content, below music player)

**Content Structure**:

```
┌─────────────────────────────────────────────────┐
│ [Menu] [Logo] [Search] [Auth/Avatar]            │
├─────────────────────────────────────────────────┤
│ [Collapsible Menu]                              │
│ - All navigation items                          │
│ - Authentication options                        │
└─────────────────────────────────────────────────┘
```

**Features**:

- Hamburger menu for navigation
- Integrated search bar
- Authentication buttons or user avatar
- Collapsible menu with all navigation options

### **MusicPlayer Component**

**Purpose**: Fixed bottom music player available to all users

**Positioning**:

- **Position**: Fixed bottom
- **Z-index**: 40 (above sidebar, below mobile header)
- **Height**: 80px
- **Width**: Full width

**Content Structure**:

```
┌─────────────────────────────────────────────────┐
│ [Track Info] [Controls] [Volume]                │
│ - Album art     - Play/Pause   - Volume slider  │
│ - Track title   - Previous     - Mute button    │
│ - Artist name   - Next         - Fullscreen     │
│                 - Shuffle                        │
│                 - Repeat                         │
└─────────────────────────────────────────────────┘
```

**Features**:

- Track information display
- Full playback controls
- Progress bar with time display
- Volume control
- Always visible regardless of authentication status

## 🎨 Layout Spacing & Positioning

### **Z-Index Hierarchy**

```css
/* Z-index values for proper layering */
--z-sidebar: 30; /* Desktop sidebar */
--z-mobile-header: 40; /* Mobile header */
--z-music-player: 40; /* Music player */
--z-dropdown: 50; /* Dropdown menus */
--z-modal: 60; /* Modals and overlays */
```

### **Spacing System**

```css
/* Layout spacing values */
--sidebar-width: 256px; /* w-64 */
--header-height: 64px; /* h-16 */
--player-height: 80px; /* h-20 */
--content-padding: 16px; /* p-4 */
--section-spacing: 32px; /* space-y-8 */
```

### **Responsive Breakpoints**

```css
/* Tailwind breakpoints */
--breakpoint-sm: 640px; /* sm */
--breakpoint-md: 768px; /* md */
--breakpoint-lg: 1024px; /* lg - Layout switch point */
--breakpoint-xl: 1280px; /* xl */
--breakpoint-2xl: 1536px; /* 2xl */
```

## 🔐 Authentication-Aware Layout Behavior

### **Navigation Content Adaptation**

#### **Non-Authenticated Users**

```typescript
// Sidebar content for non-authenticated users
const sidebarContent = {
  logo: { show: true, themeToggle: true },
  menu: {
    show: true,
    items: ['Explore', 'Albums', 'Genres', 'Artist', 'Dashboard'],
  },
  account: { show: true, items: ['Login', 'Sign Up'] },
  userProfile: { show: false },
};
```

#### **Authenticated Users**

```typescript
// Sidebar content for authenticated users
const sidebarContent = {
  logo: { show: true, themeToggle: true },
  menu: {
    show: true,
    items: ['Explore', 'Albums', 'Genres', 'Artist', 'Dashboard'],
  },
  account: { show: false },
  userProfile: {
    show: true,
    content: {
      avatar: true,
      name: true,
      email: true,
      dropdown: ['Account', 'Logout'],
    },
  },
};
```

### **Layout Adjustments Based on Authentication**

#### **Sidebar Bottom Spacing**

```typescript
// Always account for music player height
const sidebarClasses = `pb-20`; // 80px bottom padding
```

#### **Main Content Positioning**

```typescript
// Desktop: offset by sidebar width
const mainContentClasses = `ml-64`; // 256px left margin

// Mobile: no offset needed
const mainContentClasses = ``; // No margin
```

## 🎵 Music Player Integration

### **Player Positioning Strategy**

- **Always Visible**: Music player is always rendered regardless of authentication
- **Fixed Bottom**: Positioned at bottom of viewport
- **Full Width**: Spans entire width of viewport
- **Above Content**: Z-index ensures it's always visible

### **Content Area Adjustments**

- **Sidebar**: Bottom padding to prevent overlap
- **Main Content**: No bottom padding needed (player overlays content)
- **Mobile**: No adjustments needed (player is at bottom)

### **Player State Management**

```typescript
// Player state for all users
const playerState = {
  isVisible: true, // Always visible
  isPlaying: false, // Playback state
  currentTrack: null, // Current track info
  volume: 70, // Volume level
  progress: 0, // Playback progress
  isAuthenticated: !!session, // Auth status for features
};
```

## 📱 Responsive Behavior

### **Layout Switching Logic**

```typescript
// Screen size detection
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 1024); // lg breakpoint
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### **Component Rendering Strategy**

```typescript
// Conditional rendering based on screen size
return (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
    {/* Desktop Sidebar */}
    {!isMobile && <Sidebar />}

    {/* Mobile Header */}
    {isMobile && <MobileHeader />}

    {/* Main Content */}
    <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <MusicPlayer />
    </div>
  </div>
)
```

## 🎨 Theme Integration

### **Theme Toggle Placement**

- **Location**: Integrated into logo section
- **Visibility**: Always available regardless of authentication
- **Design**: Subtle button with sun/moon icon
- **Behavior**: Toggles between light and dark modes

### **Theme-Aware Styling**

```typescript
// Theme-aware component styling
const themeClasses = {
  sidebar:
    'bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700',
  content: 'bg-gray-50 dark:bg-slate-900',
  player:
    'bg-gray-900 dark:bg-slate-800 border-t border-gray-700 dark:border-slate-600',
};
```

## 🔧 Implementation Guidelines

### **Component Dependencies**

```typescript
// Required imports for layout components
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
```

### **State Management**

- **Authentication**: NextAuth.js session management
- **Theme**: next-themes for dark/light mode
- **Responsive**: Custom hook for screen size detection
- **Player**: Local state for playback controls

### **Performance Considerations**

- **Lazy Loading**: Components loaded on demand
- **Memoization**: Prevent unnecessary re-renders
- **Event Listeners**: Proper cleanup for resize events
- **Z-index Management**: Consistent layering system

## 📊 Layout Analytics

### **User Behavior Tracking**

- **Navigation Patterns**: Track which sections users visit most
- **Device Usage**: Monitor mobile vs desktop usage
- **Feature Adoption**: Track usage of different navigation items
- **Authentication Flow**: Monitor login/signup conversion

### **Performance Metrics**

- **Layout Shift**: Monitor CLS (Cumulative Layout Shift)
- **Render Time**: Track component render performance
- **Responsive Behavior**: Monitor layout switching performance
- **User Experience**: Track user satisfaction with navigation

## 🚀 Future Enhancements

### **Planned Improvements**

- **Keyboard Navigation**: Full keyboard accessibility
- **Gesture Support**: Swipe gestures for mobile
- **Customizable Layout**: User-configurable sidebar
- **Advanced Theming**: Multiple theme options
- **Accessibility**: Enhanced screen reader support

### **Scalability Considerations**

- **Component Splitting**: Break down large components
- **State Management**: Consider global state for complex interactions
- **Performance**: Optimize for large-scale usage
- **Maintenance**: Ensure easy updates and modifications

This layout and navigation architecture ensures a consistent, responsive, and user-friendly experience across all devices and authentication states while maintaining performance and accessibility standards.
