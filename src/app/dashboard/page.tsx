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

  // Check if user has an artist profile
  const profile = await prisma.artistProfile.findFirst({
    where: { userId: session.user?.id },
  });

  // If no profile exists, redirect to profile selection BEFORE rendering
  if (!profile) {
    redirect('/profile/select');
  }

  // User has a profile, render the dashboard
  return <DashboardContent />;
}
