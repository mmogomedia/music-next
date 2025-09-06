# Phase 6: User Interface & Experience

## 🎯 Objective

Implement a comprehensive user interface for music browsing, search functionality, user interactions (likes, follows), and create an engaging user experience that encourages music discovery and engagement.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, & 5 completed successfully
- Music streaming interface functional
- Database with tracks and user data available
- Authentication system working

## 🚀 Step-by-Step Implementation

### 1. Install UI Enhancement Dependencies

```bash
# UI components and animations
yarn add framer-motion
yarn add react-intersection-observer
yarn add react-virtualized-auto-sizer
yarn add react-window

# Icons and UI elements
yarn add lucide-react
yarn add @radix-ui/react-dialog
yarn add @radix-ui/react-dropdown-menu
yarn add @radix-ui/react-tooltip

# Charts for analytics display
yarn add recharts
yarn add chart.js react-chartjs-2
```

### 2. Enhanced Homepage with Featured Content

#### `src/app/page.tsx`

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import FeaturedTracks from '@/components/music/FeaturedTracks'
import TrendingArtists from '@/components/music/TrendingArtists'
import GenreHighlights from '@/components/music/GenreHighlights'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

async function getHomepageData() {
  // Get featured tracks (most played in last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const featuredTracks = await prisma.track.findMany({
    where: {
      isPublished: true,
      playEvents: {
        some: {
          timestamp: {
            gte: sevenDaysAgo
          }
        }
      }
    },
    orderBy: {
      playEvents: {
        _count: 'desc'
      }
    },
    take: 8,
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  })

  // Get trending artists (most followers gained)
  const trendingArtists = await prisma.user.findMany({
    where: {
      role: 'ARTIST',
      tracks: {
        some: {
          isPublished: true
        }
      }
    },
    orderBy: {
      followers: {
        _count: 'desc'
      }
    },
    take: 6,
    include: {
      _count: {
        select: {
          tracks: true,
          followers: true
        }
      }
    }
  })

  // Get genre distribution
  const genreStats = await prisma.track.groupBy({
    by: ['genre'],
    where: {
      isPublished: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 6
  })

  return {
    featuredTracks,
    trendingArtists,
    genreStats
  }
}

export default async function Home() {
  const { featuredTracks, trendingArtists, genreStats } = await getHomepageData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Flemoji
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Discover and stream music from independent artists. Upload your music,
              share it with the world, and track your success across all platforms.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/browse"
                className="group relative px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-full hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Start Listening</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>

              <Link
                href="/register"
                className="group relative px-8 py-4 bg-secondary-500 text-white text-lg font-semibold rounded-full hover:bg-secondary-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10">Join as Artist</span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {featuredTracks.length}+
                </div>
                <div className="text-gray-600">Featured Tracks</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary-600 mb-2">
                  {trendingArtists.length}+
                </div>
                <div className="text-gray-600">Active Artists</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {genreStats.length}+
                </div>
                <div className="text-gray-600">Music Genres</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Tracks
            </h2>
            <p className="text-lg text-gray-600">
              Discover the most popular music on our platform
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <FeaturedTracks tracks={featuredTracks} />
          </Suspense>
        </div>
      </section>

      {/* Trending Artists */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trending Artists
            </h2>
            <p className="text-lg text-gray-600">
              Follow your favorite artists and discover new ones
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <TrendingArtists artists={trendingArtists} />
          </Suspense>
        </div>
      </section>

      {/* Genre Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Genres
            </h2>
            <p className="text-lg text-gray-600">
              Find your perfect sound across different musical styles
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <GenreHighlights genres={genreStats} />
          </Suspense>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Share Your Music?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of artists who are already sharing their music and building their audience on Flemoji.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-primary-600 text-lg font-semibold rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  )
}
```

### 3. Featured Tracks Component

#### `src/components/music/FeaturedTracks.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { useAudioStore } from '@/store/audio-store'
import TrackCard from './TrackCard'
import { PlayIcon } from '@heroicons/react/24/outline'

interface Track {
  id: string
  title: string
  artist: {
    id: string
    name: string
    image: string | null
  }
  coverImageUrl: string | null
  fileUrl: string
  genre: string
  album: string | null
  duration: number
  playCount: number
  likeCount: number
}

interface FeaturedTracksProps {
  tracks: Track[]
}

export default function FeaturedTracks({ tracks }: FeaturedTracksProps) {
  const { setCurrentTrack, play } = useAudioStore()

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0])
      play()
    }
  }

  return (
    <div>
      {/* Play All Button */}
      <div className="flex justify-center mb-8">
        <motion.button
          onClick={handlePlayAll}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-lg"
        >
          <PlayIcon className="w-5 h-5" />
          <span>Play All Featured Tracks</span>
        </motion.button>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tracks.map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="h-full"
          >
            <TrackCard
              track={track}
              showActions={true}
              compact={true}
            />
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center mt-8">
        <motion.a
          href="/browse"
          whileHover={{ scale: 1.05 }}
          className="inline-block px-6 py-3 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          View All Tracks →
        </motion.a>
      </div>
    </div>
  )
}
```

### 4. Trending Artists Component

#### `src/components/music/TrendingArtists.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline'

