import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PulseAdminPage from '@/components/dashboard/admin/PulseAdminPage';

export default async function AdminPulsePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <PulseAdminPage />;
}
