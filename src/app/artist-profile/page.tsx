'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import {
  UserIcon,
  LinkIcon,
  MusicalNoteIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ArtistProfileForm from '@/components/artist/ArtistProfileForm';
import SocialLinksEditor from '@/components/artist/SocialLinksEditor';
import StreamingLinksEditor from '@/components/artist/StreamingLinksEditor';
import ArtistProfileCard from '@/components/artist/ArtistProfileCard';
import {
  ArtistProfile,
  SocialLinks,
  StreamingLinks,
} from '@/types/artist-profile';

export default function ArtistProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showForm, setShowForm] = useState(false);
  const [, setFormType] = useState<'create' | 'edit'>('create');

  // Fetch artist profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/artist-profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.artistProfile);
          if (data.artistProfile) {
            setFormType('edit');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialLinks = async (socialLinks: SocialLinks) => {
    setSaving(true);
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
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      alert('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStreamingLinks = async (streamingLinks: StreamingLinks) => {
    setSaving(true);
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
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving streaming links:', error);
      alert('Failed to save streaming links');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardBody className='p-8 text-center'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
              Access Denied
            </h2>
            <p className='text-gray-500 dark:text-gray-400'>
              Please sign in to manage your artist profile.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Artist Profile
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Manage your artist identity and social media presence
          </p>
        </div>

        {!profile && !showForm ? (
          /* No Profile - Show Create Button */
          <Card className='w-full max-w-2xl mx-auto'>
            <CardBody className='p-12 text-center'>
              <div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                <UserIcon className='w-8 h-8 text-white' />
              </div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
                Create Your Artist Profile
              </h2>
              <p className='text-gray-500 dark:text-gray-400 mb-6'>
                Set up your artist identity to start sharing your music with the
                world.
              </p>
              <Button
                color='primary'
                size='lg'
                startContent={<PlusIcon className='w-5 h-5' />}
                onClick={() => setShowForm(true)}
              >
                Create Artist Profile
              </Button>
            </CardBody>
          </Card>
        ) : showForm ? (
          /* Show Form */
          <div className='space-y-6'>
            {activeTab === 'profile' && (
              <ArtistProfileForm
                profile={profile || undefined}
                onSave={handleSaveProfile}
                onCancel={() => setShowForm(false)}
                isLoading={saving}
              />
            )}
            {activeTab === 'social' && profile && (
              <SocialLinksEditor
                socialLinks={profile.socialLinks}
                onSave={handleSaveSocialLinks}
                onCancel={() => setShowForm(false)}
                isLoading={saving}
              />
            )}
            {activeTab === 'streaming' && profile && (
              <StreamingLinksEditor
                streamingLinks={profile.streamingLinks}
                onSave={handleSaveStreamingLinks}
                onCancel={() => setShowForm(false)}
                isLoading={saving}
              />
            )}
          </div>
        ) : (
          /* Show Profile Management */
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Profile Display */}
            <div className='lg:col-span-2'>
              {profile && (
                <ArtistProfileCard
                  profile={profile}
                  showActions={false}
                  variant='detailed'
                />
              )}
            </div>

            {/* Management Panel */}
            <div className='space-y-6'>
              <Card>
                <CardBody className='p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Manage Profile
                  </h3>
                  <div className='space-y-3'>
                    <Button
                      variant='bordered'
                      className='w-full justify-start'
                      startContent={<UserIcon className='w-4 h-4' />}
                      onClick={() => {
                        setActiveTab('profile');
                        setShowForm(true);
                      }}
                    >
                      Edit Profile Info
                    </Button>
                    <Button
                      variant='bordered'
                      className='w-full justify-start'
                      startContent={<LinkIcon className='w-4 h-4' />}
                      onClick={() => {
                        setActiveTab('social');
                        setShowForm(true);
                      }}
                    >
                      Social Media Links
                    </Button>
                    <Button
                      variant='bordered'
                      className='w-full justify-start'
                      startContent={<MusicalNoteIcon className='w-4 h-4' />}
                      onClick={() => {
                        setActiveTab('streaming');
                        setShowForm(true);
                      }}
                    >
                      Streaming Platforms
                    </Button>
                    <Button
                      variant='bordered'
                      className='w-full justify-start'
                      startContent={<ChartBarIcon className='w-4 h-4' />}
                      onClick={() => {
                        // TODO: Navigate to analytics
                        alert('Analytics coming soon!');
                      }}
                    >
                      View Analytics
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardBody className='p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Quick Stats
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Total Plays
                      </span>
                      <span className='font-medium'>
                        {profile?.totalPlays.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Total Likes
                      </span>
                      <span className='font-medium'>
                        {profile?.totalLikes.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Followers
                      </span>
                      <span className='font-medium'>
                        {profile?.totalFollowers.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Profile Views
                      </span>
                      <span className='font-medium'>
                        {profile?.profileViews.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
