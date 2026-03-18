import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatLayout from '@/components/layout/ChatLayout';

export const metadata: Metadata = {
  title: 'League | Flemoji',
  // League is a client-side tab within the homepage SPA — no distinct crawlable content
  robots: { index: false, follow: false },
};

export default function LeagueRoute() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  );
}
