# Flemoji Rules Archive (Chunk 1)

## 00-implementation-summary.md

# Implementation Summary: Modern Music Streaming Interface

## 🎯 Overview

This document summarizes the comprehensive UI/UX transformation implemented for the Flemoji music streaming platform, including the new responsive layout system, authentication-aware components, and modern design approach.

## 📋 Changes Implemented

### **1. Track Editing & File Protection System**

#### **Comprehensive Track Management**

- **25+ Metadata Fields**: Title, artist, album, genre, composer, year, BPM, ISRC, lyrics, technical details
- **Privacy Controls**: Public/private visibility, download permissions, explicit content flags
- **Copyright Management**: License types, copyright information, distribution rights
- **Advanced Protection**: Audio watermarking, geo-blocking, time restrictions, device limits

#### **Enhanced Upload Flow**

- **Post-Upload Editing**: Automatic track edit form after successful upload
- **Success Notifications**: Green-themed success cards with next steps
- **Real-time Updates**: Immediate UI updates when tracks are modified
- **Library Integration**: Edit buttons on each track in the music library

#### **File Protection Features**

- **Audio Watermarking**: Invisible tracking markers embedded in audio
- **Geographic Blocking**: Country-based access restrictions
- **Time Restrictions**: Time-based access controls with timezone support
- **Device Management**: Mobile/desktop access controls and device limits
- **Streaming Limits**: Concurrent streams, daily/weekly play limits
- **DRM Tokens**: Time-limited access tokens for protected content

#### **Database Schema Enhancement**

- **Enhanced Track Model**: 25+ fields for comprehensive metadata
- **Unique URLs**: Each track gets a unique, trackable URL
- **File Protection Fields**: Watermarking, copyright, license management
- **Analytics Fields**: Play counts, download counts, share counts
- **Privacy Fields**: Public/private, downloadable, explicit content flags

### **2. Layout Architecture Transformation**

#### **Before: Traditional Header-Based Layout**

- Top header navigation for all devices
- Music player only visible for authenticated users
- Marketing hero page for non-authenticated users
- Limited responsive behavior

#### **After: Modern Sidebar + Music Player Layout**

- **Desktop**: Fixed sidebar navigation (256px width)
- **Mobile**: Top header with hamburger menu
- **Music Player**: Always visible at bottom (80px height)
- **Responsive**: Automatic switching at 1024px breakpoint

### **2. Navigation System Redesign**

#### **Desktop Sidebar Structure**

```
┌─────────────────────────────────┐
│ Logo Section                    │
│ - Flemoji branding              │
│ - Theme toggle (sun/moon)       │
├─────────────────────────────────┤
│ MENU Section                    │
│ - Explore (Home)                │
│ - Albums                        │
│ - Genres                        │
│ - Artist                        │
│ - Dashboard                     │
├─────────────────────────────────┤
│ ACCOUNT Section (if not logged) │
│ - Login                         │
│ - Sign Up                       │
├─────────────────────────────────┤
│ [Spacer]                        │
├─────────────────────────────────┤
│ User Profile (if logged in)     │
│ - Avatar + name + email         │
│ - Dropdown: Account, Logout     │
└─────────────────────────────────┘
```

#### **Mobile Header Structure**

```
┌─────────────────────────────────────────────────┐
│ [☰] [Flemoji] [🔍] [Login/Avatar]              │
├─────────────────────────────────────────────────┤
│ [Collapsible Menu]                              │
│ - All navigation items                          │
│ - Authentication options                        │
└─────────────────────────────────────────────────┘
```

### **3. Authentication-Aware UI Behavior**

#### **Non-Authenticated Users**

- **Sidebar**: Shows MENU and ACCOUNT sections
- **User Profile**: Not visible
- **Music Player**: Always visible and functional
- **Theme Toggle**: Available next to logo

#### **Authenticated Users**

- **Sidebar**: Shows MENU section only
- **User Profile**: Shows at bottom with dropdown menu
- **Music Player**: Full functionality + personalized features
- **Theme Toggle**: Available next to logo

### **4. Music Player Integration**

#### **Always-Visible Player**

- **Position**: Fixed bottom (80px height)
- **Z-index**: 40 (above sidebar, below mobile header)
- **Content**: Track info, controls, progress bar, volume
- **Availability**: All users regardless of authentication

#### **Player Features**

- Play/pause, previous, next, shuffle, repeat controls
- Progress bar with time display
- Volume control with mute/unmute
- Track information with album art
- Responsive design for all screen sizes

### **5. Theme System Enhancement**

#### **Subtle Theme Toggle**

