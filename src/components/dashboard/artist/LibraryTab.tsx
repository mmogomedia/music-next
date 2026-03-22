'use client';

import { useState, useMemo } from 'react';
import {
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
} from '@heroui/react';
import {
  PlusIcon,
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import TrackArtwork from '@/components/music/TrackArtwork';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';
import FCard from '@/components/ui/FCard';
import type { Track } from '@/types/track';
import type { SourceType } from '@/types/stats';

type SortKey = 'newest' | 'oldest' | 'title' | 'plays' | 'likes';

interface LibraryTabProps {
  tracks: Track[];
  onUpload: () => void;
  onDelete: (_trackId: string) => void;
  onSubmitToPlaylist: (_track: Track) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCount(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function LibraryTab({
  tracks,
  onUpload,
  onDelete,
  onSubmitToPlaylist,
}: LibraryTabProps) {
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack } = useMusicPlayer();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  const totalPlays = tracks.reduce((s, t) => s + (t.playCount ?? 0), 0);
  const totalLikes = tracks.reduce((s, t) => s + (t.likeCount ?? 0), 0);
  const totalDownloads = tracks.reduce((s, t) => s + (t.downloadCount ?? 0), 0);

  const filtered = useMemo(() => {
    let list = tracks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.genre?.toLowerCase().includes(q) ||
          t.album?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'title':
          return a.title.localeCompare(b.title);
        case 'plays':
          return (b.playCount ?? 0) - (a.playCount ?? 0);
        case 'likes':
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        default: // newest
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [tracks, search, sort]);

  const sortLabels: Record<SortKey, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    title: 'Title A–Z',
    plays: 'Most played',
    likes: 'Most liked',
  };

  if (tracks.length === 0) {
    return (
      <FCard padding='none'>
        <div className='flex flex-col items-center justify-center py-20 px-6 text-center'>
          <div className='w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-5'>
            <MusicalNoteIcon className='w-10 h-10 text-primary-400' />
          </div>
          <h4 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
            Your library is empty
          </h4>
          <p className='text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-8'>
            Upload your first track to start building your music library and
            reach new listeners.
          </p>
          <Button
            color='primary'
            size='lg'
            startContent={<PlusIcon className='w-5 h-5' />}
            onPress={onUpload}
          >
            Upload Your First Track
          </Button>
        </div>
      </FCard>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Stats row */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {[
          {
            label: 'Tracks',
            value: tracks.length,
            icon: MusicalNoteIcon,
            color: 'text-primary-500',
            bg: 'bg-primary-50 dark:bg-primary-900/20',
          },
          {
            label: 'Total Plays',
            value: formatCount(totalPlays),
            icon: PlayIcon,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: 'Total Likes',
            value: formatCount(totalLikes),
            icon: HeartIcon,
            color: 'text-rose-500',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
          },
          {
            label: 'Downloads',
            value: formatCount(totalDownloads),
            icon: ArrowDownTrayIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className='bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3'
          >
            <div
              className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div className='min-w-0'>
              <p className='text-lg font-bold text-gray-900 dark:text-white leading-tight'>
                {value}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tracks card */}
      <FCard
        padding='none'
        title='My Tracks'
        action={
          <Button
            color='primary'
            size='sm'
            startContent={<PlusIcon className='w-4 h-4' />}
            onPress={onUpload}
          >
            Upload
          </Button>
        }
      >
        {/* Controls */}
        <div className='px-5 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700'>
          <Input
            placeholder='Search tracks…'
            size='sm'
            variant='bordered'
            value={search}
            onValueChange={setSearch}
            startContent={
              <MagnifyingGlassIcon className='w-4 h-4 text-gray-400 flex-shrink-0' />
            }
            classNames={{
              base: 'flex-1 max-w-xs',
              inputWrapper: 'border-gray-200 dark:border-slate-600',
            }}
          />
          <Dropdown>
            <DropdownTrigger>
              <Button
                size='sm'
                variant='bordered'
                endContent={<ChevronUpDownIcon className='w-3.5 h-3.5' />}
                className='border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 flex-shrink-0'
              >
                {sortLabels[sort]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[sort]}
              selectionMode='single'
              onSelectionChange={keys => setSort([...keys][0] as SortKey)}
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownItem key={key}>{label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          {search && (
            <span className='text-xs text-gray-400 flex-shrink-0'>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Column headers */}
        <div className='px-5 py-2 grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_8rem_7rem_auto] gap-4 items-center border-b border-gray-50 dark:border-slate-700/50'>
          <span className='text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center'>
            #
          </span>
          <span className='text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
            Title
          </span>
          <span className='hidden sm:block text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right'>
            Plays
          </span>
          <span className='hidden sm:flex items-center justify-end gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider'>
            <ClockIcon className='w-3 h-3' />
          </span>
          <span />
        </div>

        {/* Track rows */}
        {filtered.length === 0 ? (
          <div className='px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500'>
            No tracks match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className='divide-y divide-gray-50 dark:divide-slate-700/50'>
            {filtered.map((track, idx) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`group px-5 py-3 grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_8rem_7rem_auto] gap-4 items-center transition-colors ${
                    isActive
                      ? 'bg-primary-50/60 dark:bg-primary-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  {/* Index / play button */}
                  <div className='flex items-center justify-center w-8 h-8 flex-shrink-0'>
                    <span
                      className={`text-sm font-medium group-hover:hidden ${
                        isActive
                          ? 'text-primary-500 hidden'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        playTrack(track, 'dashboard' as SourceType)
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hidden group-hover:flex ${
                        isActive ? '!flex' : ''
                      } ${
                        isActive
                          ? 'text-primary-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                      aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isActive && isPlaying ? (
                        <PauseIcon className='w-4 h-4' />
                      ) : (
                        <PlayIcon className='w-4 h-4' />
                      )}
                    </button>
                  </div>

                  {/* Artwork + info */}
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='flex-shrink-0'>
                      <TrackArtwork
                        artworkUrl={track.albumArtwork || track.coverImageUrl}
                        title={track.title}
                        size='md'
                      />
                    </div>
                    <div className='min-w-0'>
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                        <span className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                          <ArtistDisplay track={track} />
                        </span>
                        {track.genre && (
                          <>
                            <span className='text-gray-300 dark:text-gray-600'>
                              ·
                            </span>
                            <Chip
                              size='sm'
                              variant='flat'
                              className='h-4 text-[10px] px-1.5'
                            >
                              {track.genre}
                            </Chip>
                          </>
                        )}
                        {track.isExplicit && (
                          <Chip
                            size='sm'
                            variant='flat'
                            color='danger'
                            className='h-4 text-[10px] px-1.5'
                          >
                            E
                          </Chip>
                        )}
                        {track.completionPercentage !== undefined && (
                          <CompletionBadge
                            percentage={track.completionPercentage}
                            size='sm'
                            className='flex-shrink-0'
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plays */}
                  <div className='hidden sm:flex items-center justify-end gap-1 text-sm text-gray-500 dark:text-gray-400'>
                    <PlayIcon className='w-3 h-3 flex-shrink-0' />
                    <span>{formatCount(track.playCount)}</span>
                  </div>

                  {/* Duration */}
                  <div className='hidden sm:block text-sm text-gray-500 dark:text-gray-400 text-right tabular-nums'>
                    {formatDuration(track.duration)}
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Dropdown placement='bottom-end'>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity'
                          aria-label='Track options'
                        >
                          <EllipsisVerticalIcon className='w-4 h-4' />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='Track actions'>
                        <DropdownItem
                          key='submit'
                          startContent={<MusicalNoteIcon className='w-4 h-4' />}
                          onPress={() => onSubmitToPlaylist(track)}
                        >
                          Submit to Playlists
                        </DropdownItem>
                        <DropdownItem
                          key='edit'
                          startContent={<PencilIcon className='w-4 h-4' />}
                          onPress={() =>
                            router.push(`/dashboard/tracks/${track.id}/edit`)
                          }
                        >
                          Edit Track
                        </DropdownItem>
                        <DropdownItem
                          key='delete'
                          className='text-danger'
                          color='danger'
                          startContent={<TrashIcon className='w-4 h-4' />}
                          onPress={() => onDelete(track.id)}
                        >
                          Delete Track
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FCard>
    </div>
  );
}
