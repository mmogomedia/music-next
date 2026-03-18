import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLeaguePage from '@/components/dashboard/admin/AdminLeaguePage';

export const dynamic = 'force-dynamic';

export default async function LeagueAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <AdminLeaguePage />;
}
