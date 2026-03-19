import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PulseDashboard from '@/components/pulse/PulsePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pulse³ — Artist Analytics | Flemoji',
  description:
    'Track your music performance, streams, and audience growth with Pulse³.',
  // Auth-protected — do not index
  robots: { index: false, follow: false },
};

export default async function PulsePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/pulse')}`);
  }

  return <PulseDashboard />;
}
