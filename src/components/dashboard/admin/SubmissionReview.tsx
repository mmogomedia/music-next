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
} from '@heroicons/react/24/outline';
import {
  PlaylistSubmission,
  TrackSubmissionStatus,
  Playlist,
  Track,
} from '@/types/playlist';

interface SubmissionReviewProps {
  onClose?: () => void;
}

export default function SubmissionReview({ onClose }: SubmissionReviewProps) {
  const [submissions, setSubmissions] = useState<PlaylistSubmission[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PlaylistSubmission | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as TrackSubmissionStatus | 'all',
    playlist: 'all',
    search: '',
  });
  const [reviewComment, setReviewComment] = useState('');

  // Mock data - replace with API calls
  useEffect(() => {
    const mockSubmissions: PlaylistSubmission[] = [
      {
        id: '1',
        playlistId: '1',
        trackId: 'track-1',
        artistId: 'artist-1',
        status: TrackSubmissionStatus.PENDING,
        submittedAt: new Date('2024-01-20'),
        reviewedAt: null,
        reviewedBy: null,
        adminComment: null,
        artistComment:
          'This track would be perfect for your featured playlist!',
      },
      {
        id: '2',
        playlistId: '2',
        trackId: 'track-2',
        artistId: 'artist-2',
        status: TrackSubmissionStatus.APPROVED,
        submittedAt: new Date('2024-01-19'),
        reviewedAt: new Date('2024-01-20'),
        reviewedBy: 'admin-1',
        adminComment: 'Great track, fits perfectly with the theme.',
        artistComment: 'Hope you like this one!',
      },
      {
        id: '3',
        playlistId: '3',
        trackId: 'track-3',
        artistId: 'artist-3',
        status: TrackSubmissionStatus.REJECTED,
        submittedAt: new Date('2024-01-18'),
        reviewedAt: new Date('2024-01-19'),
        reviewedBy: 'admin-1',
        adminComment: 'Not quite the right genre for this playlist.',
        artistComment: 'Please consider this track for your playlist.',
      },
      {
        id: '4',
        playlistId: '4',
        trackId: 'track-4',
        artistId: 'artist-4',
        status: TrackSubmissionStatus.SHORTLISTED,
        submittedAt: new Date('2024-01-17'),
        reviewedAt: new Date('2024-01-18'),
        reviewedBy: 'admin-1',
        adminComment: 'Good track, considering for next update.',
        artistComment: 'This is my latest release.',
      },
    ];

    const mockPlaylists: Playlist[] = [
      {
        id: '1',
        name: "Editor's Choice",
        type: 'FEATURED' as any,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 5,
        currentTracks: 4,
        status: 'ACTIVE' as any,
        submissionStatus: 'CLOSED' as any,
        maxSubmissionsPerArtist: 1,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        order: 1,
      },
      {
        id: '2',
        name: 'Top 10 This Week',
        type: 'TOP_TEN' as any,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 10,
        currentTracks: 10,
        status: 'ACTIVE' as any,
        submissionStatus: 'OPEN' as any,
        maxSubmissionsPerArtist: 2,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        order: 2,
      },
    ];

    const mockTracks: Track[] = [
      {
        id: 'track-1',
        title: 'Amapiano Vibes',
        coverImageUrl: '/api/placeholder/300/300',
        genre: 'Amapiano',
        album: 'Summer Collection',
        description: 'A fresh take on Amapiano with modern elements',
        duration: 240,
        playCount: 1250,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        filePath: 'tracks/amapiano-vibes.mp3',
        albumArtwork: null,
        artist: 'DJ Fresh',
        artistProfileId: 'profile-1',
        bitrate: 320,
        bpm: 120,
        channels: 2,
        composer: 'DJ Fresh',
        copyrightInfo: 'All rights reserved',
        distributionRights: 'Flemoji Records',
        downloadCount: 45,
        fileSize: 8.5 * 1024 * 1024,
        isDownloadable: true,
        isExplicit: false,
        isPublic: true,
        isrc: 'USRC17607839',
        licenseType: 'All Rights Reserved',
        likeCount: 89,
        lyrics: null,
        releaseDate: new Date('2024-01-15'),
        sampleRate: 44100,
        shareCount: 23,
        uniqueUrl: 'amapiano-vibes-dj-fresh',
        userId: 'user-1',
        watermarkId: null,
        year: 2024,
        playEvents: [],
        playlistSubmissions: [],
        playlistTracks: [],
        smartLinks: [],
        artistProfile: {} as any,
        user: {} as any,
      },
    ];

    setTimeout(() => {
      setSubmissions(mockSubmissions);
      setPlaylists(mockPlaylists);
      setTracks(mockTracks);
      setLoading(false);
    }, 1000);
  }, []);

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
    // Here you would typically call the API to update the submission
    console.log('Reviewing submission:', { submissionId, status, comment });

    // Update local state
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId
          ? {
              ...sub,
              status,
              reviewedAt: new Date(),
              reviewedBy: 'admin-1',
              adminComment: comment || null,
            }
          : sub
      )
    );

    setSelectedSubmission(null);
    setReviewComment('');
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
      const track = tracks.find(t => t.id === submission.trackId);
      if (!track?.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
    }
    return true;
  });

  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const getTrack = (trackId: string) => {
    return tracks.find(t => t.id === trackId);
  };

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
          <div className='space-y-4'>
            {filteredSubmissions.map(submission => {
              const track = getTrack(submission.trackId);
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
                        {track?.coverImageUrl ? (
                          <img
                            src={track.coverImageUrl}
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
                            {track?.artist || 'Unknown Artist'}
                          </div>
                          <div className='flex items-center gap-1'>
                            <CalendarIcon className='w-4 h-4' />
                            {submission.submittedAt.toLocaleDateString()}
                          </div>
                          <div className='flex items-center gap-1'>
                            <span>Playlist:</span>
                            <span className='font-medium'>{playlistName}</span>
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
                      {submission.status === TrackSubmissionStatus.PENDING && (
                        <>
                          <button
                            onClick={() =>
                              handleReview(
                                submission.id,
                                TrackSubmissionStatus.APPROVED,
                                reviewComment
                              )
                            }
                            className='p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors'
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
                            className='p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors'
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
                            className='p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors'
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
              onClick={() => setSelectedSubmission(null)}
              role='button'
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedSubmission(null)}
              aria-label='Close modal'
            ></div>

            <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md'>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Add Review Comment
                </h3>

                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4'
                  placeholder='Add a comment for the artist...'
                />

                <div className='flex items-center justify-end space-x-3'>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors duration-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle comment submission
                      setSelectedSubmission(null);
                      setReviewComment('');
                    }}
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'
                  >
                    Save Comment
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
