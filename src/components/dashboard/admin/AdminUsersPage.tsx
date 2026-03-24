'use client';

import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import UserManagement from './UserManagement';

export default function AdminUsersPage() {
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';
  const systemHealthReasons = stats?.systemMetrics?.platformHealthReasons;

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-4 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Users
            </h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Manage users
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
          systemHealth={systemHealth}
          systemHealthReasons={systemHealthReasons}
        />
      }
      header={header}
    >
      <div className='w-full py-8 px-4 sm:px-6'>
        <UserManagement onUserAction={() => {}} />
      </div>
    </UnifiedLayout>
  );
}
