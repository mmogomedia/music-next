"use client"

import Link from 'next/link'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Switch,
} from '@heroui/react'
import { useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { MusicalNoteIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useNextTheme()
  const isDark = resolvedTheme === 'dark'

  const menuItems = [
    { name: 'Browse', href: '/browse' },
    { name: 'Artists', href: '/artists' },
    { name: 'Search', href: '/search' },
  ]

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="bg-background/80 backdrop-blur-md border-b border-divider" maxWidth="full" position="sticky">
      <NavbarContent>
        <NavbarMenuToggle aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} className="sm:hidden" />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <MusicalNoteIcon className="w-7 h-7 text-primary" />
            <p className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Flemoji</p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.name}>
            <Link href={item.href} className="text-foreground hover:text-primary transition-colors">
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Switch
            isSelected={isDark}
            onValueChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            size="sm"
            color="primary"
            thumbIcon={({ isSelected, className }) => (isSelected ? <MoonIcon className={className} /> : <SunIcon className={className} />)}
          />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">
          <Link href="/login">
            <Button variant="light" color="default">
              Login
            </Button>
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/register">
            <Button color="primary" variant="solid">
              Sign Up
            </Button>
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.name}>
            <Link className="w-full" href={item.href}>
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}
