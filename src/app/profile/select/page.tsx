'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileTypeSelection from '@/components/profile/ProfileTypeSelection';

export default function ProfileSelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/login');
      return;
    }

    // If user is already authenticated, we'll show the profile selection
    // The ProfileTypeSelection component will handle the UI
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return <ProfileTypeSelection />;
}
