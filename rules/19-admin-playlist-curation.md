# Phase 19: Admin Playlist Curation Interface

## 🎯 Objective

Create a comprehensive admin interface for playlist management, submission review, and content curation. This interface will be the central hub for admins to control all playlist-related activities and maintain high-quality content curation.

## 📋 Prerequisites

- Phase 18 (Playlist Management System) completed
- Admin dashboard functional
- Database schema implemented
- API endpoints created

## 🚀 Admin Interface Components

### **1. Playlist Management Dashboard**

#### **Main Playlist List View**

```
┌─────────────────────────────────────────────────────────────┐
│ Playlist Management                    [+ Create Playlist] │
├─────────────────────────────────────────────────────────────┤
│ [All] [Genre] [Featured] [Top Ten] [Province] [Inactive]   │
├─────────────────────────────────────────────────────────────┤
│ 🎵 Amapiano Hits                    [Active] [Open] [Edit]  │
│    Genre • 15/20 tracks • 5 submissions pending           │
│ 🏆 Editor's Choice                  [Active] [Closed] [Edit]│
│    Featured • 4/5 tracks • 0 submissions                  │
│ 📊 Top 10 This Week                [Active] [Open] [Edit]  │
│    Top Ten • 10/10 tracks • 2 submissions pending         │
└─────────────────────────────────────────────────────────────┘
```

#### **Playlist Creation/Edit Form**

```
┌─────────────────────────────────────────────────────────────┐
│ Create/Edit Playlist                                       │
├─────────────────────────────────────────────────────────────┤
│ Name: [Amapiano Hits                    ]                  │
│ Description: [Curated selection of...]                     │
│ Type: [Genre ▼] Max Tracks: [20 ▼]                        │
│ Province: [Western Cape ▼] (if applicable)                 │
│ Status: [●] Active [ ] Inactive                            │
│ Submissions: [●] Open [ ] Closed                           │
│ Max per Artist: [3 ▼]                                      │
│ Cover Image: [Upload Image] [Preview]                      │
│                                                             │
│ [Cancel] [Save Playlist]                                   │
└─────────────────────────────────────────────────────────────┘
```

### **2. Submission Review Interface**

#### **Submission Queue**

```
┌─────────────────────────────────────────────────────────────┐
│ Submission Review Queue                    [Filter] [Sort]  │
├─────────────────────────────────────────────────────────────┤
│ 🎵 Amapiano Hits - 5 pending submissions                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Track: "Midnight Vibes" - Artist: DJ Khaya              │ │
│ │ Submitted: 2 hours ago • [Approve] [Reject] [Shortlist] │ │
│ │ Comment: [Great track, fits perfectly...]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Track: "Cape Town Nights" - Artist: Sarah M            │ │
│ │ Submitted: 1 day ago • [Approve] [Reject] [Shortlist]  │ │
│ │ Comment: [Perfect for the playlist...]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### **Bulk Review Actions**

```
┌─────────────────────────────────────────────────────────────┐
│ Bulk Actions                                               │
├─────────────────────────────────────────────────────────────┤
│ [Select All] [Select Pending] [Select This Week]           │
│ [Approve Selected] [Reject Selected] [Shortlist Selected]  │
│ [Add Comment to Selected] [Export Selected]                │
└─────────────────────────────────────────────────────────────┘
```

### **3. Playlist Content Management**

#### **Track Management View**

```
┌─────────────────────────────────────────────────────────────┐
│ Amapiano Hits - Track Management          [Add Track] [Sort]│
├─────────────────────────────────────────────────────────────┤
│ Order │ Track Name        │ Artist      │ Duration │ Actions│
├─────────────────────────────────────────────────────────────┤
│ 1     │ Midnight Vibes    │ DJ Khaya    │ 3:45     │ [↑][↓]│
│ 2     │ Cape Town Nights  │ Sarah M     │ 4:12     │ [↑][↓]│
│ 3     │ Township Groove   │ The Beats   │ 3:28     │ [↑][↓]│
│ 4     │ [Empty Slot]      │ [Empty]     │ --       │ [Add] │
└─────────────────────────────────────────────────────────────┘
```

#### **Track Search & Add Interface**

```
┌─────────────────────────────────────────────────────────────┐
│ Add Track to Playlist                                      │
├─────────────────────────────────────────────────────────────┤
│ Search: [Track name, artist, genre...] [Search]            │
│                                                             │
│ Results:                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎵 "Summer Nights" - Artist: Mike D - Genre: Amapiano  │ │
│ │ Duration: 3:45 • Plays: 1,234 • [Add to Playlist]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎵 "City Lights" - Artist: Lisa K - Genre: Amapiano    │ │
│ │ Duration: 4:02 • Plays: 856 • [Add to Playlist]       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **4. Analytics Dashboard**

