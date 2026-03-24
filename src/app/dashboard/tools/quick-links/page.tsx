import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import QuickLinksPageClient from '@/components/dashboard/tools/QuickLinksPageClient';

export const metadata = { title: 'Quick Links — Flemoji' };

export default async function QuickLinksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await prisma.artistProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect('/profile/select');
  }

  const tracks = await prisma.track.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      genre: true,
      coverImageUrl: true,
      albumArtwork: true,
      artistProfileId: true,
      primaryArtistIds: true,
      featuredArtistIds: true,
    },
  });

  return (
    <QuickLinksPageClient
      // Pass serialisable data — no Date objects
      profile={{
        id: profile.id,
        artistName: profile.artistName,
        profileImage: profile.profileImage ?? undefined,
        slug: profile.slug ?? undefined,
        userId: profile.userId ?? '',
      }}
      tracks={tracks as Parameters<typeof QuickLinksPageClient>[0]['tracks']}
    />
  );
}
