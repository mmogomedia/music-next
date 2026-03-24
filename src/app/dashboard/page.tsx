import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has an artist profile (no redirect — fans get a fan dashboard)
  const profile = await prisma.artistProfile.findFirst({
    where: { userId: session.user?.id },
    select: { id: true },
  });

  return <DashboardContent hasArtistProfile={!!profile} />;
}
