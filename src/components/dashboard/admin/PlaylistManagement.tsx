'use client';

import { useState, useEffect } from 'react';
import {
  QueueListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  PlaylistType,
  PlaylistStatus,
  SubmissionStatus,
  Playlist,
} from '@/types/playlist';

interface PlaylistManagementProps {
  onEditPlaylist?: (_playlist: Playlist) => void;
  onCreatePlaylist?: () => void;
}

export default function PlaylistManagement({
  onEditPlaylist,
  onCreatePlaylist,
}: PlaylistManagementProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all' as PlaylistType | 'all',
    status: 'all' as PlaylistStatus | 'all',
    search: '',
  });

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockPlaylists: Playlist[] = [
      {
        id: '1',
        name: "Editor's Choice",
        description: 'Our handpicked favorites this week',
        type: PlaylistType.FEATURED,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 5,
        currentTracks: 4,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.CLOSED,
        maxSubmissionsPerArtist: 1,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        order: 1,
      },
      {
        id: '2',
        name: 'Top 10 This Week',
        description: 'Most played tracks this week',
        type: PlaylistType.TOP_TEN,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 10,
        currentTracks: 10,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 2,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        order: 2,
      },
      {
        id: '3',
        name: 'Cape Town Sounds',
        description: 'Music from the Mother City',
        type: PlaylistType.PROVINCE,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 20,
        currentTracks: 12,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 3,
        province: 'Western Cape',
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15'),
        order: 3,
      },
      {
        id: '4',
        name: 'Amapiano Hits',
        description: 'Curated selection of Amapiano tracks',
        type: PlaylistType.GENRE,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 20,
        currentTracks: 15,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 2,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-12'),
        order: 4,
      },
    ];

    setTimeout(() => {
      setPlaylists(mockPlaylists);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: PlaylistType) => {
    switch (type) {
      case 'FEATURED':
        return '🏆';
      case 'TOP_TEN':
        return '📊';
      case 'PROVINCE':
        return '🏙️';
      case 'GENRE':
        return '🎵';
      default:
        return '🎵';
    }
  };

  const getTypeColor = (type: PlaylistType) => {
    switch (type) {
      case 'FEATURED':
        return 'from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700';
      case 'TOP_TEN':
        return 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700';
      case 'PROVINCE':
        return 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-700';
      case 'GENRE':
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
      default:
        return 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status: PlaylistStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 dark:text-green-400';
      case 'INACTIVE':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'OPEN':
        return 'text-green-600 dark:text-green-400';
      case 'CLOSED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const filteredPlaylists = playlists.filter(playlist => {
    if (filters.type !== 'all' && playlist.type !== filters.type) return false;
    if (filters.status !== 'all' && playlist.status !== filters.status)
      return false;
    if (
      filters.search &&
      !playlist.name.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className='space-y-8'>
        <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
          <div className='p-6'>
            <div className='animate-pulse space-y-4'>
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4'></div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className='h-48 bg-gray-200 dark:bg-slate-700 rounded-xl'
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Playlist Management
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Create and manage curated playlists
              </p>
            </div>
            <button
              onClick={onCreatePlaylist}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2'
            >
              <PlusIcon className='w-4 h-4' />
              Create Playlist
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-64'>
              <input
                type='text'
                placeholder='Search playlists...'
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <select
              value={filters.type}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  type: e.target.value as PlaylistType | 'all',
                }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Types</option>
              <option value='FEATURED'>Featured</option>
              <option value='TOP_TEN'>Top Ten</option>
              <option value='PROVINCE'>Province</option>
              <option value='GENRE'>Genre</option>
            </select>
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value as PlaylistStatus | 'all',
                }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Status</option>
              <option value='ACTIVE'>Active</option>
              <option value='INACTIVE'>Inactive</option>
            </select>
          </div>
        </div>

        {/* Playlist Grid */}
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredPlaylists.map(playlist => (
              <div
                key={playlist.id}
                className={`bg-gradient-to-br ${getTypeColor(playlist.type)} rounded-xl p-6 border`}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center'>
                    <span className='text-2xl'>
                      {getTypeIcon(playlist.type)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        playlist.type === 'FEATURED'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : playlist.type === 'TOP_TEN'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : playlist.type === 'PROVINCE'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {playlist.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  {playlist.name}
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2'>
                  {playlist.description}
                </p>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Tracks
                    </span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {playlist.currentTracks}/{playlist.maxTracks}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Status
                    </span>
                    <span
                      className={`font-medium ${getStatusColor(playlist.status)}`}
                    >
                      {playlist.status}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Submissions
                    </span>
                    <span
                      className={`font-medium ${getSubmissionStatusColor(playlist.submissionStatus)}`}
                    >
                      {playlist.submissionStatus}
                    </span>
                  </div>
                  {playlist.province && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Province
                      </span>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        {playlist.province}
                      </span>
                    </div>
                  )}
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-white/20 dark:border-slate-700/50'>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => onEditPlaylist?.(playlist)}
                      className='p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors'
                      title='Edit playlist'
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      className='p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors'
                      title='View details'
                    >
                      <EyeIcon className='w-4 h-4' />
                    </button>
                    <button
                      className='p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors'
                      title='Delete playlist'
                    >
                      <TrashIcon className='w-4 h-4' />
                    </button>
                  </div>
                  <div className='flex items-center gap-1'>
                    {playlist.status === 'ACTIVE' ? (
                      <CheckCircleIcon className='w-5 h-5 text-green-500' />
                    ) : (
                      <XCircleIcon className='w-5 h-5 text-gray-400' />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredPlaylists.length === 0 && (
              <div className='col-span-full bg-gray-50 dark:bg-slate-700/50 rounded-xl p-12 border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center'>
                <div className='w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center mb-4'>
                  <QueueListIcon className='w-8 h-8 text-gray-400 dark:text-gray-500' />
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  No playlists found
                </h4>
                <p className='text-sm text-gray-500 dark:text-gray-400 text-center mb-6'>
                  {filters.search ||
                  filters.type !== 'all' ||
                  filters.status !== 'all'
                    ? 'Try adjusting your filters to see more playlists'
                    : 'Create your first playlist to get started'}
                </p>
                {!filters.search &&
                  filters.type === 'all' &&
                  filters.status === 'all' && (
                    <button
                      onClick={onCreatePlaylist}
                      className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
                    >
                      Create Playlist
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
