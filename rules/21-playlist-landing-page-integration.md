# Phase 21: Playlist Landing Page Integration

## 🎯 Objective

Integrate the playlist system into the main landing page to showcase curated content and provide an engaging music discovery experience. The landing page will feature playlists prominently and serve as the primary entry point for music streaming.

## 📋 Prerequisites

- Phase 18 (Playlist Management System) completed
- Phase 19 (Admin Playlist Curation) completed
- Phase 20 (Artist Playlist Submissions) completed
- Landing page functional
- Music player system working

## 🚀 Landing Page Layout

### **Main Landing Page Structure**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo, Navigation, Search, User Menu                 │
├─────────────────────────────────────────────────────────────┤
│ Hero Section: Featured Playlist Carousel                   │
├─────────────────────────────────────────────────────────────┤
│ Top Ten Playlist Section                                   │
├─────────────────────────────────────────────────────────────┤
│ Province Playlists Grid (3x3)                              │
├─────────────────────────────────────────────────────────────┤
│ Genre Playlists Grid                                       │
├─────────────────────────────────────────────────────────────┤
│ Footer: Links, Social, Copyright                           │
└─────────────────────────────────────────────────────────────┘
```

### **1. Featured Playlist Carousel**

#### **Desktop Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏆 Featured Playlist                                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [<] Editor's Choice                    [>] [●][○][○]    │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🎵 Midnight Vibes - DJ Khaya        [▶] 3:45       │ │ │
│ │ │ 🎵 Cape Town Nights - Sarah M       [▶] 4:12       │ │ │
│ │ │ 🎵 Township Groove - The Beats      [▶] 3:28       │ │ │
│ │ │ 🎵 Summer Lights - Mike D           [▶] 4:05       │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ "Our handpicked favorites this week"                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### **Mobile Layout**

```
┌─────────────────────────────────────┐
│ 🏆 Featured                        │
├─────────────────────────────────────┤
│ [<] Editor's Choice        [>]      │
│ ┌─────────────────────────────────┐ │
│ │ 🎵 Midnight Vibes - DJ Khaya    │ │
│ │ [▶] 3:45                        │ │
│ └─────────────────────────────────┘ │
│ "Our handpicked favorites"         │
│ [●][○][○]                          │
└─────────────────────────────────────┘
```

### **2. Top Ten Playlist Section**

#### **Desktop Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Top 10 This Week                    [View All] [Play All]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. 🎵 "Midnight Vibes" - DJ Khaya        [▶] 3:45     │ │
│ │ 2. 🎵 "Cape Town Nights" - Sarah M       [▶] 4:12     │ │
│ │ 3. 🎵 "Township Groove" - The Beats      [▶] 3:28     │ │
│ │ 4. 🎵 "Summer Lights" - Mike D           [▶] 4:05     │ │
│ │ 5. 🎵 "City Dreams" - Lisa K             [▶] 3:52     │ │
│ │ 6. 🎵 "Ocean Breeze" - Cape Sound        [▶] 4:18     │ │
│ │ 7. 🎵 "Mountain High" - High Notes       [▶] 3:41     │ │
│ │ 8. 🎵 "Desert Wind" - Sand Storm         [▶] 4:02     │ │
│ │ 9. 🎵 "Forest Path" - Nature Beats       [▶] 3:35     │ │
│ │ 10. 🎵 "Sky Above" - Cloud Nine          [▶] 4:08     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### **Mobile Layout**

```
┌─────────────────────────────────────┐
│ 📊 Top 10 This Week                 │
├─────────────────────────────────────┤
│ 1. 🎵 "Midnight Vibes" - DJ Khaya   │
│    [▶] 3:45                         │
│ 2. 🎵 "Cape Town Nights" - Sarah M  │
│    [▶] 4:12                         │
│ 3. 🎵 "Township Groove" - The Beats │
│    [▶] 3:28                         │
│ ...                                 │
│ [View All] [Play All]               │
└─────────────────────────────────────┘
```

### **3. Province Playlists Grid**

#### **Desktop Layout (3x3)**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏙️ Music by Province                                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Cape Town   │ │ Johannesburg│ │ Durban      │            │
│ │ Sounds      │ │ Beats       │ │ Vibes       │            │
│ │ 12 tracks   │ │ 15 tracks   │ │ 8 tracks    │            │
│ │ [Play]      │ │ [Play]      │ │ [Play]      │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Port        │ │ Pretoria    │ │ Bloem       │            │
│ │ Elizabeth   │ │ Sounds      │ │ Fontein     │            │
│ │ Waves       │ │ 10 tracks   │ │ Beats       │            │
│ │ 7 tracks    │ │ [Play]      │ │ 6 tracks    │            │
│ │ [Play]      │ └─────────────┘ │ [Play]      │            │
│ └─────────────┘                 └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Nelspruit   │ │ Polokwane   │ │ Kimberley   │            │
│ │ Mountains   │ │ Northern    │ │ Diamonds    │            │
│ │ 5 tracks    │ │ Beats       │ │ 4 tracks    │            │
│ │ [Play]      │ │ 3 tracks    │ │ [Play]      │            │
│ └─────────────┘ │ [Play]      │ └─────────────┘            │
│                 └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

#### **Mobile Layout (2x2)**

```
┌─────────────────────────────────────┐
│ 🏙️ Music by Province                │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐    │
│ │ Cape Town   │ │ Johannesburg│    │
│ │ Sounds      │ │ Beats       │    │
│ │ 12 tracks   │ │ 15 tracks   │    │
│ │ [Play]      │ │ [Play]      │    │
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ Durban      │ │ Port        │    │
│ │ Vibes       │ │ Elizabeth   │    │
│ │ 8 tracks    │ │ Waves       │    │
│ │ [Play]      │ │ 7 tracks    │    │
│ └─────────────┘ │ [Play]      │    │
│                 └─────────────┘    │
│ [View All Provinces]               │
└─────────────────────────────────────┘
```

### **4. Genre Playlists Grid**

#### **Desktop Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ 🎵 Browse by Genre                                          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Amapiano    │ │ Gqom        │ │ Afro House  │            │
│ │ Hits        │ │ Essentials  │ │ Vibes       │            │
│ │ 20 tracks   │ │ 15 tracks   │ │ 18 tracks   │            │
│ │ [Play]      │ │ [Play]      │ │ [Play]      │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Kwaito      │ │ Deep House  │ │ Afro Pop    │            │
│ │ Classics    │ │ Sessions    │ │ Favorites   │            │
│ │ 12 tracks   │ │ 22 tracks   │ │ 16 tracks   │            │
│ │ [Play]      │ │ [Play]      │ │ [Play]      │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ [View All Genres]                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### **FeaturedPlaylistCarousel Component**

```typescript
interface FeaturedPlaylistCarouselProps {
  playlist: Playlist;
  tracks: Track[];
  onTrackPlay: (track: Track) => void;
  onPlaylistPlay: (playlist: Playlist) => void;
}

