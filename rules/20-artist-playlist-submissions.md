# Phase 20: Artist Playlist Submissions

## 🎯 Objective

Create an intuitive artist interface for discovering playlists, submitting tracks, and tracking submission status. This system will enable artists to actively participate in playlist curation while maintaining quality control through admin review.

## 📋 Prerequisites

- Phase 18 (Playlist Management System) completed
- Phase 19 (Admin Playlist Curation) completed
- Artist dashboard functional
- Submission system APIs implemented

## 🚀 Artist Submission Interface

### **1. Playlist Discovery Dashboard**

#### **Available Playlists View**

```
┌─────────────────────────────────────────────────────────────┐
│ Submit to Playlists                    [My Submissions]     │
├─────────────────────────────────────────────────────────────┤
│ [All] [Genre] [Province] [Featured] [Top Ten]              │
├─────────────────────────────────────────────────────────────┤
│ 🎵 Amapiano Hits                    [Open] [Submit Tracks]  │
│    Genre • 15/20 tracks • Max 3 per artist                │
│    "Curated selection of the best Amapiano tracks"         │
│                                                             │
│ 🏆 Editor's Choice                  [Closed] [View Only]   │
│    Featured • 4/5 tracks • Not accepting submissions       │
│    "Our handpicked favorites this week"                    │
│                                                             │
│ 🏙️ Cape Town Sounds                [Open] [Submit Tracks]  │
│    Province • 8/15 tracks • Max 2 per artist              │
│    "Music from the Mother City"                            │
└─────────────────────────────────────────────────────────────┘
```

#### **Playlist Details Modal**

```
┌─────────────────────────────────────────────────────────────┐
│ Amapiano Hits - Submission Details                         │
├─────────────────────────────────────────────────────────────┤
│ 🎵 Amapiano Hits                                           │
│ Genre • 15/20 tracks • Max 3 per artist                   │
│                                                             │
│ Description:                                                │
│ Curated selection of the best Amapiano tracks from        │
│ across South Africa. Perfect for those late-night vibes.  │
│                                                             │
│ Current Tracks: 15/20                                      │
│ Your Submissions: 0/3                                      │
│                                                             │
│ [Close] [Submit Tracks]                                    │
└─────────────────────────────────────────────────────────────┘
```

### **2. Track Submission Interface**

#### **Track Selection View**

```
┌─────────────────────────────────────────────────────────────┐
│ Submit to: Amapiano Hits              [Back] [Submit (0/3)] │
├─────────────────────────────────────────────────────────────┤
│ Select up to 3 tracks to submit:                           │
│                                                             │
│ [✓] 🎵 "Midnight Vibes" - 3:45 - Amapiano                  │
│     Uploaded: 2 days ago • Plays: 234                      │
│                                                             │
│ [ ] 🎵 "Summer Nights" - 4:12 - Amapiano                   │
│     Uploaded: 1 week ago • Plays: 156                      │
│                                                             │
│ [ ] 🎵 "City Lights" - 3:28 - Electronic                   │
│     Uploaded: 3 days ago • Plays: 89                       │
│                                                             │
│ [ ] 🎵 "Township Groove" - 4:05 - Amapiano                 │
│     Uploaded: 5 days ago • Plays: 312                      │
│                                                             │
│ Optional Message:                                           │
│ [This track perfectly captures the Amapiano vibe...]       │
│                                                             │
│ [Cancel] [Submit Selected Tracks]                          │
└─────────────────────────────────────────────────────────────┘
```

#### **Submission Confirmation**

```
┌─────────────────────────────────────────────────────────────┐
│ Submission Confirmed!                                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ Successfully submitted 2 tracks to "Amapiano Hits"      │
│                                                             │
│ Submitted Tracks:                                           │
│ • "Midnight Vibes"                                          │
│ • "Township Groove"                                         │
│                                                             │
│ What happens next:                                          │
│ • Admin will review your submission                         │
│ • You'll be notified of the decision                        │
│ • Check your submissions page for updates                   │
│                                                             │
│ [View My Submissions] [Submit to Another Playlist]         │
└─────────────────────────────────────────────────────────────┘
```

