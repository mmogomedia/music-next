'use client';

import HeroSection from '@/components/landing/HeroSection';
import SearchSection from '@/components/landing/SearchSection';
import PlaylistShowcase from '@/components/landing/PlaylistShowcase';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

export default function SubmissionsPage() {
  const handlePlaylistClick = (_playlist: Playlist) => {
    // TODO: Navigate to playlist detail page
    // console.log('Playlist clicked:', _playlist);
  };

  const handleTrackPlay = (_track: Track) => {
    // TODO: Integrate with music player context
    // console.log('Track play clicked:', _track);
  };

  return (
    <main className='w-full min-h-screen bg-slate-900'>
      {/* Hero Section */}
      <HeroSection
        onPlaylistClick={handlePlaylistClick}
        onTrackPlay={handleTrackPlay}
      />

      {/* Search Section */}
      <SearchSection />

      {/* Playlist Showcase */}
      <PlaylistShowcase
        onPlaylistClick={handlePlaylistClick}
        onTrackPlay={handleTrackPlay}
      />
    </main>
  );
}
