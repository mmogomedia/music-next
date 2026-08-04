import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * `page.tsx` is a Client Component and cannot export metadata, so the noindex
 * lives here.
 *
 * Deliberately noindex rather than a robots.txt `Disallow`: disallowing the
 * path would stop Google crawling it, which means it would never read the
 * noindex — and a blocked URL can still be indexed from inbound links. To keep
 * a page out of the index it must stay crawlable.
 */
export const metadata: Metadata = {
  title: 'Access denied | Flemoji',
  robots: { index: false, follow: false },
};

export default function UnauthorizedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
