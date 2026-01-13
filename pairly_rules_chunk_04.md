# Flemoji Rules Archive (Chunk 4)

## 09-smart-links.md

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

---

## 10-subscription-system.md

# Phase 10: Subscription System

## 🎯 Objective

Implement a comprehensive subscription system using Stripe that allows users to upgrade to premium features, manage their subscriptions, and access advanced analytics and platform features.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, & 9 completed successfully
- Smart links system functional
- Analytics system working
- Stripe account and API keys configured

## 🚀 Step-by-Step Implementation

### 1. Install Stripe Dependencies

```bash
# Stripe integration
yarn add stripe
yarn add @stripe/stripe-js

# Payment forms and validation
yarn add react-stripe-js
yarn add @stripe/react-stripe-js
```

### 2. Stripe Configuration

#### `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};

export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: [
      'Stream unlimited music',
      'Basic analytics',
      'Create playlists',
      'Follow artists',
    ],
    stripePriceId: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    features: [
      'All Basic features',
      'Advanced analytics',
      'Premium content access',
      'Ad-free experience',
      'High-quality streaming',
      'Download tracks',
      'Exclusive artist content',
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  },
  {
    id: 'artist-pro',
    name: 'Artist Pro',
    price: 19.99,
    features: [
      'All Premium features',
      'Advanced artist analytics',
      'Smart link customization',
      'Priority support',
      'Featured placement',
      'Revenue sharing',
      'Marketing tools',
    ],
    stripePriceId: process.env.STRIPE_ARTIST_PRO_PRICE_ID,
  },
];

export const getPlanById = (id: string) => {
  return subscriptionPlans.find(plan => plan.id === id);
};

export const getPlanByStripePriceId = (stripePriceId: string) => {
  return subscriptionPlans.find(plan => plan.stripePriceId === stripePriceId);
};
```

### 3. Subscription Management Store

#### `src/store/subscription-store.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Subscription {
  id: string;
  status:
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: string;
}

export interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSubscription: (subscription: Subscription | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  immer((set, get) => ({
    subscription: null,
    isLoading: false,
    error: null,

    setSubscription: subscription => {
      set(state => {
        state.subscription = subscription;
      });
    },

    setLoading: loading => {
      set(state => {
        state.isLoading = loading;
      });
    },

    setError: error => {
      set(state => {
        state.error = error;
      });
    },

    refreshSubscription: async () => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/subscription/current');
        if (response.ok) {
          const data = await response.json();
          set(state => {
            state.subscription = data.subscription;
          });
        }
      } catch (error) {
        set(state => {
          state.error = 'Failed to refresh subscription';
        });
      } finally {
        set(state => {
          state.isLoading = false;
        });
      }
    },

    cancelSubscription: async () => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/subscription/cancel', {
          method: 'POST',
        });

        if (response.ok) {
          await get().refreshSubscription();
        } else {
          const error = await response.json();
          set(state => {
            state.error = error.message || 'Failed to cancel subscription';
          });
        }
      } catch (error) {
        set(state => {
          state.error = 'Failed to cancel subscription';
        });
      } finally {
        set(state => {
          state.isLoading = false;
        });
      }
    },

    reactivateSubscription: async () => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/subscription/reactivate', {
          method: 'POST',
        });

        if (response.ok) {
          await get().refreshSubscription();
        } else {
          const error = await response.json();
          set(state => {
            state.error = error.message || 'Failed to reactivate subscription';
          });
        }
      } catch (error) {
        set(state => {
          state.error = 'Failed to reactivate subscription';
        });
      } finally {
        set(state => {
          state.isLoading = false;
        });
      }
    },
  }))
);
```

### 4. Pricing Page

#### `src/app/pricing/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionPlans } from '@/lib/stripe'
import PricingCards from '@/components/subscription/PricingCards'
import { CheckIcon } from '@heroicons/react/24/outline'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock premium features and take your music experience to the next level.
            Choose the plan that best fits your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards plans={subscriptionPlans} user={session?.user} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I downgrade my plan?
              </h3>
              <p className="text-gray-600">
                When you downgrade, you'll lose access to premium features at the end of your current billing period. Your data and playlists will be preserved.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all premium subscriptions. If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade my plan later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade your plan at any time. The new features will be available immediately, and you'll be charged the prorated difference.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <a
            href="/support"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 5. Pricing Cards Component

#### `src/components/subscription/PricingCards.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { subscriptionPlans } from '@/lib/stripe'

interface PricingCardsProps {
  plans: any[]
  user: any
}

export default function PricingCards({ plans, user }: PricingCardsProps) {
  const { data: session } = useSession()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing'
      return
    }

    if (planId === 'basic') {
      return // Basic plan is free
    }

    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => {
    // This would check against the user's current subscription
    return false
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className={`relative bg-white rounded-2xl shadow-lg p-8 ${
            plan.id === 'premium' ? 'ring-2 ring-primary-500 scale-105' : ''
          }`}
        >
          {/* Popular Badge */}
          {plan.id === 'premium' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                <StarIcon className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>
          )}

          {/* Plan Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500">/month</span>
              )}
            </div>
            {plan.price === 0 && (
              <p className="text-gray-600">Free forever</p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8">
            {plan.features.map((feature: string, featureIndex: number) => (
              <li key={featureIndex} className="flex items-start space-x-3">
                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <div className="text-center">
            {isCurrentPlan(plan.id) ? (
              <div className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
                className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                  plan.id === 'premium'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : plan.id === 'basic'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-secondary-500 text-white hover:bg-secondary-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && selectedPlan === plan.id ? (
                  'Processing...'
                ) : plan.price === 0 ? (
                  'Get Started'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            )}
          </div>

          {/* Additional Info */}
          {plan.price > 0 && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Cancel anytime. 30-day money-back guarantee.
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
```

### 6. Stripe Checkout API

#### `src/app/api/subscription/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, getPlanById } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, successUrl, cancelUrl } = body;

    if (!planId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = session.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          userId: session.user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: session.user.id,
        planId: planId,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7. Stripe Webhook Handler

#### `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const { userId, planId } = session.metadata;

  // Update user's subscription status
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      // Add other premium flags based on plan
    },
  });
}

