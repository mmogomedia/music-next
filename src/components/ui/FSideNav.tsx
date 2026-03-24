'use client';

import React, {
  useState,
  useEffect,
  ReactNode,
  ComponentType,
  SVGProps,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

// ── Public types ──────────────────────────────────────────────────────────────

export interface FSideNavItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Falls back to `icon` when not provided */
  activeIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * string → gray label pill  (e.g. "Soon")
   * number → red count badge  (hidden when 0)
   */
  badge?: string | number;
  /** href-mode only: custom active check (e.g. prefix matching) */
  matchFn?: (_pathname: string) => boolean;
  disabled?: boolean;
}

export interface FSideNavGroup {
  /** Empty string = no heading rendered */
  label: string;
  items: FSideNavItem[];
}

export interface FSideNavProps {
  groups: FSideNavGroup[];
  /**
   * 'tab'  → active when `item.id === activeTab`
   * 'href' → active when pathname matches `item.href` / `item.matchFn`
   * @default 'href'
   */
  mode?: 'tab' | 'href';
  /** Required when mode='tab' */
  activeTab?: string;
  /** Show a collapse/expand toggle on desktop */
  collapsible?: boolean;
  /** localStorage key for persisting collapsed state */
  storageKey?: string;
  /** Rendered at the bottom of the sidebar (e.g. UserDetailsFooter) */
  footer?: ReactNode;
  /** Accessible label for the nav landmark */
  'aria-label'?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function checkActive(
  item: FSideNavItem,
  mode: 'tab' | 'href',
  activeTab: string | undefined,
  pathname: string
): boolean {
  if (mode === 'tab') return item.id === activeTab;
  if (item.matchFn) return item.matchFn(pathname);
  return pathname === item.href;
}

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  item,
  isActive,
  isPending,
  isCollapsed,
  scrollFalse,
  onClick,
}: {
  item: FSideNavItem;
  isActive: boolean;
  isPending: boolean;
  isCollapsed: boolean;
  scrollFalse: boolean;
  onClick?: (_href: string) => void;
}) {
  const highlighted = isActive || isPending;
  const Icon = highlighted ? (item.activeIcon ?? item.icon) : item.icon;

  return (
    <Link
      href={item.disabled ? '#' : item.href}
      scroll={scrollFalse ? false : undefined}
      onClick={
        item.disabled ? e => e.preventDefault() : () => onClick?.(item.href)
      }
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isCollapsed ? 'justify-center px-2' : 'px-3'
      } ${
        item.disabled
          ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
          : highlighted
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {isPending && !isActive ? (
        <span className='w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center'>
          <span className='w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin' />
        </span>
      ) : (
        <Icon className='w-[18px] h-[18px] flex-shrink-0' />
      )}
      {!isCollapsed && (
        <>
          <span className='flex-1'>{item.label}</span>
          {/* String badge */}
          {typeof item.badge === 'string' && (
            <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'>
              {item.badge}
            </span>
          )}
          {/* Number badge */}
          {typeof item.badge === 'number' && item.badge > 0 && (
            <span className='min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1'>
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

// ── NavGroup ──────────────────────────────────────────────────────────────────

function NavGroup({
  group,
  mode,
  activeTab,
  pathname,
  pendingHref,
  isCollapsed,
  scrollFalse,
  onItemClick,
}: {
  group: FSideNavGroup;
  mode: 'tab' | 'href';
  activeTab: string | undefined;
  pathname: string;
  pendingHref: string | null;
  isCollapsed: boolean;
  scrollFalse: boolean;
  onItemClick?: (_href: string) => void;
}) {
  return (
    <div>
      {group.label && !isCollapsed && (
        <p className='px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500'>
          {group.label}
        </p>
      )}
      {/* Collapsed: small spacer between groups instead of label */}
      {isCollapsed && <div className='h-3' />}
      <nav className='space-y-0.5'>
        {group.items.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={checkActive(item, mode, activeTab, pathname)}
            isPending={
              pendingHref === item.href &&
              !checkActive(item, mode, activeTab, pathname)
            }
            isCollapsed={isCollapsed}
            scrollFalse={scrollFalse}
            onClick={onItemClick}
          />
        ))}
      </nav>
    </div>
  );
}

// ── SidebarBody ───────────────────────────────────────────────────────────────

function SidebarBody({
  groups,
  mode,
  activeTab,
  pathname,
  pendingHref,
  isCollapsed,
  scrollFalse,
  footer,
  ariaLabel,
  onItemClick,
}: {
  groups: FSideNavGroup[];
  mode: 'tab' | 'href';
  activeTab: string | undefined;
  pathname: string;
  pendingHref: string | null;
  isCollapsed: boolean;
  scrollFalse: boolean;
  footer?: ReactNode;
  ariaLabel?: string;
  onItemClick?: (_href: string) => void;
}) {
  return (
    <>
      {/* Nav groups */}
      <div
        role='navigation'
        aria-label={ariaLabel}
        className='flex-1 px-3 py-4 overflow-y-auto min-h-0 space-y-5'
      >
        {groups.map((group, i) => (
          <NavGroup
            key={group.label || String(i)}
            group={group}
            mode={mode}
            activeTab={activeTab}
            pathname={pathname}
            pendingHref={pendingHref}
            isCollapsed={isCollapsed}
            scrollFalse={scrollFalse}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {/* Footer slot */}
      {footer && (
        <div className='flex-shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-slate-800'>
          {footer}
        </div>
      )}
    </>
  );
}

// ── FSideNav (main export) ────────────────────────────────────────────────────

export default function FSideNav({
  groups,
  mode = 'href',
  activeTab,
  collapsible = false,
  storageKey,
  footer,
  'aria-label': ariaLabel,
}: FSideNavProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Determine mobile/desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Restore collapsed state from localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setIsCollapsed(stored === 'true');
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  // Clear pending state once the navigation resolves
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const closeDrawer = () => setIsOpen(false);

  const handleNavClick = (href: string) => {
    setPendingHref(href);
    closeDrawer();
  };

  // Prevent hydration mismatch
  if (isMobile === null) return null;

  const scrollFalse = mode === 'tab';

  // ── Desktop ──────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <aside
        className={`relative flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-30 transition-all duration-200 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo + optional collapse toggle */}
        <div
          className={`border-b border-gray-100 dark:border-slate-800 flex-shrink-0 h-16 flex items-center ${
            isCollapsed
              ? 'flex-col justify-center gap-1 px-2 py-2'
              : 'justify-between px-5'
          }`}
        >
          <Link href='/'>
            {isCollapsed ? (
              <Image
                src='/logo_symbol.png'
                alt='Flemoji'
                width={32}
                height={32}
                className='w-8 h-8 rounded-lg'
              />
            ) : (
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={120}
                height={32}
                className='h-8 w-auto'
              />
            )}
          </Link>
          {collapsible && (
            <button
              onClick={toggleCollapsed}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className='p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0'
            >
              {isCollapsed ? (
                <ChevronDoubleRightIcon className='w-4 h-4' />
              ) : (
                <ChevronDoubleLeftIcon className='w-4 h-4' />
              )}
            </button>
          )}
        </div>

        <SidebarBody
          groups={groups}
          mode={mode}
          activeTab={activeTab}
          pathname={pathname}
          pendingHref={pendingHref}
          isCollapsed={isCollapsed}
          scrollFalse={scrollFalse}
          footer={footer}
          ariaLabel={ariaLabel}
          onItemClick={handleNavClick}
        />
      </aside>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Fixed mobile header bar */}
      <header className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800'>
        <div className='flex items-center justify-between px-4 py-3'>
          <Link href='/'>
            <Image
              src='/logo_symbol.png'
              alt='Flemoji'
              width={32}
              height={32}
              className='h-8 w-auto'
            />
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            aria-label='Open navigation menu'
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors'
          >
            <Bars3Icon className='w-5 h-5' />
          </button>
        </div>
      </header>

      {/* Backdrop — always in DOM, animated */}
      <div
        className={`fixed inset-0 bg-black/40 z-[54] lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden='true'
      />

      {/* Drawer panel — always in DOM, CSS slide */}
      <div
        role='dialog'
        aria-modal='true'
        aria-label={ariaLabel ?? 'Navigation menu'}
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[55] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className='flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-slate-800 flex-shrink-0'>
          <Link href='/' onClick={closeDrawer}>
            <Image
              src='/logo_symbol.png'
              alt='Flemoji'
              width={32}
              height={32}
              className='h-8 w-auto'
            />
          </Link>
          <button
            onClick={closeDrawer}
            aria-label='Close navigation menu'
            className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors'
          >
            <XMarkIcon className='w-4 h-4' />
          </button>
        </div>

        <SidebarBody
          groups={groups}
          mode={mode}
          activeTab={activeTab}
          pathname={pathname}
          pendingHref={pendingHref}
          isCollapsed={false}
          scrollFalse={scrollFalse}
          footer={footer}
          ariaLabel={ariaLabel}
          onItemClick={handleNavClick}
        />
      </div>
    </>
  );
}