// Features:
// - Auto-rotate every 5 seconds
// - Manual navigation with arrows
// - Dot indicators for current slide
// - Responsive design for mobile
// - Smooth transitions
```

### **TopTenPlaylist Component**

```typescript
interface TopTenPlaylistProps {
  playlist: Playlist;
  tracks: Track[];
  onTrackPlay: (track: Track) => void;
  onPlaylistPlay: (playlist: Playlist) => void;
}

// Features:
// - Numbered track list
// - Play all functionality
// - Individual track play
// - Responsive grid layout
// - Hover effects
```

### **ProvincePlaylistsGrid Component**

```typescript
interface ProvincePlaylistsGridProps {
  playlists: Playlist[];
  onPlaylistPlay: (playlist: Playlist) => void;
  onViewAll: () => void;
}

// Features:
// - 3x3 grid on desktop, 2x2 on mobile
// - Province-specific styling
// - Track count display
// - Play button on hover
// - Responsive design
```

### **GenrePlaylistsGrid Component**

```typescript
interface GenrePlaylistsGridProps {
  playlists: Playlist[];
  onPlaylistPlay: (playlist: Playlist) => void;
  onViewAll: () => void;
}

// Features:
// - Dynamic grid layout
// - Genre-specific styling
// - Track count display
// - Play button on hover
// - Responsive design
```

## 🔧 Implementation Details

### **Landing Page Integration**

#### **Main Landing Page Component**

```typescript
interface LandingPageProps {
  featuredPlaylist: Playlist;
  topTenPlaylist: Playlist;
  provincePlaylists: Playlist[];
  genrePlaylists: Playlist[];
  onTrackPlay: (track: Track) => void;
  onPlaylistPlay: (playlist: Playlist) => void;
}
```

#### **Playlist Data Fetching**

```typescript
// Fetch playlist data for landing page
async function fetchLandingPageData() {
  const [featuredPlaylist, topTenPlaylist, provincePlaylists, genrePlaylists] =
    await Promise.all([
      fetch('/api/playlists/featured'),
      fetch('/api/playlists/top-ten'),
      fetch('/api/playlists/province'),
      fetch('/api/playlists/genre'),
    ]);

  return {
    featuredPlaylist: await featuredPlaylist.json(),
    topTenPlaylist: await topTenPlaylist.json(),
    provincePlaylists: await provincePlaylists.json(),
    genrePlaylists: await genrePlaylists.json(),
  };
}
```

### **API Integration**

#### **Landing Page APIs**

```typescript
// Get featured playlist
GET /api/playlists/featured
Response: {
  playlist: Playlist;
  tracks: Track[];
}

