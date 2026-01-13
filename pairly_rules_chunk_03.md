# Flemoji Rules Archive (Chunk 3)

## 05-music-streaming.md

# Phase 5: Music Streaming Interface

## 🎯 Objective

Implement a comprehensive music streaming interface with an audio player, streaming functionality, playlist management, and seamless user experience for listening to music on the platform.

## 📋 Prerequisites

- Phase 1, 2, 3, & 4 completed successfully
- Music upload system functional
- Database with tracks available
- Audio files accessible via S3 URLs

## 🚀 Step-by-Step Implementation

### 1. Install Audio Dependencies

```bash
# Audio player and streaming
yarn add howler @types/howler
yarn add react-h5-audio-player
yarn add wavesurfer.js

# Audio processing and analysis
yarn add audio-visualizer
yarn add web-audio-api

# State management for audio
yarn add zustand
yarn add immer
```

### 2. Audio Player Store

#### `src/store/audio-store.ts`

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Howl } from 'howler'

export interface Track {
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

export interface AudioState {
  // Current track
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean

  // Playlist
  playlist: Track[]
  currentIndex: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'

  // Audio instance
  sound: Howl | null

  // Actions
  setCurrentTrack: (track: Track) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  next: () => void
  previous: () => void
  setPlaylist: (tracks: Track[]) => void
  addToPlaylist: (track: Track) => void
  removeFromPlaylist: (trackId: string) => void
  toggleShuffle: () => void
  setRepeat: (mode: 'none' | 'one' | 'all') => void
  updatePlayCount: (trackId: string) => void
}

export const useAudioStore = create<AudioState>()(
  immer((set, get) => ({
    // Initial state
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playlist: [],
    currentIndex: 0,
    shuffle: false,
    repeat: 'none',
    sound: null,

    // Actions
    setCurrentTrack: (track: Track) => {
      set((state) => {
        // Stop current audio if playing
        if (state.sound) {
          state.sound.stop()
          state.sound.unload()
        }

        // Create new Howl instance
        const sound = new Howl({
          src: [track.fileUrl],
          html5: true,
          preload: true,
          volume: state.volume,
          onload: () => {
            set((state) => {
              state.duration = sound.duration()
            })
          },
          onplay: () => {
            set((state) => {
              state.isPlaying = true
            })
          },
          onpause: () => {
            set((state) => {
              state.isPlaying = false
            })
          },
          onstop: () => {
            set((state) => {
              state.isPlaying = false
              state.currentTime = 0
            })
          },
          onend: () => {
            const { repeat, next } = get()
            if (repeat === 'one') {
              // Repeat current track
              sound.play()
            } else if (repeat === 'all' || repeat === 'none') {
              // Go to next track or stop
              next()
            }
          },
        })

        // Set up time update interval
        const updateTime = () => {
          if (sound.playing()) {
            set((state) => {
              state.currentTime = sound.seek()
            })
          }
        }
        const timeInterval = setInterval(updateTime, 100)

        // Clean up interval when track changes
        sound.once('unload', () => {
          clearInterval(timeInterval)
        })

        state.currentTrack = track
        state.sound = sound
        state.currentTime = 0
        state.duration = 0
        state.isPlaying = false
      })
    },

    play: () => {
      const { sound } = get()
      if (sound) {
        sound.play()
      }
    },

    pause: () => {
      const { sound } = get()
      if (sound) {
        sound.pause()
      }
    },

    stop: () => {
      const { sound } => get()
      if (sound) {
        sound.stop()
      }
    },

    seek: (time: number) => {
      const { sound } = get()
      if (sound) {
        sound.seek(time)
        set((state) => {
          state.currentTime = time
        })
      }
    },

    setVolume: (volume: number) => {
      const { sound } = get()
      if (sound) {
        sound.volume(volume)
      }
      set((state) => {
        state.volume = volume
        if (state.isMuted && volume > 0) {
          state.isMuted = false
        }
      })
    },

    toggleMute: () => {
      const { sound, isMuted, volume } = get()
      if (sound) {
        if (isMuted) {
          sound.volume(volume)
        } else {
          sound.volume(0)
        }
      }
      set((state) => {
        state.isMuted = !state.isMuted
      })
    },

    next: () => {
      const { playlist, currentIndex, shuffle, repeat } = get()
      if (playlist.length === 0) return

      let nextIndex: number
      if (shuffle) {
        // Random next track
        nextIndex = Math.floor(Math.random() * playlist.length)
      } else {
        // Sequential next track
        nextIndex = (currentIndex + 1) % playlist.length
      }

      if (nextIndex === currentIndex && repeat === 'none') {
        // Stop if we're back to the same track and not repeating
        get().stop()
        return
      }

      set((state) => {
        state.currentIndex = nextIndex
      })
      get().setCurrentTrack(playlist[nextIndex])
      get().play()
    },

    previous: () => {
      const { playlist, currentIndex, shuffle } = get()
      if (playlist.length === 0) return

      let prevIndex: number
      if (shuffle) {
        // Random previous track
        prevIndex = Math.floor(Math.random() * playlist.length)
      } else {
        // Sequential previous track
        prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
      }

      set((state) => {
        state.currentIndex = prevIndex
      })
      get().setCurrentTrack(playlist[prevIndex])
      get().play()
    },

    setPlaylist: (tracks: Track[]) => {
      set((state) => {
        state.playlist = tracks
        state.currentIndex = 0
      })
      if (tracks.length > 0) {
        get().setCurrentTrack(tracks[0])
      }
    },

    addToPlaylist: (track: Track) => {
      set((state) => {
        state.playlist.push(track)
      })
    },

    removeFromPlaylist: (trackId: string) => {
      set((state) => {
        const index = state.playlist.findIndex(t => t.id === trackId)
        if (index !== -1) {
          state.playlist.splice(index, 1)
          if (state.currentIndex >= state.playlist.length) {
            state.currentIndex = Math.max(0, state.playlist.length - 1)
          }
        }
      })
    },

    toggleShuffle: () => {
      set((state) => {
        state.shuffle = !state.shuffle
      })
    },

    setRepeat: (mode: 'none' | 'one' | 'all') => {
      set((state) => {
        state.repeat = mode
      })
    },

    updatePlayCount: (trackId: string) => {
      // This will be called when a track starts playing
      // The actual API call will be made in the component
    },
  }))
)
```

### 3. Audio Player Component

#### `src/components/music/AudioPlayer.tsx`

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioStore } from '@/store/audio-store'
import { formatDuration } from '@/lib/utils'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'

export default function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playlist,
    currentIndex,
    shuffle,
    repeat,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    setRepeat,
  } = useAudioStore()

  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const percentage = clickX / width
    const newTime = percentage * duration

    seek(newTime)
  }

  // Handle volume slider click
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return

    const rect = volumeSliderRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const height = rect.height
    const percentage = 1 - (clickY / height) // Invert Y axis
    const newVolume = Math.max(0, Math.min(1, percentage))

    setVolume(newVolume)
  }

  // Update play count when track starts playing
  useEffect(() => {
    if (isPlaying && currentTrack) {
      // Record play event
      fetch(`/api/tracks/${currentTrack.id}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(console.error)
    }
  }, [isPlaying, currentTrack])

  if (!currentTrack) {
    return null
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercentage = isMuted ? 0 : volume * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {currentTrack.coverImageUrl ? (
              <img
                src={currentTrack.coverImageUrl}
                alt={`${currentTrack.title} cover`}
                className="w-12 h-12 rounded-md object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Cover</span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {currentTrack.artist.name}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                shuffle ? 'text-primary-600' : 'text-gray-400'
              }`}
              title="Shuffle"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={previous}
              disabled={playlist.length <= 1}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
              title="Previous"
            >
              <BackwardIcon className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={isPlaying ? pause : play}
              className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            {/* Stop */}
            <button
              onClick={stop}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              title="Stop"
            >
              <StopIcon className="w-5 h-5" />
            </button>

            {/* Next */}
            <button
              onClick={next}
              disabled={playlist.length <= 1}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
              title="Next"
            >
              <ForwardIcon className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => {
                const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all']
                const currentIndex = modes.indexOf(repeat)
                const nextIndex = (currentIndex + 1) % modes.length
                setRepeat(modes[nextIndex])
              }}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                repeat !== 'none' ? 'text-primary-600' : 'text-gray-400'
              }`}
              title={`Repeat: ${repeat}`}
            >
              <ArrowPathIcon className={`w-5 h-5 ${repeat === 'one' ? 'text-primary-600' : ''}`} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 mx-8">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 w-12 text-right">
                {formatDuration(currentTime)}
              </span>

              <div
                ref={progressBarRef}
                className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className="absolute top-0 w-3 h-3 bg-primary-600 rounded-full -mt-0.5 -ml-1.5 cursor-pointer"
                  style={{ left: `${progressPercentage}%` }}
                />
              </div>

              <span className="text-xs text-gray-500 w-12">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
              </button>

              {showVolumeSlider && (
                <div
                  ref={volumeSliderRef}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div
                    className="w-2 h-20 bg-gray-200 rounded-full cursor-pointer relative"
                    onClick={handleVolumeClick}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-primary-600 rounded-full transition-all duration-100"
                      style={{ height: `${volumePercentage}%` }}
                    />
                    <div
                      className="absolute bottom-0 w-3 h-3 bg-primary-600 rounded-full -ml-0.5 cursor-pointer"
                      style={{ bottom: `${volumePercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Toggle */}
            {playlist.length > 0 && (
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                title="Playlist"
              >
                <span className="text-xs font-medium">{playlist.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Playlist */}
        {showPlaylist && playlist.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="max-h-32 overflow-y-auto">
              {playlist.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    index === currentIndex ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                  onClick={() => {
                    useAudioStore.getState().setCurrentTrack(track)
                    useAudioStore.getState().play()
                  }}
                >
                  <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-gray-500 truncate">{track.artist.name}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4. Track Card Component

#### `src/components/music/TrackCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAudioStore } from '@/store/audio-store'
import { formatDuration } from '@/lib/utils'
import { HeartIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

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
  isLiked?: boolean
}

interface TrackCardProps {
  track: Track
  showActions?: boolean
  onLike?: (trackId: string, liked: boolean) => void
  onAddToPlaylist?: (track: Track) => void
}

export default function TrackCard({
  track,
  showActions = true,
  onLike,
  onAddToPlaylist,
}: TrackCardProps) {
  const { data: session } = useSession()
  const { currentTrack, isPlaying, play, pause, addToPlaylist } = useAudioStore()
  const [isLiked, setIsLiked] = useState(track.isLiked || false)
  const [likeCount, setLikeCount] = useState(track.likeCount)

  const isCurrentTrack = currentTrack?.id === track.id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying

  const handlePlayPause = () => {
    if (isCurrentTrack) {
      if (isCurrentlyPlaying) {
        pause()
      } else {
        play()
      }
    } else {
      // Set as current track and play
      useAudioStore.getState().setCurrentTrack(track)
      useAudioStore.getState().play()
    }
  }

  const handleLike = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/tracks/${track.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ liked: !isLiked }),
      })

      if (response.ok) {
        const newLiked = !isLiked
        setIsLiked(newLiked)
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
        onLike?.(track.id, newLiked)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleAddToPlaylist = () => {
    addToPlaylist(track)
    onAddToPlaylist?.(track)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
      <div className="flex items-center space-x-4">
        {/* Cover Image */}
        <div className="flex-shrink-0 relative">
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

          {/* Play/Pause Overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md opacity-0 hover:opacity-100 transition-opacity"
          >
            {isCurrentlyPlaying ? (
              <PauseIcon className="w-8 h-8 text-white" />
            ) : (
              <PlayIcon className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {track.title}
          </h3>

          <p className="text-sm text-gray-600 truncate">
            by {track.artist.name}
          </p>

          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>{track.genre}</span>
            {track.album && <span>• {track.album}</span>}
            <span>• {formatDuration(track.duration)}</span>
            <span>• {track.playCount} plays</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>

            {/* Like Count */}
            <span className="text-sm text-gray-500 min-w-[2rem]">
              {likeCount}
            </span>

            {/* Add to Playlist */}
            <button
              onClick={handleAddToPlaylist}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              title="Add to playlist"
            >
              <span className="text-xs font-medium">+</span>
            </button>
          </div>
        )}
      </div>

      {/* Currently Playing Indicator */}
      {isCurrentTrack && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-primary-600">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {isCurrentlyPlaying ? 'Now Playing' : 'Paused'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 5. Music Browse Page

#### `src/app/browse/page.tsx`

```typescript
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import TrackList from '@/components/music/TrackList'
import SearchBar from '@/components/music/SearchBar'
import GenreFilter from '@/components/music/GenreFilter'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

async function getTracks(searchParams: { [key: string]: string | string[] | undefined }) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  const genre = typeof searchParams.genre === 'string' ? searchParams.genre : ''
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
  const limit = 20

  const where: any = {
    isPublished: true,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { artist: { name: { contains: search, mode: 'insensitive' } } },
      { album: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (genre) {
    where.genre = genre
  }

  const tracks = await prisma.track.findMany({
    where,
    orderBy: { playCount: 'desc' },
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

  return { tracks, total, page, totalPages: Math.ceil(total / limit) }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { tracks, total, page, totalPages } = await getTracks(searchParams)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Browse Music
          </h1>
          <p className="mt-2 text-gray-600">
            Discover amazing music from independent artists
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <SearchBar />
          <GenreFilter />
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} tracks
            </>
          ) : (
            'No tracks found'
          )}
        </div>

        {/* Track List */}
        <Suspense fallback={<LoadingSpinner />}>
          <TrackList tracks={tracks} />
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              {page > 1 && (
                <a
                  href={`/browse?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.genre ? `&genre=${searchParams.genre}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </a>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <a
                  key={pageNum}
                  href={`/browse?page=${pageNum}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.genre ? `&genre=${searchParams.genre}` : ''}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </a>
              ))}

              {page < totalPages && (
                <a
                  href={`/browse?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.genre ? `&genre=${searchParams.genre}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 6. Search and Filter Components

#### `src/components/music/SearchBar.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams(searchParams)
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    } else {
      params.delete('search')
    }
    params.delete('page') // Reset to first page

    router.push(`/browse?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tracks, artists, or albums..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
      </div>
    </form>
  )
}
```

#### `src/components/music/GenreFilter.tsx`

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const genres = [
  'All',
  'Pop',
  'Rock',
  'Hip-Hop',
  'Electronic',
  'Jazz',
  'Classical',
  'Country',
  'R&B',
  'Alternative',
  'Indie',
  'Other',
]

export default function GenreFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentGenre = searchParams.get('genre') || 'All'

  const handleGenreChange = (genre: string) => {
    const params = new URLSearchParams(searchParams)

    if (genre === 'All') {
      params.delete('genre')
    } else {
      params.set('genre', genre)
    }
    params.delete('page') // Reset to first page

    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => handleGenreChange(genre)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentGenre === genre
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  )
}
```

### 7. Update Root Layout with Audio Player

#### `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import SessionProvider from '@/components/providers/SessionProvider'
import AudioPlayer from '@/components/music/AudioPlayer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flemoji - Music Streaming Platform',
  description: 'Discover and stream music from independent artists',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Header />
          <main className="min-h-screen bg-gray-50 pb-24">
            {children}
          </main>
          <AudioPlayer />
        </SessionProvider>
      </body>
    </html>
  )
}
```

### 8. Track Play API Route

#### `src/app/api/tracks/[id]/play/route.ts`

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
    const body = await request.json();
    const { duration, completed = false } = body;

    // Get client IP and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create play event
    const playEvent = await prisma.playEvent.create({
      data: {
        trackId: params.id,
        userId: session?.user?.id,
        ipAddress,
        userAgent,
        duration,
        completed,
      },
    });

    // Increment track play count
    await prisma.track.update({
      where: { id: params.id },
      data: {
        playCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      message: 'Play event recorded',
      playEvent,
    });
  } catch (error) {
    console.error('Error recording play event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Audio player functional** - Can play, pause, stop, seek tracks
2. **Streaming works** - Audio files play without errors
3. **Playlist management** - Can add/remove tracks, navigate between them
4. **Volume control** - Volume slider and mute functionality working
5. **Play count tracking** - Play events recorded in database
6. **Search and filtering** - Can search tracks and filter by genre
7. **Responsive design** - Player works on mobile and desktop

### Test Commands:

```bash
# Test audio playback
# 1. Upload a track
# 2. Navigate to browse page
# 3. Click play on track
# 4. Verify audio player appears and plays

