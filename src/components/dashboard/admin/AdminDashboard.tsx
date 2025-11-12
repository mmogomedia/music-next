'use client';

import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  BellIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupSolidIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
} from '@heroicons/react/24/solid';
import UnifiedPlaylistManagement from './UnifiedPlaylistManagement';
import SubmissionReview from './SubmissionReview';
import TrackManagement from './TrackManagement';
import UserManagement from './UserManagement';
import GenreManagement from './GenreManagement';
import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, loading, error, refetch } = useAdminDashboardStats();

  const handleCreatePlaylist = () => {
    // This will be handled by the UnifiedPlaylistManagement component
  };

  const handleEditPlaylist = (_playlist: Playlist) => {
    // This will be handled by the UnifiedPlaylistManagement component
  };

  const handleTrackPlay = (_track: Track) => {
    // This will be handled by the TrackManagement component
  };

  const handleUserAction = (_action: string, _user: any) => {
    // Placeholder for future implementation
  };

  // Use real data from API or fallback to defaults
  const systemMetrics = stats?.systemMetrics || {
    totalUsers: 0,
    totalArtists: 0,
    totalTracks: 0,
    totalPlays: 0,
    totalDownloads: 0,
    totalPageViews: 0,
    totalRevenue: 0,
    platformHealth: 'healthy' as 'healthy' | 'warning' | 'critical',
  };

  const recentActivity = stats?.recentActivity || [];
  const pendingActions = stats?.pendingActions || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const tabNames: Record<string, string> = {
    overview: 'Overview',
    users: 'Users',
    content: 'Content',
    genres: 'Genres',
    playlists: 'Playlists',
    submissions: 'Submissions',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-4 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {tabNames[activeTab] || 'Admin Dashboard'}
            </h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {activeTab === 'overview'
                ? 'Manage your platform and monitor system health'
                : `Manage ${tabNames[activeTab]?.toLowerCase()}`}
            </p>
          </div>
          <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2'>
            <BellIcon className='w-4 h-4' />
            <span className='hidden sm:inline'>Notifications</span>
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={
        <AdminNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          systemHealth={systemMetrics.platformHealth}
        />
      }
      header={header}
    >
      <div className='w-full py-8 px-4 sm:px-6'>
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            {/* Loading State */}
            {loading && (
              <div className='flex justify-center items-center h-32'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <div className='flex items-center'>
                  <ExclamationTriangleIcon className='w-5 h-5 text-red-600 dark:text-red-400 mr-2' />
                  <p className='text-red-600 dark:text-red-400'>
                    Error loading dashboard data: {error}
                  </p>
                </div>
                <button
                  onClick={refetch}
                  className='mt-2 text-sm text-red-600 dark:text-red-400 hover:underline'
                >
                  Try again
                </button>
              </div>
            )}

            {/* System Metrics */}
            {!loading && !error && (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                          <UserGroupSolidIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Users
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {systemMetrics.totalUsers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                          <MusicalNoteSolidIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Artists
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {systemMetrics.totalArtists.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center'>
                          <MusicalNoteIcon className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Tracks
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {systemMetrics.totalTracks.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center'>
                          <ChartBarSolidIcon className='w-5 h-5 text-orange-600 dark:text-orange-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Plays
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {systemMetrics.totalPlays.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center'>
                          <ArrowDownTrayIcon className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Downloads
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {(systemMetrics.totalDownloads || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center'>
                          <EyeIcon className='w-5 h-5 text-pink-600 dark:text-pink-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Page Views
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {(systemMetrics.totalPageViews || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center'>
                          <span className='text-yellow-600 dark:text-yellow-400 font-bold'>
                            $
                          </span>
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          Total Revenue
                        </p>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          ${systemMetrics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                          <ShieldCheckIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                        </div>
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                          System Health
                        </p>
                        <p className='text-lg font-bold text-gray-900 dark:text-white capitalize'>
                          {systemMetrics.platformHealth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  {/* Pending Actions */}
                  <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Pending Actions
                      </h3>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Items requiring your attention
                      </p>
                    </div>
                    <div className='p-6'>
                      <div className='space-y-4'>
                        {pendingActions.map(action => (
                          <div
                            key={action.id}
                            className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg'
                          >
                            <div className='flex-1'>
                              <h4 className='font-medium text-gray-900 dark:text-white'>
                                {action.title}
                              </h4>
                              <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {action.description}
                              </p>
                            </div>
                            <div className='flex items-center space-x-3'>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(action.priority)}`}
                              >
                                {action.priority}
                              </span>
                              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                {action.count}
                              </span>
                              <button className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'>
                                <EyeIcon className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Recent Activity
                      </h3>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Latest platform events
                      </p>
                    </div>
                    <div className='p-6'>
                      <div className='space-y-4'>
                        {recentActivity.map(activity => {
                          const getIcon = (iconName: string) => {
                            switch (iconName) {
                              case 'UserGroupIcon':
                                return UserGroupIcon;
                              case 'MusicalNoteIcon':
                                return MusicalNoteIcon;
                              case 'ClockIcon':
                                return ClockIcon;
                              case 'ExclamationTriangleIcon':
                                return ExclamationTriangleIcon;
                              case 'CheckCircleIcon':
                                return CheckCircleIcon;
                              default:
                                return ClockIcon;
                            }
                          };
                          const Icon = getIcon(activity.icon);
                          return (
                            <div
                              key={activity.id}
                              className='flex items-start space-x-3'
                            >
                              <div
                                className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`w-4 h-4 ${activity.color}`} />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm text-gray-900 dark:text-white'>
                                  {activity.message}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                  {activity.timestamp}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                        <UserGroupIcon className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Manage Users
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          View and manage all users
                        </p>
                      </div>
                    </div>
                    <button
                      className='mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200'
                      onClick={() => setActiveTab('users')}
                    >
                      Manage Users
                    </button>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                        <MusicalNoteIcon className='w-6 h-6 text-green-600 dark:text-green-400' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Content Review
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          Review and moderate content
                        </p>
                      </div>
                    </div>
                    <button className='mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200'>
                      Review Content
                    </button>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center'>
                        <ChartBarIcon className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          View Analytics
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          Platform performance metrics
                        </p>
                      </div>
                    </div>
                    <button className='mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200'>
                      View Analytics
                    </button>
                  </div>

                  <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-lg flex items-center justify-center'>
                        <Cog6ToothIcon className='w-6 h-6 text-gray-600 dark:text-gray-400' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Platform Settings
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          Configure platform settings
                        </p>
                      </div>
                    </div>
                    <button className='mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200'>
                      Settings
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement onUserAction={handleUserAction} />
        )}

        {activeTab === 'content' && (
          <TrackManagement onTrackPlay={handleTrackPlay} />
        )}

        {activeTab === 'genres' && <GenreManagement />}

        {activeTab === 'playlists' && (
          <UnifiedPlaylistManagement
            onEditPlaylist={handleEditPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
          />
        )}

        {activeTab === 'submissions' && <SubmissionReview />}

        {activeTab === 'analytics' && (
          <div className='space-y-8'>
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
              <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  System Analytics
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Platform performance and insights
                </p>
              </div>
              <div className='p-6'>
                <p className='text-gray-500 dark:text-gray-400 text-center py-8'>
                  Analytics charts and metrics will be displayed here
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='space-y-8'>
            <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
              <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Platform Settings
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Configure platform settings and preferences
                </p>
              </div>
              <div className='p-6'>
                <p className='text-gray-500 dark:text-gray-400 text-center py-8'>
                  Platform settings interface will be displayed here
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}
