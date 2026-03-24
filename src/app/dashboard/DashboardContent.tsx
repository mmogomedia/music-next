'use client';

// This is the actual dashboard content component
// It's extracted so we can wrap it with a server component that checks for profile

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardBody, Button, Chip, Avatar } from '@heroui/react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  PencilIcon,
  MapPinIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  PlusIcon,
  UserIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import UploadTab from '@/components/dashboard/artist/UploadTab';
import ToolsTab from '@/components/dashboard/artist/ToolsTab';
import ArtistProfileForm from '@/components/artist/ArtistProfileForm';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RecentTracks from '@/components/dashboard/RecentTracks';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TopPerformingTracks from '@/components/dashboard/TopPerformingTracks';
import PlaylistSubmissionsTab from '@/components/dashboard/artist/PlaylistSubmissionsTab';
import LibraryTab from '@/components/dashboard/artist/LibraryTab';
import QuickSubmitModal from '@/components/dashboard/artist/QuickSubmitModal';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  CreateArtistProfileData,
  UpdateArtistProfileData,
} from '@/types/artist-profile';
import { Track } from '@/types/track';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
import ArtistNavigation from '@/components/dashboard/artist/ArtistNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import FanDashboardContent from '@/components/dashboard/fan/FanDashboardContent';
import QuickLinksManager from '@/components/dashboard/quick-links/QuickLinksManager';
import PulseCard from '@/components/dashboard/pulse/PulseCard';
import { usePulseData } from '@/hooks/usePulseData';
import WelcomeStrip from '@/components/dashboard/overview/WelcomeStrip';

interface DashboardContentProps {
  hasArtistProfile?: boolean;
}

