import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PulseConnectPage from '@/components/dashboard/pulse/PulseConnectPage';

export const dynamic = 'force-dynamic';

export default async function PulseConnectRoute() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/pulse/connect')}`);
  }

  return <PulseConnectPage />;
}
