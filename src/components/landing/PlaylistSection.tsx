'use client';

import { useState } from 'react';
import FeaturedPlaylistCarousel from './FeaturedPlaylistCarousel';
import PlaylistGrid from './PlaylistGrid';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

interface PlaylistSectionProps {
  onPlaylistClick?: (_playlist: Playlist) => void;
  onTrackPlay?: (_track: Track) => void;
}

export default function PlaylistSection({
  onPlaylistClick,
  onTrackPlay,
}: PlaylistSectionProps) {
  const [activeTab, setActiveTab] = useState<
    'featured' | 'top-ten' | 'province' | 'genre'
  >('featured');

  const tabs = [
    { id: 'featured', name: 'Featured', icon: '🏆' },
    { id: 'top-ten', name: 'Top Ten', icon: '📊' },
    { id: 'province', name: 'Provinces', icon: '🏙️' },
    { id: 'genre', name: 'Genres', icon: '🎵' },
  ];

  const handlePlaylistClick = (playlist: Playlist) => {
    onPlaylistClick?.(playlist);
  };

  const handleTrackPlay = (track: Track) => {
    onTrackPlay?.(track);
  };

  return (
    <div className='space-y-12'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
          Discover Music
        </h2>
        <p className='text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
          Explore curated playlists featuring the best music from South Africa
          and beyond
        </p>
      </div>

      {/* Featured Playlist */}
      <div>
        <FeaturedPlaylistCarousel
          onTrackPlay={handleTrackPlay}
          onPlaylistClick={handlePlaylistClick}
        />
      </div>

      {/* Tab Navigation */}
      <div className='flex justify-center'>
        <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-1'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className='text-lg'>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'featured' && (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🏆</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
              Featured Playlist Above
            </h3>
            <p className='text-gray-600 dark:text-gray-400'>
              The featured playlist is displayed in the carousel above
            </p>
          </div>
        )}

        {activeTab === 'top-ten' && (
          <PlaylistGrid
            type='top-ten'
            title='Top 10 This Week'
            description='The most played tracks this week'
            onPlaylistClick={handlePlaylistClick}
            onTrackPlay={handleTrackPlay}
          />
        )}

        {activeTab === 'province' && (
          <PlaylistGrid
            type='province'
            title='Provincial Playlists'
            description='Music from different provinces across South Africa'
            onPlaylistClick={handlePlaylistClick}
            onTrackPlay={handleTrackPlay}
          />
        )}

        {activeTab === 'genre' && (
          <PlaylistGrid
            type='genre'
            title='Genre Playlists'
            description='Curated collections by music genre'
            onPlaylistClick={handlePlaylistClick}
            onTrackPlay={handleTrackPlay}
          />
        )}
      </div>

      {/* Call to Action */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center'>
        <h3 className='text-2xl font-bold mb-4'>Want to Submit Your Music?</h3>
        <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
          Join our community of artists and submit your tracks to be featured in
          our curated playlists
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <button className='px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200'>
            Sign Up as Artist
          </button>
          <button className='px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors duration-200'>
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
