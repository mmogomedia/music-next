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
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { duration, completed = false } = body

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create play event
    const playEvent = await prisma.playEvent.create({
      data: {
        trackId: params.id,
        userId: session?.user?.id,
        ipAddress,
        userAgent,
        duration,
        completed,
      }
    })

    // Increment track play count
    await prisma.track.update({
      where: { id: params.id },
      data: {
        playCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ 
      message: 'Play event recorded',
      playEvent 
    })
  } catch (error) {
    console.error('Error recording play event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
