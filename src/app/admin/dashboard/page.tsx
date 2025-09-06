import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/dashboard')}`);
  }

  // Check if user has admin role
  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminDashboard />;
}