### **3. Submission Tracking Dashboard**

#### **My Submissions Overview**

```
┌─────────────────────────────────────────────────────────────┐
│ My Submissions                        [Filter] [Sort]       │
├─────────────────────────────────────────────────────────────┤
│ [All] [Pending] [Approved] [Rejected] [Shortlisted]         │
├─────────────────────────────────────────────────────────────┤
│ 🎵 "Midnight Vibes" → Amapiano Hits                        │
│ Status: Pending • Submitted: 2 hours ago                   │
│ Admin Comment: None                                         │
│                                                             │
│ 🎵 "Township Groove" → Amapiano Hits                       │
│ Status: Pending • Submitted: 2 hours ago                   │
│ Admin Comment: None                                         │
│                                                             │
│ 🎵 "Cape Town Nights" → Cape Town Sounds                   │
│ Status: Approved • Submitted: 3 days ago                   │
│ Admin Comment: "Great track, fits perfectly!"              │
│                                                             │
│ 🎵 "Summer Vibes" → Editor's Choice                        │
│ Status: Rejected • Submitted: 1 week ago                   │
│ Admin Comment: "Not quite the right fit for this playlist" │
└─────────────────────────────────────────────────────────────┘
```

#### **Submission Details View**

```
┌─────────────────────────────────────────────────────────────┐
│ Submission Details - "Midnight Vibes"                      │
├─────────────────────────────────────────────────────────────┤
│ Track: "Midnight Vibes"                                    │
│ Artist: DJ Khaya                                           │
│ Playlist: Amapiano Hits                                    │
│ Status: Pending Review                                     │
│ Submitted: 2 hours ago                                     │
│                                                             │
│ Your Message:                                               │
│ "This track perfectly captures the Amapiano vibe with      │
│ its deep basslines and melodic piano riffs."               │
│                                                             │
│ Admin Comment: None yet                                    │
│                                                             │
│ [Edit Submission] [Withdraw Submission] [View Track]       │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### **PlaylistCard Component**

```typescript
interface PlaylistCardProps {
  playlist: Playlist;
  userSubmissions: number;
  maxSubmissions: number;
  onViewDetails: (playlist: Playlist) => void;
  onSubmit: (playlist: Playlist) => void;
}
```

### **TrackSelectionModal Component**

```typescript
interface TrackSelectionModalProps {
  isOpen: boolean;
  playlist: Playlist;
  availableTracks: Track[];
  onClose: () => void;
  onSubmit: (trackIds: string[], message?: string) => void;
}
```

### **SubmissionCard Component**

```typescript
interface SubmissionCardProps {
  submission: PlaylistSubmission;
  track: Track;
  playlist: Playlist;
  onViewDetails: (submission: PlaylistSubmission) => void;
  onWithdraw: (submission: PlaylistSubmission) => void;
}
```

## 🔧 Implementation Details

### **Artist Dashboard Integration**

#### **New Artist Dashboard Sections**

1. **Submit to Playlists** - Discover and submit to playlists
2. **My Submissions** - Track submission status
3. **Playlist History** - View previously submitted playlists

#### **Navigation Structure**

```
Artist Dashboard
├── Overview
├── Music Library
├── Upload Music
├── Playlist Submissions ← NEW
│   ├── Available Playlists
│   ├── My Submissions
│   └── Submission History
├── Analytics
└── Profile Settings
```

### **API Integration**

#### **Playlist Discovery APIs**

```typescript
// Get available playlists for submission
GET /api/playlists/available?type=genre&status=open

// Get playlist details
GET /api/playlists/[id]/details

// Check submission eligibility
GET /api/playlists/[id]/eligibility
```

#### **Submission APIs**

```typescript
// Submit tracks to playlist
POST /api/playlists/[id]/submit
{
  trackIds: string[];
  message?: string;
}

// Get artist's submissions
GET /api/playlists/submissions?status=pending&page=1&limit=20

// Get submission details
GET /api/playlists/submissions/[id]

// Withdraw submission
DELETE /api/playlists/submissions/[id]

// Update submission message
PUT /api/playlists/submissions/[id]
{
  message: string;
}
```

#### **Track Management APIs**

```typescript
// Get artist's tracks available for submission
GET /api/tracks/available-for-submission?playlistId=[id]

