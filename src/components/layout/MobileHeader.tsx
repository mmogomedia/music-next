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
  NavbarMenu,
  NavbarMenuItem,
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
} from '@heroicons/react/24/outline';

export default function MobileHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Explore', href: '/' },
    { name: 'Albums', href: '/albums' },
    { name: 'Genres', href: '/genres' },
    { name: 'Artists', href: '/artists' },
    { name: 'Recent', href: '/recent' },
    { name: 'Playlists', href: '/playlists' },
    { name: 'Favorites', href: '/favorites' },
    { name: 'Local', href: '/local' },
  ];

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

      <NavbarMenu className='bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
        <div className='px-4 py-2'>
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
        {menuItems.map(item => (
          <NavbarMenuItem key={item.name}>
            <Link
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                pathname?.startsWith(item.href)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
              href={item.href}
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {session ? (
          <>
            <NavbarMenuItem key='m-dashboard'>
              <Link
                className='w-full px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200'
                href='/dashboard'
              >
                Dashboard
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem key='m-signout'>
              <button
                className='w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200'
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </NavbarMenuItem>
          </>
        ) : (
          <>
            <NavbarMenuItem key='m-login'>
              <Link
                className='w-full px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200'
                href='/login'
              >
                Login
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem key='m-register'>
              <Link
                className='w-full px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200'
                href='/register'
              >
                Sign Up
              </Link>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
