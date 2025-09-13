'use client';

import StreamingHero from '@/components/streaming/StreamingHero';
import TopTenTracks from '@/components/streaming/TopTenTracks';
import ProvincialPlaylists from '@/components/streaming/ProvincialPlaylists';
import GenrePlaylists from '@/components/streaming/GenrePlaylists';
import { Track } from '@/types/track';

export default function HomePage() {
  const handleTrackPlay = (_track: Track) => {
    // TODO: Integrate with music player context
    // console.log('Track play clicked:', _track);
  };

  return (
    <main className='w-full min-h-screen bg-gray-50 dark:bg-slate-900 pb-24'>
      {/* Streaming Hero */}
      <StreamingHero onTrackPlay={handleTrackPlay} />

      {/* Top Ten Tracks */}
      <TopTenTracks onTrackPlay={handleTrackPlay} />

      {/* Provincial Playlists */}
      <ProvincialPlaylists onTrackPlay={handleTrackPlay} />

      {/* Genre Playlists */}
      <GenrePlaylists onTrackPlay={handleTrackPlay} />
    </main>
  );
}
