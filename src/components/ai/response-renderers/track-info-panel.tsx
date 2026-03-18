'use client';

import { useState } from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { Track } from '@/types/track';
import type { ArtistProfile } from '@/types/artist-profile';

type Tab = 'dna' | 'about' | 'lyrics' | 'artist';

interface TrackInfoPanelProps {
  track: Track;
}

function formatDuration(seconds?: number): string {
  if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function hasDnaData(track: Track): boolean {
  return !!(
    track.genre ||
    track.bpm ||
    track.language ||
    track.duration ||
    track.year ||
    track.isExplicit ||
    (track.mood && track.mood.length > 0) ||
    (track.attributes && track.attributes.length > 0)
  );
}

function hasArtistTabData(
  artistProfile?: ArtistProfile | null | Record<string, unknown>
): boolean {
  if (!artistProfile) return false;
  const profile = artistProfile as any;
  return !!(
    profile.bio ||
    (profile.socialLinks &&
      typeof profile.socialLinks === 'object' &&
      Object.values(profile.socialLinks as Record<string, any>).some(
        v => v?.url
      )) ||
    (profile.streamingLinks &&
      typeof profile.streamingLinks === 'object' &&
      Object.values(profile.streamingLinks as Record<string, any>).some(
        v => v?.url
      ))
  );
}

export function hasInfoData(track: Track): boolean {
  const artistProfile =
    track.artistProfile ?? track.primaryArtists?.[0] ?? null;
  return (
    hasDnaData(track) ||
    !!track.description ||
    !!track.lyrics ||
    hasArtistTabData(artistProfile)
  );
}

export function TrackInfoPanel({ track }: TrackInfoPanelProps) {
  const artistProfile =
    track.artistProfile ?? track.primaryArtists?.[0] ?? null;

  const tabs: { id: Tab; label: string }[] = [];
  if (hasDnaData(track)) tabs.push({ id: 'dna', label: 'DNA' });
  if (track.description) tabs.push({ id: 'about', label: 'About' });
  if (track.lyrics) tabs.push({ id: 'lyrics', label: 'Lyrics' });
  if (hasArtistTabData(artistProfile))
    tabs.push({ id: 'artist', label: 'Artist' });

  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id ?? 'dna');

  if (tabs.length === 0) return null;

  const currentTab = tabs.find(t => t.id === activeTab)
    ? activeTab
    : tabs[0].id;

  return (
    <div className='px-1 pt-1 pb-2'>
      {/* Tab switcher — plain text, no underline bar */}
      <div className='flex gap-3 mb-3'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            className={`text-[11px] transition-colors ${
              currentTab === tab.id
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-gray-300 dark:text-slate-600 hover:text-gray-400 dark:hover:text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentTab === 'dna' && <DnaTab track={track} />}
      {currentTab === 'about' && <AboutTab track={track} />}
      {currentTab === 'lyrics' && <LyricsTab track={track} />}
      {currentTab === 'artist' && artistProfile && (
        <ArtistTab profile={artistProfile} />
      )}
    </div>
  );
}

// Shared pill style — neutral, no colour coding
const pill =
  'px-2 py-0.5 rounded text-[11px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800';

function DnaTab({ track }: { track: Track }) {
  const durationStr = formatDuration(track.duration);

  return (
    <div className='space-y-2.5'>
      <div className='flex flex-wrap gap-1.5'>
        {track.genre && <span className={pill}>{track.genre}</span>}
        {track.language && <span className={pill}>{track.language}</span>}
        {track.year && <span className={pill}>{track.year}</span>}
        {durationStr && <span className={pill}>{durationStr}</span>}
        {track.bpm && <span className={pill}>{track.bpm} bpm</span>}
        {track.isExplicit && <span className={pill}>explicit</span>}
      </div>

      {track.mood && track.mood.length > 0 && (
        <div className='flex items-start gap-2'>
          <span className='text-[10px] text-gray-300 dark:text-slate-600 mt-0.5 shrink-0 w-12'>
            mood
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {track.mood.map(m => (
              <span key={m} className={pill}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {track.attributes && track.attributes.length > 0 && (
        <div className='flex items-start gap-2'>
          <span className='text-[10px] text-gray-300 dark:text-slate-600 mt-0.5 shrink-0 w-12'>
            themes
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {track.attributes.map(a => (
              <span key={a} className={pill}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AboutTab({ track }: { track: Track }) {
  const meta: { label: string; value: string }[] = [];
  if (track.album) meta.push({ label: 'album', value: track.album });
  if (track.composer) meta.push({ label: 'composer', value: track.composer });
  if (track.isrc) meta.push({ label: 'isrc', value: track.isrc });
  if (track.copyrightInfo)
    meta.push({ label: 'copyright', value: track.copyrightInfo });

  return (
    <div className='space-y-3'>
      {track.description && (
        <p className='text-[12px] text-gray-500 dark:text-slate-400 leading-relaxed'>
          {track.description}
        </p>
      )}
      {meta.length > 0 && (
        <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
          {meta.map(({ label, value }) => (
            <div key={label}>
              <div className='text-[10px] text-gray-300 dark:text-slate-600'>
                {label}
              </div>
              <div className='text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5'>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LyricsTab({ track }: { track: Track }) {
  return (
    <div className='space-y-2'>
      {track.language && (
        <div className='text-[10px] text-gray-300 dark:text-slate-600'>
          {track.language}
        </div>
      )}
      <pre className='text-[12px] text-gray-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto pr-1'>
        {track.lyrics}
      </pre>
    </div>
  );
}

function ArtistTab({
  profile,
}: {
  profile: ArtistProfile | Record<string, any>;
}) {
  const p = profile as any;
  const socialEntries: [string, { url: string }][] =
    p.socialLinks && typeof p.socialLinks === 'object'
      ? (Object.entries(p.socialLinks) as [string, any][]).filter(
          ([, v]) => v?.url
        )
      : [];

  const streamingEntries: [string, { url: string }][] =
    p.streamingLinks && typeof p.streamingLinks === 'object'
      ? (Object.entries(p.streamingLinks) as [string, any][]).filter(
          ([, v]) => v?.url
        )
      : [];

  const formatPlatformName = (key: string): string => {
    const names: Record<string, string> = {
      appleMusic: 'Apple Music',
      youtubeMusic: 'YouTube Music',
      amazonMusic: 'Amazon Music',
    };
    return names[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className='space-y-2.5'>
      <div className='flex items-center gap-1.5 flex-wrap'>
        <span className='text-[12px] text-gray-600 dark:text-gray-300 font-medium'>
          {p.artistName}
        </span>
        {p.isVerified && (
          <CheckBadgeIcon className='w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0' />
        )}
        {p.location && (
          <span className='text-[11px] text-gray-400 dark:text-slate-500'>
            · {p.location}
          </span>
        )}
      </div>

      {p.bio && (
        <p className='text-[12px] text-gray-500 dark:text-slate-400 leading-relaxed'>
          {p.bio}
        </p>
      )}

      {(socialEntries.length > 0 || streamingEntries.length > 0) && (
        <div className='flex flex-wrap gap-x-3 gap-y-1'>
          {socialEntries.map(([platform, data]) => (
            <a
              key={platform}
              href={data!.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors capitalize'
            >
              {platform}
            </a>
          ))}
          {streamingEntries.map(([platform, data]) => (
            <a
              key={platform}
              href={data!.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors'
            >
              {formatPlatformName(platform)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
