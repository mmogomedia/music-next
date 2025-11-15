import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MusicService } from '@/lib/services/music-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const genre = (searchParams.get('genre') || '').trim();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Number(limitParam) || 20, 50) : 20;

    if (!query) {
      return NextResponse.json({ tracks: [] });
    }

    const tracks = await MusicService.searchTracks(query, {
      genre: genre || undefined,
      limit,
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
}
