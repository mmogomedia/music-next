'use client';

import { Suspense } from 'react';
import ChatLayout from '@/components/layout/ChatLayout';

export default function LeagueRoute() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  );
}
