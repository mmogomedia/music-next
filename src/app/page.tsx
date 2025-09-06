'use client'

import { Button } from '@heroui/react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { 
  PlayIcon, 
  HeartIcon, 
  MusicalNoteIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

export default function HomePage() {
  const { data: session } = useSession()

  // Mock data for the music streaming interface
  const trendingArtists = [
    { id: '1', name: 'Billie Eilish', followers: '127M', coverImage: '/api/placeholder/80/80' },
    { id: '2', name: 'Dewa 19', followers: '89K', coverImage: '/api/placeholder/80/80' },
    { id: '3', name: 'Sam Smith', followers: '156K', coverImage: '/api/placeholder/80/80' },
    { id: '4', name: 'Eminem', followers: '72K', coverImage: '/api/placeholder/80/80' },
    { id: '5', name: 'Charlie Puth', followers: '95K', coverImage: '/api/placeholder/80/80' },
    { id: '6', name: 'Yura Yunita', followers: '68K', coverImage: '/api/placeholder/80/80' }
  ]

  const topHits = [
    { rank: 1, title: 'Greedy', artist: 'Tate McRae', duration: '02:11' },
    { rank: 2, title: 'One of the Girls', artist: 'The Weeknd, Jennie & Lily Ro...', duration: '03:45' },
    { rank: 3, title: 'Popular', artist: 'The Weeknd, Playboi Carti an...', duration: '04:02' },
    { rank: 4, title: 'I Wanna Be Yours', artist: 'Arctic Monkeys', duration: '03:28' }
  ]

  const justForYou = [
    { title: 'Half of My Heart', artist: 'Ft. John Mayer' },
    { title: 'Dance The Night', artist: 'Dua Lipa' },
    { title: 'End Game', artist: 'Ft. Ed Sheeran' }
  ]

  

    return (
    <main className="w-full h-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Clean Content Layout */}
      <section className="w-full h-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto">
            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for songs, artists, or albums..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Trending Artists Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trending Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {trendingArtists.map((artist) => (
                  <div key={artist.id} className="text-center group cursor-pointer">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 group-hover:scale-105 transition-transform duration-200">
                      {/* Artist image placeholder */}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{artist.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{artist.followers} followers</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Hits Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Hits</h2>
              <div className="space-y-3">
                {topHits.map((track) => (
                  <div key={track.rank} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {track.rank}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{track.duration}</span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <PlayIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4 overflow-y-auto">
            {/* Just For You */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Just For You</h3>
              <div className="space-y-3">
                {justForYou.map((track, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <MusicalNoteIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{track.artist}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <HeartIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Played */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recently Played</h3>
              <div className="space-y-3">
                {justForYou.map((track, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <MusicalNoteIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{track.artist}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <PlayIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
