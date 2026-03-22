'use client';

import { useState, useEffect } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MusicalNoteIcon,
  QueueListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  Playlist,
  PlaylistSubmission,
  TrackSubmissionStatus,
} from '@/types/playlist';
import { Track } from '@/types/track';
import { api } from '@/lib/api-client';
import { FCard, FButton, FChip, FEmptyState, FImage } from '@/components/ui';

interface PlaylistSubmissionsTabProps {
  onQuickSubmit?: (_track: Track | null, _playlist?: Playlist) => void;
}

export default function PlaylistSubmissionsTab({
  onQuickSubmit,
}: PlaylistSubmissionsTabProps) {
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [mySubmissions, setMySubmissions] = useState<PlaylistSubmission[]>([]);
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-submissions'>(
    'available'
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available playlists (ACTIVE + OPEN for submissions)
      const playlistsResponse = await api.playlists.getAvailable();
      setAvailablePlaylists(playlistsResponse.data.playlists || []);

      // Fetch user's submissions
      const submissionsResponse = await api.playlists.getSubmissions();
      setMySubmissions(submissionsResponse.data.submissions || []);

      // Fetch user's tracks
      const tracksResponse = await api.tracks.getAll();
      setMyTracks(tracksResponse.data.tracks || []);
    } catch {
      // error stored implicitly via empty state
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TrackSubmissionStatus) => {
    switch (status) {
      case 'APPROVED':
        return CheckCircleIcon;
      case 'REJECTED':
        return XCircleIcon;
      case 'SHORTLISTED':
        return EyeIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (
    status: TrackSubmissionStatus
  ): 'success' | 'danger' | 'warning' | 'default' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'SHORTLISTED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSubmissionCount = (playlistId: string) => {
    return mySubmissions.filter(s => s.playlistId === playlistId).length;
  };

  const getPendingSubmissions = (playlistId: string) => {
    return mySubmissions.filter(
      s => s.playlistId === playlistId && s.status === 'PENDING'
    ).length;
  };

  const getSubmissionStatus = (playlist: Playlist) => {
    const pendingCount = getPendingSubmissions(playlist.id);
    const totalCount = getSubmissionCount(playlist.id);

    if (pendingCount >= playlist.maxSubmissionsPerArtist) {
      return 'max-reached';
    }
    if (totalCount > 0) {
      return 'has-submissions';
    }
    return 'can-submit';
  };

  if (loading) {
    return (
      <FCard padding='lg'>
        <div className='flex items-center justify-center py-12 gap-3 text-gray-400 dark:text-gray-500'>
          <div className='w-5 h-5 border-2 border-gray-300 dark:border-slate-600 border-t-primary-500 rounded-full animate-spin' />
          <span className='text-sm'>Loading submissions…</span>
        </div>
      </FCard>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>
            Playlist Submissions
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
            Submit your tracks to curated playlists
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-100 dark:border-slate-700 flex gap-0'>
        {[
          {
            key: 'available',
            label: 'Available Playlists',
            icon: <QueueListIcon className='w-4 h-4' />,
          },
          {
            key: 'my-submissions',
            label: `My Submissions (${mySubmissions.length})`,
            icon: <ClockIcon className='w-4 h-4' />,
          },
        ].map(tab => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Available Playlists Tab */}
      {activeTab === 'available' && (
        <div className='space-y-3'>
          {availablePlaylists.length === 0 ? (
            <FCard padding='lg'>
              <FEmptyState
                icon={QueueListIcon}
                title='No playlists available'
                description='There are currently no playlists accepting submissions. Check back soon.'
              />
            </FCard>
          ) : (
            availablePlaylists.map(playlist => {
              const status = getSubmissionStatus(playlist);
              const pendingCount = getPendingSubmissions(playlist.id);

              return (
                <FCard
                  key={playlist.id}
                  padding='none'
                  className='overflow-hidden'
                >
                  <div className='p-4 flex items-center gap-4'>
                    <FImage
                      src={playlist.coverImage}
                      alt={playlist.name}
                      className='w-16 h-16 flex-shrink-0'
                      rounded='lg'
                      fallback='music'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='font-semibold text-gray-800 dark:text-gray-100 truncate'>
                            {playlist.name}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1'>
                            {playlist.description}
                          </p>
                        </div>
                        <div className='flex items-center gap-1.5 flex-shrink-0'>
                          <FChip
                            size='xs'
                            color={
                              playlist.submissionStatus === 'OPEN'
                                ? 'success'
                                : 'danger'
                            }
                            variant='dot'
                          >
                            {playlist.submissionStatus === 'OPEN'
                              ? 'Open'
                              : 'Closed'}
                          </FChip>
                          {playlist.playlistType?.name && (
                            <FChip size='xs' color='primary' variant='flat'>
                              {playlist.playlistType.name}
                            </FChip>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center justify-between mt-3'>
                        <div className='flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500'>
                          <span className='flex items-center gap-1'>
                            <MusicalNoteIcon className='w-3.5 h-3.5' />
                            {playlist.currentTracks}/{playlist.maxTracks}
                          </span>
                          <span>
                            Max {playlist.maxSubmissionsPerArtist} per artist
                          </span>
                          {pendingCount > 0 && (
                            <span className='text-amber-600 dark:text-amber-400'>
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
                        <div>
                          {status === 'max-reached' ? (
                            <FChip size='xs' color='warning' variant='flat'>
                              Limit reached
                            </FChip>
                          ) : status === 'has-submissions' ? (
                            <FChip size='xs' color='primary' variant='dot'>
                              {pendingCount} pending
                            </FChip>
                          ) : (
                            <FButton
                              variant='primary-outline'
                              size='sm'
                              startContent={
                                <PlusIcon className='w-3.5 h-3.5' />
                              }
                              onPress={() => onQuickSubmit?.(null, playlist)}
                            >
                              Submit
                            </FButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </FCard>
              );
            })
          )}
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'my-submissions' && (
        <div className='space-y-3'>
          {mySubmissions.length === 0 ? (
            <FCard padding='lg'>
              <FEmptyState
                icon={ClockIcon}
                title='No submissions yet'
                description="You haven't submitted any tracks to playlists yet."
                action={{
                  label: 'Browse Playlists',
                  onPress: () => setActiveTab('available'),
                  variant: 'primary',
                }}
              />
            </FCard>
          ) : (
            mySubmissions.map(submission => {
              const StatusIcon = getStatusIcon(submission.status);
              const track = myTracks.find(t => t.id === submission.trackId);
              const playlist = availablePlaylists.find(
                p => p.id === submission.playlistId
              );

              return (
                <FCard key={submission.id} padding='none'>
                  <div className='p-4 flex items-center gap-3'>
                    <FImage
                      src={track?.albumArtwork || track?.coverImageUrl || ''}
                      alt={track?.title || 'Track'}
                      className='w-12 h-12 flex-shrink-0'
                      rounded='lg'
                      fallback='music'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='font-medium text-gray-800 dark:text-gray-100 truncate text-sm'>
                            {track?.title || 'Unknown Track'}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                            → {playlist?.name || 'Unknown Playlist'}
                          </p>
                        </div>
                        <FChip
                          size='xs'
                          color={getStatusColor(submission.status)}
                          variant='flat'
                          startContent={<StatusIcon className='w-3 h-3' />}
                        >
                          {submission.status.charAt(0) +
                            submission.status.slice(1).toLowerCase()}
                        </FChip>
                      </div>
                      <div className='flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500'>
                        <span>
                          Submitted{' '}
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString()}
                        </span>
                        {submission.reviewedAt && (
                          <span>
                            Reviewed{' '}
                            {new Date(
                              submission.reviewedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Artist Comment */}
                      {submission.artistComment && (
                        <div className='mt-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 text-xs text-gray-600 dark:text-gray-400'>
                          <span className='font-medium'>Your comment:</span>{' '}
                          {submission.artistComment}
                        </div>
                      )}
                      {/* Admin Comment */}
                      {submission.adminComment && (
                        <div className='mt-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 text-xs text-gray-600 dark:text-gray-400'>
                          <span className='font-medium'>Feedback:</span>{' '}
                          {submission.adminComment}
                        </div>
                      )}
                    </div>
                  </div>
                </FCard>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
