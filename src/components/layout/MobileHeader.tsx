'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Button,
  Input,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
} from '@heroicons/react/24/solid';

export default function MobileHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Explore', href: '/', icon: HomeIcon, activeIcon: HomeSolidIcon },
    { name: 'Albums', href: '/albums', icon: ChartBarIcon, activeIcon: ChartBarSolidIcon },
    { name: 'Genres', href: '/genres', icon: UserGroupIcon, activeIcon: UserGroupSolidIcon },
    { name: 'Artists', href: '/artists', icon: UserGroupIcon, activeIcon: UserGroupSolidIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, activeIcon: ChartBarSolidIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      className='bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 shadow-sm'
      maxWidth='full'
      position='sticky'
      height='64px'
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className='sm:hidden text-gray-600 dark:text-gray-300'
        />
        <NavbarBrand>
          <Link href='/' className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <p className='font-bold text-lg text-gray-900 dark:text-white'>
              Flemoji
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify='end' className='gap-2'>
        <NavbarItem className='hidden sm:flex'>
          <Input
            size='sm'
            placeholder='Search...'
            variant='bordered'
            classNames={{
              inputWrapper:
                'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 shadow-sm',
              input:
                'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm',
            }}
            startContent={
              <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
            }
          />
        </NavbarItem>

        {session ? (
          <NavbarItem>
            <Dropdown placement='bottom-end'>
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as='button'
                  className='transition-all duration-200 hover:scale-105'
                  color='primary'
                  name={session.user?.name || session.user?.email || 'User'}
                  size='sm'
                />
              </DropdownTrigger>
              <DropdownMenu aria-label='Profile Actions' variant='flat'>
                <DropdownItem key='profile' className='h-14 gap-2'>
                  <p className='font-semibold'>Signed in as</p>
                  <p className='font-semibold'>{session.user?.email}</p>
                </DropdownItem>
                <DropdownItem
                  key='profile-settings'
                  startContent={<UserIcon className='w-4 h-4' />}
                >
                  Profile Settings
                </DropdownItem>
                <DropdownItem
                  key='settings'
                  startContent={<Cog6ToothIcon className='w-4 h-4' />}
                >
                  Settings
                </DropdownItem>
                <DropdownItem
                  key='logout'
                  color='danger'
                  startContent={
                    <ArrowRightOnRectangleIcon className='w-4 h-4' />
                  }
                  onPress={() => signOut()}
                >
                  Sign out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <>
            <NavbarItem>
              <Link href='/login'>
                <Button
                  variant='light'
                  size='sm'
                  className='font-medium text-gray-700 dark:text-gray-300'
                >
                  Login
                </Button>
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href='/register'>
                <Button color='primary' size='sm' className='font-semibold'>
                  Sign Up
                </Button>
              </Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Custom Mobile Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-black/50 z-[60] lg:hidden'
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel - slides in from left, starts below header */}
          <div
            className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-slate-900 z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Content - starts just below header */}
            <div className='flex-1 overflow-y-auto pt-4'>
              {/* Search Section */}
              <div className='px-4 pb-4'>
          <Input
            size='sm'
            placeholder='Search...'
            variant='bordered'
            classNames={{
              inputWrapper:
                'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600',
              input: 'text-gray-900 dark:text-gray-100',
            }}
            startContent={
              <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
            }
          />
        </div>

              {/* MENU Section */}
              <div className='px-4 pb-6'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
                  MENU
                </h3>
                <nav className='space-y-1'>
                  {menuItems.map(item => {
                    const active = isActive(item.href);
                    const IconComponent = active ? item.activeIcon : item.icon;

                    return (
            <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            active ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'
                          }`}
                        />
                        <IconComponent className='w-5 h-5' />
                        <span className='text-sm'>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* ACCOUNT Section - Only show for non-authenticated users */}
              {!session && (
                <div className='px-4 pb-6'>
                  <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
                    ACCOUNT
                  </h3>
                  <nav className='space-y-1'>
                    <Link
                      href='/login'
                      onClick={() => setIsMenuOpen(false)}
                      className='flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                    >
                      <UserIcon className='w-5 h-5' />
                      <span className='text-sm'>Login</span>
                    </Link>
                    <Link
                      href='/register'
                      onClick={() => setIsMenuOpen(false)}
                      className='flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                    >
                      <UserIcon className='w-5 h-5' />
                      <span className='text-sm'>Sign Up</span>
            </Link>
                  </nav>
                </div>
              )}

              {/* User Profile Section - Only show for authenticated users */}
              {session && (
                <div className='mt-auto px-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4'>
                  <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm'>
                      {session.user?.image ? (
                        <Avatar
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          size='sm'
                        />
                      ) : (
                        <UserIcon className='w-5 h-5 text-white' />
                      )}
                    </div>
                    <div className='flex-1 text-left min-w-0'>
                      <p className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                        {session.user?.name || session.user?.email || 'User'}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className='mt-2 space-y-1'>
              <Link
                href='/dashboard'
                      onClick={() => setIsMenuOpen(false)}
                      className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
              >
                      <Cog6ToothIcon className='w-4 h-4' />
                Dashboard
              </Link>
              <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left'
                    >
                      <ArrowRightOnRectangleIcon className='w-4 h-4' />
                Sign out
              </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
    </Navbar>
  );
}
