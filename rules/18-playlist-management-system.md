# Phase 18: Playlist Management System

## 🎯 Objective

Implement a comprehensive playlist management system that allows admins to create, curate, and manage playlists while enabling artists to submit tracks for consideration. The system will power the main landing page with featured content and provide a robust content curation platform.

## 📋 Prerequisites

- Phase 1-17 completed successfully
- Admin dashboard functional
- Artist dashboard functional
- Music upload and streaming system working
- User authentication and role management in place

## 🚀 System Overview

### **Playlist Types & Limits**

#### **Genre Playlists**

- **Limit**: Unlimited
- **Max Tracks**: Configurable (10, 15, 20, 50, 100)
- **Purpose**: Curate music by specific genres
- **Examples**: "Amapiano Hits", "Gqom Essentials", "Afro House Vibes"

#### **Featured Playlists**

- **Limit**: 1 active
- **Max Tracks**: 3-5 tracks
- **Purpose**: Highlight premium content on landing page
- **Display**: Carousel format on main page
- **Examples**: "Editor's Choice", "This Week's Favorites"

#### **Top Ten Playlists**

- **Limit**: 1 active
- **Max Tracks**: 10 tracks
- **Purpose**: Showcase trending/popular content
- **Display**: Grid format on main page
- **Examples**: "Top 10 This Week", "Most Played"

#### **Province Playlists**

- **Limit**: 9 active (one per province)
- **Max Tracks**: Configurable (10, 15, 20, 50, 100)
- **Purpose**: Geographic-based music curation
- **Provinces**: Western Cape, Eastern Cape, Northern Cape, Free State, KwaZulu-Natal, North West, Gauteng, Mpumalanga, Limpopo
- **Examples**: "Cape Town Sounds", "Joburg Beats", "Durban Vibes"

### **Playlist States**

#### **Active/Inactive**

- **Active**: Visible on landing page and available for submissions
- **Inactive**: Hidden from public view, not accepting submissions

#### **Submission Status**

- **Open**: Accepting artist submissions
- **Closed**: Not accepting submissions (admin can still add tracks manually)

### **Track Submission Limits**

- **Per Artist**: Configurable (e.g., 1-5 tracks per playlist)
- **Per Playlist**: Based on playlist max tracks setting
- **Submission Window**: When playlist is open for submissions

## 🎵 Playlist Features

### **Required Fields**

- **Name**: Playlist title
- **Description**: Brief description of playlist content
- **Type**: Genre, Featured, Top Ten, or Province
- **Cover Image**: Visual representation (required)
- **Max Tracks**: 10, 15, 20, 50, or 100
- **Status**: Active/Inactive
- **Submission Status**: Open/Closed
- **Max Submissions per Artist**: 1-5 tracks
- **Province** (if applicable): For province playlists

### **Admin Controls**

- **Create/Edit/Delete**: Full playlist management
- **Toggle Active Status**: Show/hide from landing page
- **Toggle Submission Status**: Open/close for submissions
- **Review Submissions**: Accept/Reject/Shortlist with comments
- **Manual Track Addition**: Add tracks directly to playlists
- **Reorder Tracks**: Change track order within playlists
- **Analytics View**: Track playlist performance

### **Artist Submission Process**

1. **Browse Available Playlists**: View open playlists for submission
2. **Select Tracks**: Choose tracks to submit (within limits)
3. **Submit**: Send tracks for admin review
4. **Track Status**: Monitor submission status
5. **Resubmit**: Submit different tracks if rejected

## 🏗️ Technical Architecture

### **Database Schema**

```typescript
// Playlist Types
enum PlaylistType {
  GENRE = 'genre',
  FEATURED = 'featured',
  TOP_TEN = 'top_ten',
  PROVINCE = 'province',
}

// Playlist Status
enum PlaylistStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Submission Status
enum SubmissionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// Track Submission Status
enum TrackSubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHORTLISTED = 'shortlisted',
}

// Main Playlist Model
interface Playlist {
  id: string;
  name: string;
  description: string;
  type: PlaylistType;
  coverImage: string; // R2 URL
  maxTracks: number; // 10, 15, 20, 50, 100
  currentTracks: number;
  status: PlaylistStatus;
  submissionStatus: SubmissionStatus;
  maxSubmissionsPerArtist: number; // 1-5
  province?: string; // For province playlists
  createdBy: string; // Admin ID
  createdAt: Date;
  updatedAt: Date;
  order: number; // For display ordering
}

// Track Submission Model
interface PlaylistSubmission {
  id: string;
  playlistId: string;
  trackId: string;
  artistId: string;
  status: TrackSubmissionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin ID
  adminComment?: string;
  artistComment?: string; // Optional artist note
}

// Playlist Track Model (approved tracks)
interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  order: number; // Position in playlist
  addedAt: Date;
  addedBy: string; // Admin ID or 'submission'
  submissionId?: string; // If added via submission
}

// Playlist Analytics Model
interface PlaylistAnalytics {
  id: string;
  playlistId: string;
  date: Date;
  views: number;
  plays: number;
  likes: number;
  shares: number;
  uniqueListeners: number;
}
```