# Test playlist functionality
# 1. Add multiple tracks to playlist
# 2. Test next/previous navigation
# 3. Test shuffle and repeat modes

# Test search and filters
# 1. Search for specific tracks
# 2. Filter by genre
# 3. Verify results update correctly
```

## 🚨 Common Issues & Solutions

### Issue: Audio not playing

**Solution**: Check S3 file URLs, verify CORS settings, ensure audio format support

### Issue: Player not appearing

**Solution**: Verify AudioPlayer component is imported in layout, check zustand store

### Issue: Play count not updating

**Solution**: Check API route, verify database connection, check for errors in console

### Issue: Volume control not working

**Solution**: Ensure Howler.js is properly initialized, check volume slider event handlers

## 📝 Notes

- Audio player persists across page navigation
- Play events are recorded for analytics
- Responsive design ensures mobile compatibility
- Error handling for corrupted or invalid audio files
- Consider implementing audio quality selection for different network conditions

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 6: User Interface & Experience](./06-user-interface.md)

---

## 06-user-interface.md

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

---

## 07-artist-dashboard.md

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

---

## 07-dashboard-system.md

# Dashboard System Documentation

## 🎯 Objective

Comprehensive documentation for the Artist Dashboard and Admin Dashboard systems, including design principles, component architecture, and implementation guidelines.

## 🎨 Design Principles

### **Consistent with Landing Page**

- **Color Scheme**: Blue theme (#3b82f6) matching design system
- **Typography**: Inter font with proper hierarchy
- **Spacing**: 16px/32px spacing system
- **Cards**: White backgrounds with subtle shadows
- **Borders**: Light gray borders for clean separation

### **Modern UI Elements**

- **Hover Effects**: Smooth transitions and interactive feedback
- **Status Badges**: Color-coded status indicators
- **Progress Bars**: Visual upload progress
- **Empty States**: Helpful messages when no content
- **Loading States**: Proper loading indicators

## 🎵 Artist Dashboard

### **Layout Architecture**

```
┌─────────────────────────────────────────────────┐
│ [Sidebar] │ [Artist Dashboard Content]          │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ Welcome Header                  │ │
│           │ │ - User greeting                 │ │
│           │ │ - Quick upload button           │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ Navigation Tabs                 │ │
│           │ │ - Overview, Upload, Library,    │ │
│           │ │   Analytics                     │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ Tab Content                     │ │
│           │ │ - Dynamic content based on tab  │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ [80px bottom padding]               │
│           │ [Music Player - Always]             │
└─────────────────────────────────────────────────┘
```

### **Component Structure**

```
src/components/dashboard/artist/
├── ArtistDashboard.tsx    # Main dashboard with tabs
├── UploadMusic.tsx        # Drag & drop upload interface
└── MusicLibrary.tsx       # Grid/list view with management
```

### **Features Implemented**

- ✅ **Tab Navigation**: Overview, Upload Music, My Music, Analytics
- ✅ **Welcome Header**: Personalized greeting with user info
- ✅ **Stats Overview**: Total tracks, plays, likes, revenue
- ✅ **Recent Tracks**: List of latest uploads with performance metrics
- ✅ **Quick Actions**: Upload, Analytics, Smart Links buttons
- ✅ **Drag & Drop Upload**: Modern file upload with progress tracking
- ✅ **Music Library**: Grid/list view with search, filter, and management
- ✅ **Responsive Design**: Works perfectly on all devices

## 👨‍💼 Admin Dashboard

### **Layout Architecture**

```
┌─────────────────────────────────────────────────┐
│ [Sidebar] │ [Admin Dashboard Content]           │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ System Overview                 │ │
│           │ │ - Key metrics & stats           │ │
│           │ │ - Platform health               │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ Navigation Tabs                 │ │
│           │ │ - Overview, Users, Content,     │ │
│           │ │   Analytics, Settings           │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ Tab Content                     │ │
│           │ │ - Dynamic content based on tab  │ │
│           │ └─────────────────────────────────┘ │
│           │                                     │
│           │ [80px bottom padding]               │
│           │ [Music Player - Always]             │
└─────────────────────────────────────────────────┘
```

### **Component Structure**

```
src/components/dashboard/admin/
├── AdminDashboard.tsx      # Main admin dashboard
├── UserManagement.tsx      # User and artist management
├── ContentManagement.tsx   # Track and content moderation
├── SystemAnalytics.tsx     # Platform analytics
└── SystemSettings.tsx      # Platform configuration
```

### **Features to Implement**

- 🔄 **System Overview**: Platform health and key metrics
- 🔄 **User Management**: All users with search and filtering
- 🔄 **Content Moderation**: Track and content review system
- 🔄 **System Analytics**: Platform-wide analytics and insights
- 🔄 **Platform Settings**: Configuration and system management

## 🔧 Implementation Guidelines

### **Component Architecture**

- **Modular Design**: Each feature in separate components
- **Reusable Components**: Shared UI elements across dashboards
- **State Management**: Local state for UI, server state for data
- **Error Handling**: Proper error states and user feedback

### **Responsive Design**

- **Mobile-First**: Optimized for mobile devices
- **Breakpoint Management**: Consistent with design system
- **Touch-Friendly**: Proper touch targets and interactions
- **Performance**: Optimized for all screen sizes

### **Accessibility**

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Proper ARIA labels and descriptions
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Clear focus indicators

## 📊 Data Structures

### **Track Interface**

```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  plays: number;
  likes: number;
  uploadDate: string;
  coverImage: string;
  isPlaying: boolean;
  isLiked: boolean;
  status: 'published' | 'draft' | 'processing';
}
```

### **User Interface**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ARTIST' | 'ADMIN';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  trackCount: number;
  totalPlays: number;
}
```