// Get track details for submission
GET /api/tracks/[id]/submission-details
```

### **State Management**

#### **Submission State**

```typescript
interface SubmissionState {
  availablePlaylists: Playlist[];
  mySubmissions: PlaylistSubmission[];
  selectedTracks: string[];
  submissionMessage: string;
  loading: boolean;
  error: string | null;
  filters: {
    status: TrackSubmissionStatus | 'all';
    playlistType: PlaylistType | 'all';
    dateRange: { start: Date; end: Date };
  };
}
```

#### **Playlist Discovery State**

```typescript
interface PlaylistDiscoveryState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  eligibility: {
    canSubmit: boolean;
    remainingSubmissions: number;
    reason?: string;
  };
  loading: boolean;
  error: string | null;
}
```

## 📊 Submission Logic

### **Eligibility Checking**

```typescript
interface SubmissionEligibility {
  canSubmit: boolean;
  remainingSubmissions: number;
  reason?: string;
  checks: {
    playlistOpen: boolean;
    hasCapacity: boolean;
    withinLimits: boolean;
    trackEligible: boolean;
  };
}

// Check if artist can submit to playlist
function checkSubmissionEligibility(
  playlist: Playlist,
  artistId: string,
  trackIds: string[]
): SubmissionEligibility {
  // Implementation details
}
```

### **Submission Validation**

```typescript
interface SubmissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate submission before sending
function validateSubmission(
  playlist: Playlist,
  trackIds: string[],
  message?: string
): SubmissionValidation {
  // Implementation details
}
```

## 🔔 Notification System (Future)

### **Notification Types**

```typescript
enum NotificationType {
  SUBMISSION_APPROVED = 'submission_approved',
  SUBMISSION_REJECTED = 'submission_rejected',
  SUBMISSION_SHORTLISTED = 'submission_shortlisted',
  PLAYLIST_OPENED = 'playlist_opened',
  PLAYLIST_CLOSED = 'playlist_closed',
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  playlistId?: string;
  submissionId?: string;
  read: boolean;
  createdAt: Date;
}
```

## 📱 Mobile Responsiveness

### **Mobile Playlist Card**

```
┌─────────────────────────────────────┐
│ 🎵 Amapiano Hits                   │
│ Genre • 15/20 tracks               │
│ Max 3 per artist                   │
│ [Open] [Submit Tracks]             │
└─────────────────────────────────────┘
```

### **Mobile Track Selection**

```
┌─────────────────────────────────────┐
│ Select Tracks (0/3)                 │
├─────────────────────────────────────┤
│ [✓] Midnight Vibes                  │
│     3:45 • 234 plays                │
│                                     │
│ [ ] Summer Nights                   │
│     4:12 • 156 plays                │
│                                     │
│ [ ] City Lights                     │
│     3:28 • 89 plays                 │
│                                     │
│ [Submit Selected]                   │
└─────────────────────────────────────┘
```

## 🔒 Permissions & Security

### **Artist Permissions**

- **View Playlists**: Can see open playlists for submission
- **Submit Tracks**: Can submit tracks to open playlists
- **View Submissions**: Can see own submission status
- **Withdraw Submissions**: Can withdraw pending submissions
- **No Admin Access**: Cannot see admin-only information

### **Submission Limits Enforcement**

```typescript
// Check submission limits before allowing submission
function enforceSubmissionLimits(
  playlist: Playlist,
  artistId: string,
  trackIds: string[]
): boolean {
  // Check if artist has remaining submissions
  // Check if playlist has capacity
  // Check if tracks are eligible
  // Return true if all checks pass
}
```

## 📝 Notes

- Artists can only submit to playlists that are open for submissions
- Submission limits are enforced per artist per playlist
- Artists can withdraw submissions that are still pending
- All submissions are logged for audit purposes
- Track eligibility is checked before allowing submission
- Submission messages are optional but recommended

## 🔗 Next Phase

Once this phase is complete, proceed to [Phase 21: Playlist Landing Page Integration](./21-playlist-landing-page-integration.md)
