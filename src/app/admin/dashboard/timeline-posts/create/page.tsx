import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateTimelinePostPage from '@/components/dashboard/admin/CreateTimelinePostPage';

export const dynamic = 'force-dynamic';

export default async function CreateTimelinePostPageRoute() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/timeline-posts/create')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <CreateTimelinePostPage />;
}
