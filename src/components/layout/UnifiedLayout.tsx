'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface UnifiedLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarWidth?: string; // Default: 'w-64' (256px)
  contentClassName?: string;
  header?: ReactNode; // Optional header component
  disableBottomPadding?: boolean;
}

/**
 * UnifiedLayout - A reusable layout component for left nav + right content structure
 * Used throughout the entire app for consistent layout
 *
 * Structure:
 * - Left: Fixed sidebar (256px on desktop, drawer on mobile)
 * - Right: Main content area (offset by sidebar width on desktop)
 * - Handles mobile/desktop responsive behavior
 * - Accounts for music player at bottom (80px padding)
 */
export default function UnifiedLayout({
  children,
  sidebar,
  sidebarWidth = 'w-64',
  contentClassName = '',
  header,
  disableBottomPadding = false,
}: UnifiedLayoutProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render until we know if it's mobile or not (prevents double render)
  if (isMobile === null) {
    return null;
  }

  return (
    <div className='h-screen bg-gray-50 dark:bg-slate-900 flex relative overflow-hidden'>
      {/* Sidebar Navigation - handles its own mobile/desktop rendering */}
      {sidebar}

      {/* Main Content Area - automatically takes remaining space */}
      <div className='flex-1 flex flex-col h-screen transition-all duration-200 overflow-hidden'>
        {/* Mobile Header Spacing (for mobile drawer header with player) */}
        {isMobile && <div className='h-14 flex-shrink-0' />}

        {/* Optional Header */}
        {header && (
          <div className='flex-shrink-0 z-20'>{header}</div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto ${contentClassName}`}
          style={{
            paddingLeft: 0,
            // Adjust bottom padding when the global music player overlaps content
            paddingBottom: disableBottomPadding
              ? '0px'
              : isMobile
                ? '0px'
                : '80px',
            ...(contentClassName.includes('fixed') || contentClassName.includes('h-full')
              ? { paddingBottom: 0 }
              : {}),
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
