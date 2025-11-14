'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  MusicalNoteIcon,
  UserIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {
  PlaylistSubmission,
  TrackSubmissionStatus,
  Playlist,
} from '@/types/playlist';
import { api } from '@/lib/api-client';
import { constructFileUrl } from '@/lib/url-utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Track } from '@/types/track';
import { SourceType } from '@/types/stats';
import ArtistDisplay from '@/components/track/ArtistDisplay';

interface SubmissionReviewProps {
  onClose?: () => void;
}

export default function SubmissionReview({ onClose }: SubmissionReviewProps) {
  const [submissions, setSubmissions] = useState<PlaylistSubmission[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PlaylistSubmission | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as TrackSubmissionStatus | 'all',
    playlist: 'all',
    search: '',
  });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Use global music player
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  // Fetch submissions and playlists
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch submissions and playlists in parallel
      const [submissionsResponse, playlistsResponse] = await Promise.all([
        api.admin.getSubmissions(),
        api.admin.getPlaylists(),
      ]);

      setSubmissions(submissionsResponse.data.submissions || []);
      setPlaylists(playlistsResponse.data.playlists || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TrackSubmissionStatus) => {
    switch (status) {
      case TrackSubmissionStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case TrackSubmissionStatus.APPROVED:
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case TrackSubmissionStatus.REJECTED:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case TrackSubmissionStatus.SHORTLISTED:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleReview = async (
    submissionId: string,
    status: TrackSubmissionStatus,
    comment?: string
  ) => {
    try {
      setReviewing(true);

      // Call the API to review the submission
      const response = await api.admin.reviewSubmission(submissionId, {
        status,
        comment,
      });

      // Update local state with the response
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? {
                ...sub,
                status: response.data.submission.status,
                reviewedAt: response.data.submission.reviewedAt,
                reviewedBy: response.data.submission.reviewedBy,
                adminComment: response.data.submission.adminComment,
              }
            : sub
        )
      );

      setSelectedSubmission(null);
      setReviewComment('');

      // Refresh data to show updated submission
      await fetchData();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      // You might want to show an error message to the user here
    } finally {
      setReviewing(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.status !== 'all' && submission.status !== filters.status)
      return false;
    if (
      filters.playlist !== 'all' &&
      submission.playlistId !== filters.playlist
    )
      return false;
    if (filters.search) {
      const track = submission.track;
      if (!track?.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
    }
    return true;
  });

  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const handlePlayTrack = (submissionTrack: any) => {
    // Convert submission track to Track type for the global player
    const track: Track = {
      id: submissionTrack.id,
      title: submissionTrack.title,
      artist: submissionTrack.artist || 'Unknown Artist',
      filePath: submissionTrack.filePath,
      fileUrl: submissionTrack.fileUrl, // Constructed by API from filePath
      coverImageUrl: submissionTrack.coverImageUrl,
      albumArtwork: submissionTrack.albumArtwork,
      genre: submissionTrack.genre,
      duration: submissionTrack.duration,
      playCount: submissionTrack.playCount || 0,
      artistId: submissionTrack.artistProfileId || '', // Use artistProfileId from schema
      userId: '', // Not available in submission track data
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    playTrack(track, 'admin' as SourceType);
  };

  // Group submissions by date
  const groupedSubmissions = filteredSubmissions.reduce(
    (groups, submission) => {
      const date = new Date(submission.submittedAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(submission);
      return groups;
    },
    {} as Record<string, typeof filteredSubmissions>
  );

  // Sort dates (most recent first)
  const sortedDates = Object.keys(groupedSubmissions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className='space-y-8'>
        <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
          <div className='p-6'>
            <div className='animate-pulse space-y-4'>
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4'></div>
              <div className='space-y-3'>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className='h-20 bg-gray-200 dark:bg-slate-700 rounded'
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Submission Review
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Review and manage playlist submissions
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <button
                onClick={fetchData}
                disabled={loading}
                className='px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title='Refresh submissions'
              >
                Refresh
              </button>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {filteredSubmissions.length} submissions
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  <XCircleIcon className='w-5 h-5' />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-64'>
              <input
                type='text'
                placeholder='Search tracks...'
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value as TrackSubmissionStatus | 'all',
                }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Status</option>
              <option value={TrackSubmissionStatus.PENDING}>Pending</option>
              <option value={TrackSubmissionStatus.APPROVED}>Approved</option>
              <option value={TrackSubmissionStatus.REJECTED}>Rejected</option>
              <option value={TrackSubmissionStatus.SHORTLISTED}>
                Shortlisted
              </option>
            </select>
            <select
              value={filters.playlist}
              onChange={e =>
                setFilters(prev => ({ ...prev, playlist: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Playlists</option>
              {playlists.map(playlist => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className='p-6'>
          <div className='space-y-8'>
            {sortedDates.map(date => (
              <div key={date} className='space-y-4'>
                {/* Date Header */}
                <div className='flex items-center gap-3'>
                  <div className='h-px bg-gray-200 dark:bg-slate-600 flex-1'></div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white px-4'>
                    {date}
                  </h3>
                  <div className='h-px bg-gray-200 dark:bg-slate-600 flex-1'></div>
                </div>

                {/* Submissions for this date */}
                <div className='space-y-4'>
                  {groupedSubmissions[date].map(submission => {
                    const submissionTrack = submission.track;
                    if (!submissionTrack) return null;

                    // Normalize track to ensure all required properties are present
                    const track: Track = {
                      id: submissionTrack.id,
                      title: submissionTrack.title,
                      filePath: submissionTrack.filePath ?? '',
                      fileUrl: submissionTrack.fileUrl ?? '',
                      coverImageUrl:
                        submissionTrack.coverImageUrl ??
                        submissionTrack.albumArtwork ??
                        undefined,
                      albumArtwork: submissionTrack.albumArtwork ?? undefined,
                      genre: submissionTrack.genre ?? undefined,
                      album: submissionTrack.album ?? undefined,
                      description: submissionTrack.description ?? undefined,
                      duration:
                        typeof submissionTrack.duration === 'number' &&
                        Number.isFinite(submissionTrack.duration)
                          ? submissionTrack.duration
                          : undefined,
                      playCount: submissionTrack.playCount ?? 0,
                      likeCount: submissionTrack.likeCount ?? 0,
                      artistId:
                        submissionTrack.artistId ??
                        submissionTrack.artistProfileId ??
                        '',
                      artistProfileId:
                        submissionTrack.artistProfileId ?? undefined,
                      userId: submissionTrack.userId ?? '',
                      createdAt:
                        submissionTrack.createdAt ?? new Date().toISOString(),
                      updatedAt:
                        submissionTrack.updatedAt ?? new Date().toISOString(),
                      artist:
                        submissionTrack.artist ??
                        submissionTrack.artistProfile?.artistName ??
                        'Unknown Artist',
                      primaryArtistIds:
                        submissionTrack.primaryArtistIds ?? undefined,
                      featuredArtistIds:
                        submissionTrack.featuredArtistIds ?? undefined,
                      primaryArtists:
                        submissionTrack.primaryArtists ?? undefined,
                      featuredArtists:
                        submissionTrack.featuredArtists ?? undefined,
                    };
                    const playlistName = getPlaylistName(submission.playlistId);

                    return (
                      <div
                        key={submission.id}
                        className='bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start space-x-4 flex-1'>
                            {/* Track Image */}
                            <div className='w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                              {track?.coverImageUrl || track?.albumArtwork ? (
                                <img
                                  src={constructFileUrl(
                                    track.coverImageUrl ||
                                      track.albumArtwork ||
                                      ''
                                  )}
                                  alt={track.title}
                                  className='w-full h-full object-cover rounded-lg'
                                />
                              ) : (
                                <MusicalNoteIcon className='w-8 h-8 text-gray-400' />
                              )}
                            </div>

                            {/* Track Info */}
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h4 className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
                                  {track?.title || 'Unknown Track'}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}
                                >
                                  {submission.status}
                                </span>
                              </div>

                              <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2'>
                                <div className='flex items-center gap-1'>
                                  <UserIcon className='w-4 h-4' />
                                  <ArtistDisplay track={track} />
                                </div>
                                <div className='flex items-center gap-1'>
                                  <CalendarIcon className='w-4 h-4' />
                                  {new Date(
                                    submission.submittedAt
                                  ).toLocaleDateString()}
                                </div>
                                <div className='flex items-center gap-1'>
                                  <span>Playlist:</span>
                                  <span className='font-medium'>
                                    {playlistName}
                                  </span>
                                </div>
                              </div>

                              {submission.artistComment && (
                                <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2'>
                                  <div className='flex items-start gap-2'>
                                    <ChatBubbleLeftIcon className='w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                                    <div>
                                      <p className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-1'>
                                        Artist Comment:
                                      </p>
                                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                                        {submission.artistComment}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {submission.adminComment && (
                                <div className='bg-gray-100 dark:bg-slate-600 rounded-lg p-3'>
                                  <div className='flex items-start gap-2'>
                                    <ChatBubbleLeftIcon className='w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0' />
                                    <div>
                                      <p className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                        Admin Comment:
                                      </p>
                                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                                        {submission.adminComment}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className='flex items-center gap-2 ml-4'>
                            {/* Play Button */}
                            {track && (
                              <button
                                onClick={() => handlePlayTrack(track)}
                                className='p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors'
                                title={
                                  currentTrack?.id === track.id && isPlaying
                                    ? 'Pause preview'
                                    : 'Preview track'
                                }
                              >
                                {currentTrack?.id === track.id && isPlaying ? (
                                  <PauseIcon className='w-5 h-5' />
                                ) : (
                                  <PlayIcon className='w-5 h-5' />
                                )}
                              </button>
                            )}

                            {/* Review Actions - Show for all submissions */}
                            {submission.status !==
                              TrackSubmissionStatus.PENDING && (
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setReviewComment(
                                    submission.adminComment || ''
                                  );
                                }}
                                className='p-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors'
                                title='Update Review'
                              >
                                <PencilIcon className='w-5 h-5' />
                              </button>
                            )}

                            {submission.status ===
                              TrackSubmissionStatus.PENDING && (
                              <>
                                <button
                                  onClick={() =>
                                    handleReview(
                                      submission.id,
                                      TrackSubmissionStatus.APPROVED,
                                      reviewComment
                                    )
                                  }
                                  disabled={reviewing}
                                  className='p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                  title='Approve'
                                >
                                  <CheckCircleIcon className='w-5 h-5' />
                                </button>
                                <button
                                  onClick={() =>
                                    handleReview(
                                      submission.id,
                                      TrackSubmissionStatus.SHORTLISTED,
                                      reviewComment
                                    )
                                  }
                                  disabled={reviewing}
                                  className='p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                  title='Shortlist'
                                >
                                  <EyeIcon className='w-5 h-5' />
                                </button>
                                <button
                                  onClick={() =>
                                    handleReview(
                                      submission.id,
                                      TrackSubmissionStatus.REJECTED,
                                      reviewComment
                                    )
                                  }
                                  disabled={reviewing}
                                  className='p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                  title='Reject'
                                >
                                  <XCircleIcon className='w-5 h-5' />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setSelectedSubmission(submission)}
                              className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
                              title='View Details'
                            >
                              <EyeIcon className='w-5 h-5' />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className='text-center py-12'>
                <div className='w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <ClockIcon className='w-8 h-8 text-gray-400' />
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  No submissions found
                </h4>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {filters.search ||
                  filters.status !== 'all' ||
                  filters.playlist !== 'all'
                    ? 'Try adjusting your filters to see more submissions'
                    : 'No submissions have been made yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Comment Modal */}
      {selectedSubmission && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex min-h-screen items-center justify-center p-4'>
            <div
              className='fixed inset-0 bg-black bg-opacity-50'
              onClick={() => {
                setSelectedSubmission(null);
                setReviewComment('');
              }}
              role='button'
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedSubmission(null)}
              aria-label='Close modal'
            ></div>

            <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg'>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  {selectedSubmission.status === TrackSubmissionStatus.PENDING
                    ? 'Add Review Comment'
                    : 'Update Review'}
                </h3>

                {selectedSubmission.status !==
                  TrackSubmissionStatus.PENDING && (
                  <div className='mb-4'>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                      Current Status:{' '}
                      <span className='font-medium'>
                        {selectedSubmission.status}
                      </span>
                    </p>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Change to:
                      </span>
                      <button
                        onClick={() =>
                          setSelectedSubmission({
                            ...selectedSubmission,
                            status: TrackSubmissionStatus.APPROVED,
                          })
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedSubmission.status ===
                          TrackSubmissionStatus.APPROVED
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        Approved
                      </button>
                      <button
                        onClick={() =>
                          setSelectedSubmission({
                            ...selectedSubmission,
                            status: TrackSubmissionStatus.SHORTLISTED,
                          })
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedSubmission.status ===
                          TrackSubmissionStatus.SHORTLISTED
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        Shortlisted
                      </button>
                      <button
                        onClick={() =>
                          setSelectedSubmission({
                            ...selectedSubmission,
                            status: TrackSubmissionStatus.REJECTED,
                          })
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedSubmission.status ===
                          TrackSubmissionStatus.REJECTED
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4'
                  placeholder={
                    selectedSubmission.status === TrackSubmissionStatus.PENDING
                      ? 'Add a comment for the artist...'
                      : 'Update your comment...'
                  }
                />

                <div className='flex items-center justify-end space-x-3'>
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setReviewComment('');
                    }}
                    className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors duration-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedSubmission) {
                        handleReview(
                          selectedSubmission.id,
                          selectedSubmission.status,
                          reviewComment
                        );
                        setSelectedSubmission(null);
                        setReviewComment('');
                      }
                    }}
                    disabled={reviewing}
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {reviewing
                      ? 'Saving...'
                      : selectedSubmission.status ===
                          TrackSubmissionStatus.PENDING
                        ? 'Save Comment'
                        : 'Update Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
