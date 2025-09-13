'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface RoleBasedRedirectProps {
  children: ReactNode;
}

export default function RoleBasedRedirect({
  children,
}: RoleBasedRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    if (session.user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }

    // For regular users and artists, continue to the normal flow
    // This component will render its children for non-admin users
  }, [session, status, router]);

  // Show loading while checking authentication and role
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

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  // Don't render children for admin users (they'll be redirected)
  if (session.user?.role === 'ADMIN') {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            Redirecting to admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Render children for non-admin users
  return <>{children}</>;
}