#### **Playlist Performance Overview**

```
┌─────────────────────────────────────────────────────────────┐
│ Playlist Analytics - Last 30 Days                          │
├─────────────────────────────────────────────────────────────┤
│ Featured Playlist: Editor's Choice                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Views: 12,456 │ Plays: 8,234 │ Likes: 1,456 │ Shares: 234│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Top Performing Playlists:                                  │
│ 1. Amapiano Hits - 15,678 views                           │
│ 2. Cape Town Sounds - 12,345 views                        │
│ 3. Gqom Essentials - 9,876 views                          │
└─────────────────────────────────────────────────────────────┘
```

#### **Submission Analytics**

```
┌─────────────────────────────────────────────────────────────┐
│ Submission Analytics                                        │
├─────────────────────────────────────────────────────────────┤
│ Total Submissions: 1,234                                   │
│ Pending Review: 45                                         │
│ Approved This Week: 23                                     │
│ Rejection Rate: 15%                                        │
│                                                             │
│ Most Active Artists:                                        │
│ 1. DJ Khaya - 12 submissions                              │
│ 2. Sarah M - 8 submissions                                │
│ 3. The Beats - 6 submissions                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### **PlaylistCard Component**

```typescript
interface PlaylistCardProps {
  playlist: Playlist;
  onEdit: (playlist: Playlist) => void;
  onToggleActive: (playlist: Playlist) => void;
  onToggleSubmissions: (playlist: Playlist) => void;
  onViewSubmissions: (playlist: Playlist) => void;
  onViewAnalytics: (playlist: Playlist) => void;
}
```

### **SubmissionReviewCard Component**

```typescript
interface SubmissionReviewCardProps {
  submission: PlaylistSubmission;
  track: Track;
  artist: User;
  onApprove: (submission: PlaylistSubmission) => void;
  onReject: (submission: PlaylistSubmission, comment: string) => void;
  onShortlist: (submission: PlaylistSubmission) => void;
}
```

### **TrackSearchModal Component**

```typescript
interface TrackSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
  playlistId: string;
  currentTracks: Track[];
}
```

## 🔧 Implementation Details

### **Admin Dashboard Integration**

#### **New Admin Dashboard Sections**

1. **Playlist Management** - Main playlist CRUD interface
2. **Submission Review** - Review and approve submissions
3. **Content Curation** - Manual track addition and management
4. **Analytics** - Playlist performance metrics
5. **Settings** - Playlist configuration and limits

#### **Navigation Structure**

```
Admin Dashboard
├── Overview
├── Users
├── Music
├── Playlists ← NEW
│   ├── All Playlists
│   ├── Create Playlist
│   ├── Review Submissions
│   ├── Content Curation
│   └── Analytics
├── Content Moderation
└── System Settings
```

### **API Integration**

#### **Playlist Management APIs**

```typescript
// Get all playlists with filters
GET /api/admin/playlists?type=genre&status=active&page=1&limit=20

// Create new playlist
POST /api/admin/playlists
{
  name: string;
  description: string;
  type: PlaylistType;
  maxTracks: number;
  province?: string;
  coverImage: string;
  maxSubmissionsPerArtist: number;
}

