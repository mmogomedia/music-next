import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSubmissionsPage from '@/components/dashboard/admin/AdminSubmissionsPage';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/submissions')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminSubmissionsPage />;
}
