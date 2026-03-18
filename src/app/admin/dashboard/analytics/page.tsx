import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminAnalyticsPage from '@/components/dashboard/admin/AdminAnalyticsPage';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/analytics')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminAnalyticsPage />;
}