interface Artist {
  id: string
  name: string
  image: string | null
  bio: string | null
  _count: {
    tracks: number
    followers: number
  }
}

interface TrendingArtistsProps {
  artists: Artist[]
}

export default function TrendingArtists({ artists }: TrendingArtistsProps) {
  const { data: session } = useSession()
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set())

  const handleFollow = async (artistId: string) => {
    if (!session) return

    try {
      const isFollowing = followedArtists.has(artistId)
      const response = await fetch(`/api/users/${artistId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setFollowedArtists(prev => {
          const newSet = new Set(prev)
          if (isFollowing) {
            newSet.delete(artistId)
          } else {
            newSet.add(artistId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error following artist:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {artists.map((artist, index) => (
        <motion.div
          key={artist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            {/* Artist Image */}
            <div className="mb-4">
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={`${artist.name} profile`}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl font-bold">
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Artist Info */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {artist.name}
            </h3>

            {artist.bio && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {artist.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex justify-center space-x-6 mb-4 text-sm text-gray-500">
              <span>{artist._count.tracks} tracks</span>
              <span>{artist._count.followers} followers</span>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3">
              <Link
                href={`/artist/${artist.id}`}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
              >
                View Profile
              </Link>

              {session && session.user.id !== artist.id && (
                <button
                  onClick={() => handleFollow(artist.id)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                    followedArtists.has(artist.id)
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-secondary-500 text-white hover:bg-secondary-600'
                  }`}
                >
                  {followedArtists.has(artist.id) ? (
                    <>
                      <UserMinusIcon className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
```

### 5. Genre Highlights Component

#### `src/components/music/GenreHighlights.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface GenreStat {
  genre: string
  _count: {
    id: number
  }
}

interface GenreHighlightsProps {
  genres: GenreStat[]
}

const genreColors = {
  'Pop': 'from-pink-400 to-rose-400',
  'Rock': 'from-red-400 to-orange-400',
  'Hip-Hop': 'from-purple-400 to-indigo-400',
  'Electronic': 'from-blue-400 to-cyan-400',
  'Jazz': 'from-yellow-400 to-orange-400',
  'Classical': 'from-emerald-400 to-teal-400',
  'Country': 'from-green-400 to-emerald-400',
  'R&B': 'from-violet-400 to-purple-400',
  'Alternative': 'from-gray-400 to-slate-400',
  'Indie': 'from-amber-400 to-yellow-400',
  'Other': 'from-slate-400 to-gray-400',
}

export default function GenreHighlights({ genres }: GenreHighlightsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {genres.map((genreStat, index) => {
        const colorClass = genreColors[genreStat.genre as keyof typeof genreColors] || 'from-gray-400 to-slate-400'

        return (
          <motion.div
            key={genreStat.genre}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="group"
          >
            <Link href={`/browse?genre=${encodeURIComponent(genreStat.genre)}`}>
              <div className={`bg-gradient-to-br ${colorClass} rounded-lg p-6 text-center text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}>
                <h3 className="text-lg font-semibold mb-2">
                  {genreStat.genre}
                </h3>
                <p className="text-2xl font-bold">
                  {genreStat._count.id}
                </p>
                <p className="text-sm opacity-90">tracks</p>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
```

### 6. Enhanced Track List with Virtualization

#### `src/components/music/VirtualizedTrackList.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useAudioStore } from '@/store/audio-store'
import TrackCard from './TrackCard'

interface Track {
  id: string
  title: string
  artist: {
    id: string
    name: string
    image: string | null
  }
  coverImageUrl: string | null
  fileUrl: string
  genre: string
  album: string | null
  duration: number
  playCount: number
  likeCount: number
}

interface VirtualizedTrackListProps {
  tracks: Track[]
  height?: number
  itemHeight?: number
}

export default function VirtualizedTrackList({
  tracks,
  height = 600,
  itemHeight = 120
}: VirtualizedTrackListProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = tracks[index]
    const isSelected = selectedTrack === track.id

    return (
      <div style={style} className="px-4">
        <TrackCard
          track={track}
          showActions={true}
          compact={true}
          isSelected={isSelected}
          onSelect={() => setSelectedTrack(track.id)}
        />
      </div>
    )
  }, [tracks, selectedTrack])

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracks found.</p>
      </div>
    )
  }

  return (
    <List
      height={height}
      itemCount={tracks.length}
      itemSize={itemHeight}
      width="100%"
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
    >
      {Row}
    </List>
  )
}
```

### 7. User Profile Page

#### `src/app/user/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import UserProfile from '@/components/user/UserProfile'
import UserTracks from '@/components/user/UserTracks'
import UserPlaylists from '@/components/user/UserPlaylists'

interface UserPageProps {
  params: { id: string }
}

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          tracks: true,
          playlists: true,
          followers: true,
          following: true,
        }
      },
      tracks: {
        where: { isPublished: true },
        orderBy: { playCount: 'desc' },
        take: 10,
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      },
      playlists: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: {
              playlistTracks: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    return null
  }

  return user
}

export default async function UserPage({ params }: UserPageProps) {
  const user = await getUserData(params.id)

  if (!user) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const isOwnProfile = session?.user?.id === params.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserProfile user={user} isOwnProfile={isOwnProfile} />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserTracks tracks={user.tracks} />
          <UserPlaylists playlists={user.playlists} />
        </div>
      </div>
    </div>
  )
}
```

### 8. Follow/Unfollow API Route

#### `src/app/api/users/[id]/follow/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followerId = session.user.id;
    const followingId = params.id;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({
      message: 'Successfully followed user',
      follow,
    });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followerId = session.user.id;
    const followingId = params.id;

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 9. Enhanced Search with Filters

#### `src/app/search/page.tsx`

```typescript
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import SearchResults from '@/components/search/SearchResults'
import SearchFilters from '@/components/search/SearchFilters'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function searchContent(searchParams: { [key: string]: string | string[] | undefined }) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const type = typeof searchParams.type === 'string' ? searchParams.type : 'all'
  const genre = typeof searchParams.genre === 'string' ? searchParams.genre : ''
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'relevance'
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
  const limit = 20

  if (!query.trim()) {
    return { tracks: [], artists: [], total: 0, page, totalPages: 0 }
  }

  const where: any = {
    isPublished: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { artist: { name: { contains: query, mode: 'insensitive' } } },
      { album: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (genre) {
    where.genre = genre
  }

  let orderBy: any = {}
  switch (sort) {
    case 'plays':
      orderBy.playCount = 'desc'
      break
    case 'newest':
      orderBy.createdAt = 'desc'
      break
    case 'oldest':
      orderBy.createdAt = 'asc'
      break
    default:
      // Relevance - use full-text search if available
      orderBy.playCount = 'desc'
  }

  const tracks = await prisma.track.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  })

  const total = await prisma.track.count({ where })
  const totalPages = Math.ceil(total / limit)

  return { tracks, total, page, totalPages }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { tracks, total, page, totalPages } = await searchContent(searchParams)
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-lg text-gray-600">
              Results for "{query}" ({total} found)
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <SearchFilters searchParams={searchParams} />
          </div>

          {/* Search Results */}
          <div className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <SearchResults
                tracks={tracks}
                query={query}
                page={page}
                totalPages={totalPages}
                searchParams={searchParams}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Homepage displays correctly** - Featured content loads and displays
2. **Search functionality works** - Can search tracks and filter results
3. **User interactions functional** - Likes, follows, and playlists work
4. **Responsive design** - Interface works on all device sizes
5. **Performance acceptable** - Pages load within reasonable time
6. **Navigation smooth** - User can browse between different sections

### Test Commands:

```bash
# Test homepage features
# 1. Load homepage and verify featured content
# 2. Test search functionality
# 3. Test user interactions (like, follow)

# Test responsive design
# 1. Test on mobile devices
# 2. Test on different screen sizes
# 3. Verify navigation works on all devices
```

## 🚨 Common Issues & Solutions

### Issue: Featured content not loading

**Solution**: Check database queries, verify data exists, check for errors in console

### Issue: Search results empty

**Solution**: Verify search query parameters, check database indexes, test search logic

### Issue: User interactions failing

**Solution**: Check authentication state, verify API routes, check database permissions

### Issue: Performance issues

**Solution**: Implement virtualization for large lists, optimize database queries, add caching

## 📝 Notes

- Implement proper loading states for better UX
- Add error boundaries for graceful error handling
- Consider implementing infinite scroll for large result sets
- Add analytics tracking for user interactions
- Implement proper SEO meta tags for search pages

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 7: Artist Dashboard](./07-artist-dashboard.md)
