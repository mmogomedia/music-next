import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPlaylistsPage from '@/components/dashboard/admin/AdminPlaylistsPage';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard/playlists')}`
    );
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <AdminPlaylistsPage />;
}