async function handleSubscriptionCreated(subscription: any) {
  const { userId, planId } = subscription.metadata;

  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  const { userId } = subscription.metadata;

  // Update user's premium status
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: false },
  });

  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELED' },
  });
}

async function handlePaymentSucceeded(invoice: any) {
  // Handle successful payment
  console.log('Payment succeeded:', invoice.id);
}

async function handlePaymentFailed(invoice: any) {
  // Handle failed payment
  console.log('Payment failed:', invoice.id);
}
```

### 8. Subscription Management Page

#### `src/app/(dashboard)/subscription/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SubscriptionDetails from '@/components/subscription/SubscriptionDetails'
import BillingHistory from '@/components/subscription/BillingHistory'

async function getSubscriptionData(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      stripeCustomerId: true,
    }
  })

  return { subscription, user }
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { subscription, user } = await getSubscriptionData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Subscription & Billing
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription, update payment methods, and view billing history
          </p>
        </div>

        <div className="space-y-8">
          <SubscriptionDetails subscription={subscription} user={user} />
          <BillingHistory userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Subscription creation works** - Can create Stripe checkout sessions
2. **Webhook handling functional** - Subscription events are processed correctly
3. **Premium features accessible** - Users can access premium content after subscription
4. **Billing management works** - Can view and manage subscription details
5. **Payment processing** - Stripe payments are processed successfully
6. **Subscription lifecycle** - Can cancel, reactivate, and upgrade subscriptions

### Test Commands:

```bash
# Test subscription flow
# 1. Create test subscription
# 2. Verify webhook processing
# 3. Test premium feature access
# 4. Verify billing management

# Test Stripe integration
# 1. Use Stripe test cards
# 2. Test webhook events
# 3. Verify customer creation
# 4. Test subscription updates
```

## 🚨 Common Issues & Solutions

### Issue: Stripe checkout not working

**Solution**: Verify API keys, check webhook configuration, validate price IDs

### Issue: Webhooks not processing

**Solution**: Check webhook endpoint, verify signature validation, test with Stripe CLI

### Issue: Premium features not accessible

**Solution**: Check subscription status, verify user premium flags, check database updates

### Issue: Payment failures

**Solution**: Verify Stripe account status, check payment method validation, test with valid cards

## 📝 Notes

- Use Stripe test mode for development
- Implement proper error handling for payment failures
- Consider adding subscription tiers and upgrades
- Implement usage-based billing if needed
- Add proper logging for webhook events

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 11: Premium Analytics](./11-premium-analytics.md)

---

## 11-premium-analytics.md

# Phase 11: Premium Analytics

## 🎯 Objective

Implement advanced analytics features exclusively for premium users, including detailed performance metrics, audience insights, trend analysis, and predictive analytics to help artists and users make data-driven decisions.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, & 10 completed successfully
- Subscription system functional
- Basic analytics system working
- Premium user access control implemented

## 🚀 Step-by-Step Implementation

### 1. Premium Analytics Dashboard

#### `src/app/(dashboard)/premium-analytics/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import PremiumAnalyticsDashboard from '@/components/analytics/PremiumAnalyticsDashboard'
import { subscriptionPlans } from '@/lib/stripe'

