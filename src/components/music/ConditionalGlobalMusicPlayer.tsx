'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalMusicPlayer from './GlobalMusicPlayer';

export default function ConditionalGlobalMusicPlayer() {
  const pathname = usePathname();

  // Hide global player on chat and quick link routes
  const isChatRoute = pathname === '/' || pathname?.startsWith('/chat');
  const isQuickLinkRoute = pathname?.startsWith('/quick');

  if (isChatRoute || isQuickLinkRoute) {
    return null;
  }

  return <GlobalMusicPlayer />;
}
