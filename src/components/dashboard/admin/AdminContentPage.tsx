'use client';

import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import ArticleManagement from './ArticleManagement';

export default function AdminContentPage() {
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-4 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Articles
            </h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Manage SEO content clusters and articles
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
          activeTab='content'
          onTabChange={() => {}}
          systemHealth={systemHealth}
        />
      }
      header={header}
    >
      <div className='w-full py-8 px-4 sm:px-6'>
        <ArticleManagement />
      </div>
    </UnifiedLayout>
  );
}