- **Location**: Integrated into logo section
- **Design**: Small sun/moon icon button
- **Behavior**: Toggles between light and dark modes
- **Accessibility**: Available to all users

#### **Theme-Aware Components**

- All components support light/dark modes
- Consistent color schemes across the platform
- Smooth transitions between themes

### **6. Responsive Design Implementation**

#### **Breakpoint Strategy**

- **Mobile**: < 1024px - Top header navigation
- **Desktop**: ≥ 1024px - Sidebar navigation
- **Smooth Transitions**: 200-300ms duration

#### **Layout Adaptations**

- **Desktop**: Main content offset by 256px (sidebar width)
- **Mobile**: No offset needed
- **Music Player**: Always at bottom regardless of device

### **7. Component Architecture**

#### **New Components Created**

- `AppLayout.tsx` - Main layout wrapper
- `Sidebar.tsx` - Desktop sidebar navigation
- `MobileHeader.tsx` - Mobile header navigation
- `MusicPlayer.tsx` - Bottom music player

#### **Component Responsibilities**

- **AppLayout**: Screen size detection, component selection
- **Sidebar**: Desktop navigation with auth-aware content
- **MobileHeader**: Mobile navigation with collapsible menu
- **MusicPlayer**: Always-visible music playback controls

### **8. Z-Index Management**

#### **Layering System**

```css
--z-sidebar: 30; /* Desktop sidebar */
--z-mobile-header: 40; /* Mobile header */
--z-music-player: 40; /* Music player */
--z-dropdown: 50; /* Dropdown menus */
--z-modal: 60; /* Modals and overlays */
```

#### **Visual Hierarchy**

- Sidebar below music player
- Mobile header above music player
- Dropdowns above all navigation elements
- Modals above everything

### **9. User Experience Improvements**

#### **Seamless Music Streaming**

- No authentication barriers for music playback
- Consistent interface across all user states
- Professional, modern appearance
- Intuitive navigation patterns

#### **Authentication Flow**

- Clear distinction between authenticated and non-authenticated states
- Easy access to login/signup for non-authenticated users
- User profile management for authenticated users
- Theme switching available to all users

### **10. Performance Optimizations**

#### **Responsive Behavior**

- Efficient screen size detection
- Proper event listener cleanup
- Memoized components to prevent unnecessary re-renders
- Optimized z-index management

#### **Layout Performance**

- Fixed positioning for better performance
- Minimal layout shifts
- Smooth transitions and animations
- Efficient component rendering

## 🎨 Design System Updates

### **Color Palette**

