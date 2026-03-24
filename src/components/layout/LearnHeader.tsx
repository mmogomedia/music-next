'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,
} from '@heroui/react';
import { useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import SignInModal from '@/components/auth/SignInModal';

export default function LearnHeader() {
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Learn', href: '/learn' },
    { name: 'Tools', href: '/tools' },
  ];

  return (
    <>
      <Navbar
        onMenuOpenChange={setIsMenuOpen}
        className='bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-800 shadow-sm px-4 sm:px-6 lg:px-8'
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
            <Link href='/learn' className='flex items-center gap-3'>
              <Image
                src='/logo_symbol.png'
                alt='Flemoji symbol'
                width={36}
                height={36}
                priority
                className='h-9 w-9 rounded-lg block lg:hidden'
              />
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={180}
                height={50}
                priority
                className='h-10 w-auto hidden lg:block dark:brightness-0 dark:invert'
              />
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Center nav — just Home and Learn */}
        <NavbarContent className='hidden sm:flex gap-1' justify='center'>
          {navItems.map(item => (
            <NavbarItem key={item.name}>
              <Link
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  pathname?.startsWith(item.href) && item.href !== '/'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : pathname === item.href
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                }`}
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify='end'>
          <NavbarItem>
            <Switch
              isSelected={isDark}
              onValueChange={checked => setTheme(checked ? 'dark' : 'light')}
              size='sm'
              color='primary'
              thumbIcon={({ isSelected, className }) =>
                isSelected ? (
                  <MoonIcon className={className} />
                ) : (
                  <SunIcon className={className} />
                )
              }
            />
          </NavbarItem>

          {session ? (
            <>
              <NavbarItem className='hidden sm:flex'>
                <Link href='/dashboard'>
                  <Button
                    variant='flat'
                    color='primary'
                    size='sm'
                    className='font-semibold text-sm'
                  >
                    Dashboard
                  </Button>
                </Link>
              </NavbarItem>
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
                      key='logout'
                      color='danger'
                      onPress={() => signOut()}
                    >
                      Sign out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            </>
          ) : (
            <>
              <NavbarItem className='hidden sm:flex'>
                <Button
                  variant='light'
                  color='default'
                  size='sm'
                  className='font-medium text-sm'
                  onPress={() => setIsSignInModalOpen(true)}
                >
                  Login
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Link href='/register'>
                  <Button
                    color='primary'
                    variant='solid'
                    size='sm'
                    className='font-semibold text-sm'
                  >
                    Sign Up
                  </Button>
                </Link>
              </NavbarItem>
            </>
          )}
        </NavbarContent>

        <NavbarMenu>
          {navItems.map(item => (
            <NavbarMenuItem key={item.name}>
              <Link
                className='w-full py-2 text-gray-700 dark:text-gray-200'
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
          {session ? (
            <>
              <NavbarMenuItem>
                <Link
                  className='w-full py-2 text-gray-700 dark:text-gray-200'
                  href='/dashboard'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  className='w-full text-left py-2 text-red-600'
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <button
                  className='w-full text-left py-2 text-gray-700 dark:text-gray-200'
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSignInModalOpen(true);
                  }}
                >
                  Login
                </button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  className='w-full py-2 text-gray-700 dark:text-gray-200'
                  href='/register'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>
      </Navbar>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
}
