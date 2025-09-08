'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import {
  UserIcon,
  PencilIcon,
  LinkIcon,
  MusicalNoteIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { UserIcon as UserSolidIcon } from '@heroicons/react/24/solid';
import ArtistProfileForm from '@/components/artist/ArtistProfileForm';
import SocialLinksEditor from '@/components/artist/SocialLinksEditor';
import StreamingLinksEditor from '@/components/artist/StreamingLinksEditor';
import ArtistProfileCard from '@/components/artist/ArtistProfileCard';
import {
  ArtistProfile,
  SocialLinks,
  StreamingLinks,
} from '@/types/artist-profile';

interface ArtistProfileManagerProps {
  onClose?: () => void;
}

export default function ArtistProfileManager({
  onClose,
}: ArtistProfileManagerProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'edit' | 'social' | 'streaming'
  >('overview');
  const [error, setError] = useState<string | null>(null);

  // Fetch artist profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/artist-profile');

        if (response.ok) {
          const data = await response.json();
          setProfile(data.artistProfile);
        } else if (response.status === 404) {
          // No profile exists yet
          setProfile(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const handleSaveProfile = async (formData: any) => {
    setSaving(true);
    setError(null);

    try {
      const url = '/api/artist-profile';
      const method = profile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.artistProfile);
        setActiveTab('overview');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialLinks = async (socialLinks: SocialLinks) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/artist-profile/social-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socialLinks }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.artistProfile);
        setActiveTab('overview');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save social links');
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      setError('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStreamingLinks = async (streamingLinks: StreamingLinks) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/artist-profile/streaming-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamingLinks }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.artistProfile);
        setActiveTab('overview');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save streaming links');
      }
    } catch (error) {
      console.error('Error saving streaming links:', error);
      setError('Failed to save streaming links');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      !profile ||
      !confirm(
        'Are you sure you want to delete your artist profile? This action cannot be undone.'
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/artist-profile', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(null);
        setActiveTab('overview');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <Spinner size='lg' />
          <p className='mt-4 text-gray-500 dark:text-gray-400'>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ExclamationTriangleIcon className='w-8 h-8 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Error Loading Profile
          </h3>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>{error}</p>
          <Button color='primary' onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Artist Profile
          </h2>
          <p className='text-gray-500 dark:text-gray-400'>
            {profile
              ? 'Manage your artist identity'
              : 'Create your artist profile'}
          </p>
        </div>
        {onClose && (
          <Button
            variant='light'
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          >
            Close
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      {profile && (
        <div className='bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-slate-700'>
          <nav className='flex space-x-2'>
            {[
              { id: 'overview', name: 'Overview', icon: UserSolidIcon },
              { id: 'edit', name: 'Edit Profile', icon: PencilIcon },
              { id: 'social', name: 'Social Links', icon: LinkIcon },
              { id: 'streaming', name: 'Streaming', icon: MusicalNoteIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Content */}
      {!profile && activeTab === 'overview' ? (
        /* No Profile - Show Create Button */
        <Card className='w-full'>
          <CardBody className='p-12 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <UserIcon className='w-10 h-10 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
              Create Your Artist Profile
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
              Set up your artist identity to start sharing your music with the
              world. Add your bio, social media links, and streaming platform
              connections.
            </p>
            <Button
              color='primary'
              size='lg'
              startContent={<PlusIcon className='w-5 h-5' />}
              onClick={() => setActiveTab('edit')}
            >
              Create Artist Profile
            </Button>
          </CardBody>
        </Card>
      ) : activeTab === 'overview' && profile ? (
        /* Profile Overview */
        <div className='space-y-6'>
          <ArtistProfileCard
            profile={profile}
            showActions={false}
            variant='detailed'
          />

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Card>
              <CardBody className='p-4 text-center'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1'>
                  {profile.totalPlays.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Plays
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className='p-4 text-center'>
                <div className='text-2xl font-bold text-pink-600 dark:text-pink-400 mb-1'>
                  {profile.totalLikes.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Total Likes
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className='p-4 text-center'>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400 mb-1'>
                  {profile.totalFollowers.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Followers
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className='p-4 text-center'>
                <div className='text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1'>
                  {profile.profileViews.toLocaleString()}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Profile Views
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-3'>
            <Button
              color='primary'
              startContent={<PencilIcon className='w-4 h-4' />}
              onClick={() => setActiveTab('edit')}
            >
              Edit Profile
            </Button>
            <Button
              variant='bordered'
              startContent={<LinkIcon className='w-4 h-4' />}
              onClick={() => setActiveTab('social')}
            >
              Social Links
            </Button>
            <Button
              variant='bordered'
              startContent={<MusicalNoteIcon className='w-4 h-4' />}
              onClick={() => setActiveTab('streaming')}
            >
              Streaming Platforms
            </Button>
            <Button
              color='danger'
              variant='light'
              onClick={handleDeleteProfile}
              disabled={saving}
            >
              Delete Profile
            </Button>
          </div>
        </div>
      ) : activeTab === 'edit' ? (
        /* Edit Profile */
        <ArtistProfileForm
          profile={profile || undefined}
          onSave={handleSaveProfile}
          onCancel={() => setActiveTab('overview')}
          isLoading={saving}
        />
      ) : activeTab === 'social' && profile ? (
        /* Social Links */
        <SocialLinksEditor
          socialLinks={profile.socialLinks}
          onSave={handleSaveSocialLinks}
          onCancel={() => setActiveTab('overview')}
          isLoading={saving}
        />
      ) : activeTab === 'streaming' && profile ? (
        /* Streaming Links */
        <StreamingLinksEditor
          streamingLinks={profile.streamingLinks}
          onSave={handleSaveStreamingLinks}
          onCancel={() => setActiveTab('overview')}
          isLoading={saving}
        />
      ) : null}

      {/* Error Display */}
      {error && (
        <Card className='border-red-200 dark:border-red-800'>
          <CardBody className='p-4'>
            <div className='flex items-center gap-3 text-red-600 dark:text-red-400'>
              <ExclamationTriangleIcon className='w-5 h-5 flex-shrink-0' />
              <span className='text-sm font-medium'>{error}</span>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