- **Primary**: Blue theme (#3b82f6) for modern look
- **Neutral**: Gray scale for clean interface
- **Accent**: Blue variations for interactive elements

### **Typography**

- **Primary Font**: Inter for clean, modern appearance
- **Weights**: 400-800 for proper hierarchy
- **Sizes**: 12px-48px for various content types

### **Spacing System**

- **Component Padding**: 16px standard
- **Section Spacing**: 32px between sections
- **Card Padding**: 24px for content cards

### **Border Radius**

- **Cards**: 12px for modern appearance
- **Buttons**: 8px for consistency
- **Small Elements**: 4px for subtle details

## 📱 Mobile-First Approach

### **Responsive Strategy**

- **Mobile-First**: Designed for mobile devices first
- **Progressive Enhancement**: Enhanced features for larger screens
- **Touch-Optimized**: 44px minimum touch targets
- **Performance**: Optimized for mobile performance

### **Breakpoint Management**

- **Small**: 640px - Large phones
- **Medium**: 768px - Tablets
- **Large**: 1024px - Layout switch point
- **Extra Large**: 1280px+ - Desktop enhancements

## 🔐 Authentication Integration

### **Public Access Strategy**

- **Music Streaming**: Available to all users
- **Content Discovery**: No barriers to exploration
- **Theme Switching**: Available to all users
- **Basic Functionality**: Full music player access

### **Protected Features**

- **User Profile**: Authentication required
- **Personalized Content**: Authentication required
- **Social Features**: Authentication required
- **Advanced Features**: Role-based access

### **Function-Level Protection**

- **Play Music**: Always available
- **Like Tracks**: Authentication required
- **Add to Playlist**: Authentication required
- **Upload Music**: Artist role required

## 🚀 Implementation Benefits

### **User Experience**

1. **No Barriers**: Users can stream music without authentication
2. **Consistent Interface**: Same experience across all user states
3. **Modern Design**: Professional, state-of-the-art appearance
4. **Intuitive Navigation**: Clear, logical navigation patterns

### **Technical Benefits**

1. **Responsive Design**: Works seamlessly across all devices
2. **Performance**: Optimized for speed and efficiency
3. **Maintainability**: Clean, organized component architecture
4. **Scalability**: Easy to extend and modify

### **Business Benefits**

1. **User Engagement**: Lower barriers to entry
2. **Conversion**: Users can experience platform before signing up
3. **Analytics**: Track behavior for both authenticated and anonymous users
4. **Professional Image**: Modern, polished appearance

## 📊 Analytics & Tracking

### **User Behavior**

- **Navigation Patterns**: Track which sections users visit
- **Device Usage**: Monitor mobile vs desktop usage
- **Authentication Flow**: Track login/signup conversion
- **Feature Adoption**: Monitor usage of different features

### **Performance Metrics**

- **Layout Shift**: Monitor CLS (Cumulative Layout Shift)
- **Render Time**: Track component render performance
- **User Experience**: Monitor user satisfaction
- **Conversion Rates**: Track anonymous to authenticated conversion

## 🔧 Technical Implementation

### **Dependencies**

- **NextAuth.js**: Authentication management
- **next-themes**: Theme switching
- **HeroUI**: Component library
- **Tailwind CSS**: Styling system
- **Heroicons**: Icon library

### **State Management**

- **Authentication**: NextAuth.js session management
- **Theme**: next-themes for dark/light mode
- **Responsive**: Custom hook for screen size detection
- **Player**: Local state for playback controls

### **File Structure**

```
src/components/
├── layout/
│   ├── AppLayout.tsx          # Main layout wrapper
│   ├── Sidebar.tsx            # Desktop sidebar
│   └── MobileHeader.tsx       # Mobile header
├── music/
│   └── MusicPlayer.tsx        # Music player
├── track/
│   ├── TrackEditForm.tsx      # Comprehensive track editing form
│   ├── TrackEditModal.tsx     # Modal wrapper for track editing
│   └── TrackProtectionSettings.tsx # Advanced protection settings
├── upload/
│   └── FileUpload.tsx         # Enhanced upload with post-upload editing
└── providers/
    ├── SessionProvider.tsx    # Authentication
    └── HeroUIProvider.tsx     # UI components

src/lib/
└── file-protection.ts         # File protection utilities

src/app/api/tracks/
├── create/route.ts            # Track creation with metadata
└── update/route.ts            # Track updates with validation
```

## 🎯 Future Enhancements

### **Planned Features**

- **Keyboard Shortcuts**: Global keyboard controls
- **Voice Search**: Voice-activated search
- **Offline Support**: Progressive Web App capabilities
- **Advanced Filtering**: Sophisticated content filtering
- **Social Features**: Sharing and collaboration tools

### **Accessibility Improvements**

- **Screen Reader**: Enhanced screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: High contrast mode support
- **Reduced Motion**: Respect user motion preferences

### **11. Centralized API Client System**

#### **Code Duplication Elimination**

- **Before**: 150+ lines of duplicate fetch() calls across components
- **After**: Single centralized API client with consistent error handling
- **Image Upload**: 6 duplicate functions consolidated into 1 utility

#### **API Client Features**

- **Centralized HTTP Methods**: GET, POST, PUT, DELETE, PATCH with automatic auth
- **Error Handling**: Custom ApiError class with status codes and consistent responses
- **Authentication**: Automatic NextAuth.js session handling
- **TypeScript Support**: Fully typed requests and responses
- **Timeout & Retry**: Built-in request timeout and error recovery

#### **Developer Experience Improvements**

- **Simplified API Calls**: One-line method calls instead of complex fetch logic
- **Better Error Handling**: Custom error types with proper status codes
- **Automatic Authentication**: No manual auth header management
- **IntelliSense Support**: Full TypeScript autocomplete and type checking

#### **Components Updated**

- **PlaylistFormDynamic.tsx**: 20 lines → 8 lines (-60%)
- **TrackEditForm.tsx**: 25 lines → 12 lines (-52%)
- **ProfileImageUpdate.tsx**: 15 lines → 3 lines (-80%)
- **ArtistProfileForm.tsx**: 18 lines → 3 lines (-83%)
- **UnifiedPlaylistManagement.tsx**: Multiple fetch calls → API client methods

## 📝 Conclusion

The implementation of this modern music streaming interface represents a significant upgrade to the Flemoji platform, providing:

1. **Professional Appearance**: State-of-the-art design that rivals top music platforms
2. **Seamless User Experience**: No barriers to music streaming and discovery
3. **Responsive Design**: Perfect experience across all devices
4. **Authentication Integration**: Smart, context-aware user interface
5. **Performance Optimization**: Fast, efficient, and scalable architecture
6. **Code Quality**: Centralized API client eliminating duplication and improving maintainability

This implementation establishes a solid foundation for future development while providing an excellent user experience that encourages engagement and conversion.

---

## 00-landing-page-complete.md

# Landing Page Design & Implementation Documentation

## 🎯 Overview

This comprehensive document covers both the design principles and implementation details for the Flemoji landing page, providing a complete reference for the modern, professional music streaming interface that works seamlessly across all devices and user states.

## 📱 Layout Architecture & Implementation

### **Responsive Layout System**

#### **Desktop Layout (≥1024px)**

```
┌─────────────────────────────────────────────────┐
│ [Fixed Sidebar] │ [Main Content Area]           │
│                 │                               │
│ - Logo + Theme  │ - StreamingHero (Featured)    │
│   Toggle        │ - TopTenTracks                │
│ - MENU          │ - ProvincialPlaylists         │
│   • Explore     │ - GenrePlaylists              │
│   • Albums      │                               │
│   • Genres      │                               │
│   • Artist      │                               │
│   • Dashboard   │                               │
│                 │                               │
│ - ACCOUNT       │                               │
│ (if not logged) │                               │
│                 │                               │
│ [User Profile]  │                               │
│ (if logged in)  │                               │
│                 │ [Music Player - Always]       │
└─────────────────────────────────────────────────┘
```

#### **Mobile Layout (<1024px)**

```
┌─────────────────────────────────────────────────┐
│ [Mobile Header]                                 │
│ - Logo + Menu + Search + Auth                   │
├─────────────────────────────────────────────────┤
│ [Main Content Area]                             │
│ - StreamingHero (Featured)                      │
│ - TopTenTracks                                  │
│ - ProvincialPlaylists                           │
│ - GenrePlaylists                                │
│                                                 │
│ [Music Player - Always]                         │
└─────────────────────────────────────────────────┘
```

### **Component Hierarchy & Implementation**

#### **AppLayout Component**

**Location**: `src/components/layout/AppLayout.tsx`

- **Purpose**: Main layout wrapper that handles responsive behavior
- **Responsibilities**:
  - Detects screen size (mobile vs desktop)
  - Renders appropriate navigation (sidebar vs mobile header)
  - Manages main content area positioning
  - Always renders music player

#### **Sidebar Component (Desktop)**

**Location**: `src/components/layout/Sidebar.tsx`

- **Position**: Fixed left sidebar (256px width)
- **Z-index**: 30 (below music player)
- **Content**:
  - Logo section with theme toggle
  - MENU navigation (always visible)
  - ACCOUNT section (non-authenticated users only)
  - User profile section (authenticated users only)
- **Bottom Padding**: 80px (to account for music player)

#### **MobileHeader Component (Mobile)**

**Location**: `src/components/layout/MobileHeader.tsx`

- **Position**: Fixed top header (64px height)
- **Content**:
  - Logo and branding
  - Hamburger menu
  - Search bar
  - Authentication buttons/avatar
- **Behavior**: Collapsible menu with full navigation

#### **MusicPlayer Component**

**Location**: `src/components/music/MusicPlayer.tsx`

- **Position**: Fixed bottom (always visible)
- **Z-index**: 40 (above sidebar)
- **Height**: 80px
- **Content**:
  - Track information
  - Playback controls
  - Progress bar
  - Volume controls

## 🎵 Landing Page Components Implementation

### **Main Landing Page Structure**

**Location**: `src/app/page.tsx`

```typescript
// Main components imported and used:
import StreamingHero from '@/components/streaming/StreamingHero';
import TopTenTracks from '@/components/streaming/TopTenTracks';
import ProvincialPlaylists from '@/components/streaming/ProvincialPlaylists';
import GenrePlaylists from '@/components/streaming/GenrePlaylists';
```

### **Component Implementation Details**

#### **1. StreamingHero Component**

**Location**: `src/components/streaming/StreamingHero.tsx`

**Purpose**: Displays the featured track section with creative banner design and controls.

**Features:**

- **Featured Track Display**: Shows current featured track with large artwork
- **Creative Banner Design**: Modern gradient backgrounds and visual elements
- **Interactive Controls**: Play, previous/next, and three-dot menu
- **Progress Bar**: Visual progress indicator with "Now Playing" status
- **Track Stats**: Play count, duration, and track number
- **Genre Badge**: Displays track genre with gradient styling

**Layout:**

- **Artwork Section**: 1/4 width with hover effects and featured badge
- **Content Section**: 3/4 width with track info, stats, and controls
- **Controls Position**: Right side of track title (moved from bottom)
- **Three-Dot Menu**: Contains Like, Add to Playlist, Share, and Download options

**State Management:**

```typescript
const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [showMenu, setShowMenu] = useState(false);
```

**API Integration:**

- Fetches from `/api/playlists/featured`
- Handles loading and error states
- Supports track navigation (previous/next)

#### **2. TopTenTracks Component**

**Location**: `src/components/streaming/TopTenTracks.tsx`

**Purpose**: Displays the top 10 tracks in a clean, modern grid layout.

**Features:**

- **2-Track Grid**: Displays 2 tracks per row on desktop
- **Rank Badges**: Blue circular badges showing track position
- **Track Cards**: Clean white cards with subtle shadows
- **Action Buttons**: Play, Like, and Download buttons
- **View All Button**: Blue button linking to full top tracks page

**Layout:**

```typescript
// Grid layout for tracks
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  // Track cards with rank, artwork, info, and actions
</div>
```

**API Integration:**

- Fetches from `/api/playlists/top-ten`
- Handles empty states and loading

#### **3. ProvincialPlaylists Component**

**Location**: `src/components/streaming/ProvincialPlaylists.tsx`

**Purpose**: Displays tracks from different South African provinces with dropdown selection.

**Features:**

- **Province Dropdown**: Inline dropdown with province selection
- **Single Row Display**: Shows 10 tracks in a horizontal scrollable row
- **Track Entries**: Compact design with track number, artwork, and actions
- **Simplified Actions**: Only Play, Like, and Download buttons

**Layout:**

```typescript
// Header with inline dropdown
<div className="flex items-center justify-between">
  <h2>Provincial Playlists</h2>
  <select>/* Province options */</select>
</div>

// Single row of tracks
<div className="flex gap-4 overflow-x-auto">
  // Track entries
</div>
```

**API Integration:**

- Fetches from `/api/playlists/province`
- Loads tracks from `/api/playlists/[id]/tracks`

#### **4. GenrePlaylists Component**

**Location**: `src/components/streaming/GenrePlaylists.tsx`

**Purpose**: Displays tracks from different music genres with filter and editor's choice highlight.

**Features:**

- **Genre Filter**: Dropdown to select different genres
- **Editor's Choice**: Highlighted full-width track at the top
- **3-Track Grid**: Three tracks per row on desktop
- **Compact Design**: Smaller track displays for better space usage
- **Hidden Actions**: Like and Download buttons in three-dot menu

**Layout:**

```typescript
// Editor's Choice (full width)
<div className="mb-6">
  // Large featured track
</div>

// Genre filter
<select>/* Genre options */</select>

// 3-track grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  // Compact track entries
</div>
```

**API Integration:**

- Fetches from `/api/playlists/genre`
- Dynamically loads available genres
- Loads tracks from `/api/playlists/[id]/tracks`

## 🎨 Design System & Styling

### **Color Palette (Implemented)**

```css
/* Primary - Blue theme for modern look */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* Main primary */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;

/* Neutral colors for clean interface */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
--gray-950: #020617;
```

### **Typography (Applied)**

- **Primary Font**: Inter (clean, modern)
- **Headers**: `text-3xl font-bold` with left alignment
- **Track Titles**: `text-lg font-semibold`
- **Track Artists**: `text-sm text-gray-600`
- **Labels**: `text-xs font-bold uppercase tracking-wider`
- **Body Text**: Regular weight (400-500)
- **Small Text**: 12-14px for captions and metadata

### **Spacing System (Implemented)**

- **Section Margins**: `mb-8` (32px between sections)
- **Component Padding**: 16px (p-4)
- **Section Spacing**: 32px (space-y-8)
- **Card Padding**: `p-3` to `p-6` depending on component
- **Button Padding**: 12px vertical, 16px horizontal
- **Button Gaps**: `gap-3` to `gap-6` for control spacing
- **Grid Gaps**: `gap-3` to `gap-4` for track layouts

### **Border Radius & Shadows (Applied)**

- **Cards**: 12px (rounded-xl) with `shadow-sm border border-gray-100 dark:border-slate-700`
- **Buttons**: 8px (rounded-lg) with `shadow-md hover:shadow-lg`
- **Small Elements**: 4px (rounded)
- **Featured Section**: `shadow-2xl` for emphasis

## 🔐 Authentication-Aware Design

### **Navigation Behavior**

#### **Non-Authenticated Users**

- **Sidebar**: Shows MENU and ACCOUNT sections
- **ACCOUNT Section**: Login and Sign Up buttons
- **User Profile**: Not visible
- **Music Player**: Always visible (read-only mode)

#### **Authenticated Users**

- **Sidebar**: Shows MENU section only
- **User Profile**: Shows at bottom of sidebar
  - User avatar and name
  - Dropdown menu with Account and Logout
- **Music Player**: Full functionality available

### **Theme Switching**

- **Location**: Subtle button next to logo
- **Icon**: Sun/Moon icon that changes based on current theme
- **Behavior**: Toggles between light and dark modes
- **Accessibility**: Available to all users regardless of auth status

## 📱 Responsive Design Implementation

### **Mobile First Approach**

```css
/* Mobile: < 640px */
- Single column layout
- Mobile header with hamburger menu
- Stacked content sections
- Touch-optimized controls

/* Tablet: 640px - 1024px */
- Two column layout for content
- Larger touch targets
- Optimized spacing

/* Desktop: ≥ 1024px */
- Sidebar + main content layout
- Hover states and interactions
- Full feature set available
```

### **Layout Transitions**

- **Smooth Transitions**: 200-300ms duration
- **Hover Effects**: Scale and color changes
- **Loading States**: Skeleton screens and spinners
- **Error States**: Clear error messages and recovery options

## 🎯 User Experience Patterns

### **Navigation Patterns**

- **Active States**: Blue accent color with dot indicator
- **Hover States**: Subtle background color changes
- **Focus States**: Clear focus indicators for accessibility
- **Loading States**: Skeleton screens during data fetching

### **Content Discovery**

- **Search**: Prominent search bar with autocomplete
- **Categories**: Clear section headers and organization
- **Recommendations**: Personalized content based on user behavior
- **Trending**: Popular content prominently displayed

### **Interaction Feedback**

- **Immediate Response**: Buttons respond instantly to clicks
- **Visual Feedback**: Loading states and success indicators
- **Error Handling**: Clear error messages with recovery options
- **Accessibility**: Screen reader support and keyboard navigation

## 🔧 Technical Implementation

### **Component Structure**

```
src/components/
├── layout/
│   ├── AppLayout.tsx          # Main layout wrapper
│   ├── Sidebar.tsx            # Desktop sidebar navigation
│   └── MobileHeader.tsx       # Mobile header navigation
├── streaming/
│   ├── StreamingHero.tsx      # Featured track section
│   ├── TopTenTracks.tsx       # Top 10 tracks grid
│   ├── ProvincialPlaylists.tsx # Provincial playlists
│   └── GenrePlaylists.tsx     # Genre playlists
├── music/
│   └── MusicPlayer.tsx        # Bottom music player
└── providers/
    ├── SessionProvider.tsx    # Authentication context
    └── HeroUIProvider.tsx     # UI component provider
```

### **State Management**

- **Authentication**: NextAuth.js session management
- **Theme**: next-themes for dark/light mode
- **Responsive**: Custom hook for screen size detection
- **Music Player**: Local state for playback controls
- **Component State**: Each component manages its own loading, error, and data states

### **API Integration**

All components use consistent API patterns:

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### **Performance Optimizations**

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js Image component
- **Bundle Splitting**: Route-based code splitting
- **Caching**: Static generation where possible
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens for better perceived performance

## 📊 Data Flow & User Interactions

### **Component Data Flow**

```
API Endpoints → Component State → UI Rendering
     ↓              ↓              ↓
/api/playlists → useState() → JSX Components
```

### **User Interactions**

```
User Action → Event Handler → State Update → UI Update
     ↓              ↓              ↓            ↓
Click Play → handlePlay() → setIsPlaying() → Button Icon Change
```

## 📊 Analytics & Tracking

### **User Behavior Tracking**

- **Page Views**: Track navigation patterns
- **Music Plays**: Track listening behavior (anonymous and authenticated)
- **Search Queries**: Track search patterns
- **Feature Usage**: Track which features are used most

### **Performance Metrics**

- **Page Load Times**: Monitor Core Web Vitals
- **User Engagement**: Time spent on platform
- **Conversion Rates**: Anonymous to authenticated user conversion
- **Error Rates**: Track and monitor application errors

## 🐛 Known Issues & Solutions

### **Image Loading**

- **Issue**: Some track images may fail to load
- **Solution**: Fallback to default music icon
- **Implementation**: Error handling in image components

### **Long Track Titles**

- **Issue**: Long titles could push controls off-screen
- **Solution**: Implemented proper truncation with `max-w-2xl` and `text-ellipsis`
- **Implementation**: CSS truncation with flex layout constraints

### **Mobile Performance**

- **Issue**: Large track lists on mobile
- **Solution**: Implemented compact designs and lazy loading
- **Implementation**: Responsive grids and optimized components

## 📝 Maintenance Guidelines

### **Adding New Sections**

1. Create component in `src/components/streaming/`
2. Add to main page imports and layout
3. Follow existing design patterns and API structure
4. Test responsive behavior and accessibility

### **Updating Styles**

1. Maintain consistency with existing design system
2. Test in both light and dark modes
3. Ensure responsive behavior across breakpoints
4. Update documentation for significant changes

### **API Changes**

1. Update component API calls
2. Handle new data structures
3. Update TypeScript interfaces
4. Test error handling and loading states

## 🚀 Future Enhancements

### **Planned Features**

- **Keyboard Shortcuts**: Global keyboard controls
- **Voice Search**: Voice-activated search functionality
- **Offline Support**: Progressive Web App capabilities
- **Advanced Filtering**: More sophisticated content filtering
- **Social Features**: Sharing and collaboration tools
- **Infinite Scroll**: Load more tracks as user scrolls
- **Search Integration**: Search functionality across all sections
- **Personalization**: User-specific recommendations

### **Accessibility Improvements**

- **Screen Reader**: Enhanced screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: High contrast mode support
- **Reduced Motion**: Respect user motion preferences

### **Performance Improvements**

- **Virtual Scrolling**: For large track lists
- **Image Optimization**: WebP format and lazy loading
- **Caching**: Implement proper caching strategies
- **Bundle Optimization**: Code splitting and tree shaking

This comprehensive documentation ensures a modern, professional, and accessible music streaming experience that works seamlessly across all devices and user states, providing both design principles and implementation details for complete understanding and maintenance.

---

## 00-layout-navigation-architecture.md

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

---

## 00-ui-design-system.md

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

> **Note**: This design system uses **solid colors only** - no gradients are used anywhere in the application to maintain a clean, modern aesthetic.

#### **Primary Colors**

```css
/* Blue - Main brand color (Solid, no gradients) */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;
--primary-600: #2563eb; /* Main primary */
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;
```

#### **Secondary Colors**

```css
/* Yellow - Secondary actions */
--secondary-50: #fefce8;
--secondary-100: #fef9c3;
--secondary-200: #fef08a;
--secondary-300: #fde047;
--secondary-400: #facc15;
--secondary-500: #eab308; /* Main secondary */
--secondary-600: #ca8a04;
--secondary-700: #a16207;
--secondary-800: #854d0e;
--secondary-900: #713f12;
--secondary-950: #422006;
```

#### **Accent Colors**

```css
/* Blue - Additional variety */
--accent-50: #f0f9ff;
--accent-100: #e0f2fe;
--accent-200: #bae6fd;
--accent-300: #7dd3fc;
--accent-400: #38bdf8;
--accent-500: #0ea5e9; /* Main accent */
--accent-600: #0284c7;
--accent-700: #0369a1;
--accent-800: #075985;
--accent-900: #0c4a6e;
--accent-950: #082f49;
```

#### **Neutral Colors**

```css
/* Gray scale for text and backgrounds */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
--gray-950: #020617;
```

### **Typography**

#### **Font Families**

```css
/* Primary font - Inter */
font-family:
  'Inter',
  system-ui,
  -apple-system,
  sans-serif;

/* Monospace font - JetBrains Mono */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

#### **Font Scale**

```css
/* Headings */
--text-6xl: 3.75rem; /* 60px - Hero titles */
--text-5xl: 3rem; /* 48px - Page titles */
--text-4xl: 2.25rem; /* 36px - Section titles */
--text-3xl: 1.875rem; /* 30px - Subsection titles */
--text-2xl: 1.5rem; /* 24px - Card titles */
--text-xl: 1.25rem; /* 20px - Large text */
--text-lg: 1.125rem; /* 18px - Body large */
--text-base: 1rem; /* 16px - Body text */
--text-sm: 0.875rem; /* 14px - Small text */
--text-xs: 0.75rem; /* 12px - Caption text */
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
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
--space-32: 8rem; /* 128px */
```

### **Border Radius**

```css
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px */
--radius-base: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px; /* Fully rounded */
```

### **Shadows**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md:
  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg:
  0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl:
  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

#### **Desktop Sidebar Navigation**

- Fixed left sidebar (256px width)
- Authentication-aware content
- Logo section with theme toggle
- MENU section with navigation items
- ACCOUNT section for non-authenticated users
- User profile section for authenticated users
- Bottom padding to account for music player

#### **Mobile Header Navigation**

- Fixed top header (64px height)
- Hamburger menu for navigation
- Integrated search bar
- Authentication buttons or user avatar
- Collapsible menu with all navigation options

#### **Music Player Navigation**

- Fixed bottom position (80px height)
- Always visible regardless of authentication
- Full playback controls
- Track information display
- Volume and progress controls

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
--breakpoint-xs: 475px; /* Small phones */
--breakpoint-sm: 640px; /* Large phones */
--breakpoint-md: 768px; /* Tablets */
--breakpoint-lg: 1024px; /* Small laptops */
--breakpoint-xl: 1280px; /* Large laptops */
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
--duration-fast: 150ms; /* Micro-interactions */
--duration-normal: 300ms; /* Standard transitions */
--duration-slow: 500ms; /* Page transitions */
--duration-slower: 800ms; /* Complex animations */
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

- Fixed bottom position on all devices (80px height)
- Always visible regardless of authentication status
- Visual feedback for play/pause
- Progress bar with seek functionality
- Volume control with mute/unmute
- Track information display with album art
- Full playback controls (play, pause, previous, next, shuffle, repeat)
- Responsive design that adapts to screen size
- Z-index 40 to appear above sidebar but below mobile header

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
│   ├── ui/                       # Base UI components (HeroUI)
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
├── ui/              # Base UI components (HeroUI)
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
TrackCard.tsx;
AudioPlayer.tsx;
UserDashboard.tsx;

// kebab-case for utility files
format - duration.ts;
audio - utils.ts;
validation - helpers.ts;
```

##### **Index Files**

```typescript
// components/music/index.ts
export { default as TrackCard } from './track/TrackCard';
export { default as AudioPlayer } from './player/AudioPlayer';
export { default as ArtistCard } from './artist/ArtistCard';

// Re-export with barrel exports
export * from './track';
export * from './player';
export * from './artist';
```

##### **Storybook Files**

```typescript
// TrackCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import TrackCard from './TrackCard';

const meta: Meta<typeof TrackCard> = {
  title: 'Music/TrackCard',
  component: TrackCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    track: {
      id: '1',
      title: 'Sample Track',
      artist: { name: 'Sample Artist' },
      duration: 180,
    },
  },
};
```

#### **Import/Export Patterns**

##### **Component Imports**

```typescript
// Preferred: Named imports from index files
import { TrackCard, AudioPlayer, ArtistCard } from '@/components/music';

// Alternative: Direct imports for specific components
import TrackCard from '@/components/music/track/TrackCard';
import AudioPlayer from '@/components/music/player/AudioPlayer';
```

##### **Type Imports**

```typescript
// Import types from dedicated type files
import type { Track, Artist, Playlist } from '@/types/music';
import type { User, Session } from '@/types/auth';
```

##### **Utility Imports**

```typescript
// Import utilities from lib folder
import { formatDuration, formatFileSize } from '@/lib/utils';
import { useAudio } from '@/lib/hooks/use-audio';
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
export { default as TrackCard } from './TrackCard';
export { default as TrackList } from './TrackList';
export { default as TrackItem } from './TrackItem';
export { default as TrackGrid } from './TrackGrid';

// Export types if needed
export type { TrackCardProps } from './TrackCard';
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
  title: string;
  artist: string;

  // Optional props with defaults
  isPlaying?: boolean;
  size?: 'sm' | 'md' | 'lg';

  // Event handlers
  onPlay?: () => void;
  onLike?: () => void;

  // Styling
  className?: string;
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
- HeroUI documentation
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

---

## 01-project-setup.md

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
};

module.exports = nextConfig;
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
import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

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
        },
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
        float: 'float 6s ease-in-out infinite',
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
        xs: '475px',
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
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium:
          '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        large:
          '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-secondary': '0 0 20px rgba(234, 179, 8, 0.3)',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
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
    }),
  ],
};

export default config;
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
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

#### `src/lib/validations.ts`

```typescript
import { z } from 'z';

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const trackSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  genre: z.string().min(1, 'Genre is required'),
  album: z.string().optional(),
  description: z.string().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
export type TrackFormData = z.infer<typeof trackSchema>;
```

### 7. Basic Types

#### `src/types/index.ts`

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'artist' | 'admin';
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artist: User;
  fileUrl: string;
  coverImageUrl?: string;
  genre: string;
  album?: string;
  duration: number;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayEvent {
  id: string;
  trackId: string;
  userId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SmartLink {
  id: string;
  trackId: string;
  track: Track;
  slug: string;
  platformLinks: PlatformLink[];
  clickCount: number;
  createdAt: Date;
}

export interface PlatformLink {
  id: string;
  smartLinkId: string;
  platform: 'spotify' | 'apple-music' | 'youtube' | 'soundcloud';
  url: string;
  clickCount: number;
}
```

### 8. HeroUI Provider Setup

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
2. **Homepage displays correctly** - Shows modern HeroUI design with animations
3. **Theme system working** - Light/dark mode toggle functions properly
4. **HeroUI components render** - All components display without errors
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

- **HeroUI Components**: Modern, accessible components with built-in theming
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

---
