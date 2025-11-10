'use client';

import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Track } from '@/types/track';
import TrackCard from '@/components/ai/TrackCard';

interface ChatWelcomePlaceholderProps {
  province?: string;
}

export default function ChatWelcomePlaceholder({
  province,
}: ChatWelcomePlaceholderProps) {
  const [featured, setFeatured] = useState<Track[]>([]);
  const [topTen, setTopTen] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fRes, tRes] = await Promise.all([
          fetch('/api/playlists/featured').catch(() => null),
          fetch('/api/playlists/top-ten').catch(() => null),
        ]);

        if (fRes && fRes.ok) {
          const fJson = await fRes.json();
          const tracks = (fJson.tracks || []).slice(0, 3).map((t: any) => ({
            id: String(t.id),
            title: t.title || 'Untitled',
            artist: t.artist || 'Unknown Artist',
            coverImageUrl: t.coverImageUrl || t.albumArtwork,
            albumArtwork: t.albumArtwork,
            fileUrl: t.fileUrl,
            filePath: t.filePath || '',
            playCount: t.playCount || 0,
            likeCount: t.likeCount || 0,
            artistId: t.artistProfileId || t.userId || '',
            userId: t.userId || '',
            createdAt: t.createdAt || new Date(),
            updatedAt: t.updatedAt || new Date(),
            duration: t.duration,
            genre: t.genre,
            isDownloadable: t.isDownloadable ?? false,
          }));
          setFeatured(tracks);
        }

        if (tRes && tRes.ok) {
          const tJson = await tRes.json();
          const tracks = (tJson.tracks || []).slice(0, 10).map((t: any) => ({
            id: String(t.id),
            title: t.title || 'Untitled',
            artist: t.artist || 'Unknown Artist',
            coverImageUrl: t.coverImageUrl || t.albumArtwork,
            albumArtwork: t.albumArtwork,
            fileUrl: t.fileUrl,
            filePath: t.filePath || '',
            playCount: t.playCount || 0,
            likeCount: t.likeCount || 0,
            artistId: t.artistProfileId || t.userId || '',
            userId: t.userId || '',
            createdAt: t.createdAt || new Date(),
            updatedAt: t.updatedAt || new Date(),
            duration: t.duration,
            genre: t.genre,
            isDownloadable: t.isDownloadable ?? false,
          }));
          setTopTen(tracks);
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  const PlaceholderCard = ({
    isFeatured = false,
  }: {
    isFeatured?: boolean;
  }) => (
    <div
      className={`${isFeatured ? 'rounded-xl' : 'rounded-xl'} bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 ${isFeatured ? 'aspect-square' : 'h-20'} animate-pulse overflow-hidden`}
    >
      <div
        className={`${isFeatured ? 'w-full aspect-square bg-gray-200 dark:bg-slate-700' : 'w-14 h-14 m-3 rounded-lg bg-gray-200 dark:bg-slate-700'}`}
      />
      {isFeatured && (
        <div className='p-4 space-y-2'>
          <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4'></div>
          <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-8'>
      {/* Featured - horizontal grid layout */}
      <section className='mb-6'>
        <div className='bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-green-50/50 dark:from-blue-950/40 dark:via-purple-950/30 dark:to-green-950/40 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-sm'>
          {/* Section heading */}
          <div className='flex items-center justify-between mb-5'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-300/30 dark:border-blue-700/30 rounded-full shadow-sm'>
                <svg
                  className='w-4 h-4 text-blue-600 dark:text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider'>
                  Featured
                </span>
              </div>
            </div>
          </div>

          {/* Featured tracks grid - max 3 in one row */}
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <PlaceholderCard key={i} isFeatured />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {featured.map((track, idx) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={handlePlay}
                  variant='spotlight'
                  showDuration
                  badge={idx === 0 ? 'Hot' : undefined}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-10'>
              <svg
                className='w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                />
              </svg>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                No featured tracks available
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Top Ten - list style */}
      <section>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            Top 10 Tracks
          </h3>
          {province && (
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              in {province}
            </p>
          )}
        </div>
        {loading ? (
          <div className='space-y-2'>
            {Array.from({ length: 10 }).map((_, i) => (
              <PlaceholderCard key={i} />
            ))}
          </div>
        ) : topTen.length > 0 ? (
          <div className='space-y-2'>
            {topTen.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={handlePlay}
                size='md'
                showDuration={true}
              />
            ))}
          </div>
        ) : (
          <div className='text-sm text-gray-500 dark:text-gray-400 text-center py-8'>
            No top tracks available
          </div>
        )}
      </section>
    </div>
  );
}