// Update playlist
PUT /api/admin/playlists/[id]
{
  // Same fields as create
}

// Toggle playlist status
PUT /api/admin/playlists/[id]/toggle-status
{
  status: 'active' | 'inactive';
}

// Toggle submission status
PUT /api/admin/playlists/[id]/toggle-submissions
{
  submissionStatus: 'open' | 'closed';
}
```

#### **Submission Review APIs**

```typescript
// Get submissions for a playlist
GET /api/admin/playlists/[id]/submissions?status=pending

// Review a submission
PUT /api/admin/submissions/[id]/review
{
  status: 'approved' | 'rejected' | 'shortlisted';
  comment?: string;
}

// Bulk review submissions
POST /api/admin/submissions/bulk-review
{
  submissionIds: string[];
  action: 'approve' | 'reject' | 'shortlist';
  comment?: string;
}
```

#### **Content Curation APIs**

```typescript
// Search tracks for playlist
GET /api/admin/tracks/search?q=searchTerm&genre=amapiano&limit=20

// Add track to playlist
POST /api/admin/playlists/[id]/tracks
{
  trackId: string;
  order?: number;
}

// Remove track from playlist
DELETE /api/admin/playlists/[id]/tracks/[trackId]

// Reorder tracks in playlist
PUT /api/admin/playlists/[id]/tracks/reorder
{
  trackOrders: { trackId: string; order: number }[];
}
```

### **State Management**

#### **Playlist State**

```typescript
interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  submissions: PlaylistSubmission[];
  loading: boolean;
  error: string | null;
  filters: {
    type: PlaylistType | 'all';
    status: PlaylistStatus | 'all';
    search: string;
  };
}
```

#### **Submission State**

```typescript
interface SubmissionState {
  submissions: PlaylistSubmission[];
  selectedSubmissions: string[];
  reviewLoading: boolean;
  filters: {
    status: TrackSubmissionStatus | 'all';
    playlistId: string | 'all';
    dateRange: { start: Date; end: Date };
  };
}
```

## 📊 Analytics Implementation

### **Playlist Metrics Tracking**

```typescript
// Track playlist views
POST / api / playlists / [id] / view;

// Track playlist plays
POST / api / playlists / [id] / play;

// Track playlist likes
POST / api / playlists / [id] / like;

// Track playlist shares
POST / api / playlists / [id] / share;
```

### **Analytics Dashboard Data**

```typescript
interface PlaylistAnalytics {
  playlistId: string;
  period: '7d' | '30d' | '90d';
  metrics: {
    views: number;
    plays: number;
    likes: number;
    shares: number;
    uniqueListeners: number;
    completionRate: number;
  };
  topTracks: {
    trackId: string;
    title: string;
    plays: number;
  }[];
  trends: {
    date: string;
    views: number;
    plays: number;
  }[];
}
```

## 🔒 Permissions & Security

### **Admin Permissions**

- **Full Access**: Create, edit, delete playlists
- **Submission Review**: Approve, reject, shortlist submissions
- **Content Curation**: Add/remove tracks manually
- **Analytics Access**: View all playlist metrics
- **Settings Management**: Configure playlist limits and rules

### **Audit Logging**

```typescript
interface PlaylistAuditLog {
  id: string;
  playlistId: string;
  action: 'created' | 'updated' | 'deleted' | 'track_added' | 'track_removed';
  adminId: string;
  details: Record<string, any>;
  timestamp: Date;
}
```

## 📝 Notes

- All playlist changes are logged for audit purposes
- Cover images are required for all playlists
- Playlist limits are enforced at the database level
- Submission limits are checked before allowing submissions
- Analytics data is aggregated daily for performance
- Bulk operations are limited to prevent system overload

## 🔗 Next Phase

Once this phase is complete, proceed to [Phase 20: Artist Playlist Submissions](./20-artist-playlist-submissions.md)
