'use client';

import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import TimelinePostsManagement from './TimelinePostsManagement';

export default function AdminTimelinePostsPage() {
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
              Timeline Posts
            </h1>
            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
              Manage and create timeline posts
            </p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={<AdminNavigation systemHealth={systemHealth} />}
      header={header}
    >
      <div className='w-full py-4 px-4 sm:px-6'>
        <TimelinePostsManagement />
      </div>
    </UnifiedLayout>
  );
}
