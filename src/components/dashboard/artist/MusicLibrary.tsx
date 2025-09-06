"use client"

import { useState } from 'react'
import { 
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  HeartIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { 
  PlayIcon as PlaySolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid'

interface Track {
  id: string
  title: string
  artist: string
  album: string
  genre: string
  duration: number
  plays: number
  likes: number
  uploadDate: string
  coverImage: string
  isPlaying: boolean
  isLiked: boolean
  status: 'published' | 'draft' | 'processing'
}

export default function MusicLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortBy, setSortBy] = useState('uploadDate')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock data - replace with real data from your API
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Your Artist Name',
      album: 'Night Collection',
      genre: 'Electronic',
      duration: 180,
      plays: 15420,
      likes: 892,
      uploadDate: '2024-01-15',
      coverImage: '/api/placeholder/300/300',
      isPlaying: false,
      isLiked: true,
      status: 'published'
    },
    {
      id: '2',
      title: 'Summer Vibes',
      artist: 'Your Artist Name',
      album: 'Summer Collection',
      genre: 'Pop',
      duration: 210,
      plays: 12340,
      likes: 756,
      uploadDate: '2024-01-10',
      coverImage: '/api/placeholder/300/300',
      isPlaying: true,
      isLiked: false,
      status: 'published'
    },
    {
      id: '3',
      title: 'City Lights',
      artist: 'Your Artist Name',
      album: 'Urban Stories',
      genre: 'Hip Hop',
      duration: 195,
      plays: 9876,
      likes: 634,
      uploadDate: '2024-01-05',
      coverImage: '/api/placeholder/300/300',
      isPlaying: false,
      isLiked: true,
      status: 'published'
    },
    {
      id: '4',
      title: 'Ocean Waves',
      artist: 'Your Artist Name',
      album: 'Nature Sounds',
      genre: 'Ambient',
      duration: 240,
      plays: 5432,
      likes: 321,
      uploadDate: '2024-01-01',
      coverImage: '/api/placeholder/300/300',
      isPlaying: false,
      isLiked: false,
      status: 'draft'
    },
    {
      id: '5',
      title: 'Electric Pulse',
      artist: 'Your Artist Name',
      album: 'Energy',
      genre: 'Electronic',
      duration: 165,
      plays: 8765,
      likes: 543,
      uploadDate: '2023-12-28',
      coverImage: '/api/placeholder/300/300',
      isPlaying: false,
      isLiked: true,
      status: 'processing'
    },
    {
      id: '6',
      title: 'Jazz Night',
      artist: 'Your Artist Name',
      album: 'Smooth Jazz',
      genre: 'Jazz',
      duration: 285,
      plays: 4321,
      likes: 234,
      uploadDate: '2023-12-20',
      coverImage: '/api/placeholder/300/300',
      isPlaying: false,
      isLiked: false,
      status: 'published'
    }
  ]

  const genres = ['All', 'Electronic', 'Pop', 'Hip Hop', 'Ambient', 'Jazz', 'Rock', 'Classical']

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.album.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === '' || track.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'plays':
        return b.plays - a.plays
      case 'likes':
        return b.likes - a.likes
      case 'uploadDate':
      default:
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    }
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Floating Upload Button - Always Accessible */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
            <PlusIcon className="w-5 h-5" />
          </div>
          <span className="hidden sm:block">Upload Music</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Music Library</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {sortedTracks.length} track{sortedTracks.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tracks, albums, or genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Genre Filter */}
          <div className="sm:w-48">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              {genres.map(genre => (
                <option key={genre} value={genre === 'All' ? '' : genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="uploadDate">Upload Date</option>
              <option value="title">Title</option>
              <option value="plays">Most Plays</option>
              <option value="likes">Most Likes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracks Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedTracks.map((track) => (
            <div key={track.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Cover Image */}
              <div className="relative aspect-square bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MusicalNoteIcon className="w-16 h-16 text-white opacity-50" />
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(track.status)}`}>
                    {track.status}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100">
                    {track.isPlaying ? (
                      <PauseIcon className="w-6 h-6 text-gray-900" />
                    ) : (
                      <PlayIcon className="w-6 h-6 text-gray-900 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Track Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                  {track.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                  {track.album}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>{track.genre}</span>
                  <span>{formatDuration(track.duration)}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <PlaySolidIcon className="w-4 h-4" />
                      <span>{track.plays.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      {track.isLiked ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4" />
                      )}
                      <span>{track.likes.toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(track.uploadDate)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <ShareIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {sortedTracks.map((track) => (
              <div key={track.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {track.isPlaying ? (
                        <PauseIcon className="w-6 h-6 text-white" />
                      ) : (
                        <PlayIcon className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {track.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(track.status)}`}>
                        {track.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {track.album} • {track.genre}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(track.duration)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {track.plays.toLocaleString()} plays
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {track.likes.toLocaleString()} likes
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(track.uploadDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <ShareIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedTracks.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-slate-700 text-center">
          <MusicalNoteIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tracks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || selectedGenre ? 'Try adjusting your search or filters.' : 'Upload your first track to get started.'}
          </p>
          {!searchTerm && !selectedGenre && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Upload Music
            </button>
          )}
        </div>
      )}
    </div>
  )
}

