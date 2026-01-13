import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminTimelinePostsPage from '@/components/dashboard/admin/AdminTimelinePostsPage';

export const dynamic = 'force-dynamic';

export default async function TimelinePostsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/timeline-posts')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminTimelinePostsPage />;
}
