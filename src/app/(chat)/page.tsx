'use client';

import { Suspense } from 'react';
import ChatLayout from '@/components/layout/ChatLayout';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  );
}
