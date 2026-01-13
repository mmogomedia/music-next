'use client';

import {
  ExclamationTriangleIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupSolidIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
} from '@heroicons/react/24/solid';
import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useRouter } from 'next/navigation';

export default function AdminOverviewPage() {
  const router = useRouter();
  const { stats, loading, error, refetch } = useAdminDashboardStats();

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

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
              Dashboard Overview
            </h1>
            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
              Platform metrics and quick actions
            </p>
          </div>
          <button
            onClick={() =>
              router.push('/admin/dashboard/timeline-posts/create')
            }
            className='flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg'
          >
            <PlusIcon className='w-4 h-4' />
            <span className='hidden sm:inline'>New Timeline Post</span>
            <span className='sm:hidden'>New Post</span>
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={
        <AdminNavigation
          activeTab='overview'
          onTabChange={() => {}}
          systemHealth={systemMetrics.platformHealth}
        />
      }
      header={header}
    >
      <div className='w-full py-4 px-4 sm:px-6'>
        <div className='space-y-4'>
          {/* Loading State */}
          {loading && (
            <div className='flex justify-center items-center h-32'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3'>
              <div className='flex items-center'>
                <ExclamationTriangleIcon className='w-4 h-4 text-red-600 dark:text-red-400 mr-2' />
                <p className='text-sm text-red-600 dark:text-red-400'>
                  Error loading dashboard data: {error}
                </p>
              </div>
              <button
                onClick={refetch}
                className='mt-2 text-xs text-red-600 dark:text-red-400 hover:underline'
              >
                Try again
              </button>
            </div>
          )}

          {/* System Metrics - Compact Grid */}
          {!loading && !error && (
            <>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div className='bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <UserGroupSolidIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                        Users
                      </p>
                      <p className='text-lg font-bold text-gray-900 dark:text-white'>
                        {systemMetrics.totalUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <MusicalNoteSolidIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                        Artists
                      </p>
                      <p className='text-lg font-bold text-gray-900 dark:text-white'>
                        {systemMetrics.totalArtists.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <MusicalNoteIcon className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                        Tracks
                      </p>
                      <p className='text-lg font-bold text-gray-900 dark:text-white'>
                        {systemMetrics.totalTracks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <ChartBarSolidIcon className='w-5 h-5 text-orange-600 dark:text-orange-400' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                        Plays
                      </p>
                      <p className='text-lg font-bold text-gray-900 dark:text-white'>
                        {systemMetrics.totalPlays.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                {/* Quick Actions */}
                <div className='lg:col-span-2'>
                  <div className='bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700'>
                    <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700'>
                      <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Quick Actions
                      </h3>
                    </div>
                    <div className='p-4'>
                      <div className='grid grid-cols-2 gap-3'>
                        <button
                          onClick={() =>
                            router.push(
                              '/admin/dashboard/timeline-posts/create'
                            )
                          }
                          className='flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-all group'
                        >
                          <SparklesIcon className='w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform' />
                          <div className='text-left'>
                            <p className='text-xs font-medium text-gray-900 dark:text-white'>
                              Timeline Post
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              Create new
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() =>
                            router.push('/admin/dashboard/timeline-posts')
                          }
                          className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition-all group'
                        >
                          <SparklesIcon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform' />
                          <div className='text-left'>
                            <p className='text-xs font-medium text-gray-900 dark:text-white'>
                              Manage Posts
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              View all posts
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => router.push('/admin/dashboard/users')}
                          className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition-all group'
                        >
                          <UserGroupIcon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform' />
                          <div className='text-left'>
                            <p className='text-xs font-medium text-gray-900 dark:text-white'>
                              Manage Users
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              View all users
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() =>
                            router.push('/admin/dashboard/content')
                          }
                          className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition-all group'
                        >
                          <MusicalNoteIcon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform' />
                          <div className='text-left'>
                            <p className='text-xs font-medium text-gray-900 dark:text-white'>
                              Content
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              Review tracks
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Actions - Compact */}
                <div className='bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700'>
                  <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700'>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Pending Actions
                    </h3>
                  </div>
                  <div className='p-4'>
                    <div className='space-y-2'>
                      {pendingActions.length === 0 ? (
                        <p className='text-xs text-gray-500 dark:text-gray-400 text-center py-4'>
                          No pending actions
                        </p>
                      ) : (
                        pendingActions.slice(0, 3).map(action => (
                          <div
                            key={action.id}
                            className='flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg'
                          >
                            <div className='flex-1 min-w-0'>
                              <h4 className='text-xs font-medium text-gray-900 dark:text-white truncate'>
                                {action.title}
                              </h4>
                              <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                {action.description}
                              </p>
                            </div>
                            <div className='flex items-center gap-2 ml-2'>
                              <span
                                className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(action.priority)}`}
                              >
                                {action.priority}
                              </span>
                              <span className='text-xs font-semibold text-gray-900 dark:text-white'>
                                {action.count}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity - Compact */}
              <div className='bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700'>
                <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                    Recent Activity
                  </h3>
                </div>
                <div className='p-4'>
                  <RecentActivity
                    activity={stats?.recentActivity}
                    useSSE={true}
                    scope='admin'
                    noCard={true}
                    noHeader={true}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}