export default function DashboardContent({
  hasArtistProfile = true,
}: DashboardContentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { playTrack } = useMusicPlayer();
  const [timeRange, setTimeRange] = useState('7d');

  const TAB_IDS = [
    'overview',
    'library',
    'upload',
    'submissions',
    'tools',
    'quick-links', // kept for backward-compat deep links; accessible via Tools tab
    'analytics',
    'profile',
  ] as const;

  type TabId = (typeof TAB_IDS)[number];
  type AllTabId = TabId | 'pulse';
  const DEFAULT_TAB: TabId = 'overview';

  const isValidTab = (tab: string | null): tab is TabId =>
    !!tab && TAB_IDS.includes(tab as TabId);

  const createHrefForTab = useCallback(
    (tab: AllTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === DEFAULT_TAB) {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const queryString = params.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParams]
  );

  const navigateToTab = useCallback(
    (tab: TabId, options?: { replace?: boolean }) => {
      const href = createHrefForTab(tab);
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [createHrefForTab, router]
  );

  const tabParam = searchParams.get('tab');
  const activeTab: TabId = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;

  useEffect(() => {
    if (tabParam && !isValidTab(tabParam)) {
      navigateToTab(DEFAULT_TAB, { replace: true });
    }
  }, [tabParam, navigateToTab]);
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
  const {
    pulseData,
    loading: pulseLoading,
    refresh: refreshPulseData,
  } = usePulseData();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [, setLoading] = useState(true);
  const [deletingTrack, setDeletingTrack] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
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
      router.push('/login');
    }
  }, [status, router]);

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

  // Fan users (no artist profile) get the fan dashboard
  if (!hasArtistProfile) {
    return <FanDashboardContent />;
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <RoleBasedRedirect>
        <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
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
    totalLikes: tracks.reduce((sum, track) => sum + (track.likeCount || 0), 0),
    totalShares: 0,
    totalDownloads: tracks.reduce(
      (sum, track) => sum + (track.downloadCount || 0),
      0
    ),
    totalSaves: 0,
    uniqueListeners: 0,
    avgDuration: 0,
    avgCompletionRate: 0,
  };

  const recentTracks = tracks.slice(0, 5);

  const tabNames: Record<TabId, string> = {
    overview: 'Overview',
    library: 'Library',
    upload: 'Upload',
    submissions: 'Submissions',
    tools: 'Tools',
    'quick-links': 'Quick Links',
    analytics: 'Analytics',
    profile: 'Profile',
  };

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center px-4 sm:px-5 lg:px-6'>
      {/* Left — page title */}
      <div className='flex-1 min-w-0'>
        <h1 className='text-lg font-bold text-gray-900 dark:text-white truncate'>
          {tabNames[activeTab] || 'Dashboard'}
        </h1>
        {activeTab === 'overview' && (
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Track your performance
          </p>
        )}
      </div>

      {/* Right — stats chips + actions */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        <div className='hidden md:flex items-center gap-1.5'>
          <Chip
            size='sm'
            color='primary'
            variant='flat'
            className='h-6 text-xs'
          >
            {stats?.overview?.totalTracks || 0} tracks
          </Chip>
          <Chip
            size='sm'
            color='primary'
            variant='flat'
            className='h-6 text-xs'
          >
            {(stats?.overview?.totalPlays || 0).toLocaleString()} plays
          </Chip>
        </div>
        {profile && (
          <Button
            as={profile.slug ? 'a' : 'button'}
            href={profile.slug ? `/artist/${profile.slug}` : undefined}
            target={profile.slug ? '_blank' : undefined}
            rel={profile.slug ? 'noopener noreferrer' : undefined}
            isDisabled={!profile.slug}
            title={
              profile.slug
                ? 'View your public profile'
                : 'Set a profile URL in your profile settings first'
            }
            size='sm'
            variant='bordered'
            className='hidden sm:flex h-8 text-xs'
            endContent={<ArrowTopRightOnSquareIcon className='w-3 h-3' />}
            onPress={!profile.slug ? () => navigateToTab('profile') : undefined}
          >
            View Profile
          </Button>
        )}
        {activeTab !== 'upload' && (
          <Button
            size='sm'
            color='primary'
            className='hidden sm:flex h-8 text-xs'
            startContent={<PlusIcon className='w-3.5 h-3.5' />}
            onPress={() => navigateToTab('upload')}
          >
            Upload
          </Button>
        )}
      </div>
    </header>
  );

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={
          <ArtistNavigation
            activeTab={activeTab}
            getTabHref={createHrefForTab}
          />
        }
        contentClassName='w-full'
        header={header}
      >
        <div className='w-full py-4 px-4 sm:px-5 lg:px-6'>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-4'>
              {/* Welcome strip with greeting + time range selector */}
              <WelcomeStrip
                artistName={
                  profile?.artistName ??
                  (stats?.artistProfile as { artistName?: string } | undefined)
                    ?.artistName ??
                  'Artist'
                }
                profileImage={profile?.profileImage}
                totalTracks={displayStats.totalTracks}
                totalPlays={displayStats.totalPlays}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                loading={statsLoading}
              />

              {/* Stats row */}
              {statsError ? (
                <div className='text-center text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 text-sm'>
                  Error loading stats: {statsError}
                </div>
              ) : (
                <StatsGrid
                  stats={{
                    totalTracks: displayStats.totalTracks,
                    totalPlays: displayStats.totalPlays,
                    totalLikes: displayStats.totalLikes,
                    totalDownloads: displayStats.totalDownloads,
                    uniqueListeners: displayStats.uniqueListeners,
                  }}
                  growth={
                    stats?.growthMetrics as
                      | {
                          playsGrowth?: number;
                          likesGrowth?: number;
                          sharesGrowth?: number;
                        }
                      | undefined
                  }
                  loading={statsLoading}
                />
              )}

              {/* Top Tracks (3/5) + PULSE³ (2/5) */}
              {!statsLoading && !statsError && (
                <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
                  <div className='lg:col-span-3'>
                    <TopPerformingTracks
                      topTracks={stats?.topTracks ?? []}
                      onViewAll={() => navigateToTab('library')}
                    />
                  </div>
                  <div className='lg:col-span-2'>
                    <PulseCard
                      pulseData={pulseData}
                      loading={pulseLoading}
                      onRefresh={refreshPulseData}
                    />
                  </div>
                </div>
              )}

              {/* Recent Uploads (1/2) + Live Activity (1/2) */}
              {!statsLoading && !statsError && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  <RecentTracks
                    tracks={recentTracks}
                    onViewAll={() => navigateToTab('library')}
                    onPlay={track => playTrack(track, 'direct')}
                  />
                  <RecentActivity activity={stats?.recentActivity} />
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className='space-y-6'>
              {!profile && !isEditingProfile ? (
                <Card>
                  <CardBody className='p-8 text-center'>
                    <div className='w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                      <UserIcon className='w-8 h-8 text-white' />
                    </div>
                    <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                      Create Your Artist Profile
                    </h3>
                    <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6'>
                      Set up your artist identity to start sharing your music
                      with the world
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
                              className='text-primary-600 dark:text-primary-400 hover:underline'
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
            <UploadTab
              onUploadComplete={_jobId => {
                const fetchTracks = async () => {
                  try {
                    const response = await fetch('/api/tracks');
                    if (response.ok) {
                      const data = await response.json();
                      setTracks(data.tracks || []);
                    }
                  } catch (err) {
                    console.error('Error fetching tracks:', err);
                  }
                };
                fetchTracks();
              }}
              onViewLibrary={() => navigateToTab('library')}
            />
          )}

          {/* Library Tab */}
          {activeTab === 'library' && (
            <LibraryTab
              tracks={tracks}
              onUpload={() => navigateToTab('upload')}
              onDelete={confirmDelete}
              onSubmitToPlaylist={track => {
                setSelectedTrackForSubmit(track);
                setSelectedPlaylistForSubmit(null);
                setShowQuickSubmit(true);
              }}
            />
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

          {/* Tools Tab */}
          {activeTab === 'tools' && <ToolsTab />}

          {/* Quick Links Tab — kept for backward-compat; accessible via Tools tab */}
          {activeTab === 'quick-links' && (
            <QuickLinksManager tracks={tracks} profile={profile} />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card>
              <CardBody className='p-8 text-center'>
                <div className='w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                  <ChartBarIcon className='w-10 h-10 text-white' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-3'>
                  Analytics Coming Soon
                </h3>
                <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
                  Detailed charts and metrics will be displayed here to help you
                  track your music performance
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
