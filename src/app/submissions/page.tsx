'use client';

import HeroSection from '@/components/landing/HeroSection';
import SearchSection from '@/components/landing/SearchSection';
import PlaylistShowcase from '@/components/landing/PlaylistShowcase';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

export default function SubmissionsPage() {
  const { playTrack } = useMusicPlayer();

  const handlePlaylistClick = (_playlist: Playlist) => {
    // TODO: Navigate to playlist detail page
  };

  const handleTrackPlay = (track: Track) => {
    playTrack(track, 'landing');
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