### **API Endpoints**

#### **Admin Playlist Management**

```
GET    /api/admin/playlists              # List all playlists
POST   /api/admin/playlists              # Create playlist
GET    /api/admin/playlists/[id]         # Get playlist details
PUT    /api/admin/playlists/[id]         # Update playlist
DELETE /api/admin/playlists/[id]         # Delete playlist
POST   /api/admin/playlists/[id]/tracks  # Add track manually
DELETE /api/admin/playlists/[id]/tracks/[trackId] # Remove track
PUT    /api/admin/playlists/[id]/tracks/reorder # Reorder tracks
```

#### **Submission Management**

```
GET    /api/admin/playlists/[id]/submissions     # Get submissions
PUT    /api/admin/submissions/[id]/review        # Review submission
GET    /api/admin/submissions                    # All pending submissions
```

#### **Artist Submission**

```
GET    /api/playlists/available          # Get open playlists
POST   /api/playlists/[id]/submit        # Submit tracks
GET    /api/playlists/submissions        # Get artist's submissions
```

#### **Public Playlist Access**

```
GET    /api/playlists/featured           # Featured playlists
GET    /api/playlists/top-ten            # Top ten playlist
GET    /api/playlists/province/[province] # Province playlists
GET    /api/playlists/genre/[genre]      # Genre playlists
GET    /api/playlists/[id]               # Get playlist details
```

### **Landing Page Integration**

#### **Display Order**

1. **Featured Playlist**: Carousel (3-5 tracks)
2. **Top Ten Playlist**: Grid format (10 tracks)
3. **Province Playlists**: Grid of 9 province playlists
4. **Genre Playlists**: Grid of genre playlists

#### **Component Structure**

```
LandingPage
├── FeaturedPlaylistCarousel
├── TopTenPlaylist
├── ProvincePlaylistsGrid
└── GenrePlaylistsGrid
```

## 🔧 Implementation Phases

### **Phase 18.1: Database & API Setup**

- Create playlist database schema
- Implement playlist CRUD APIs
- Set up submission system APIs

### **Phase 18.2: Admin Dashboard Integration**

- Add playlist management to admin dashboard
- Implement submission review interface
- Add playlist analytics dashboard

### **Phase 18.3: Artist Submission System**

- Add submission interface to artist dashboard
- Implement track selection and submission flow
- Add submission status tracking

### **Phase 18.4: Landing Page Integration**

- Create playlist display components
- Implement carousel and grid layouts
- Add playlist navigation and filtering

### **Phase 18.5: Analytics & Optimization**

- Implement playlist analytics tracking
- Add performance monitoring
- Optimize playlist loading and caching

## 📊 Analytics & Monitoring

### **Playlist Metrics**

- **Views**: How many times playlist was viewed
- **Plays**: Total track plays from playlist
- **Likes**: Playlist likes and track likes
- **Shares**: Playlist sharing activity
- **Unique Listeners**: Distinct users who listened
- **Completion Rate**: How many tracks were played fully

### **Submission Metrics**

- **Submission Volume**: Tracks submitted per playlist
- **Approval Rate**: Percentage of approved submissions
- **Review Time**: Average time to review submissions
- **Artist Engagement**: Most active submitting artists

## 🔒 Security & Permissions

### **Admin Permissions**

- Full playlist management access
- Submission review and approval
- Analytics and reporting access
- System configuration access

### **Artist Permissions**

- Submit to open playlists
- View own submission status
- Limited playlist browsing (public playlists only)

### **Public Access**

- View active playlists
- Play tracks from playlists
- Like and share playlists
- No submission or management access

## 📝 Notes

- All playlists require cover images for visual appeal
- Province playlists are limited to 9 (one per South African province)
- Featured playlists are limited to 1 active at a time
- Top ten playlists are limited to 1 active at a time
- Genre playlists have no limit but should be curated for quality
- All playlist changes are logged for audit purposes
- Playlist analytics are tracked daily for performance monitoring

## 🔗 Next Phase

Once this phase is complete, proceed to [Phase 19: Admin Playlist Curation Interface](./19-admin-playlist-curation.md)
