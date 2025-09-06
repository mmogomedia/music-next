# Phase 9: Smart Links System

## 🎯 Objective

Implement a comprehensive smart links system that allows artists to create shareable links for their music across multiple platforms (Spotify, Apple Music, YouTube, etc.) with click tracking, analytics, and customizable landing pages.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, & 8 completed successfully
- Artist dashboard functional
- Analytics system working
- Database with smart link models available

## 🚀 Step-by-Step Implementation

### 1. Smart Link Creation Form

#### `src/app/(dashboard)/artist/smart-links/create/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SmartLinkForm from '@/components/smart-links/SmartLinkForm'

async function getArtistTracks(userId: string) {
  const tracks = await prisma.track.findMany({
    where: {
      artistId: userId,
      isPublished: true
    },
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      artist: {
        select: {
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return tracks
}

export default async function CreateSmartLinkPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const tracks = await getArtistTracks(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Smart Link
          </h1>
          <p className="mt-2 text-gray-600">
            Generate a single link that directs fans to your music on all platforms
          </p>
        </div>

        <SmartLinkForm tracks={tracks} />
      </div>
    </div>
  )
}
```

### 2. Smart Link Form Component

#### `src/components/smart-links/SmartLinkForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  TrashIcon,
  LinkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Track {
  id: string
  title: string
  coverImageUrl: string | null
  artist: {
    name: string
  }
}

interface PlatformLink {
  platform: string
  url: string
}

interface SmartLinkFormProps {
  tracks: Track[]
}

const PLATFORMS = [
  { value: 'SPOTIFY', label: 'Spotify', icon: '🎵', color: 'bg-green-500' },
  { value: 'APPLE_MUSIC', label: 'Apple Music', icon: '🍎', color: 'bg-pink-500' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '📺', color: 'bg-red-500' },
  { value: 'SOUNDCLOUD', label: 'SoundCloud', icon: '☁️', color: 'bg-orange-500' },
  { value: 'TIKTOK', label: 'TikTok', icon: '🎵', color: 'bg-black' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📷', color: 'bg-purple-500' },
  { value: 'BANDCAMP', label: 'Bandcamp', icon: '🎸', color: 'bg-blue-500' },
  { value: 'DEEZER', label: 'Deezer', icon: '🎧', color: 'bg-blue-600' },
]

export default function SmartLinkForm({ tracks }: SmartLinkFormProps) {
  const router = useRouter()
  const [selectedTrack, setSelectedTrack] = useState<string>('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [platformLinks, setPlatformLinks] = useState<PlatformLink[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const selectedTrackData = tracks.find(track => track.id === selectedTrack)

  const addPlatformLink = () => {
    setPlatformLinks([...platformLinks, { platform: '', url: '' }])
  }

  const removePlatformLink = (index: number) => {
    setPlatformLinks(platformLinks.filter((_, i) => i !== index))
  }

  const updatePlatformLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...platformLinks]
    newLinks[index][field] = value
    setPlatformLinks(newLinks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTrack || platformLinks.length === 0) {
      alert('Please select a track and add at least one platform link')
      return
    }

    // Validate platform links
    const validLinks = platformLinks.filter(link => link.platform && link.url)
    if (validLinks.length === 0) {
      alert('Please add valid platform links')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/smart-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: selectedTrack,
          title: customTitle,
          description: customDescription,
          platformLinks: validLinks,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/artist/smart-links?created=${result.smartLink.slug}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create smart link')
      }
    } catch (error) {
      console.error('Error creating smart link:', error)
      alert('An error occurred while creating the smart link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePreview = () => {
    if (!selectedTrackData || platformLinks.length === 0) return

    setPreviewData({
      track: selectedTrackData,
      title: customTitle || `Listen to ${selectedTrackData.title}`,
      description: customDescription || `Check out "${selectedTrackData.title}" by ${selectedTrackData.artist.name}`,
      platformLinks: platformLinks.filter(link => link.platform && link.url),
    })
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Track Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Track *
          </label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Choose a track</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title} - {track.artist.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Title (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g., Check out my new song!"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Custom Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Description (Optional)
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            rows={3}
            placeholder="e.g., Listen to my latest release on all your favorite platforms"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Platform Links */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Platform Links *
            </label>
            <button
              type="button"
              onClick={addPlatformLink}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Platform</span>
            </button>
          </div>

          <div className="space-y-3">
            {platformLinks.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-3"
              >
                <select
                  value={link.platform}
                  onChange={(e) => updatePlatformLink(index, 'platform', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updatePlatformLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />

                <button
                  type="button"
                  onClick={() => removePlatformLink(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {platformLinks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No platform links added yet</p>
                <p className="text-sm">Click "Add Platform" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Button */}
        {selectedTrack && platformLinks.length > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generatePreview}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Preview Smart Link</span>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedTrack || platformLinks.length === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Smart Link'}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Smart Link Preview</h3>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Track Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {previewData.track.coverImageUrl ? (
                    <img
                      src={previewData.track.coverImageUrl}
                      alt={`${previewData.track.title} cover`}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Cover</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{previewData.track.title}</h4>
                    <p className="text-sm text-gray-600">by {previewData.track.artist.name}</p>
                  </div>
                </div>

                {/* Custom Content */}
                {previewData.title && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                    <p className="text-gray-600">{previewData.title}</p>
                  </div>
                )}

                {previewData.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{previewData.description}</p>
                  </div>
                )}

                {/* Platform Links */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Platform Links</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {previewData.platformLinks.map((link: PlatformLink, index: number) => {
                      const platform = PLATFORMS.find(p => p.value === link.platform)
                      return (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <span className="text-lg">{platform?.icon}</span>
                          <span className="text-sm font-medium">{platform?.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3. Smart Links API Route

#### `src/app/api/smart-links/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/smart-link-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, title, description, platformLinks } = body;

    // Validate required fields
    if (!trackId || !platformLinks || platformLinks.length === 0) {
      return NextResponse.json(
        { error: 'Track ID and platform links are required' },
        { status: 400 }
      );
    }

    // Check if user owns the track or is admin
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug();

    // Create smart link with platform links
    const smartLink = await prisma.smartLink.create({
      data: {
        trackId,
        slug,
        title,
        description,
        platformLinks: {
          create: platformLinks.map((link: any) => ({
            platform: link.platform,
            url: link.url,
          })),
        },
      },
      include: {
        track: {
          select: {
            title: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
        platformLinks: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Smart link created successfully',
        smartLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating smart link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId') || session.user.id;

    // Check if user can access this data
    if (artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const smartLinks = await prisma.smartLink.findMany({
      where: {
        track: { artistId },
      },
      include: {
        track: {
          select: {
            title: true,
            coverImageUrl: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
        platformLinks: {
          select: {
            platform: true,
            url: true,
            clickCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ smartLinks });
  } catch (error) {
    console.error('Error fetching smart links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Smart Link Landing Page

#### `src/app/link/[slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import SmartLinkLanding from '@/components/smart-links/SmartLinkLanding'

interface SmartLinkPageProps {
  params: { slug: string }
}

async function getSmartLinkData(slug: string) {
  const smartLink = await prisma.smartLink.findUnique({
    where: { slug },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          coverImageUrl: true,
          artist: {
            select: {
              name: true,
              image: true,
            }
          }
        }
      },
      platformLinks: {
        where: { isActive: true },
        orderBy: { clickCount: 'desc' }
      }
    }
  })

  if (!smartLink) {
    return null
  }

  return smartLink
}

export default async function SmartLinkPage({ params }: SmartLinkPageProps) {
  const smartLink = await getSmartLinkData(params.slug)

  if (!smartLink) {
    notFound()
  }

  return <SmartLinkLanding smartLink={smartLink} />
}
```

### 5. Smart Link Landing Component

#### `src/components/smart-links/SmartLinkLanding.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PlayIcon,
  HeartIcon,
  ShareIcon,
  ExternalLinkIcon
} from '@heroicons/react/24/outline'
import { useAudioStore } from '@/store/audio-store'

interface PlatformLink {
  id: string
  platform: string
  url: string
  clickCount: number
}

interface Track {
  id: string
  title: string
  coverImageUrl: string | null
  artist: {
    name: string
    image: string | null
  }
}

interface SmartLink {
  id: string
  title: string | null
  description: string | null
  clickCount: number
  track: Track
  platformLinks: PlatformLink[]
}

interface SmartLinkLandingProps {
  smartLink: SmartLink
}

const PLATFORM_ICONS: Record<string, { icon: string; color: string; name: string }> = {
  SPOTIFY: { icon: '🎵', color: 'bg-green-500', name: 'Spotify' },
  APPLE_MUSIC: { icon: '🍎', color: 'bg-pink-500', name: 'Apple Music' },
  YOUTUBE: { icon: '📺', color: 'bg-red-500', name: 'YouTube' },
  SOUNDCLOUD: { icon: '☁️', color: 'bg-orange-500', name: 'SoundCloud' },
  TIKTOK: { icon: '🎵', color: 'bg-black', name: 'TikTok' },
  INSTAGRAM: { icon: '📷', color: 'bg-purple-500', name: 'Instagram' },
  BANDCAMP: { icon: '🎸', color: 'bg-blue-500', name: 'Bandcamp' },
  DEEZER: { icon: '🎧', color: 'bg-blue-600', name: 'Deezer' },
}

export default function SmartLinkLanding({ smartLink }: SmartLinkLandingProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null)
  const { setCurrentTrack, play, pause, currentTrack } = useAudioStore()

  const isCurrentTrack = currentTrack?.id === smartLink.track.id

  const handlePlay = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pause()
        setIsPlaying(false)
      } else {
        play()
        setIsPlaying(true)
      }
    } else {
      // Set as current track and play
      setCurrentTrack({
        id: smartLink.track.id,
        title: smartLink.track.title,
        artist: smartLink.track.artist,
        coverImageUrl: smartLink.track.coverImageUrl,
        fileUrl: '', // This would need to be fetched from the track
        genre: '',
        album: null,
        duration: 0,
        playCount: 0,
        likeCount: 0,
      })
      setIsPlaying(true)
    }
  }

  const handlePlatformClick = async (platform: string, url: string) => {
    setCurrentPlatform(platform)

    try {
      // Record the click
      await fetch(`/api/smart-links/${smartLink.id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      })

      // Redirect to the platform
      setTimeout(() => {
        window.open(url, '_blank')
        setCurrentPlatform(null)
      }, 100)
    } catch (error) {
      console.error('Error recording click:', error)
      // Still redirect even if recording fails
      window.open(url, '_blank')
      setCurrentPlatform(null)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: smartLink.title || `Listen to ${smartLink.track.title}`,
          text: smartLink.description || `Check out "${smartLink.track.title}" by ${smartLink.track.artist.name}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-4"
          >
            {smartLink.title || `Listen to ${smartLink.track.title}`}
          </motion.h1>

          {smartLink.description && (
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              {smartLink.description}
            </motion.p>
          )}
        </div>

        {/* Track Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {smartLink.track.coverImageUrl ? (
                <img
                  src={smartLink.track.coverImageUrl}
                  alt={`${smartLink.track.title} cover`}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {smartLink.track.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Track Details */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {smartLink.track.title}
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                by {smartLink.track.artist.name}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handlePlay}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-lg"
                >
                  {isCurrentTrack && isPlaying ? (
                    <>
                      <PauseIcon className="w-5 h-5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Play Preview</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-6 py-3 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors shadow-lg"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Choose Your Platform
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartLink.platformLinks.map((platformLink) => {
              const platformInfo = PLATFORM_ICONS[platformLink.platform]

              return (
                <motion.button
                  key={platformLink.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlatformClick(platformLink.platform, platformLink.url)}
                  disabled={currentPlatform === platformLink.platform}
                  className={`relative p-6 rounded-xl text-white transition-all duration-200 ${
                    platformInfo?.color || 'bg-gray-500'
                  } hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{platformInfo?.icon}</div>
                    <div className="text-lg font-semibold mb-1">
                      {platformInfo?.name}
                    </div>
                    <div className="text-sm opacity-90">
                      {platformLink.clickCount} clicks
                    </div>
                  </div>

                  {currentPlatform === platformLink.platform && (
                    <div className="absolute inset-0 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}

                  <ExternalLinkIcon className="absolute top-3 right-3 w-5 h-5 opacity-70" />
                </motion.button>
              )
            })}
          </div>

          {/* Stats */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              This smart link has been clicked {smartLink.clickCount} times
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### 6. Smart Link Click Tracking API

#### `src/app/api/smart-links/[id]/click/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Record the click using a transaction
    const [updatedSmartLink, updatedPlatformLink] = await prisma.$transaction([
      // Update smart link click count
      prisma.smartLink.update({
        where: { id: params.id },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),

      // Update platform link click count
      prisma.platformLink.updateMany({
        where: {
          smartLinkId: params.id,
          platform: platform,
        },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Click recorded successfully',
      updatedSmartLink,
      updatedPlatformLink,
    });
  } catch (error) {
    console.error('Error recording click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7. Smart Link Management Page

#### `src/app/(dashboard)/artist/smart-links/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SmartLinkList from '@/components/smart-links/SmartLinkList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

async function getArtistSmartLinks(userId: string) {
  const smartLinks = await prisma.smartLink.findMany({
    where: {
      track: { artistId: userId }
    },
    include: {
      track: {
        select: {
          title: true,
          coverImageUrl: true,
          artist: {
            select: {
              name: true
            }
          }
        }
      },
      platformLinks: {
        select: {
          platform: true,
          url: true,
          clickCount: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return smartLinks
}

export default async function SmartLinksPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const smartLinks = await getArtistSmartLinks(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Smart Links
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your shareable links across all platforms
            </p>
          </div>

          <Link
            href="/artist/smart-links/create"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create New Link</span>
          </Link>
        </div>

        <SmartLinkList smartLinks={smartLinks} />
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Smart link creation works** - Can create links with multiple platforms
2. **Landing pages display correctly** - Smart link pages render properly
3. **Click tracking functional** - Platform clicks are recorded accurately
4. **Analytics working** - Click counts and statistics update correctly
5. **Share functionality** - Can share smart links via various methods
6. **Responsive design** - Works on all device sizes

### Test Commands:

```bash
# Test smart link creation
# 1. Login as artist
# 2. Create new smart link
# 3. Add multiple platform links
# 4. Verify creation success

# Test landing page
# 1. Visit smart link URL
# 2. Test platform redirects
# 3. Verify click tracking
# 4. Test share functionality
```

## 🚨 Common Issues & Solutions

### Issue: Smart link creation fails

**Solution**: Check database schema, verify track ownership, validate platform link format

### Issue: Landing page not loading

**Solution**: Verify slug generation, check database queries, validate route configuration

### Issue: Click tracking not working

**Solution**: Check API routes, verify database transactions, validate platform data

### Issue: Platform redirects failing

**Solution**: Validate platform URLs, check CORS settings, verify external link handling

## 📝 Notes

- Implement proper URL validation for platform links
- Consider adding link expiration and deactivation features
- Add analytics for geographic and device data
- Implement link customization options (themes, layouts)
- Consider adding QR code generation for smart links

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 10: Subscription System](./10-subscription-system.md)
