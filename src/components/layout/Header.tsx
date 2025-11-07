'use client';

import Link from 'next/link';
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
  Input,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,
} from '@heroui/react';
import { useMemo, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import {
  MusicalNoteIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import SignInModal from '@/components/auth/SignInModal';

export default function Header() {
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  const pathname = usePathname();

  const menuItems = useMemo(
    () => [
      { name: 'Home', href: '/' },
      { name: 'Browse', href: '/browse' },
      { name: 'Artists', href: '/artists' },
      { name: 'Playlists', href: '/playlists' },
    ],
    []
  );

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      className='bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm px-4 sm:px-6 lg:px-8'
      maxWidth='full'
      position='sticky'
      height='80px'
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className='sm:hidden text-gray-600'
        />
        <NavbarBrand>
          <Link href='/' className='flex items-center gap-3 group'>
            <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='font-bold text-xl text-gray-900'>Flemoji</p>
              <p className='text-xs text-gray-500 -mt-1'>Music</p>
            </div>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className='hidden lg:flex gap-2' justify='center'>
        {menuItems.map(item => (
          <NavbarItem key={item.name}>
            <Link
              href={item.href}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                pathname?.startsWith(item.href)
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify='end'>
        <NavbarItem className='hidden md:flex w-60'>
          <Input
            size='sm'
            placeholder='Search...'
            variant='bordered'
            classNames={{
              inputWrapper:
                'bg-gray-50 border-gray-200 hover:border-purple-300 focus-within:border-purple-500 shadow-sm',
              input: 'text-gray-900 placeholder:text-gray-500 text-sm',
            }}
            startContent={
              <svg
                className='w-4 h-4 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            }
          />
        </NavbarItem>
        <NavbarItem>
          <Switch
            isSelected={isDark}
            onValueChange={checked => setTheme(checked ? 'dark' : 'light')}
            size='md'
            color='primary'
            classNames={{
              wrapper: 'group-data-[selected=true]:bg-primary',
              thumb: 'group-data-[selected=true]:bg-white',
            }}
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
            <NavbarItem>
              <Link href='/dashboard'>
                <Button
                  variant='flat'
                  color='primary'
                  size='sm'
                  className='font-semibold shadow-sm hover:shadow-md transition-all duration-200 text-sm'
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
                    className='transition-all duration-200 hover:scale-105 hover:shadow-lg'
                    color='primary'
                    name={session.user?.name || session.user?.email || 'User'}
                    size='sm'
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label='Profile Actions'
                  variant='flat'
                  className='backdrop-blur-xl'
                >
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
            <NavbarItem>
              <Button
                variant='light'
                color='default'
                size='sm'
                className='font-medium hover:bg-primary/5 transition-all duration-200 text-sm'
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
                  className='font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm'
                >
                  Sign Up
                </Button>
              </Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarMenu>
        <div className='px-4 py-2'>
          <Input
            size='sm'
            placeholder='Search...'
            variant='bordered'
            classNames={{ inputWrapper: 'bg-content2' }}
          />
        </div>
        {menuItems.map(item => (
          <NavbarMenuItem key={item.name}>
            <Link className='w-full' href={item.href}>
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        {session ? (
          <>
            <NavbarMenuItem key='m-dashboard'>
              <Link className='w-full' href='/dashboard'>
                Dashboard
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem key='m-signout'>
              <button className='w-full text-left' onClick={() => signOut()}>
                Sign out
              </button>
            </NavbarMenuItem>
          </>
        ) : (
          <>
            <NavbarMenuItem key='m-login'>
              <Link className='w-full' href='/login'>
                Login
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem key='m-register'>
              <Link className='w-full' href='/register'>
                Sign Up
              </Link>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </Navbar>
  );
}