// Get top ten playlist
GET /api/playlists/top-ten
Response: {
  playlist: Playlist;
  tracks: Track[];
}

// Get province playlists
GET /api/playlists/province
Response: {
  playlists: Playlist[];
}

// Get genre playlists
GET /api/playlists/genre?limit=6
Response: {
  playlists: Playlist[];
}
```

#### **Playlist Detail APIs**

```typescript
// Get playlist with tracks
GET /api/playlists/[id]?includeTracks=true
Response: {
  playlist: Playlist;
  tracks: Track[];
}

// Play playlist
POST /api/playlists/[id]/play
Response: {
  success: boolean;
  message: string;
}
```

### **State Management**

#### **Landing Page State**

```typescript
interface LandingPageState {
  featuredPlaylist: Playlist | null;
  topTenPlaylist: Playlist | null;
  provincePlaylists: Playlist[];
  genrePlaylists: Playlist[];
  loading: boolean;
  error: string | null;
  currentPlaying: {
    playlist: Playlist | null;
    track: Track | null;
  };
}
```

#### **Playlist State**

```typescript
interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  tracks: Track[];
  loading: boolean;
  error: string | null;
}
```

## 📱 Responsive Design

### **Breakpoints**

```css
/* Mobile First Approach */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
```

### **Grid Layouts**

```css
/* Province Playlists Grid */
.province-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 1024px) {
  .province-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Genre Playlists Grid */
.genre-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .genre-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🎵 Music Player Integration

### **Playlist Playback**

```typescript
// Play entire playlist
function playPlaylist(playlist: Playlist, tracks: Track[]) {
  // Set playlist as current
  setCurrentPlaylist(playlist);

  // Play first track
  playTrack(tracks[0]);

  // Queue remaining tracks
  queueTracks(tracks.slice(1));
}

// Play single track from playlist
function playTrackFromPlaylist(track: Track, playlist: Playlist) {
  // Set playlist context
  setCurrentPlaylist(playlist);

  // Play track
  playTrack(track);
}
```

### **Playlist Context**

```typescript
interface PlaylistContext {
  currentPlaylist: Playlist | null;
  playlistTracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (track: Track) => void;
  playPlaylist: (playlist: Playlist) => void;
}
```

## 📊 Analytics Integration

### **Playlist Analytics Tracking**

```typescript
// Track playlist views
function trackPlaylistView(playlistId: string) {
  fetch('/api/analytics/playlist-view', {
    method: 'POST',
    body: JSON.stringify({ playlistId }),
  });
}

// Track playlist plays
function trackPlaylistPlay(playlistId: string, trackId: string) {
  fetch('/api/analytics/playlist-play', {
    method: 'POST',
    body: JSON.stringify({ playlistId, trackId }),
  });
}

// Track playlist likes
function trackPlaylistLike(playlistId: string) {
  fetch('/api/analytics/playlist-like', {
    method: 'POST',
    body: JSON.stringify({ playlistId }),
  });
}
```

## 🔒 Performance Optimization

### **Lazy Loading**

```typescript
// Lazy load playlist components
const FeaturedPlaylistCarousel = lazy(
  () => import('./FeaturedPlaylistCarousel')
);
const TopTenPlaylist = lazy(() => import('./TopTenPlaylist'));
const ProvincePlaylistsGrid = lazy(() => import('./ProvincePlaylistsGrid'));
const GenrePlaylistsGrid = lazy(() => import('./GenrePlaylistsGrid'));
```

### **Image Optimization**

```typescript
// Optimize playlist cover images
interface OptimizedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: string;
  blurDataURL: string;
}
```

### **Caching Strategy**

```typescript
// Cache playlist data
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedPlaylistData(key: string) {
  const cached = localStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}
```

## 📝 Notes

- Featured playlist carousel auto-rotates every 5 seconds
- Top ten playlist shows numbered tracks 1-10
- Province playlists are limited to 9 (one per province)
- Genre playlists show up to 6 on landing page
- All playlists require cover images for visual appeal
- Playlist data is cached for 5 minutes to improve performance
- Analytics are tracked for all playlist interactions

## 🔗 Next Phase

Once this phase is complete, proceed to [Phase 22: Playlist Analytics & Optimization](./22-playlist-analytics-optimization.md)
