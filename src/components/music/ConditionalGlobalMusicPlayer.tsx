'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalMusicPlayer from './GlobalMusicPlayer';

export default function ConditionalGlobalMusicPlayer() {
  const pathname = usePathname();

  // Hide global player on chat routes
  const isChatRoute = pathname === '/' || pathname?.startsWith('/chat');

  if (isChatRoute) {
    return null;
  }

  return <GlobalMusicPlayer />;
}