### **System Metrics Interface**

```typescript
interface SystemMetrics {
  totalUsers: number;
  totalArtists: number;
  totalTracks: number;
  totalPlays: number;
  totalRevenue: number;
  platformHealth: 'healthy' | 'warning' | 'critical';
}
```

## 🚀 Future Enhancements

### **Planned Features**

- **Advanced Analytics**: More detailed charts and insights
- **Bulk Operations**: Enhanced mass management tools
- **Real-time Updates**: Live data updates and notifications
- **Custom Dashboards**: User-configurable dashboard layouts
- **API Integration**: Third-party service integrations

### **Accessibility Improvements**

- **Enhanced Screen Reader**: Better screen reader support
- **Keyboard Shortcuts**: Global keyboard shortcuts
- **High Contrast Mode**: High contrast theme support
- **Reduced Motion**: Respect user motion preferences

## 📝 Testing Requirements

### **Artist Dashboard Tests**

1. **Dashboard Navigation**: All tabs and sections work correctly
2. **File Upload**: Drag & drop upload functionality works
3. **Track Management**: All track actions work properly
4. **Search & Filter**: Filtering and sorting work correctly
5. **Responsive Design**: Dashboard works on all devices

### **Admin Dashboard Tests**

1. **User Management**: All user management features work
2. **Content Moderation**: Content review and moderation tools work
3. **System Analytics**: Analytics and reporting features work
4. **Platform Settings**: Configuration and settings work
5. **Role-Based Access**: Admin permissions work correctly

