'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Avatar,
} from '@heroui/react';
import {
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import SignInModal from '@/components/auth/SignInModal';

interface UserDetailsFooterProps {
  showSystemHealth?: boolean;
  systemHealth?: 'healthy' | 'warning' | 'critical';
  onMobileMenuClose?: () => void;
}

export default function UserDetailsFooter({
  showSystemHealth = false,
  systemHealth = 'healthy',
  onMobileMenuClose,
}: UserDetailsFooterProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isOnDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className='space-y-3'>
      {/* System Health Status - Only shown if enabled */}
      {showSystemHealth && (
        <div
          className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${getHealthColor(systemHealth)}`}
        >
          {systemHealth === 'healthy' && 'System Healthy'}
          {systemHealth === 'warning' && 'System Warning'}
          {systemHealth === 'critical' && 'System Critical'}
        </div>
      )}

      {/* Auth Status */}
      {status === 'authenticated' && session?.user ? (
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2.5 min-w-0 flex-1'>
            <Avatar
              src={session.user.image || undefined}
              name={session.user.name || session.user.email || 'User'}
              size='sm'
              className='flex-shrink-0'
              showFallback
            />
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-semibold text-gray-900 dark:text-white truncate'>
                {session.user.name || session.user.email}
              </p>
              <p className='text-[10px] text-gray-400 dark:text-gray-500 mt-0.5'>
                Signed in
              </p>
            </div>
          </div>
          <Dropdown placement='top-end'>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant='light'
                size='sm'
                className='min-w-0 w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                <EllipsisVerticalIcon className='w-4 h-4' />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label='User menu' variant='flat'>
              {isOnDashboard ? (
                <DropdownItem
                  key='landing'
                  startContent={<HomeIcon className='w-4 h-4' />}
                  as={Link}
                  href='/'
                  onPress={onMobileMenuClose}
                >
                  Go to Landing
                </DropdownItem>
              ) : (
                <DropdownItem
                  key='dashboard'
                  startContent={<HomeIcon className='w-4 h-4' />}
                  as={Link}
                  href={session?.user?.role === 'ARTIST' ? '/dashboard' : '/admin/dashboard'}
                  onPress={onMobileMenuClose}
                >
                  Go to Dashboard
                </DropdownItem>
              )}
              <DropdownItem
                key='classic-view'
                startContent={<ArrowsRightLeftIcon className='w-4 h-4' />}
                as={Link}
                href='/classic'
                onPress={onMobileMenuClose}
              >
                Classic View
              </DropdownItem>
              <DropdownItem
                key='logout'
                color='danger'
                startContent={<ArrowRightOnRectangleIcon className='w-4 h-4' />}
                onPress={() => {
                  onMobileMenuClose?.();
                  signOut();
                }}
              >
                Sign out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600'></div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
              Signed Out
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                setIsSignInModalOpen(true);
                onMobileMenuClose?.();
              }}
              className='flex-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-2 rounded-lg text-center transition-all shadow-sm hover:shadow'
            >
              Sign in
            </button>
            <Link
              href='/classic'
              onClick={onMobileMenuClose}
              className='p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all border border-gray-200 dark:border-slate-700'
              title='Classic View'
              aria-label='Classic View'
            >
              <ArrowsRightLeftIcon className='w-4 h-4' />
            </Link>
          </div>
        </div>
      )}

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}

