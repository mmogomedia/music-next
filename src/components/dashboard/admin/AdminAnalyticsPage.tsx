'use client';

import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

export default function AdminAnalyticsPage() {
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-4 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Analytics
            </h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Platform performance and insights
            </p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={
        <AdminNavigation
          activeTab='analytics'
          onTabChange={() => {}}
          systemHealth={systemHealth}
        />
      }
      header={header}
    >
      <div className='w-full py-8 px-4 sm:px-6'>
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
      </div>
    </UnifiedLayout>
  );
}