## 🚨 Common Issues & Solutions

### **Issue: Dashboard content hidden behind music player**

**Solution**: Add `pb-20` (80px bottom padding) to dashboard containers

### **Issue: File upload not working**

**Solution**: Ensure `react-dropzone` is installed and properly configured

### **Issue: Responsive layout issues**

**Solution**: Check breakpoint usage and mobile-first approach

### **Issue: Admin access not working**

**Solution**: Verify middleware configuration and role-based routing

## 🚪 Dashboard Access Scenarios

### **Artist Dashboard Access (`/dashboard`)**

#### **User Roles with Access:**

- **USER**: Regular users who want to manage their music
- **ARTIST**: Artists who upload and manage their tracks

#### **Access Scenarios:**

##### **1. Direct Navigation**

- User clicks "Dashboard" in the sidebar navigation
- User types `/dashboard` in the browser URL
- User clicks dashboard link from any page

##### **2. Post-Authentication Redirect**

- User logs in and is redirected to dashboard
- User completes registration and is redirected to dashboard
- User's session is restored and they're taken to dashboard

##### **3. Role-Based Redirect**

- **USER/ARTIST**: Automatically redirected to `/dashboard`
- **ADMIN**: Automatically redirected to `/admin/dashboard`

##### **4. Protected Route Access**

