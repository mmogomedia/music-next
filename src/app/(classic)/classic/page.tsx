'use client';

import StreamingHero from '@/components/streaming/StreamingHero';
import TopTenTracks from '@/components/streaming/TopTenTracks';
import ProvincialPlaylists from '@/components/streaming/ProvincialPlaylists';
import GenrePlaylists from '@/components/streaming/GenrePlaylists';

export default function ClassicLandingPage() {
  return (
    <main className='w-full min-h-screen bg-gray-50 dark:bg-slate-900 pb-24'>
      {/* Streaming Hero */}
      <StreamingHero />

      {/* Top Ten Tracks */}
      <TopTenTracks />

      {/* Provincial Playlists */}
      <ProvincialPlaylists />

      {/* Genre Playlists */}
      <GenrePlaylists />
    </main>
  );
}


