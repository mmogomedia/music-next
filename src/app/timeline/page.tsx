import type { Metadata } from 'next';
import TimelinePage from '@/components/timeline/TimelinePage';

export const metadata: Metadata = {
  title: 'Timeline | Flemoji',
  // Timeline is a client-side tab within the homepage SPA — no distinct crawlable content
  robots: { index: false, follow: false },
};

export default function TimelineRoute() {
  return <TimelinePage />;
}