- User tries to access protected features (upload, manage tracks)
- System redirects to dashboard for authentication
- User completes action and returns to dashboard

##### **5. Feature-Specific Access**

- User clicks "Upload Music" button from anywhere
- User clicks "My Music" or "Library" links
- User wants to view their analytics or stats

#### **Dashboard Content by User Type:**

##### **For USER Role:**

- **Overview Tab**: Basic stats (tracks liked, playlists created)
- **Upload Tab**: Limited upload capabilities or upgrade prompts
- **Library Tab**: Liked tracks, created playlists, saved music
- **Analytics Tab**: Personal listening habits and preferences

##### **For ARTIST Role:**

- **Overview Tab**: Full stats (tracks, plays, likes, revenue)
- **Upload Tab**: Full drag & drop upload functionality
- **Library Tab**: Complete track management (edit, delete, share)
- **Analytics Tab**: Detailed performance metrics and insights

### **Admin Dashboard Access (`/admin/dashboard`)**

#### **User Roles with Access:**

- **ADMIN**: Platform administrators only

#### **Access Scenarios:**

##### **1. Direct Admin Navigation**

- Admin clicks "Admin Panel" in sidebar (if visible)
- Admin types `/admin/dashboard` in browser URL
- Admin accesses admin-specific links

##### **2. Role-Based Redirect**

- **ADMIN**: Automatically redirected to `/admin/dashboard`
- **USER/ARTIST**: Redirected to `/dashboard` (regular dashboard)

##### **3. System Administration Tasks**

- Platform maintenance and monitoring
- User management and support
- Content moderation and review
- System configuration and settings

##### **4. Emergency Access**

- System issues requiring admin intervention
- Security incidents requiring immediate attention
- Platform updates and maintenance

##### **5. Administrative Workflows**

- Daily platform monitoring and health checks
- User support and account management
- Content review and moderation
- Analytics review and reporting

#### **Admin Dashboard Content:**

##### **Overview Tab:**

- **System Health**: Platform status and performance metrics
- **Key Metrics**: Total users, artists, tracks, plays, revenue
- **Pending Actions**: Items requiring admin attention
- **Recent Activity**: Latest platform events and changes

##### **Users Tab:**

- **User Management**: All users with search and filtering
- **Artist Approval**: Pending artist applications
- **Role Management**: User role assignments and changes
- **Account Actions**: Suspend, activate, or delete accounts

##### **Content Tab:**

- **Content Review**: Approve or reject uploaded tracks
- **Flag Management**: Handle reported content
- **Bulk Operations**: Mass content management actions
- **Content Analytics**: Track performance and issues

##### **Analytics Tab:**

- **Platform Metrics**: Growth and engagement data
- **Performance Charts**: Visual analytics and trends
- **Revenue Tracking**: Earnings and payout management
- **System Analytics**: Platform performance and health

##### **Settings Tab:**

- **General Settings**: Platform configuration
- **Feature Toggles**: Enable/disable platform features
- **Payment Settings**: Revenue sharing and payment processing
- **Security Settings**: Access control and permissions

### **Access Control & Security**

