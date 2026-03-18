import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminContentPage from '@/components/dashboard/admin/AdminContentPage';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/content')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminContentPage />;
}
