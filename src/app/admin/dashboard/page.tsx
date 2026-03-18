import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

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

  // Redirect to overview page
  redirect('/admin/dashboard/overview');
}