#### **Authentication Requirements:**

- **Both Dashboards**: Require valid user session
- **Admin Dashboard**: Requires ADMIN role specifically
- **Session Validation**: Automatic redirect to login if not authenticated

#### **Route Protection:**

```typescript
// Artist Dashboard - /dashboard
- Requires: Valid session (USER or ARTIST role)
- Redirects: Non-authenticated users to /login
- Redirects: ADMIN users to /admin/dashboard

// Admin Dashboard - /admin/dashboard
- Requires: Valid session with ADMIN role
- Redirects: Non-authenticated users to /login
- Redirects: Non-admin users to /unauthorized
```

#### **Middleware Protection:**

- All dashboard routes protected by authentication middleware
- Role-based access control enforced at route level
- Automatic redirects based on user role and authentication status

### **User Journey Examples**

#### **New Artist Registration:**

1. User registers with ARTIST role
2. System redirects to `/dashboard`
3. Artist sees welcome message and upload interface
4. Artist can immediately start uploading music

#### **Regular User Login:**

1. User logs in with USER role
2. System redirects to `/dashboard`
3. User sees basic stats and library options
4. User can manage playlists and liked tracks

#### **Admin Daily Workflow:**

1. Admin logs in with ADMIN role
2. **Automatic redirect** to `/admin/dashboard` (no profile creation screen)
3. Admin reviews system health and pending actions
4. Admin manages users, reviews content, checks analytics

#### **Role-Based Redirect System:**

The platform implements an intelligent redirect system that automatically directs users to the appropriate dashboard based on their role:

- **Admin users**: Automatically redirected to admin dashboard after login
- **Regular users**: Continue to normal dashboard flow
- **Artists**: Access artist-specific dashboard features
- **No profile creation required** for admin users

#### **Admin Dashboard Access Flow:**

```
Admin Login → Role Detection → Automatic Redirect → Admin Dashboard
```

**Key Features:**

- **Direct Access**: No profile creation screen
- **Immediate Admin Tools**: Full admin panel access
- **Streamlined Workflow**: Skip unnecessary steps

#### **User/Artist Dashboard Flow:**

```
User Login → Role Detection → Profile Check → Dashboard/Profile Creation
```

**Key Features:**

- **Profile Creation**: When needed for new users
- **Role-Appropriate Access**: Dashboard features based on user type
- **Normal User Experience**: Standard onboarding flow

#### **Content Moderation Workflow:**

1. User reports inappropriate content
2. Admin receives notification
3. Admin accesses `/admin/dashboard`
4. Admin reviews flagged content in Content tab
5. Admin takes appropriate action (approve/reject/delete)

#### **Artist Support Request:**

1. Artist has issue with upload
2. Artist contacts support
3. Admin accesses `/admin/dashboard`
4. Admin reviews artist's account in Users tab
5. Admin provides support and resolves issue

### **Error Handling & Edge Cases**

#### **Unauthorized Access Attempts:**

- **Non-authenticated**: Redirected to login page
- **Wrong Role**: Redirected to appropriate dashboard or unauthorized page
- **Expired Session**: Redirected to login with session expired message

#### **Missing Permissions:**

- **Feature Access**: Users see appropriate messaging for unavailable features
- **Upgrade Prompts**: Non-artist users see upgrade options for advanced features
- **Graceful Degradation**: Interface adapts based on user permissions

#### **System Errors:**

- **Dashboard Load Failure**: Error boundary with retry option
- **Data Loading Issues**: Loading states and error messages
- **Network Problems**: Offline indicators and retry mechanisms

## 📝 Notes

- Dashboards use the same design system as the landing page
- All components are fully responsive and accessible
- File upload supports multiple formats with proper validation
- Admin dashboard requires ADMIN role for access
- Both dashboards integrate seamlessly with the existing layout
- Access control is enforced at multiple levels (middleware, components, routes)
- User experience is optimized based on role and permissions

---

## 08-analytics-system.md

# Phase 8: Analytics System

## 🎯 Objective

Implement a comprehensive analytics system that provides detailed insights into music performance, user engagement, and platform usage with interactive charts, data visualization, and actionable insights.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, & 7 completed successfully
- Artist dashboard functional
- Database with play events and analytics data
- Chart libraries installed

## 🚀 Step-by-Step Implementation

### 1. Analytics Dashboard Component

#### `src/components/dashboard/AnalyticsDashboard.tsx`

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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatDuration } from '@/lib/utils'

