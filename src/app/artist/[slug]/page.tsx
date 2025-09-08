'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import {
  PlayIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlaySolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import ArtistProfileCard from '@/components/artist/ArtistProfileCard';
import { ArtistProfile } from '@/types/artist-profile';
import Image from 'next/image';

export default function PublicArtistProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/artist-profile/${params.slug}`);

        if (response.ok) {
          const data = await response.json();
          setProfile(data.artistProfile);
        } else if (response.status === 404) {
          setError('Artist profile not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchProfile();
    }
  }, [params.slug]);

  const handlePlayAll = () => {
    // TODO: Implement play all functionality
    console.log('Play all tracks');
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
    console.log('Follow artist');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.artistName} - Artist Profile`,
        text: `Check out ${profile?.artistName}'s music on Flemoji`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <Spinner size='lg' />
          <p className='mt-4 text-gray-500 dark:text-gray-400'>
            Loading artist profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardBody className='p-8 text-center'>
            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-8 h-8 text-red-600 dark:text-red-400' />
            </div>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
              Profile Not Found
            </h2>
            <p className='text-gray-500 dark:text-gray-400 mb-6'>
              {error || 'This artist profile could not be found.'}
            </p>
            <Button color='primary' onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0'>
                {profile.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.artistName}
                    width={64}
                    height={64}
                    className='w-16 h-16 rounded-full object-cover'
                  />
                ) : (
                  <MusicalNoteIcon className='w-8 h-8 text-white' />
                )}
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {profile.artistName}
                </h1>
                <p className='text-gray-500 dark:text-gray-400'>
                  Artist Profile
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Button
                color='primary'
                startContent={<PlayIcon className='w-4 h-4' />}
                onClick={handlePlayAll}
              >
                Play All
              </Button>
              <Button
                variant='bordered'
                startContent={<HeartIcon className='w-4 h-4' />}
                onClick={handleFollow}
              >
                Follow
              </Button>
              <Button isIconOnly variant='light' onClick={handleShare}>
                <ShareIcon className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Profile Information */}
          <div className='lg:col-span-2'>
            <ArtistProfileCard
              profile={profile}
              showActions={false}
              variant='detailed'
            />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Stats */}
            <Card>
              <CardBody className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Stats
                </h3>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <PlaySolidIcon className='w-4 h-4 text-blue-600' />
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Total Plays
                      </span>
                    </div>
                    <span className='font-semibold text-gray-900 dark:text-white'>
                      {profile.totalPlays.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <HeartSolidIcon className='w-4 h-4 text-pink-600' />
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Total Likes
                      </span>
                    </div>
                    <span className='font-semibold text-gray-900 dark:text-white'>
                      {profile.totalLikes.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Followers
                      </span>
                    </div>
                    <span className='font-semibold text-gray-900 dark:text-white'>
                      {profile.totalFollowers.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Profile Views
                      </span>
                    </div>
                    <span className='font-semibold text-gray-900 dark:text-white'>
                      {profile.profileViews.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Location & Website */}
            {(profile.location || profile.website) && (
              <Card>
                <CardBody className='p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Info
                  </h3>
                  <div className='space-y-3'>
                    {profile.location && (
                      <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <MapPinIcon className='w-4 h-4 flex-shrink-0' />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className='flex items-center gap-2 text-sm'>
                        <GlobeAltIcon className='w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-400' />
                        <a
                          href={profile.website}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1'
                        >
                          <span>Website</span>
                          <ArrowTopRightOnSquareIcon className='w-3 h-3' />
                        </a>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Recent Tracks */}
            {profile.tracks && profile.tracks.length > 0 && (
              <Card>
                <CardBody className='p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Recent Tracks
                  </h3>
                  <div className='space-y-3'>
                    {profile.tracks.slice(0, 5).map(track => (
                      <div
                        key={track.id}
                        className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                      >
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <PlayIcon className='w-4 h-4 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                            {track.title}
                          </h4>
                          <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                            <span>
                              {track.playCount.toLocaleString()} plays
                            </span>
                            <span>
                              {(track.likeCount || 0).toLocaleString()} likes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
