'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  MusicalNoteIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlaySolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import UploadMusic from './UploadMusic';
import MusicLibrary from './MusicLibrary';
import ArtistProfileManager from './ArtistProfileManager';
import PlaylistSubmissions from './PlaylistSubmissions';
import TrackArtwork from '@/components/music/TrackArtwork';

export default function ArtistDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data - replace with real data from your API
  const stats = {
    totalTracks: 24,
    totalPlays: 125430,
    totalLikes: 8932,
    totalRevenue: 1247.5,
  };

  const recentTracks = [
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: session?.user?.name || 'You',
      duration: 180,
      plays: 15420,
      likes: 892,
      coverImage: '/api/placeholder/64/64',
      isPlaying: false,
    },
    {
      id: '2',
      title: 'Summer Vibes',
      artist: session?.user?.name || 'You',
      duration: 210,
      plays: 12340,
      likes: 756,
      coverImage: '/api/placeholder/64/64',
      isPlaying: true,
    },
    {
      id: '3',
      title: 'City Lights',
      artist: session?.user?.name || 'You',
      duration: 195,
      plays: 9876,
      likes: 634,
      coverImage: '/api/placeholder/64/64',
      isPlaying: false,
    },
  ];

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'upload', name: 'Upload Music', icon: PlusIcon },
    { id: 'library', name: 'My Music', icon: MusicalNoteIcon },
    { id: 'submissions', name: 'Playlist Submissions', icon: QueueListIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className='w-full h-full bg-gray-50 dark:bg-slate-900 overflow-hidden'>
      {/* Floating Upload Button - Always Accessible */}
      <div className='fixed bottom-6 right-6 z-50'>
        <button
          onClick={() => setActiveTab('upload')}
          className='group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105'
        >
          <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300'>
            <PlusIcon className='w-5 h-5' />
          </div>
          <span className='hidden sm:block'>Upload Music</span>
        </button>
      </div>

      {/* Header Section */}
      <section className='w-full px-4 sm:px-6 lg:px-8 py-6'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
              Welcome back, {session?.user?.name || 'Artist'}
            </h1>
            <p className='text-gray-500 dark:text-gray-400 text-lg'>
              Manage your music and track your performance
            </p>
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105'
          >
            <div className='w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center'>
              <PlusIcon className='w-4 h-4' />
            </div>
            Upload Music
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-slate-700 mb-8'>
          <nav className='flex space-x-2'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            {/* Stats Overview */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <MusicalNoteIcon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex items-center gap-1 text-blue-600 text-sm font-semibold'>
                    <span>+12%</span>
                  </div>
                </div>
                <div className='text-3xl font-bold text-gray-900 dark:text-white mb-1'>
                  {stats.totalTracks}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Tracks
                </div>
                <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                  +2 this month
                </div>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <PlaySolidIcon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex items-center gap-1 text-blue-600 text-sm font-semibold'>
                    <span>+8.3%</span>
                  </div>
                </div>
                <div className='text-3xl font-bold text-gray-900 dark:text-white mb-1'>
                  {stats.totalPlays.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Plays
                </div>
                <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                  15,420 this month
                </div>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <HeartSolidIcon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex items-center gap-1 text-blue-600 text-sm font-semibold'>
                    <span>+15.2%</span>
                  </div>
                </div>
                <div className='text-3xl font-bold text-gray-900 dark:text-white mb-1'>
                  {stats.totalLikes.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Likes
                </div>
                <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                  892 this month
                </div>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <span className='text-white font-bold text-lg'>$</span>
                  </div>
                  <div className='flex items-center gap-1 text-blue-600 text-sm font-semibold'>
                    <span>+24.1%</span>
                  </div>
                </div>
                <div className='text-3xl font-bold text-gray-900 dark:text-white mb-1'>
                  ${stats.totalRevenue.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Revenue
                </div>
                <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                  $247.50 this month
                </div>
              </div>
            </div>

            {/* Recent Tracks */}
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
              <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                      Recent Tracks
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Your latest uploads and their performance
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('library')}
                    className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200'
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className='divide-y divide-gray-200 dark:divide-slate-700'>
                {recentTracks.map(track => (
                  <div
                    key={track.id}
                    className='p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200 group'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='flex-shrink-0 relative'>
                        <TrackArtwork
                          artworkUrl={track.coverImage}
                          title={track.title}
                          size='lg'
                          className='w-14 h-14 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200'
                        />
                        <div className='absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                          {track.isPlaying ? (
                            <PauseIcon className='w-7 h-7 text-white' />
                          ) : (
                            <PlayIcon className='w-7 h-7 text-white ml-0.5' />
                          )}
                        </div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-3 mb-1'>
                          <h4 className='text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {track.title}
                          </h4>
                          <div className='flex items-center gap-1 text-sm'>
                            <span className='text-blue-600 font-semibold'>
                              +12.5%
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 truncate mb-2'>
                          {track.artist}
                        </p>
                        <div className='flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400'>
                          <span className='flex items-center gap-1'>
                            <PlaySolidIcon className='w-4 h-4' />
                            {track.plays.toLocaleString()} plays
                          </span>
                          <span className='flex items-center gap-1'>
                            <HeartSolidIcon className='w-4 h-4' />
                            {track.likes.toLocaleString()} likes
                          </span>
                          <span>
                            {Math.floor(track.duration / 60)}:
                            {(track.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <button className='p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                          <EyeIcon className='w-5 h-5' />
                        </button>
                        <button className='p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                          <PencilIcon className='w-5 h-5' />
                        </button>
                        <button className='p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                          <ShareIcon className='w-5 h-5' />
                        </button>
                        <button className='p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20'>
                          <TrashIcon className='w-5 h-5' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <PlusIcon className='w-7 h-7 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                      Upload New Track
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Share your latest music with the world
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'
                >
                  Upload Music
                </button>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <ChartBarIcon className='w-7 h-7 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                      View Analytics
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Track your performance and growth
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'
                >
                  View Analytics
                </button>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <UserIcon className='w-7 h-7 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200'>
                      Manage Profile
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Customize your artist identity and social links
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className='w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'
                >
                  Manage Profile
                </button>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 group'>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
                    <ShareIcon className='w-7 h-7 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-200'>
                      Create Smart Links
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Generate cross-platform sharing links
                    </p>
                  </div>
                </div>
                <button className='w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'>
                  Create Links
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && <ArtistProfileManager />}

        {activeTab === 'upload' && <UploadMusic />}

        {activeTab === 'library' && <MusicLibrary />}

        {activeTab === 'submissions' && <PlaylistSubmissions />}

        {activeTab === 'analytics' && (
          <div className='space-y-8'>
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
              <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                  Analytics Overview
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Track your music performance and audience
                </p>
              </div>
              <div className='p-8'>
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                    <ChartBarIcon className='w-10 h-10 text-white' />
                  </div>
                  <h4 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                    Analytics Coming Soon
                  </h4>
                  <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
                    Detailed charts and metrics will be displayed here to help
                    you track your music performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