async function getPremiumAnalyticsData(userId: string) {
  // Check if user has premium access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      role: true,
      subscription: {
        select: {
          status: true,
          stripePriceId: true,
        }
      }
    }
  })

  if (!user?.isPremium && user?.role !== 'ADMIN') {
    return null
  }

  // Get comprehensive analytics data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get user's tracks (if artist)
  const tracks = user.role === 'ARTIST' ? await prisma.track.findMany({
    where: { artistId: userId },
    include: {
      playEvents: {
        where: {
          timestamp: { gte: thirtyDaysAgo }
        },
        select: {
          timestamp: true,
          duration: true,
          completed: true,
          ipAddress: true,
          userAgent: true,
        }
      },
      _count: {
        select: {
          likes: true,
        }
      }
    }
  }) : []

  // Get audience demographics (if available)
  const audienceData = await prisma.playEvent.groupBy({
    by: ['ipAddress'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Get geographic data (simplified - in production, use IP geolocation service)
  const geographicData = audienceData.slice(0, 10).map((item, index) => ({
    location: `Location ${index + 1}`,
    plays: item._count.id,
    percentage: Math.round((item._count.id / audienceData.length) * 100)
  }))

  // Get device/browser data
  const deviceData = await prisma.playEvent.groupBy({
    by: ['userAgent'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Get time-based analytics
  const timeAnalytics = await prisma.playEvent.groupBy({
    by: ['timestamp'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Calculate advanced metrics
  const totalPlays = tracks.reduce((sum, track) => sum + track.playEvents.length, 0)
  const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0)
  const totalDuration = tracks.reduce((sum, track) =>
    sum + track.playEvents.reduce((trackSum, event) => trackSum + (event.duration || 0), 0), 0
  )
  const completionRate = totalPlays > 0
    ? (tracks.reduce((sum, track) =>
        sum + track.playEvents.filter(event => event.completed).length, 0) / totalPlays) * 100
    : 0

  // Get trending analysis
  const trendingTracks = tracks
    .sort((a, b) => b.playEvents.length - a.playEvents.length)
    .slice(0, 5)
    .map(track => ({
      id: track.id,
      title: track.title,
      plays: track.playEvents.length,
      likes: track._count.likes,
      completionRate: track.playEvents.length > 0
        ? (track.playEvents.filter(event => event.completed).length / track.playEvents.length) * 100
        : 0
    }))

  return {
    user,
    summary: {
      totalPlays,
      totalLikes,
      totalDuration,
      completionRate: Math.round(completionRate * 100) / 100,
      uniqueListeners: audienceData.length,
      totalTracks: tracks.length,
    },
    tracks,
    geographicData,
    deviceData: deviceData.slice(0, 5),
    timeAnalytics: timeAnalytics.map(item => ({
      date: item.timestamp,
      plays: item._count.id,
    })),
    trendingTracks,
    timeRange: {
      start: thirtyDaysAgo,
      end: new Date(),
      days: 30,
    }
  }
}

export default async function PremiumAnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const analyticsData = await getPremiumAnalyticsData(session.user.id)

  if (!analyticsData) {
    redirect('/pricing?feature=premium-analytics')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Premium Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Advanced insights and detailed metrics for premium users
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                Premium
              </span>
            </div>
          </div>
        </div>

        <PremiumAnalyticsDashboard data={analyticsData} />
      </div>
    </div>
  )
}
```

### 2. Premium Analytics Dashboard Component

#### `src/components/analytics/PremiumAnalyticsDashboard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { formatDuration } from '@/lib/utils'

interface PremiumAnalyticsData {
  user: any
  summary: {
    totalPlays: number
    totalLikes: number
    totalDuration: number
    completionRate: number
    uniqueListeners: number
    totalTracks: number
  }
  tracks: any[]
  geographicData: Array<{
    location: string
    plays: number
    percentage: number
  }>
  deviceData: Array<{
    userAgent: string
    _count: { id: number }
  }>
  timeAnalytics: Array<{
    date: string
    plays: number
  }>
  trendingTracks: Array<{
    id: string
    title: string
    plays: number
    likes: number
    completionRate: number
  }>
  timeRange: {
    start: Date
    end: Date
    days: number
  }
}

interface PremiumAnalyticsDashboardProps {
  data: PremiumAnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function PremiumAnalyticsDashboard({ data }: PremiumAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'plays' | 'likes' | 'duration'>('plays')

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ]

  const metricOptions = [
    { value: 'plays', label: 'Plays', icon: TrendingUpIcon },
    { value: 'likes', label: 'Likes', icon: UsersIcon },
    { value: 'duration', label: 'Duration', icon: ClockIcon },
  ]

  // Process device data for better display
  const processedDeviceData = data.deviceData.map(item => {
    const userAgent = item.userAgent || 'Unknown'
    let deviceType = 'Unknown'
    let browser = 'Unknown'

    if (userAgent.includes('Mobile')) deviceType = 'Mobile'
    else if (userAgent.includes('Tablet')) deviceType = 'Tablet'
    else if (userAgent.includes('Windows') || userAgent.includes('Mac')) deviceType = 'Desktop'

    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    return {
      deviceType,
      browser,
      plays: item._count.id
    }
  })

  // Group by device type
  const deviceTypeData = processedDeviceData.reduce((acc, item) => {
    acc[item.deviceType] = (acc[item.deviceType] || 0) + item.plays
    return acc
  }, {} as Record<string, number>)

  const deviceTypeChartData = Object.entries(deviceTypeData).map(([type, plays]) => ({
    type,
    plays
  }))

  // Group by browser
  const browserData = processedDeviceData.reduce((acc, item) => {
    acc[item.browser] = (acc[item.browser] || 0) + item.plays
    return acc
  }, {} as Record<string, number>)

  const browserChartData = Object.entries(browserData).map(([browser, plays]) => ({
    browser,
    plays
  }))

  return (
    <div className="space-y-8">
      {/* Advanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <TrendingUpIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plays</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalPlays.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Listeners</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.uniqueListeners.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.completionRate}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(data.summary.totalDuration)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
          <div className="flex space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.timeAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="plays"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic and Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <GlobeAltIcon className="w-5 h-5 mr-2" />
            Geographic Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.geographicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="plays" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
            Device Types
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ deviceType, percentage }) => `${deviceType} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="plays"
              >
                {deviceTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Browser Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Browser Usage</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={browserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="browser" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="plays" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trending Tracks Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Tracks</h3>

        <div className="space-y-4">
          {data.trendingTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{track.title}</h4>
                  <p className="text-sm text-gray-500">{track.plays} plays</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{track.likes}</p>
                  <p className="text-gray-500">Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{track.completionRate.toFixed(1)}%</p>
                  <p className="text-gray-500">Completion</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Radar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>

        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={[
            {
              metric: 'Plays',
              value: Math.min((data.summary.totalPlays / 1000) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Engagement',
              value: data.summary.completionRate,
              fullMark: 100,
            },
            {
              metric: 'Reach',
              value: Math.min((data.summary.uniqueListeners / 500) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Likes',
              value: Math.min((data.summary.totalLikes / 100) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Retention',
              value: data.summary.completionRate,
              fullMark: 100,
            },
          ]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Performance Highlights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your top track has {data.trendingTracks[0]?.plays || 0} plays</li>
              <li>• Overall completion rate is {data.summary.completionRate}%</li>
              <li>• {data.summary.uniqueListeners} unique listeners this period</li>
              <li>• Average engagement rate is strong</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Growth Opportunities</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Focus on mobile optimization ({(deviceTypeData.Mobile || 0) / data.summary.totalPlays * 100}% mobile users)</li>
              <li>• Consider promoting tracks with lower completion rates</li>
              <li>• Expand reach in top geographic locations</li>
              <li>• Leverage trending tracks for marketing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Advanced Analytics API Routes

#### `src/app/api/analytics/premium/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can access this data
    if (params.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has premium access
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        isPremium: true,
        role: true,
        subscription: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user?.isPremium && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Premium access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const metric = searchParams.get('metric') || 'plays';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get advanced analytics data
    const analytics = await getAdvancedAnalytics(
      params.userId,
      startDate,
      metric
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching premium analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAdvancedAnalytics(
  userId: string,
  startDate: Date,
  metric: string
) {
  // Get user's tracks
  const tracks = await prisma.track.findMany({
    where: { artistId: userId },
    include: {
      playEvents: {
        where: {
          timestamp: { gte: startDate },
        },
        select: {
          timestamp: true,
          duration: true,
          completed: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  // Calculate advanced metrics
  const totalPlays = tracks.reduce(
    (sum, track) => sum + track.playEvents.length,
    0
  );
  const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0);
  const totalDuration = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.reduce(
        (trackSum, event) => trackSum + (event.duration || 0),
        0
      ),
    0
  );

  // Get time-based analytics with more granular data
  const hourlyData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM "timestamp") as hour,
      COUNT(*) as plays,
      AVG(duration) as avg_duration
    FROM play_events 
    WHERE "trackId" IN (
      SELECT id FROM tracks WHERE "artistId" = ${userId}
    ) 
      AND "timestamp" >= ${startDate}
    GROUP BY EXTRACT(HOUR FROM "timestamp")
    ORDER BY hour
  `;

  // Get weekly trends
  const weeklyData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', "timestamp") as week,
      COUNT(*) as plays,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
    FROM play_events 
    WHERE "trackId" IN (
      SELECT id FROM tracks WHERE "artistId" = ${userId}
    ) 
      AND "timestamp" >= ${startDate}
    GROUP BY DATE_TRUNC('week', "timestamp")
    ORDER BY week
  `;

  // Get audience insights
  const audienceInsights = await prisma.playEvent.groupBy({
    by: ['ipAddress'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: startDate },
    },
    _count: {
      id: true,
    },
    _sum: {
      duration: true,
    },
  });

  // Calculate engagement metrics
  const engagementMetrics = {
    totalPlays,
    totalLikes,
    totalDuration,
    uniqueListeners: audienceInsights.length,
    completionRate:
      totalPlays > 0
        ? (tracks.reduce(
            (sum, track) =>
              sum + track.playEvents.filter(event => event.completed).length,
            0
          ) /
            totalPlays) *
          100
        : 0,
    avgPlayDuration: totalPlays > 0 ? totalDuration / totalPlays : 0,
    listenerRetention: calculateListenerRetention(audienceInsights),
  };

  // Get predictive analytics
  const predictions = await getPredictiveAnalytics(tracks, startDate);

  return {
    summary: engagementMetrics,
    timeAnalytics: {
      hourly: hourlyData,
      weekly: weeklyData,
    },
    audienceInsights,
    predictions,
    recommendations: generateRecommendations(engagementMetrics, tracks),
  };
}

function calculateListenerRetention(audienceInsights: any[]) {
  // Calculate listener retention based on repeat plays
  const repeatListeners = audienceInsights.filter(
    insight => insight._count.id > 1
  ).length;
  return audienceInsights.length > 0
    ? (repeatListeners / audienceInsights.length) * 100
    : 0;
}

async function getPredictiveAnalytics(tracks: any[], startDate: Date) {
  // Simple trend analysis - in production, use ML models
  const recentPlays = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.filter(
        event =>
          new Date(event.timestamp) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    0
  );

  const previousWeekPlays = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        const weekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
        return eventDate >= twoWeeksAgo && eventDate < weekAgo;
      }).length,
    0
  );

  const growthRate =
    previousWeekPlays > 0
      ? ((recentPlays - previousWeekPlays) / previousWeekPlays) * 100
      : 0;

  return {
    projectedPlays: Math.round(recentPlays * (1 + growthRate / 100)),
    growthRate: Math.round(growthRate * 100) / 100,
    trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
  };
}

function generateRecommendations(metrics: any, tracks: any[]) {
  const recommendations = [];

  if (metrics.completionRate < 70) {
    recommendations.push({
      type: 'warning',
      title: 'Low Completion Rate',
      message: 'Consider optimizing track intros and improving audio quality',
      priority: 'high',
    });
  }

  if (metrics.avgPlayDuration < 60) {
    recommendations.push({
      type: 'info',
      title: 'Short Play Duration',
      message: 'Focus on creating engaging content that keeps listeners hooked',
      priority: 'medium',
    });
  }

  if (tracks.length < 5) {
    recommendations.push({
      type: 'success',
      title: 'Content Expansion',
      message:
        'Adding more tracks can increase your overall reach and engagement',
      priority: 'low',
    });
  }

  return recommendations;
}
```

### 4. Premium Feature Access Control

#### `src/components/auth/PremiumGuard.tsx`

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import Link from 'next/link'
import {
  StarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface PremiumGuardProps {
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export default function PremiumGuard({
  children,
  fallback,
  showUpgradePrompt = true
}: PremiumGuardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-6">
          Please sign in to access this feature.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (!session.user.isPremium) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showUpgradePrompt) {
      return (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This feature is exclusively available to premium subscribers.
            Upgrade your account to unlock advanced analytics and premium features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              View Plans
            </Link>
            <Link
              href="/subscription"
              className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Manage Subscription
            </Link>
          </div>
        </div>
      )
    }

    return null
  }

  return <>{children}</>
}
```

### 5. Premium Analytics Hooks

#### `src/hooks/usePremiumAnalytics.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PremiumAnalyticsOptions {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d';
  metric?: 'plays' | 'likes' | 'duration';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePremiumAnalytics(options: PremiumAnalyticsOptions = {}) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userId = session?.user?.id,
    timeRange = '30d',
    metric = 'plays',
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const fetchAnalytics = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics/premium/${userId}?days=${timeRange}&metric=${metric}`
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId, timeRange, metric]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const refresh = () => {
    fetchAnalytics();
  };

  const exportData = async (format: 'csv' | 'json' = 'json') => {
    if (!data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `premium-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `premium-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
    exportData,
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - in production, use a proper CSV library
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(acc, flattenObject(obj[key], pre + key));
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      },
      {} as Record<string, any>
    );
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);

  return [headers.join(','), values.join(',')].join('\n');
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Premium access control works** - Only premium users can access features
2. **Advanced analytics display** - Charts and metrics render correctly
3. **Data accuracy** - Analytics show correct information
4. **Performance acceptable** - Dashboard loads within reasonable time
5. **Export functionality** - Can export data in different formats
6. **Responsive design** - Works on all device sizes

### Test Commands:

```bash
# Test premium access control
# 1. Try accessing as non-premium user
# 2. Verify upgrade prompts display
# 3. Test with premium user access

# Test analytics functionality
# 1. Verify charts render correctly
# 2. Test data export features
# 3. Check real-time updates
```

## 🚨 Common Issues & Solutions

### Issue: Premium features not accessible

**Solution**: Check subscription status, verify premium flags, check access control logic

### Issue: Analytics data missing

**Solution**: Verify database queries, check user permissions, validate data relationships

### Issue: Charts not rendering

**Solution**: Check chart library installation, verify data format, check for JavaScript errors

### Issue: Performance issues

**Solution**: Implement data caching, optimize database queries, add loading states

## 📝 Notes

- Implement proper data caching for better performance
- Consider adding real-time analytics updates
- Implement data export limits for large datasets
- Add analytics data retention policies
- Consider implementing ML-powered insights

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 12: Admin Dashboard](./12-admin-dashboard.md)

---

## 12-admin-dashboard.md

# Phase 12: Admin Dashboard

## 🎯 Objective

Implement a comprehensive admin dashboard that provides system administrators with tools to manage users, moderate content, monitor platform performance, configure system settings, and oversee the entire music streaming platform.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, & 11 completed successfully
- Premium analytics system functional
- User roles and permissions working
- Database with comprehensive data available

## 🔐 Admin Account Setup

### Quick Setup (Development)

#### **Default Admin Credentials**

- **Email**: `dev@dev.com`
- **Password**: `dev`
- **Name**: `Dev`
- **Role**: `ADMIN`

#### **Setup Commands**

```bash
# Option 1: Create admin account
yarn create-admin

# Option 2: Use seed script
yarn db:seed

# Option 3: Full database setup
yarn setup-db
```

#### **Custom Admin Creation**

```bash
# Interactive mode - prompts for details
yarn create-admin

# Command line mode - specify details
yarn create-admin --email admin@yourdomain.com --password securepassword --name "Your Name"
```

### Admin Login Flow

#### **Automatic Redirect System**

When an admin logs in, they are automatically redirected to the admin dashboard:

1. **Login**: Go to `http://localhost:3000/login`
2. **Enter credentials**: `dev@dev.com` / `dev`
3. **Automatic redirect**: System detects admin role and redirects to `/admin/dashboard`
4. **No profile creation**: Admin users skip the profile selection screen entirely

#### **Role-Based Access Control**

- **Admin users**: Automatically redirected to admin dashboard
- **Regular users**: Continue to normal profile creation flow
- **Artists**: Access artist-specific dashboard features

### Security Considerations

#### **Development vs Production**

- **Development**: Use default credentials for quick setup
- **Production**: Create secure admin accounts with strong passwords
- **Never use default credentials in production**

#### **Admin Account Features**

Once created, admin accounts have:

- **Full platform access** to all features
- **Admin dashboard** at `/admin/dashboard`
- **User management** capabilities
- **Content moderation** tools
- **System analytics** and monitoring
- **Premium features** enabled by default

### Troubleshooting Admin Setup

#### **"Admin account already exists"**

- Use the existing admin account
- Create a new admin with different email
- Delete the existing admin and recreate

#### **"Database connection failed"**

- Verify `DATABASE_URL` in `.env.local`
- Ensure database is running
- Check database permissions

#### **Admin not redirecting to dashboard**

- Check that user has `role: 'ADMIN'` in database
- Verify session includes role information
- Check browser console for errors

## 🚀 Step-by-Step Implementation

### 1. Admin Dashboard Layout

#### `src/app/(dashboard)/admin/dashboard/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AdminDashboard from '@/components/admin/AdminDashboard'
import SystemStats from '@/components/admin/SystemStats'
import QuickActions from '@/components/admin/QuickActions'
import RecentActivity from '@/components/admin/RecentActivity'

async function getAdminData() {
  // Get system-wide statistics
  const totalUsers = await prisma.user.count()
  const totalTracks = await prisma.track.count()
  const totalPlays = await prisma.playEvent.count()
  const totalSmartLinks = await prisma.smartLink.count()

  // Get user statistics by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      id: true
    }
  })

  // Get recent activity
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })

  const recentTracks = await prisma.track.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      artist: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get pending moderation items
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      reporter: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get system performance metrics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayPlays = await prisma.playEvent.count({
    where: {
      timestamp: {
        gte: today
      }
    }
  })

  const todayUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: today
      }
    }
  })

  const todayTracks = await prisma.track.count({
    where: {
      createdAt: {
        gte: today
      }
    }
  })

  return {
    stats: {
      totalUsers,
      totalTracks,
      totalPlays,
      totalSmartLinks,
      todayPlays,
      todayUsers,
      todayTracks,
    },
    usersByRole,
    recentUsers,
    recentTracks,
    pendingReports,
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const adminData = await getAdminData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                System administration and platform oversight
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Admin Access
              </span>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <SystemStats stats={adminData.stats} usersByRole={adminData.usersByRole} />

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentActivity
              recentUsers={adminData.recentUsers}
              recentTracks={adminData.recentTracks}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Reports ({adminData.pendingReports.length})
              </h3>
              <div className="space-y-3">
                {adminData.pendingReports.map((report) => (
                  <div key={report.id} className="text-sm">
                    <p className="font-medium text-gray-900">
                      {report.reporter.name}
                    </p>
                    <p className="text-gray-600">{report.reason}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href="/admin/reports"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All Reports →
              </a>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    67% Used
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. System Stats Component

#### `src/components/admin/SystemStats.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import {
  UsersIcon,
  MusicalNoteIcon,
  PlayIcon,
  LinkIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface SystemStatsProps {
  stats: {
    totalUsers: number
    totalTracks: number
    totalPlays: number
    totalSmartLinks: number
    todayPlays: number
    todayUsers: number
    todayTracks: number
  }
  usersByRole: Array<{
    role: string
    _count: { id: number }
  }>
}

export default function SystemStats({ stats, usersByRole }: SystemStatsProps) {
  const statItems = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `+${stats.todayUsers} today`,
      changeType: 'positive'
    },
    {
      label: 'Total Tracks',
      value: stats.totalTracks.toLocaleString(),
      icon: MusicalNoteIcon,
      color: 'bg-green-500',
      change: `+${stats.todayTracks} today`,
      changeType: 'positive'
    },
    {
      label: 'Total Plays',
      value: stats.totalPlays.toLocaleString(),
      icon: PlayIcon,
      color: 'bg-purple-500',
      change: `+${stats.todayPlays} today`,
      changeType: 'positive'
    },
    {
      label: 'Smart Links',
      value: stats.totalSmartLinks.toLocaleString(),
      icon: LinkIcon,
      color: 'bg-orange-500',
      change: 'Active',
      changeType: 'neutral'
    }
  ]

  const userRoleData = usersByRole.map(item => ({
    role: item.role,
    count: item._count.id,
    percentage: Math.round((item._count.id / stats.totalUsers) * 100)
  }))

  return (
    <div className="space-y-8">
      {/* Main Stats */}
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

      {/* User Role Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userRoleData.map((roleData, index) => (
            <motion.div
              key={roleData.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {roleData.count}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1).toLowerCase()}s
              </div>
              <div className="text-xs text-gray-500">
                {roleData.percentage}% of total users
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3. User Management Page

#### `src/app/(dashboard)/admin/users/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import UserManagement from '@/components/admin/UserManagement'

async function getUsersData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          tracks: true,
          playlists: true,
          followers: true,
          following: true,
        }
      },
      subscription: {
        select: {
          status: true,
        }
      }
    }
  })

  return users
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const users = await getUsersData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage users, roles, and platform access
          </p>
        </div>

        <UserManagement users={users} />
      </div>
    </div>
  )
}
```

### 4. User Management Component

#### `src/components/admin/UserManagement.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  role: string
  isPremium: boolean
  createdAt: string
  _count: {
    tracks: number
    playlists: number
    followers: number
    following: number
  }
  subscription?: {
    status: string
  }
}

interface UserManagementProps {
  users: User[]
}

export default function UserManagement({ users }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter.toUpperCase()
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        router.refresh()
        setIsEditing(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('An error occurred while updating user role')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting user')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'ARTIST':
        return 'bg-blue-100 text-blue-800'
      case 'USER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="artist">Artists</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {user.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                    {user.subscription && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription.status}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>{user._count.tracks} tracks</div>
                    <div>{user._count.followers} followers</div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditing(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit user"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit User' : 'User Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setIsEditing(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="USER">User</option>
                      <option value="ARTIST">Artist</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPremium"
                      checked={selectedUser.isPremium}
                      onChange={(e) => {
                        // Handle premium status change
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isPremium" className="text-sm text-gray-700">
                      Premium User
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedUser.name}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <p className="text-sm text-gray-900">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <p className="text-sm text-gray-900">
                        {selectedUser.isPremium ? 'Premium' : 'Basic'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tracks</p>
                      <p className="text-sm text-gray-900">{selectedUser._count.tracks}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Followers</p>
                      <p className="text-sm text-gray-900">{selectedUser._count.followers}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Joined</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
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

### 5. Admin API Routes

#### `src/app/api/admin/users/[id]/role/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['USER', 'ARTIST', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent admin from changing their own role
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### `src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent admin from deleting themselves
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists and is not an admin
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Delete user and all associated data
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Admin access control works** - Only admins can access admin features
2. **User management functional** - Can view, edit, and delete users
3. **System stats display** - Dashboard shows accurate platform metrics
4. **Role management works** - Can change user roles and permissions
5. **Quick actions functional** - All admin action buttons work correctly
6. **Responsive design** - Admin dashboard works on all device sizes

### Test Commands:

```bash
# Test admin access control
# 1. Try accessing as non-admin user
# 2. Verify admin-only features are protected
# 3. Test role-based access control

# Test user management
# 1. View user list and details
# 2. Change user roles
# 3. Delete users (non-admin)
# 4. Verify data integrity
```

## 🚨 Common Issues & Solutions

### Issue: Admin access not working

**Solution**: Check user role in database, verify session data, check middleware configuration

### Issue: User management failing

**Solution**: Check API routes, verify permissions, check database constraints

### Issue: System stats not accurate

**Solution**: Verify database queries, check data relationships, validate aggregation logic

### Issue: Role changes not persisting

**Solution**: Check database transactions, verify API responses, check for validation errors

## 📝 Notes

- Implement proper audit logging for admin actions
- Add confirmation dialogs for destructive actions
- Consider implementing admin activity tracking
- Add bulk user management features
- Implement admin notification system

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 13: Content Moderation](./13-content-moderation.md)

---

## 13-content-moderation.md

# Phase 13: Content Moderation

## 🎯 Objective

Implement a comprehensive content moderation system that allows users to report inappropriate content, provides admin tools for reviewing and managing reported content, and includes automated moderation features to maintain platform safety and compliance.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, & 12 completed successfully
- Admin dashboard functional
- User management system working
- Database with report and moderation models available

## 🚀 Step-by-Step Implementation

### 1. Content Moderation Dashboard

#### `src/app/(dashboard)/admin/moderation/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import ModerationDashboard from '@/components/moderation/ModerationDashboard'

async function getModerationData() {
  // Get pending reports
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: {
          name: true,
          email: true,
        }
      },
      reportedUser: {
        select: {
          name: true,
          email: true,
        }
      },
      track: {
        select: {
          title: true,
          artist: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  })

  // Get resolved reports (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const resolvedReports = await prisma.report.findMany({
    where: {
      status: { in: ['RESOLVED', 'REJECTED'] },
      updatedAt: { gte: thirtyDaysAgo }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      reporter: {
        select: {
          name: true,
        }
      },
      reportedUser: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get moderation statistics
  const totalReports = await prisma.report.count()
  const pendingCount = await prisma.report.count({ where: { status: 'PENDING' } })
  const resolvedCount = await prisma.report.count({ where: { status: 'RESOLVED' } })
  const rejectedCount = await prisma.report.count({ where: { status: 'REJECTED' } })

  // Get reports by type
  const reportsByType = await prisma.report.groupBy({
    by: ['reason'],
    _count: {
      id: true
    }
  })

  // Get reports by status
  const reportsByStatus = await prisma.report.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })

  return {
    pendingReports,
    resolvedReports,
    stats: {
      total: totalReports,
      pending: pendingCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
    },
    reportsByType,
    reportsByStatus,
  }
}

export default async function ModerationPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const moderationData = await getModerationData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Content Moderation
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage reported content, users, and platform violations
          </p>
        </div>

        <ModerationDashboard data={moderationData} />
      </div>
    </div>
  )
}
```

### 2. Moderation Dashboard Component

#### `src/components/moderation/ModerationDashboard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'
import ReportList from './ReportList'
import ModerationStats from './ModerationStats'

interface ModerationData {
  pendingReports: any[]
  resolvedReports: any[]
  stats: {
    total: number
    pending: number
    resolved: number
    rejected: number
  }
  reportsByType: Array<{
    reason: string
    _count: { id: number }
  }>
  reportsByStatus: Array<{
    status: string
    _count: { id: number }
  }>
}

interface ModerationDashboardProps {
  data: ModerationData
}

export default function ModerationDashboard({ data }: ModerationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'stats'>('pending')

  const tabs = [
    { id: 'pending', name: 'Pending Reports', count: data.stats.pending },
    { id: 'resolved', name: 'Resolved Reports', count: data.stats.resolved + data.stats.rejected },
    { id: 'stats', name: 'Statistics', count: null },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.pending}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.resolved}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <XCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.rejected}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.total}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && (
            <ReportList
              reports={data.pendingReports}
              status="pending"
            />
          )}

          {activeTab === 'resolved' && (
            <ReportList
              reports={data.resolvedReports}
              status="resolved"
            />
          )}

          {activeTab === 'stats' && (
            <ModerationStats
              reportsByType={data.reportsByType}
              reportsByStatus={data.reportsByStatus}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Report List Component

#### `src/components/moderation/ReportList.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  MusicalNoteIcon,
  FlagIcon
} from '@heroicons/react/24/outline'

interface Report {
  id: string
  reason: string
  description: string
  status: string
  createdAt: string
  reporter: {
    name: string
    email: string
  }
  reportedUser?: {
    name: string
    email: string
  }
  track?: {
    title: string
    artist: {
      name: string
    }
  }
}

interface ReportListProps {
  reports: Report[]
  status: 'pending' | 'resolved'
}

export default function ReportList({ reports, status }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleResolve = async (reportId: string, action: 'resolve' | 'reject') => {
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          status: action === 'resolve' ? 'RESOLVED' : 'REJECTED',
        }),
      })

      if (response.ok) {
        router.refresh()
        setSelectedReport(null)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to process report')
      }
    } catch (error) {
      console.error('Error processing report:', error)
      alert('An error occurred while processing the report')
    } finally {
      setIsProcessing(false)
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'COPYRIGHT_VIOLATION':
        return 'bg-red-100 text-red-800'
      case 'INAPPROPRIATE_CONTENT':
        return 'bg-orange-100 text-orange-800'
      case 'SPAM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HARASSMENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {status} reports
        </h3>
        <p className="text-gray-500">
          {status === 'pending'
            ? 'All reports have been processed.'
            : 'No reports have been resolved yet.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => setSelectedReport(report)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {report.track ? (
                  <MusicalNoteIcon className="w-6 h-6 text-blue-500" />
                ) : (
                  <UserIcon className="w-6 h-6 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(report.reason)}`}>
                    {report.reason.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900 truncate">
                  {report.track ? `Track: ${report.track.title}` : `User: ${report.reportedUser?.name}`}
                </p>

                <p className="text-sm text-gray-500">
                  Reported by {report.reporter.name} • {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedReport(report)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Report Details
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Report Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(selectedReport.reason)}`}>
                        {selectedReport.reason.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reported:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedReport.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reporter</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{selectedReport.reporter.name}</p>
                    <p className="text-sm text-gray-600">{selectedReport.reporter.email}</p>
                  </div>
                </div>

                {/* Reported Content */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reported Content</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedReport.track ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Track: {selectedReport.track.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Artist: {selectedReport.track.artist.name}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          User: {selectedReport.reportedUser?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedReport.reportedUser?.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedReport.description}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedReport.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleResolve(selectedReport.id, 'reject')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Reject Report'}
                    </button>

                    <button
                      onClick={() => handleResolve(selectedReport.id, 'resolve')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Resolve Report'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 4. Report API Routes

#### `src/app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, description, reportedUserId, trackId } = body;

    if (!reason || !description) {
      return NextResponse.json(
        { error: 'Reason and description are required' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      'COPYRIGHT_VIOLATION',
      'INAPPROPRIATE_CONTENT',
      'SPAM',
      'HARASSMENT',
      'OTHER',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // Prevent self-reporting
    if (reportedUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Check if user has already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId: reportedUserId || null,
        trackId: trackId || null,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reason,
        description,
        reporterId: session.user.id,
        reportedUserId,
        trackId,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
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
      },
    });

    return NextResponse.json(
      {
        message: 'Report submitted successfully',
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Only admins can view all reports
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
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
      },
    });

    const total = await prisma.report.count({ where });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Admin Report Management API

#### `src/app/api/admin/reports/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, status, adminNotes } = body;

    if (!action || !status) {
      return NextResponse.json(
        { error: 'Action and status are required' },
        { status: 400 }
      );
    }

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        reportedUser: true,
        track: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: {
        status: status.toUpperCase(),
        adminNotes,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    });

    // Take action based on the report
    if (action === 'resolve') {
      if (report.trackId) {
        // Remove track if it's a track report
        await prisma.track.update({
          where: { id: report.trackId },
          data: { isPublished: false },
        });
      } else if (report.reportedUserId) {
        // Suspend user if it's a user report
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { isSuspended: true },
        });
      }
    }

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
        action: action.toUpperCase(),
        reportId: params.id,
        adminId: session.user.id,
        targetType: report.trackId ? 'TRACK' : 'USER',
        targetId: report.trackId || report.reportedUserId,
        notes: adminNotes,
      },
    });

    return NextResponse.json({
      message: 'Report processed successfully',
      report: updatedReport,
    });
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
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
        moderationLogs: {
          include: {
            admin: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Report creation works** - Users can submit reports successfully
2. **Admin review functional** - Admins can view and process reports
3. **Content moderation works** - Reports trigger appropriate actions
4. **Status tracking** - Report status updates correctly
5. **Access control** - Only admins can access moderation tools
6. **Audit logging** - Moderation actions are logged properly

### Test Commands:

```bash
# Test report submission
# 1. Submit reports as different users
# 2. Verify report data is stored correctly
# 3. Test duplicate report prevention

# Test admin moderation
# 1. Login as admin
# 2. Review and process reports
# 3. Verify content actions are taken
# 4. Check audit logs
```

## 🚨 Common Issues & Solutions

### Issue: Reports not submitting

**Solution**: Check form validation, verify database schema, check user permissions

### Issue: Admin access not working

**Solution**: Verify admin role, check session data, validate route protection

### Issue: Content actions not triggering

**Solution**: Check action logic, verify database updates, validate target content

### Issue: Audit logging failing

**Solution**: Check moderation log schema, verify admin user data, validate log creation

## 📝 Notes

- Implement automated content filtering for common violations
- Add report analytics and trend analysis
- Consider implementing appeal process for rejected reports
- Add bulk moderation actions for efficiency
- Implement content warning system for borderline cases

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 14: Testing & QA](./14-testing-qa.md)

---
