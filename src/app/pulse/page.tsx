import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PulseDashboard from '@/components/pulse/PulsePage';

export const dynamic = 'force-dynamic';

export default async function PulsePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/pulse')}`);
  }

  return <PulseDashboard />;
}
