'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  GlobeAltIcon,
  ClockIcon,
  MusicalNoteIcon,
  PlusIcon,
  UserIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import TrackEditModal from '@/components/track/TrackEditModal';
import FileUpload from '@/components/upload/FileUpload';
import ArtistProfileForm from '@/components/artist/ArtistProfileForm';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RecentTracks from '@/components/dashboard/RecentTracks';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PlaylistSubmissionsTab from '@/components/dashboard/artist/PlaylistSubmissionsTab';
import QuickSubmitModal from '@/components/dashboard/artist/QuickSubmitModal';
import TrackArtwork from '@/components/music/TrackArtwork';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  CreateArtistProfileData,
  UpdateArtistProfileData,
} from '@/types/artist-profile';
import { Track } from '@/types/track';
import { SourceType } from '@/types/stats';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
import ArtistNavigation from '@/components/dashboard/artist/ArtistNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useDashboardStats(timeRange);
  const {
    profile,
    loading: profileLoading,
    createProfile,
    updateProfile,
  } = useArtistProfile();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [, setLoading] = useState(true);
  const [deletingTrack, setDeletingTrack] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [showTrackEdit, setShowTrackEdit] = useState(false);
  const [showQuickSubmit, setShowQuickSubmit] = useState(false);
  const [selectedTrackForSubmit, setSelectedTrackForSubmit] =
    useState<Track | null>(null);
  const [selectedPlaylistForSubmit, setSelectedPlaylistForSubmit] =
    useState<any>(null);

  // Fetch tracks from API
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch('/api/tracks');

        if (response.ok) {
          const data = await response.json();
          setTracks(data.tracks || []);
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchTracks();
    }
  }, [session?.user?.id]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  // Delete track function
  const deleteTrack = async (trackId: string) => {
    setDeletingTrack(trackId);

    try {
      const response = await fetch('/api/tracks/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId }),
      });

      if (response.ok) {
        setTracks(prevTracks =>
          prevTracks.filter(track => track.id !== trackId)
        );
      } else {
        const error = await response.json();
        console.error('Error deleting track:', error);
        alert('Failed to delete track. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Failed to delete track. Please try again.');
    } finally {
      setDeletingTrack(null);
      setShowDeleteConfirm(null);
    }
  };

  const confirmDelete = (trackId: string) => {
    setShowDeleteConfirm(trackId);
  };

  const handleEditTrack = (track: any) => {
    setEditingTrack(track);
    setShowTrackEdit(true);
  };

  const handleTrackSave = async (trackData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/tracks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: editingTrack?.id,
          ...trackData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the track in the list
        setTracks(prev =>
          prev.map(track =>
            track.id === editingTrack?.id ? data.track : track
          )
        );
        setShowTrackEdit(false);
        setEditingTrack(null);
        return true;
      } else {
        console.error('Failed to update track');
        return false;
      }
    } catch (error) {
      console.error('Error updating track:', error);
      return false;
    }
  };

  const handleTrackEditClose = () => {
    setShowTrackEdit(false);
    setEditingTrack(null);
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <RoleBasedRedirect>
        <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
          </div>
        </div>
      </RoleBasedRedirect>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Use stats from API or fallback to basic stats
  const displayStats = stats?.overview || {
    totalTracks: tracks.length,
    totalPlays: tracks.reduce((sum, track) => sum + (track.playCount || 0), 0),
    totalLikes: 0,
    totalShares: 0,
    totalDownloads: 0,
    totalSaves: 0,
    uniqueListeners: 0,
    avgDuration: 0,
    avgCompletionRate: 0,
  };

  const recentTracks = tracks.slice(0, 5);

  const tabNames: Record<string, string> = {
    overview: 'Overview',
    library: 'Library',
    upload: 'Upload',
    submissions: 'Submissions',
    analytics: 'Analytics',
    profile: 'Profile',
  };

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
              {tabNames[activeTab] || 'Artist Dashboard'}
            </h1>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {activeTab === 'overview'
                ? 'Manage your music and track your performance'
                : `Manage ${tabNames[activeTab]?.toLowerCase()}`}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {/* Quick Stats Pills */}
            <div className='hidden md:flex items-center gap-2'>
              <Chip size='sm' color='primary' variant='flat'>
                {stats?.overview?.totalTracks || 0} tracks
              </Chip>
              <Chip size='sm' color='success' variant='flat'>
                {(stats?.overview?.totalPlays || 0).toLocaleString()} plays
              </Chip>
              {profile && (
                <Chip size='sm' color='secondary' variant='flat'>
                  {profile.artistName}
                </Chip>
              )}
            </div>
            {activeTab !== 'upload' && (
              <Button
                size='sm'
                color='primary'
                className='hidden sm:flex'
                startContent={<PlusIcon className='w-4 h-4' />}
                onPress={() => setActiveTab('upload')}
              >
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Show profile creation option if no profile exists
  if (!profileLoading && !profile) {
    return (
      <RoleBasedRedirect>
        <UnifiedLayout
          sidebar={
            <ArtistNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          }
          contentClassName='w-full'
          header={header}
        >
          <div className='w-full py-8 px-4 sm:px-6 lg:px-8'>
            <div className='min-h-[60vh] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-16 text-center bg-gray-50/50 dark:bg-slate-800/50 flex flex-col justify-center'>
              <div className='w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8'>
                <MusicalNoteIcon className='w-16 h-16 text-blue-600' />
              </div>
              <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-6'>
                Welcome to Your Dashboard
              </h2>
              <p className='text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed'>
                Create a profile to start uploading music, managing tracks, and
                accessing all the features of your artist dashboard. Choose from
                different profile types to get started.
              </p>
              <div className='space-y-6'>
                <Button
                  color='primary'
                  size='lg'
                  className='w-full max-w-md h-14 text-lg font-semibold'
                  startContent={<MusicalNoteIcon className='w-6 h-6' />}
                  onPress={() => (window.location.href = '/profile/select')}
                >
                  Create Artist Profile
                </Button>
                <p className='text-base text-gray-500 dark:text-gray-400'>
                  Get started with your creative journey
                </p>
              </div>
            </div>
          </div>
        </UnifiedLayout>
      </RoleBasedRedirect>
    );
  }

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={
          <ArtistNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        }
        contentClassName='w-full'
        header={header}
      >
        <div className='w-full py-8 px-4 sm:px-6 lg:px-8'>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-8'>
              {/* Time Range Selector */}
              <div className='flex justify-between items-center'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  Dashboard Overview
                </h2>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant='bordered' size='sm'>
                      {timeRange === '24h'
                        ? 'Last 24 Hours'
                        : timeRange === '7d'
                          ? 'Last 7 Days'
                          : timeRange === '30d'
                            ? 'Last 30 Days'
                            : timeRange === '90d'
                              ? 'Last 90 Days'
                              : timeRange === '1y'
                                ? 'Last Year'
                                : 'All Time'}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    selectedKeys={[timeRange]}
                    onSelectionChange={keys =>
                      setTimeRange(Array.from(keys)[0] as string)
                    }
                  >
                    <DropdownItem key='24h'>Last 24 Hours</DropdownItem>
                    <DropdownItem key='7d'>Last 7 Days</DropdownItem>
                    <DropdownItem key='30d'>Last 30 Days</DropdownItem>
                    <DropdownItem key='90d'>Last 90 Days</DropdownItem>
                    <DropdownItem key='1y'>Last Year</DropdownItem>
                    <DropdownItem key='all'>All Time</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {statsLoading ? (
                <div className='flex justify-center items-center h-32'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                </div>
              ) : statsError ? (
                <div className='text-center text-red-600 dark:text-red-400'>
                  Error loading stats: {statsError}
                </div>
              ) : (
                <StatsGrid
                  stats={displayStats}
                  growth={stats?.growthMetrics}
                />
              )}

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <RecentTracks
                  tracks={recentTracks}
                  onViewAll={() => setActiveTab('library')}
                  onPlay={playTrack}
                />

                {stats?.recentActivity && (
                  <RecentActivity activity={stats.recentActivity} />
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className='space-y-6'>
                  {!profile && !isEditingProfile ? (
                    <Card>
                      <CardBody className='p-8 text-center'>
                        <div className='w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                          <UserIcon className='w-8 h-8 text-white' />
                        </div>
                        <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                          Create Your Artist Profile
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6'>
                          Set up your artist identity to start sharing your
                          music with the world
                        </p>
                        <Button
                          color='primary'
                          size='lg'
                          className='flex justify-start'
                          startContent={<UserIcon className='w-5 h-5' />}
                          onPress={() => {
                            setProfileError(null);
                            setIsEditingProfile(true);
                          }}
                        >
                          Create Artist Profile
                        </Button>
                      </CardBody>
                    </Card>
                  ) : isEditingProfile ? (
                    <Card>
                      <CardBody className='p-6'>
                        <div className='flex items-center justify-between mb-6'>
                          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                            {profile
                              ? 'Edit Artist Profile'
                              : 'Create Artist Profile'}
                          </h3>
                          <Button
                            variant='light'
                            onPress={() => setIsEditingProfile(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                        <ArtistProfileForm
                          profile={profile || undefined}
                          onSave={async formData => {
                            try {
                              setProfileError(null);

                              if (profile) {
                                const updateData: UpdateArtistProfileData = {
                                  artistName: formData.artistName
                                    ? formData.artistName
                                    : profile.artistName,
                                  bio: formData.bio,
                                  profileImage: formData.profileImage,
                                  coverImage: formData.coverImage,
                                  location: formData.location,
                                  website: formData.website
                                    ? formData.website.startsWith('http://') ||
                                      formData.website.startsWith('https://')
                                      ? formData.website
                                      : `https://${formData.website}`
                                    : formData.website,
                                  genre: formData.genre,
                                  slug: formData.slug,
                                };
                                const success = await updateProfile(updateData);
                                if (success) {
                                  setIsEditingProfile(false);
                                } else {
                                  setProfileError(
                                    'Failed to update profile. Please try again.'
                                  );
                                }
                              } else {
                                if (!formData.artistName?.trim()) {
                                  setProfileError('Artist name is required.');
                                  return;
                                }

                                const createData: CreateArtistProfileData = {
                                  artistName: formData.artistName,
                                  bio: formData.bio,
                                  profileImage: formData.profileImage,
                                  coverImage: formData.coverImage,
                                  location: formData.location,
                                  website: formData.website
                                    ? formData.website.startsWith('http://') ||
                                      formData.website.startsWith('https://')
                                      ? formData.website
                                      : `https://${formData.website}`
                                    : formData.website,
                                  genre: formData.genre,
                                  slug: formData.slug,
                                };
                                const success = await createProfile(createData);
                                if (success) {
                                  setIsEditingProfile(false);
                                } else {
                                  setProfileError(
                                    'Failed to create profile. Please try again.'
                                  );
                                }
                              }
                            } catch (error) {
                              console.error('Error saving profile:', error);
                              setProfileError(
                                'An unexpected error occurred. Please try again.'
                              );
                            }
                          }}
                          onCancel={() => setIsEditingProfile(false)}
                          isLoading={profileLoading}
                        />

                        {profileError && (
                          <div className='mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                            <p className='text-red-600 dark:text-red-400 text-sm'>
                              {profileError}
                            </p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ) : (
                    <div className='space-y-6'>
                      <Card>
                        <CardBody className='p-6'>
                          <div className='flex items-center justify-between mb-6'>
                            <div className='flex items-center gap-4'>
                              <Avatar
                                src={profile?.profileImage}
                                name={profile?.artistName}
                                className='w-16 h-16'
                              />
                              <div>
                                <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
                                  {profile?.artistName}
                                </h3>
                                <p className='text-gray-500 dark:text-gray-400'>
                                  {profile?.genre || 'Artist'}
                                </p>
                              </div>
                            </div>
                            <Button
                              color='primary'
                              className='flex justify-start'
                              startContent={<PencilIcon className='w-4 h-4' />}
                              onPress={() => {
                                setProfileError(null);
                                setIsEditingProfile(true);
                              }}
                            >
                              Edit Profile
                            </Button>
                          </div>

                          {profile?.bio && (
                            <div className='mb-6'>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                                About
                              </h4>
                              <p className='text-gray-600 dark:text-gray-300'>
                                {profile.bio}
                              </p>
                            </div>
                          )}

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {profile?.location && (
                              <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                                <MapPinIcon className='w-5 h-5' />
                                <span>{profile.location}</span>
                              </div>
                            )}
                            {profile?.website && (
                              <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                                <GlobeAltIcon className='w-5 h-5' />
                                <a
                                  href={profile.website}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 dark:text-blue-400 hover:underline'
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <Card>
              <CardBody className='p-6'>
                <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                      Upload Music
                    </h3>
                    <FileUpload
                      onUploadComplete={_jobId => {
                        // Refresh tracks after successful upload
                        const fetchTracks = async () => {
                          try {
                            const response = await fetch('/api/tracks');
                            if (response.ok) {
                              const data = await response.json();
                              setTracks(data.tracks || []);
                            }
                          } catch (error) {
                            console.error('Error fetching tracks:', error);
                          }
                        };
                        fetchTracks();
                      }}
                      onViewLibrary={() => setActiveTab('library')}
                      onUploadAnother={() => {
                        // Reset upload state is handled in the component
                      }}
                      onTrackCreated={track => {
                        // Add new track to the list
                        setTracks(prev => [track, ...prev]);
                        // Switch to library tab to show the new track
                        setActiveTab('library');
                      }}
                      onTrackUpdated={track => {
                        // Update existing track in the list
                        setTracks(prev =>
                          prev.map(t => (t.id === track.id ? track : t))
                        );
                      }}
                    />
              </CardBody>
            </Card>
          )}

          {/* Library Tab */}
          {activeTab === 'library' && (
            <Card>
              <CardBody className='p-6 overflow-visible'>
                    <div className='flex items-center justify-between mb-6'>
                      <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                        My Music Library
                      </h3>
                      <Button
                        color='primary'
                        className='flex justify-start'
                        startContent={<PlusIcon className='w-4 h-4' />}
                        onPress={() => setActiveTab('upload')}
                      >
                        Upload New Track
                      </Button>
                    </div>

                    {tracks.length === 0 ? (
                      <div className='text-center py-12'>
                        <div className='w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <MusicalNoteIcon className='w-10 h-10 text-gray-400' />
                        </div>
                        <h4 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                          No tracks yet
                        </h4>
                        <p className='text-gray-500 dark:text-gray-400 mb-6'>
                          Upload your first track to start building your music
                          library
                        </p>
                        <Button
                          color='primary'
                          size='lg'
                          className='flex justify-start'
                          startContent={<PlusIcon className='w-5 h-5' />}
                          onPress={() => setActiveTab('upload')}
                        >
                          Upload Music
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-3 overflow-visible'>
                        {tracks.map(track => (
                          <div
                            key={track.id}
                            className='flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors relative'
                          >
                            <div className='flex-shrink-0'>
                              <TrackArtwork
                                artworkUrl={
                                  track.albumArtwork || track.coverImageUrl
                                }
                                title={track.title}
                                size='md'
                              />
                            </div>

                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-gray-900 dark:text-white truncate'>
                                {track.title}
                              </h4>
                              <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
                                <span className='flex items-center gap-1'>
                                  <PlayIcon className='w-3 h-3' />
                                  {track.playCount?.toLocaleString() || 0} plays
                                </span>
                                <span className='flex items-center gap-1'>
                                  <ClockIcon className='w-3 h-3' />
                                  {track.duration
                                    ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`
                                    : '0:00'}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center gap-2'>
                              <Button
                                isIconOnly
                                size='sm'
                                color='primary'
                                onPress={() =>
                                  playTrack(track, 'dashboard' as SourceType)
                                }
                              >
                                {currentTrack?.id === track.id && isPlaying ? (
                                  <PauseIcon className='w-4 h-4' />
                                ) : (
                                  <PlayIcon className='w-4 h-4' />
                                )}
                              </Button>

                              {/* 3-dot menu with HeroUI Dropdown */}
                              <Dropdown placement='bottom-end'>
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size='sm'
                                    variant='light'
                                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                  >
                                    <EllipsisVerticalIcon className='w-4 h-4' />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label='Track actions'>
                                  <DropdownItem
                                    key='submit'
                                    startContent={
                                      <MusicalNoteIcon className='w-4 h-4' />
                                    }
                                    onPress={() => {
                                      setSelectedTrackForSubmit(track);
                                      setSelectedPlaylistForSubmit(null);
                                      setShowQuickSubmit(true);
                                    }}
                                  >
                                    Submit to Playlists
                                  </DropdownItem>
                                  <DropdownItem
                                    key='edit'
                                    startContent={
                                      <PencilIcon className='w-4 h-4' />
                                    }
                                    onPress={() => handleEditTrack(track)}
                                  >
                                    Edit Track
                                  </DropdownItem>
                                  <DropdownItem
                                    key='delete'
                                    className='text-danger'
                                    color='danger'
                                    startContent={
                                      <TrashIcon className='w-4 h-4' />
                                    }
                                    onPress={() => confirmDelete(track.id)}
                                  >
                                    Delete Track
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
              </CardBody>
            </Card>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <PlaylistSubmissionsTab
                  onQuickSubmit={(track, playlist) => {
                    if (track) {
                      // Track-based submission
                      setSelectedTrackForSubmit(track);
                      setSelectedPlaylistForSubmit(null);
                      setShowQuickSubmit(true);
                    } else if (playlist) {
                      // Playlist-based submission - pass available tracks
                      setSelectedTrackForSubmit(null);
                      setSelectedPlaylistForSubmit(playlist);
                      setShowQuickSubmit(true);
                    }
                  }}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card>
              <CardBody className='p-8 text-center'>
                    <div className='w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                      <ChartBarIcon className='w-10 h-10 text-white' />
                    </div>
                    <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                      Analytics Coming Soon
                    </h3>
                    <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
                      Detailed charts and metrics will be displayed here to help
                      you track your music performance
                    </p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <Card className='w-full max-w-md mx-4'>
              <CardBody className='p-6'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                  Delete Track
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  Are you sure you want to delete this track? This action cannot
                  be undone.
                </p>
                <div className='flex gap-3 justify-end'>
                  <Button
                    variant='light'
                    onPress={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color='danger'
                    onPress={() => deleteTrack(showDeleteConfirm)}
                    isLoading={deletingTrack === showDeleteConfirm}
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Track Edit Modal */}
        <TrackEditModal
          isOpen={showTrackEdit}
          onClose={handleTrackEditClose}
          onSave={handleTrackSave}
          mode={editingTrack ? 'edit' : 'create'}
          track={
            editingTrack
              ? {
                  id: editingTrack.id,
                  title: editingTrack.title,
                  artist: editingTrack.artist,
                  album: editingTrack.album,
                  genre: editingTrack.genre,
                  genreId: (editingTrack as any).genreId || undefined,
                  composer: editingTrack.composer,
                  year: editingTrack.year,
                  releaseDate: editingTrack.releaseDate,
                  bpm: editingTrack.bpm,
                  isrc: editingTrack.isrc,
                  description: editingTrack.description,
                  lyrics: editingTrack.lyrics,
                  isPublic: editingTrack.isPublic ?? true,
                  isDownloadable: editingTrack.isDownloadable ?? false,
                  isExplicit: editingTrack.isExplicit ?? false,
                  copyrightInfo: editingTrack.copyrightInfo,
                  licenseType: editingTrack.licenseType,
                  distributionRights: editingTrack.distributionRights,
                  albumArtwork: editingTrack.albumArtwork,
                }
              : undefined
          }
        />

        {/* Quick Submit Modal */}
        <QuickSubmitModal
          isOpen={showQuickSubmit}
          onClose={() => {
            setShowQuickSubmit(false);
            setSelectedTrackForSubmit(null);
            setSelectedPlaylistForSubmit(null);
          }}
          track={selectedTrackForSubmit}
          playlist={selectedPlaylistForSubmit}
          availableTracks={!selectedTrackForSubmit ? tracks : undefined}
          onSuccess={() => {
            // Optionally refresh submissions data
            // Track submitted successfully
          }}
        />
      </UnifiedLayout>
    </RoleBasedRedirect>
  );
}