interface AnalyticsData {
  summary: {
    totalPlays: number
    totalLikes: number
    totalDuration: number
    totalTracks: number
  }
  playsByDate: Array<{
    timestamp: string
    _count: {
      id: number
    }
  }>
  topTracks: Array<{
    id: string
    title: string
    plays: number
    likes: number
    duration: number
  }>
  tracks: any[]
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Process plays by date for chart
  const chartData = data.playsByDate.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    plays: item._count.id,
  }))

  // Process top tracks for chart
  const topTracksData = data.topTracks.map(track => ({
    name: track.title,
    plays: track.plays,
    likes: track.likes,
  }))

  // Calculate engagement rate
  const engagementRate = data.summary.totalPlays > 0
    ? ((data.summary.totalLikes / data.summary.totalPlays) * 100).toFixed(1)
    : '0'

  // Calculate average play duration
  const avgPlayDuration = data.summary.totalPlays > 0
    ? Math.round(data.summary.totalDuration / data.summary.totalPlays)
    : 0

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
            <div className="p-3 rounded-lg bg-red-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalLikes.toLocaleString()}
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
            <div className="p-3 rounded-lg bg-green-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {engagementRate}%
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
            <div className="p-3 rounded-lg bg-purple-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Play Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(avgPlayDuration)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Plays Over Time</h3>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="plays"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Tracks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTracksData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="plays" fill="#3B82F6" />
              <Bar dataKey="likes" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Track Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topTracksData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="plays"
              >
                {topTracksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Track Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Track Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topTracks.map((track, index) => {
                const engagement = track.plays > 0 ? ((track.likes / track.plays) * 100).toFixed(1) : '0'

                return (
                  <tr key={track.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{track.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{track.plays.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{track.likes.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDuration(track.duration)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{engagement}%</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Performance Highlights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your top track has {data.topTracks[0]?.plays || 0} plays</li>
              <li>• Overall engagement rate is {engagementRate}%</li>
              <li>• Average play duration is {formatDuration(avgPlayDuration)}</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Growth Opportunities</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Consider promoting tracks with lower engagement</li>
              <li>• Focus on tracks with shorter play durations</li>
              <li>• Create more content to increase total plays</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Advanced Analytics API Routes

#### `src/app/api/analytics/tracks/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'day';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get track details
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Check if user owns the track or is admin
    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get play events with time grouping
    let playsByTime: any[] = [];

    if (groupBy === 'hour') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('hour', "timestamp")
        ORDER BY time_group
      `;
    } else if (groupBy === 'day') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "timestamp")
        ORDER BY time_group
      `;
    } else if (groupBy === 'week') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('week', "timestamp")
        ORDER BY time_group
      `;
    }

    // Get geographic data (if available)
    const geographicData = await prisma.playEvent.groupBy({
      by: ['ipAddress'],
      where: {
        trackId: params.id,
        timestamp: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Get device/browser data
    const deviceData = await prisma.playEvent.groupBy({
      by: ['userAgent'],
      where: {
        trackId: params.id,
        timestamp: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Calculate summary statistics
    const totalPlays = playsByTime.reduce(
      (sum, item) => sum + parseInt(item.plays),
      0
    );
    const totalDuration = playsByTime.reduce(
      (sum, item) => sum + parseFloat(item.avg_duration) * parseInt(item.plays),
      0
    );
    const completionRate =
      totalPlays > 0
        ? (playsByTime.reduce(
            (sum, item) => sum + parseInt(item.completed_plays),
            0
          ) /
            totalPlays) *
          100
        : 0;

    return NextResponse.json({
      track,
      summary: {
        totalPlays,
        totalDuration,
        completionRate: Math.round(completionRate * 100) / 100,
        avgDuration:
          totalPlays > 0 ? Math.round(totalDuration / totalPlays) : 0,
      },
      playsByTime: playsByTime.map(item => ({
        time: item.time_group,
        plays: parseInt(item.plays),
        avgDuration: Math.round(parseFloat(item.avg_duration)),
        completedPlays: parseInt(item.completed_plays),
      })),
      geographicData: geographicData.slice(0, 10), // Top 10 locations
      deviceData: deviceData.slice(0, 10), // Top 10 devices
    });
  } catch (error) {
    console.error('Error fetching track analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Artist Analytics API Route

#### `src/app/api/analytics/artist/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only artists and admins can access artist analytics
    if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const artistId = searchParams.get('artistId') || session.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get artist's tracks with play data
    const tracks = await prisma.track.findMany({
      where: { artistId },
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

    // Calculate overall statistics
    const totalPlays = tracks.reduce(
      (sum, track) => sum + track.playEvents.length,
      0
    );
    const totalLikes = tracks.reduce(
      (sum, track) => sum + track._count.likes,
      0
    );
    const totalDuration = tracks.reduce(
      (sum, track) =>
        sum +
        track.playEvents.reduce(
          (trackSum, event) => trackSum + (event.duration || 0),
          0
        ),
      0
    );

    // Group plays by date
    const playsByDate = await prisma.playEvent.groupBy({
      by: ['timestamp'],
      where: {
        track: { artistId },
        timestamp: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Get top performing tracks
    const topTracks = tracks
      .sort((a, b) => b.playEvents.length - a.playEvents.length)
      .slice(0, 10)
      .map(track => ({
        id: track.id,
        title: track.title,
        plays: track.playEvents.length,
        likes: track._count.likes,
        duration: track.duration,
        playCount: track.playCount,
      }));

    // Get genre performance
    const genrePerformance = await prisma.track.groupBy({
      by: ['genre'],
      where: { artistId },
      _sum: {
        playCount: true,
        likeCount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get audience insights
    const audienceInsights = await prisma.playEvent.groupBy({
      by: ['ipAddress'],
      where: {
        track: { artistId },
        timestamp: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const previousPeriodPlays = await prisma.playEvent.count({
      where: {
        track: { artistId },
        timestamp: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    const growthRate =
      previousPeriodPlays > 0
        ? ((totalPlays - previousPeriodPlays) / previousPeriodPlays) * 100
        : 0;

    return NextResponse.json({
      summary: {
        totalPlays,
        totalLikes,
        totalDuration,
        totalTracks: tracks.length,
        growthRate: Math.round(growthRate * 100) / 100,
      },
      playsByDate: playsByDate.map(item => ({
        date: item.timestamp,
        plays: item._count.id,
      })),
      topTracks,
      genrePerformance: genrePerformance.map(item => ({
        genre: item.genre,
        tracks: item._count.id,
        totalPlays: item._sum.playCount || 0,
        totalLikes: item._sum.likeCount || 0,
      })),
      audienceInsights: {
        uniqueListeners: audienceInsights.length,
        topLocations: audienceInsights.slice(0, 10),
      },
      timeRange: {
        start: startDate,
        end: new Date(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching artist analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Real-time Analytics Updates

#### `src/components/analytics/RealTimeAnalytics.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, UsersIcon, TrendingUpIcon } from '@heroicons/react/24/outline'

interface RealTimeData {
  currentListeners: number
  recentPlays: Array<{
    trackTitle: string
    artistName: string
    timestamp: string
  }>
  trendingTracks: Array<{
    title: string
    plays: number
    change: number
  }>
}

export default function RealTimeAnalytics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    currentListeners: 0,
    recentPlays: [],
    trendingTracks: []
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate real-time updates (replace with actual WebSocket connection)
    const interval = setInterval(() => {
      // Update current listeners (random simulation)
      setRealTimeData(prev => ({
        ...prev,
        currentListeners: Math.floor(Math.random() * 100) + 50,
      }))
    }, 5000)

    // Simulate new plays
    const playInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new play
        const newPlay = {
          trackTitle: 'Sample Track',
          artistName: 'Sample Artist',
          timestamp: new Date().toLocaleTimeString(),
        }

        setRealTimeData(prev => ({
          ...prev,
          recentPlays: [newPlay, ...prev.recentPlays.slice(0, 4)]
        }))
      }
    }, 3000)

    setIsConnected(true)

    return () => {
      clearInterval(interval)
      clearInterval(playInterval)
      setIsConnected(false)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Listeners */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-blue-50 rounded-lg"
        >
          <div className="flex items-center justify-center mb-2">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {realTimeData.currentListeners}
          </div>
          <div className="text-sm text-blue-600">Currently Listening</div>
        </motion.div>

        {/* Recent Plays */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Plays</h4>
          <div className="space-y-2">
            <AnimatePresence>
              {realTimeData.recentPlays.map((play, index) => (
                <motion.div
                  key={`${play.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-900 font-medium">{play.trackTitle}</span>
                  <span className="text-gray-500">by {play.artistName}</span>
                  <span className="text-gray-400">{play.timestamp}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {realTimeData.recentPlays.length === 0 && (
              <div className="text-gray-400 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Trending Tracks */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Trending Now</h4>
        <div className="space-y-2">
          {realTimeData.trendingTracks.map((track, index) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{track.title}</span>
                <span className="text-xs text-gray-500">{track.plays} plays</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUpIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">+{track.change}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 5. Analytics Export Functionality

#### `src/components/analytics/ExportAnalytics.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface ExportAnalyticsProps {
  data: any
  artistName: string
}

export default function ExportAnalytics({ data, artistName }: ExportAnalyticsProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')

  const exportToCSV = (data: any, filename: string) => {
    const csvContent = convertToCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const convertToCSV = (data: any): string => {
    // Convert analytics data to CSV format
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Plays', data.summary?.totalPlays || 0],
      ['Total Likes', data.summary?.totalLikes || 0],
      ['Total Tracks', data.summary?.totalTracks || 0],
      ['Growth Rate', `${data.summary?.growthRate || 0}%`],
    ]

    if (data.topTracks) {
      rows.push(['', ''])
      rows.push(['Top Tracks', ''])
      data.topTracks.forEach((track: any, index: number) => {
        rows.push([`${index + 1}. ${track.title}`, `${track.plays} plays`])
      })
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${artistName}_analytics_${timestamp}.${exportFormat}`

      if (exportFormat === 'csv') {
        exportToCSV(data, filename)
      } else if (exportFormat === 'json') {
        exportToJSON(data, filename)
      } else if (exportFormat === 'pdf') {
        // PDF export would require a library like jsPDF
        alert('PDF export coming soon!')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'csv', label: 'CSV', icon: TableCellsIcon, color: 'bg-green-500' },
              { value: 'json', label: 'JSON', icon: ChartBarIcon, color: 'bg-blue-500' },
              { value: 'pdf', label: 'PDF', icon: DocumentArrowDownIcon, color: 'bg-red-500' },
            ].map((format) => (
              <label key={format.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 ${
                  exportFormat === format.value ? format.color : 'border-gray-300'
                }`} />
                <span className="text-sm text-gray-700">{format.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <motion.button
          onClick={handleExport}
          disabled={exporting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>
            {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </span>
        </motion.button>

        {/* Export Info */}
        <div className="text-xs text-gray-500 text-center">
          {exportFormat === 'csv' && 'Best for spreadsheet analysis'}
          {exportFormat === 'json' && 'Best for data processing'}
          {exportFormat === 'pdf' && 'Best for reports and sharing'}
        </div>
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Analytics dashboard loads** - All charts and data display correctly
2. **Real-time updates work** - Live data updates function properly
3. **Export functionality** - Can export data in different formats
4. **Chart interactions** - Charts respond to user interactions
5. **Data accuracy** - Analytics show correct information
6. **Performance acceptable** - Dashboard loads within reasonable time

### Test Commands:

```bash
# Test analytics dashboard
# 1. Login as artist
# 2. Navigate to analytics page
# 3. Verify charts display correctly
# 4. Test export functionality

# Test real-time features
# 1. Check live listener count
# 2. Verify recent plays update
# 3. Test trending tracks display
```

## 🚨 Common Issues & Solutions

### Issue: Charts not rendering

**Solution**: Check chart library installation, verify data format, check for JavaScript errors

### Issue: Real-time updates not working

**Solution**: Verify WebSocket connection, check server-side event handling, validate data flow

### Issue: Export functionality failing

**Solution**: Check file permissions, verify data structure, test with smaller datasets

### Issue: Performance issues

**Solution**: Implement data pagination, optimize database queries, add caching layers

## 📝 Notes

- Consider implementing data caching for better performance
- Add error boundaries for chart rendering failures
- Implement progressive loading for large datasets
- Consider adding scheduled analytics reports
- Implement data retention policies for analytics data

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 9: Smart Links System](./09-smart-links.md)

---
