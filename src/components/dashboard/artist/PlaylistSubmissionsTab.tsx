'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
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
import { constructFileUrl } from '@/lib/url-utils';

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
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const getStatusColor = (status: TrackSubmissionStatus) => {
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
      <Card>
        <CardBody className='p-8 text-center'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <MusicalNoteIcon className='w-5 h-5 text-white' />
          </div>
          <p className='text-gray-600 dark:text-gray-400'>
            Loading submissions...
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Playlist Submissions
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Submit your tracks to curated playlists
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg'>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
            activeTab === 'available'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <QueueListIcon className='w-4 h-4' />
          Available Playlists
        </button>
        <button
          onClick={() => setActiveTab('my-submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
            activeTab === 'my-submissions'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ClockIcon className='w-4 h-4' />
          My Submissions ({mySubmissions.length})
        </button>
      </div>

      {/* Available Playlists Tab */}
      {activeTab === 'available' && (
        <div className='space-y-4'>
          {availablePlaylists.length === 0 ? (
            <Card>
              <CardBody className='p-8 text-center'>
                <div className='w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <QueueListIcon className='w-8 h-8 text-gray-400' />
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  No Playlists Available
                </h4>
                <p className='text-gray-500 dark:text-gray-400'>
                  There are currently no playlists accepting submissions.
                </p>
              </CardBody>
            </Card>
          ) : (
            availablePlaylists.map(playlist => {
              const status = getSubmissionStatus(playlist);
              const pendingCount = getPendingSubmissions(playlist.id);

              return (
                <Card
                  key={playlist.id}
                  className='hover:shadow-md transition-shadow'
                >
                  <CardBody className='p-6'>
                    <div className='flex items-start gap-4'>
                      {/* Playlist Cover */}
                      <div className='flex-shrink-0'>
                        <img
                          src={constructFileUrl(playlist.coverImage)}
                          alt={playlist.name}
                          className='w-16 h-16 rounded-lg object-cover shadow-sm'
                        />
                      </div>

                      {/* Playlist Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
                              {playlist.name}
                            </h4>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                              {playlist.description}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Chip
                              size='sm'
                              color={
                                playlist.submissionStatus === 'OPEN'
                                  ? 'success'
                                  : 'danger'
                              }
                              variant='flat'
                            >
                              {playlist.submissionStatus === 'OPEN'
                                ? 'Open'
                                : 'Closed'}
                            </Chip>
                            <Chip size='sm' color='primary' variant='flat'>
                              {playlist.playlistType?.name || 'Unknown Type'}
                            </Chip>
                          </div>
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4'>
                          <span className='flex items-center gap-1'>
                            <MusicalNoteIcon className='w-4 h-4' />
                            {playlist.currentTracks}/{playlist.maxTracks} tracks
                          </span>
                          <span className='flex items-center gap-1'>
                            <QueueListIcon className='w-4 h-4' />
                            Max {playlist.maxSubmissionsPerArtist} per artist
                          </span>
                          {pendingCount > 0 && (
                            <span className='flex items-center gap-1'>
                              <ClockIcon className='w-4 h-4' />
                              {pendingCount} pending
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className='flex items-center gap-3'>
                          {status === 'max-reached' ? (
                            <Chip color='warning' variant='flat'>
                              Submission limit reached
                            </Chip>
                          ) : status === 'has-submissions' ? (
                            <Chip color='primary' variant='flat'>
                              {pendingCount} pending submission
                              {pendingCount !== 1 ? 's' : ''}
                            </Chip>
                          ) : (
                            <Button
                              color='primary'
                              size='sm'
                              startContent={<PlusIcon className='w-4 h-4' />}
                              onPress={() => {
                                // This will be handled by the quick submit modal
                                // We'll pass the playlist info to the parent
                                if (onQuickSubmit) {
                                  onQuickSubmit(null as any, playlist);
                                }
                              }}
                            >
                              Submit Tracks
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'my-submissions' && (
        <div className='space-y-4'>
          {mySubmissions.length === 0 ? (
            <Card>
              <CardBody className='p-8 text-center'>
                <div className='w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <ClockIcon className='w-8 h-8 text-gray-400' />
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  No Submissions Yet
                </h4>
                <p className='text-gray-500 dark:text-gray-400 mb-4'>
                  You haven&apos;t submitted any tracks to playlists yet.
                </p>
                <Button
                  color='primary'
                  startContent={<PlusIcon className='w-4 h-4' />}
                  onPress={() => setActiveTab('available')}
                >
                  Browse Available Playlists
                </Button>
              </CardBody>
            </Card>
          ) : (
            mySubmissions.map(submission => {
              const StatusIcon = getStatusIcon(submission.status);
              const track = myTracks.find(t => t.id === submission.trackId);
              const playlist = availablePlaylists.find(
                p => p.id === submission.playlistId
              );

              return (
                <Card
                  key={submission.id}
                  className='hover:shadow-md transition-shadow'
                >
                  <CardBody className='p-6'>
                    <div className='flex items-start gap-4'>
                      {/* Track Cover */}
                      <div className='flex-shrink-0'>
                        <img
                          src={constructFileUrl(
                            track?.albumArtwork || track?.coverImageUrl || ''
                          )}
                          alt={track?.title}
                          className='w-12 h-12 rounded-lg object-cover shadow-sm'
                        />
                      </div>

                      {/* Submission Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                              {track?.title || 'Unknown Track'}
                            </h4>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              Submitted to{' '}
                              <span className='font-medium'>
                                {playlist?.name || 'Unknown Playlist'}
                              </span>
                            </p>
                          </div>
                          <Chip
                            size='sm'
                            color={getStatusColor(submission.status)}
                            variant='flat'
                            startContent={<StatusIcon className='w-3 h-3' />}
                          >
                            {submission.status}
                          </Chip>
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2'>
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
                          <div className='mb-2'>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                              <span className='font-medium'>Your comment:</span>{' '}
                              {submission.artistComment}
                            </p>
                          </div>
                        )}

                        {/* Admin Comment */}
                        {submission.adminComment && (
                          <div className='p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                              <span className='font-medium'>
                                Admin feedback:
                              </span>{' '}
                              {submission.adminComment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
