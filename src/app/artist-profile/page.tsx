'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import {
  FSpinner,
  FCard,
  FButton,
  FEmptyState,
  FPageHeader,
  FSection,
  FStat,
} from '@/components/ui';

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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    return <FSpinner size='lg' fullScreen />;
  }

  if (!session?.user?.id) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <FCard padding='lg' className='max-w-md w-full'>
          <div className='text-center'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
              Access Denied
            </h2>
            <p className='text-gray-500 dark:text-gray-400'>
              Please sign in to manage your artist profile.
            </p>
          </div>
        </FCard>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <FSection maxWidth='wide' padding='md'>
        {/* Header */}
        <div className='mb-8'>
          <FPageHeader
            title='Artist Profile'
            subtitle='Manage your artist identity and social media presence'
          />
        </div>

        {!profile && !showForm ? (
          /* No Profile - Show Create Button */
          <div className='max-w-2xl mx-auto'>
            <FEmptyState
              icon={UserIcon}
              title='Create Your Artist Profile'
              description='Set up your artist identity to start sharing your music with the world.'
              action={{
                label: 'Create Artist Profile',
                onPress: () => setShowForm(true),
                variant: 'primary',
              }}
              size='lg'
            />
          </div>
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
              <FCard variant='default' padding='md'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Manage Profile
                </h3>
                <div className='space-y-3'>
                  <FButton
                    variant='outline'
                    fullWidth
                    startContent={<UserIcon className='w-4 h-4' />}
                    onPress={() => {
                      setActiveTab('profile');
                      setShowForm(true);
                    }}
                  >
                    Edit Profile Info
                  </FButton>
                  <FButton
                    variant='outline'
                    fullWidth
                    startContent={<LinkIcon className='w-4 h-4' />}
                    onPress={() => {
                      setActiveTab('social');
                      setShowForm(true);
                    }}
                  >
                    Social Media Links
                  </FButton>
                  <FButton
                    variant='outline'
                    fullWidth
                    startContent={<MusicalNoteIcon className='w-4 h-4' />}
                    onPress={() => {
                      setActiveTab('streaming');
                      setShowForm(true);
                    }}
                  >
                    Streaming Platforms
                  </FButton>
                  <FButton
                    variant='outline'
                    fullWidth
                    startContent={<ChartBarIcon className='w-4 h-4' />}
                    onPress={() => {
                      alert('Analytics coming soon!');
                    }}
                  >
                    View Analytics
                  </FButton>
                </div>
              </FCard>

              {/* Quick Stats */}
              <FCard variant='default' padding='md'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Quick Stats
                </h3>
                <div className='space-y-3'>
                  <FStat
                    layout='stacked'
                    label='Total Plays'
                    value={(profile?.totalPlays ?? 0).toLocaleString()}
                    size='sm'
                    color='purple'
                  />
                  <FStat
                    layout='stacked'
                    label='Total Likes'
                    value={(profile?.totalLikes ?? 0).toLocaleString()}
                    size='sm'
                    color='red'
                  />
                  <FStat
                    layout='stacked'
                    label='Followers'
                    value={(profile?.totalFollowers ?? 0).toLocaleString()}
                    size='sm'
                    color='blue'
                  />
                  <FStat
                    layout='stacked'
                    label='Profile Views'
                    value={(profile?.profileViews ?? 0).toLocaleString()}
                    size='sm'
                    color='teal'
                  />
                </div>
              </FCard>
            </div>
          </div>
        )}

        {/* Create Profile CTA (when no profile and form is shown, add back button) */}
        {showForm && (
          <div className='mt-4'>
            <FButton
              variant='ghost'
              startContent={<PlusIcon className='w-4 h-4 rotate-45' />}
              onPress={() => setShowForm(false)}
            >
              Back
            </FButton>
          </div>
        )}
      </FSection>
    </div>
  );
}
