# Phase 7: Artist Dashboard

## 🎯 Objective

Implement a comprehensive artist dashboard that allows artists to manage their music, view analytics, create smart links, and control their content on the platform.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, & 6 completed successfully
- User interface and experience features working
- Music upload and streaming systems functional
- Database with analytics data available

## 🚀 Step-by-Step Implementation

### 1. Artist Dashboard Layout

#### `src/app/(dashboard)/artist/dashboard/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import ArtistDashboard from '@/components/dashboard/ArtistDashboard'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentTracks from '@/components/dashboard/RecentTracks'
import QuickActions from '@/components/dashboard/QuickActions'

async function getArtistData(userId: string) {
  // Get artist's tracks and basic stats
  const tracks = await prisma.track.findMany({
    where: { artistId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          playEvents: true,
          likes: true,
        }
      }
    }
  })

  // Calculate total stats
  const totalPlays = tracks.reduce((sum, track) => sum + track.playCount, 0)
  const totalLikes = tracks.reduce((sum, track) => sum + track.likeCount, 0)
  const totalTracks = tracks.length
  const publishedTracks = tracks.filter(track => track.isPublished).length

  // Get recent play events for analytics
  const recentPlays = await prisma.playEvent.findMany({
    where: {
      track: { artistId: userId }
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
    include: {
      track: {
        select: {
          title: true,
          coverImageUrl: true,
        }
      }
    }
  })

  // Get smart links
  const smartLinks = await prisma.smartLink.findMany({
    where: {
      track: { artistId: userId }
    },
    include: {
      track: {
        select: {
          title: true,
          coverImageUrl: true,
        }
      },
      platformLinks: {
        select: {
          platform: true,
          clickCount: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return {
    tracks,
    stats: {
      totalPlays,
      totalLikes,
      totalTracks,
      publishedTracks,
    },
    recentPlays,
    smartLinks,
  }
}

export default async function ArtistDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const artistData = await getArtistData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Artist Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your music, track performance, and grow your audience
          </p>
        </div>

        {/* Quick Stats */}
        <DashboardStats stats={artistData.stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Dashboard Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tracks */}
          <div className="lg:col-span-2">
            <RecentTracks tracks={artistData.tracks} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {artistData.recentPlays.map((play) => (
                  <div key={play.id} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <span className="text-gray-600">
                      Someone played "{play.track.title}"
                    </span>
                    <span className="text-gray-400">
                      {new Date(play.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Smart Links
              </h3>
              <div className="space-y-3">
                {artistData.smartLinks.map((link) => (
                  <div key={link.id} className="text-sm">
                    <p className="font-medium text-gray-900">{link.track.title}</p>
                    <p className="text-gray-600">{link.clickCount} clicks</p>
                  </div>
                ))}
              </div>
              <a
                href="/artist/smart-links"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Dashboard Stats Component

#### `src/components/dashboard/DashboardStats.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import {
  PlayIcon,
  HeartIcon,
  MusicalNoteIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface DashboardStatsProps {
  stats: {
    totalPlays: number
    totalLikes: number
    totalTracks: number
    publishedTracks: number
  }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      label: 'Total Plays',
      value: stats.totalPlays.toLocaleString(),
      icon: PlayIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      label: 'Total Likes',
      value: stats.totalLikes.toLocaleString(),
      icon: HeartIcon,
      color: 'bg-red-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      label: 'Total Tracks',
      value: stats.totalTracks,
      icon: MusicalNoteIcon,
      color: 'bg-green-500',
      change: stats.publishedTracks > 0 ? `${Math.round((stats.publishedTracks / stats.totalTracks) * 100)}% published` : 'No tracks',
      changeType: 'neutral'
    },
    {
      label: 'Published Tracks',
      value: stats.publishedTracks,
      icon: EyeIcon,
      color: 'bg-purple-500',
      change: stats.totalTracks > 0 ? `${Math.round((stats.publishedTracks / stats.totalTracks) * 100)}%` : '0%',
      changeType: 'neutral'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${item.color}`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>

          <div className="mt-4">
            <span className={`text-sm font-medium ${
              item.changeType === 'positive' ? 'text-green-600' :
              item.changeType === 'negative' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {item.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
```

### 3. Quick Actions Component

#### `src/components/dashboard/QuickActions.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  PlusIcon,
  LinkIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function QuickActions() {
  const actions = [
    {
      title: 'Upload New Track',
      description: 'Share your latest music with the world',
      icon: PlusIcon,
      href: '/artist/upload',
      color: 'bg-primary-500 hover:bg-primary-600',
      iconColor: 'text-primary-500'
    },
    {
      title: 'Create Smart Link',
      description: 'Generate a link to share across all platforms',
      icon: LinkIcon,
      href: '/artist/smart-links/create',
      color: 'bg-secondary-500 hover:bg-secondary-600',
      iconColor: 'text-secondary-500'
    },
    {
      title: 'View Analytics',
      description: 'Track your performance and audience growth',
      icon: ChartBarIcon,
      href: '/artist/analytics',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-green-500'
    },
    {
      title: 'Profile Settings',
      description: 'Update your artist profile and preferences',
      icon: CogIcon,
      href: '/artist/settings',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-purple-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <Link href={action.href}>
            <div className={`${action.color} rounded-lg p-6 text-white h-full transition-colors cursor-pointer`}>
              <div className="flex items-center justify-between mb-4">
                <action.icon className="w-8 h-8 text-white" />
                <div className={`w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
```

### 4. Track Management Page

#### `src/app/(dashboard)/artist/tracks/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import TrackManagement from '@/components/dashboard/TrackManagement'

async function getArtistTracks(userId: string) {
  const tracks = await prisma.track.findMany({
    where: { artistId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          playEvents: true,
          likes: true,
        }
      }
    }
  })

  return tracks
}

export default async function TracksPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const tracks = await getArtistTracks(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Track Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your uploaded tracks, edit metadata, and control publishing
          </p>
        </div>

        <TrackManagement tracks={tracks} />
      </div>
    </div>
  )
}
```

### 5. Track Management Component

#### `src/components/dashboard/TrackManagement.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { formatDuration } from '@/lib/utils'

interface Track {
  id: string
  title: string
  coverImageUrl: string | null
  genre: string
  album: string | null
  duration: number
  playCount: number
  likeCount: number
  isPublished: boolean
  createdAt: string
  _count: {
    playEvents: number
    likes: number
  }
}

interface TrackManagementProps {
  tracks: Track[]
}

export default function TrackManagement({ tracks }: TrackManagementProps) {
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Track>>({})
  const [deletingTrack, setDeletingTrack] = useState<string | null>(null)
  const router = useRouter()

  const handleEdit = (track: Track) => {
    setEditingTrack(track.id)
    setEditForm({
      title: track.title,
      genre: track.genre,
      album: track.album,
    })
  }

  const handleSave = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        setEditingTrack(null)
        setEditForm({})
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating track:', error)
    }
  }

  const handleDelete = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeletingTrack(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting track:', error)
    }
  }

  const handlePublishToggle = async (trackId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">You haven't uploaded any tracks yet.</p>
        <a
          href="/artist/upload"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Upload Your First Track
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Your Tracks ({tracks.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6"
          >
            <div className="flex items-center space-x-4">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                {track.coverImageUrl ? (
                  <img
                    src={track.coverImageUrl}
                    alt={`${track.title} cover`}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Cover</span>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                {editingTrack === track.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Track title"
                    />
                    <div className="flex space-x-2">
                      <select
                        value={editForm.genre || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="Pop">Pop</option>
                        <option value="Rock">Rock</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Classical">Classical</option>
                        <option value="Country">Country</option>
                        <option value="R&B">R&B</option>
                        <option value="Alternative">Alternative</option>
                        <option value="Indie">Indie</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="text"
                        value={editForm.album || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, album: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Album (optional)"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {track.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {track.genre} • {track.album || 'Single'} • {formatDuration(track.duration)}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{track.playCount} plays</span>
                      <span>•</span>
                      <span>{track.likeCount} likes</span>
                      <span>•</span>
                      <span>Uploaded {new Date(track.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {editingTrack === track.id ? (
                  <>
                    <button
                      onClick={() => handleSave(track.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Save changes"
                    >
                      <span className="text-sm font-medium">Save</span>
                    </button>
                    <button
                      onClick={() => setEditingTrack(null)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                      title="Cancel editing"
                    >
                      <span className="text-sm font-medium">Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(track)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit track"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePublishToggle(track.id, track.isPublished)}
                      className={`p-2 rounded-md transition-colors ${
                        track.isPublished
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={track.isPublished ? 'Unpublish track' : 'Publish track'}
                    >
                      {track.isPublished ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setDeletingTrack(track.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete track"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Publish Status */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  track.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {track.isPublished ? 'Published' : 'Draft'}
                </span>

                {!track.isPublished && (
                  <span className="text-xs text-gray-500">
                    Only you can see this track
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {track._count.playEvents} total plays
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Track
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this track? This action cannot be undone and will remove all associated data.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeletingTrack(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingTrack)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 6. Analytics Page

#### `src/app/(dashboard)/artist/analytics/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'

async function getAnalyticsData(userId: string) {
  // Get date range for analytics (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get tracks with play data
  const tracks = await prisma.track.findMany({
    where: { artistId: userId },
    include: {
      playEvents: {
        where: {
          timestamp: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          timestamp: true,
          duration: true,
          completed: true,
        }
      },
      _count: {
        select: {
          likes: true,
        }
      }
    }
  })

  // Calculate analytics
  const totalPlays = tracks.reduce((sum, track) => sum + track.playEvents.length, 0)
  const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0)
  const totalDuration = tracks.reduce((sum, track) =>
    sum + track.playEvents.reduce((trackSum, event) => trackSum + (event.duration || 0), 0), 0
  )

  // Group plays by date for chart
  const playsByDate = await prisma.playEvent.groupBy({
    by: ['timestamp'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Get top performing tracks
  const topTracks = tracks
    .sort((a, b) => b.playEvents.length - a.playEvents.length)
    .slice(0, 5)
    .map(track => ({
      id: track.id,
      title: track.title,
      plays: track.playEvents.length,
      likes: track._count.likes,
      duration: track.duration,
    }))

  return {
    summary: {
      totalPlays,
      totalLikes,
      totalDuration,
      totalTracks: tracks.length,
    },
    playsByDate,
    topTracks,
    tracks,
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const analyticsData = await getAnalyticsData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Track your music performance and audience engagement
          </p>
        </div>

        <AnalyticsDashboard data={analyticsData} />
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Artist dashboard loads** - All components display correctly
2. **Track management works** - Can edit, delete, and publish/unpublish tracks
3. **Analytics display** - Charts and statistics show accurate data
4. **Quick actions functional** - All action buttons work correctly
5. **Responsive design** - Dashboard works on all device sizes
6. **Data updates** - Changes reflect immediately in the interface

### Test Commands:

```bash
# Test artist dashboard
# 1. Login as artist
# 2. Navigate to dashboard
# 3. Test all quick actions
# 4. Verify stats display correctly

# Test track management
# 1. Edit track metadata
# 2. Toggle publish status
# 3. Delete tracks
# 4. Verify changes persist
```

## 🚨 Common Issues & Solutions

### Issue: Dashboard not loading

**Solution**: Check authentication, verify user role, check database queries

### Issue: Analytics data missing

**Solution**: Verify play events exist, check date ranges, validate database relationships

### Issue: Track actions failing

**Solution**: Check API routes, verify permissions, check for validation errors

### Issue: Performance issues

**Solution**: Implement pagination, optimize database queries, add loading states

## 📝 Notes

- Implement proper error handling for all API calls
- Add loading states for better user experience
- Consider implementing real-time updates for analytics
- Add export functionality for analytics data
- Implement proper data validation and sanitization

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 8: Analytics System](./08-analytics-system.md)
