'use client';

import { useState, useEffect } from 'react';
import {
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MusicalNoteIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import {
  PlaylistType,
  PlaylistStatus,
  SubmissionStatus,
  Playlist,
  TrackSubmissionStatus,
  PlaylistSubmission,
  Track,
} from '@/types/playlist';

interface PlaylistSubmissionsProps {
  onClose?: () => void;
}

export default function PlaylistSubmissions({
  onClose,
}: PlaylistSubmissionsProps) {
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [mySubmissions, setMySubmissions] = useState<PlaylistSubmission[]>([]);
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [submissionComment, setSubmissionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my-submissions'>(
    'available'
  );

  // Mock data - replace with API calls
  useEffect(() => {
    const mockAvailablePlaylists: Playlist[] = [
      {
        id: '1',
        name: "Editor's Choice",
        description: 'Our handpicked favorites this week',
        type: PlaylistType.FEATURED,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 5,
        currentTracks: 4,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 1,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        order: 1,
      },
      {
        id: '2',
        name: 'Top 10 This Week',
        description: 'Most played tracks this week',
        type: PlaylistType.TOP_TEN,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 10,
        currentTracks: 8,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 2,
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        order: 2,
      },
      {
        id: '3',
        name: 'Cape Town Sounds',
        description: 'Music from the Mother City',
        type: PlaylistType.PROVINCE,
        coverImage: '/api/placeholder/300/300',
        maxTracks: 20,
        currentTracks: 12,
        status: PlaylistStatus.ACTIVE,
        submissionStatus: SubmissionStatus.OPEN,
        maxSubmissionsPerArtist: 3,
        province: 'Western Cape',
        createdBy: 'admin-1',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15'),
        order: 3,
      },
    ];

    const mockMySubmissions: PlaylistSubmission[] = [
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
        artistId: 'artist-1',
        status: TrackSubmissionStatus.APPROVED,
        submittedAt: new Date('2024-01-19'),
        reviewedAt: new Date('2024-01-20'),
        reviewedBy: 'admin-1',
        adminComment: 'Great track, fits perfectly with the theme.',
        artistComment: 'Hope you like this one!',
      },
    ];

    const mockMyTracks: Track[] = [
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
      {
        id: 'track-2',
        title: 'Deep House Groove',
        coverImageUrl: '/api/placeholder/300/300',
        genre: 'Deep House',
        album: 'Electronic Dreams',
        description: 'Smooth deep house with soulful vocals',
        duration: 320,
        playCount: 890,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        filePath: 'tracks/deep-house-groove.mp3',
        albumArtwork: null,
        artist: 'DJ Fresh',
        artistProfileId: 'profile-1',
        bitrate: 320,
        bpm: 124,
        channels: 2,
        composer: 'DJ Fresh',
        copyrightInfo: 'All rights reserved',
        distributionRights: 'Flemoji Records',
        downloadCount: 32,
        fileSize: 10.2 * 1024 * 1024,
        isDownloadable: true,
        isExplicit: false,
        isPublic: true,
        isrc: 'USRC17607840',
        licenseType: 'All Rights Reserved',
        likeCount: 67,
        lyrics: null,
        releaseDate: new Date('2024-01-10'),
        sampleRate: 44100,
        shareCount: 18,
        uniqueUrl: 'deep-house-groove-dj-fresh',
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
      setAvailablePlaylists(mockAvailablePlaylists);
      setMySubmissions(mockMySubmissions);
      setMyTracks(mockMyTracks);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: PlaylistType) => {
    switch (type) {
      case PlaylistType.FEATURED:
        return '🏆';
      case PlaylistType.TOP_TEN:
        return '📊';
      case PlaylistType.PROVINCE:
        return '🏙️';
      case PlaylistType.GENRE:
        return '🎵';
      default:
        return '🎵';
    }
  };

  const getTypeColor = (type: PlaylistType) => {
    switch (type) {
      case PlaylistType.FEATURED:
        return 'from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700';
      case PlaylistType.TOP_TEN:
        return 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700';
      case PlaylistType.PROVINCE:
        return 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-700';
      case PlaylistType.GENRE:
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
      default:
        return 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700';
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

  const getStatusIcon = (status: TrackSubmissionStatus) => {
    switch (status) {
      case TrackSubmissionStatus.PENDING:
        return ClockIcon;
      case TrackSubmissionStatus.APPROVED:
        return CheckCircleIcon;
      case TrackSubmissionStatus.REJECTED:
        return XCircleIcon;
      case TrackSubmissionStatus.SHORTLISTED:
        return EyeIcon;
      default:
        return ClockIcon;
    }
  };

  const handleSubmitToPlaylist = async () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;

    setIsSubmitting(true);
    try {
      // Here you would typically call the API to submit tracks
      console.log('Submitting tracks:', {
        playlistId: selectedPlaylist.id,
        trackIds: selectedTracks,
        comment: submissionComment,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      const newSubmissions: PlaylistSubmission[] = selectedTracks.map(
        trackId => ({
          id: `sub-${Date.now()}-${trackId}`,
          playlistId: selectedPlaylist.id,
          trackId,
          artistId: 'artist-1',
          status: TrackSubmissionStatus.PENDING,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          adminComment: null,
          artistComment: submissionComment,
        })
      );

      setMySubmissions(prev => [...prev, ...newSubmissions]);
      setSelectedPlaylist(null);
      setSelectedTracks([]);
      setSubmissionComment('');
    } catch (error) {
      console.error('Error submitting tracks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaylistName = (playlistId: string) => {
    const playlist = availablePlaylists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const getTrack = (trackId: string) => {
    return myTracks.find(t => t.id === trackId);
  };

  const getSubmissionCount = (playlistId: string) => {
    return mySubmissions.filter(s => s.playlistId === playlistId).length;
  };

  if (loading) {
    return (
      <div className='space-y-8'>
        <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
          <div className='p-6'>
            <div className='animate-pulse space-y-4'>
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4'></div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className='h-48 bg-gray-200 dark:bg-slate-700 rounded-xl'
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
                Playlist Submissions
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Submit your tracks to curated playlists
              </p>
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

        {/* Tabs */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <nav className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('available')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Available Playlists
            </button>
            <button
              onClick={() => setActiveTab('my-submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'my-submissions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              My Submissions ({mySubmissions.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className='p-6'>
          {activeTab === 'available' && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {availablePlaylists.map(playlist => {
                const submissionCount = getSubmissionCount(playlist.id);
                const canSubmit =
                  submissionCount < playlist.maxSubmissionsPerArtist;

                return (
                  <div
                    key={playlist.id}
                    className={`bg-gradient-to-br ${getTypeColor(playlist.type)} rounded-xl p-6 border`}
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center'>
                        <span className='text-2xl'>
                          {getTypeIcon(playlist.type)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            playlist.type === PlaylistType.FEATURED
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : playlist.type === PlaylistType.TOP_TEN
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : playlist.type === PlaylistType.PROVINCE
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {playlist.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                      {playlist.name}
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2'>
                      {playlist.description}
                    </p>

                    <div className='space-y-2 mb-4'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500 dark:text-gray-400'>
                          Tracks
                        </span>
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {playlist.currentTracks}/{playlist.maxTracks}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500 dark:text-gray-400'>
                          My Submissions
                        </span>
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {submissionCount}/{playlist.maxSubmissionsPerArtist}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500 dark:text-gray-400'>
                          Status
                        </span>
                        <span
                          className={`font-medium ${playlist.submissionStatus === SubmissionStatus.OPEN ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {playlist.submissionStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPlaylist(playlist)}
                      disabled={
                        !canSubmit ||
                        playlist.submissionStatus !== SubmissionStatus.OPEN
                      }
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                        canSubmit &&
                        playlist.submissionStatus === SubmissionStatus.OPEN
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {!canSubmit ? 'Max Submissions Reached' : 'Submit Track'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'my-submissions' && (
            <div className='space-y-4'>
              {mySubmissions.map(submission => {
                const track = getTrack(submission.trackId);
                const playlistName = getPlaylistName(submission.playlistId);
                const StatusIcon = getStatusIcon(submission.status);

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

                          <div className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                            <div className='flex items-center gap-4'>
                              <span>Playlist: {playlistName}</span>
                              <span>
                                Submitted:{' '}
                                {submission.submittedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {submission.artistComment && (
                            <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2'>
                              <p className='text-sm text-blue-800 dark:text-blue-200'>
                                <strong>Your comment:</strong>{' '}
                                {submission.artistComment}
                              </p>
                            </div>
                          )}

                          {submission.adminComment && (
                            <div className='bg-gray-100 dark:bg-slate-600 rounded-lg p-3'>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                <strong>Admin response:</strong>{' '}
                                {submission.adminComment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div className='flex items-center ml-4'>
                        <StatusIcon
                          className={`w-6 h-6 ${
                            submission.status === TrackSubmissionStatus.APPROVED
                              ? 'text-green-500'
                              : submission.status ===
                                  TrackSubmissionStatus.REJECTED
                                ? 'text-red-500'
                                : submission.status ===
                                    TrackSubmissionStatus.SHORTLISTED
                                  ? 'text-blue-500'
                                  : 'text-yellow-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {mySubmissions.length === 0 && (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
                    <QueueListIcon className='w-8 h-8 text-gray-400' />
                  </div>
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    No submissions yet
                  </h4>
                  <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                    Submit your tracks to available playlists to get started
                  </p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
                  >
                    Browse Playlists
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {selectedPlaylist && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex min-h-screen items-center justify-center p-4'>
            <div
              className='fixed inset-0 bg-black bg-opacity-50'
              onClick={() => setSelectedPlaylist(null)}
              role='button'
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedPlaylist(null)}
              aria-label='Close modal'
            ></div>

            <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Submit to {selectedPlaylist.name}
                  </h3>
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  >
                    <XCircleIcon className='w-6 h-6' />
                  </button>
                </div>

                <div className='space-y-6'>
                  {/* Playlist Info */}
                  <div className='bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center'>
                        <span className='text-2xl'>
                          {getTypeIcon(selectedPlaylist.type)}
                        </span>
                      </div>
                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-white'>
                          {selectedPlaylist.name}
                        </h4>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {selectedPlaylist.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Track Selection */}
                  <div>
                    <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                      Select Tracks (Max:{' '}
                      {selectedPlaylist.maxSubmissionsPerArtist})
                    </h4>
                    <div className='space-y-3 max-h-60 overflow-y-auto'>
                      {myTracks.map(track => (
                        <label
                          key={track.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTracks.includes(track.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={selectedTracks.includes(track.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                if (
                                  selectedTracks.length <
                                  selectedPlaylist.maxSubmissionsPerArtist
                                ) {
                                  setSelectedTracks(prev => [
                                    ...prev,
                                    track.id,
                                  ]);
                                }
                              } else {
                                setSelectedTracks(prev =>
                                  prev.filter(id => id !== track.id)
                                );
                              }
                            }}
                            disabled={
                              !selectedTracks.includes(track.id) &&
                              selectedTracks.length >=
                                selectedPlaylist.maxSubmissionsPerArtist
                            }
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                          />
                          <div className='w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                            {track.coverImageUrl ? (
                              <img
                                src={track.coverImageUrl}
                                alt={track.title}
                                className='w-full h-full object-cover rounded-lg'
                              />
                            ) : (
                              <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h5 className='font-medium text-gray-900 dark:text-white truncate'>
                              {track.title}
                            </h5>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              {track.genre}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label
                      htmlFor='submission-comment'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Comment (Optional)
                    </label>
                    <textarea
                      id='submission-comment'
                      value={submissionComment}
                      onChange={e => setSubmissionComment(e.target.value)}
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Add a comment for the playlist curator...'
                    />
                  </div>

                  {/* Actions */}
                  <div className='flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700'>
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors duration-200'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitToPlaylist}
                      disabled={selectedTracks.length === 0 || isSubmitting}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                        selectedTracks.length === 0 || isSubmitting
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isSubmitting && (
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      )}
                      {isSubmitting
                        ? 'Submitting...'
                        : `Submit ${selectedTracks.length} Track${selectedTracks.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
