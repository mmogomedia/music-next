'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  MusicalNoteIcon,
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { CreateArtistProfileData } from '@/types/artist-profile';
import ImageUpload from '@/components/ui/ImageUpload';

const GENRES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'Electronic',
  'Jazz',
  'Classical',
  'Country',
  'R&B',
  'Alternative',
  'Indie',
  'Reggae',
  'Blues',
  'Folk',
  'Punk',
  'Metal',
  'Funk',
  'Soul',
  'Gospel',
  'Other',
];

export default function CreateArtistProfilePage() {
  const router = useRouter();
  const { status } = useSession();
  const { createProfile, loading } = useArtistProfile();
  const [formData, setFormData] = useState<CreateArtistProfileData>({
    artistName: '',
    bio: '',
    profileImage: '',
    coverImage: '',
    location: '',
    website: '',
    genre: '',
    slug: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <MusicalNoteIcon className='w-5 h-5 text-white' />
          </div>
          <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  const handleInputChange = (
    field: keyof CreateArtistProfileData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-generate slug from artist name
    if (field === 'artistName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.artistName.trim()) {
      newErrors.artistName = 'Artist name is required';
    }

    if (!formData.genre) {
      newErrors.genre = 'Genre is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'profile');

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    // Store the full path (including user folder) for database storage
    return data.key || data.url;
  };

  const handleImageChange = (file: File | null) => {
    setProfileImageFile(file);
  };

  const handleImageError = (error: string) => {
    setErrors(prev => ({ ...prev, profileImage: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let profileImageUrl = formData.profileImage;

      // Upload profile image if selected
      if (profileImageFile) {
        setIsUploadingImage(true);
        try {
          profileImageUrl = await handleImageUpload(profileImageFile);
        } catch (error) {
          console.error('Error uploading image:', error);
          setErrors({
            submit: 'Failed to upload profile image. Please try again.',
          });
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const success = await createProfile({
        ...formData,
        profileImage: profileImageUrl,
        website: formData.website
          ? formData.website.startsWith('http')
            ? formData.website
            : `https://${formData.website}`
          : formData.website,
      });

      if (success) {
        router.push('/dashboard');
      } else {
        setErrors({ submit: 'Failed to create profile. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-4'>
              <Link href='/profile/select'>
                <Button isIconOnly variant='light' size='sm'>
                  <ArrowLeftIcon className='w-5 h-5' />
                </Button>
              </Link>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <MusicalNoteIcon className='w-5 h-5 text-white' />
                </div>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                  Create Artist Profile
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24'>
        <Card>
          <CardBody className='p-8'>
            <div className='text-center mb-8'>
              <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <UserIcon className='w-8 h-8 text-blue-600' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                Set Up Your Artist Profile
              </h2>
              <p className='text-gray-600 dark:text-gray-400'>
                Tell us about yourself and start sharing your music with the
                world
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Artist Name */}
              <Input
                label='Artist Name'
                placeholder='Enter your artist name'
                value={formData.artistName}
                onValueChange={value => handleInputChange('artistName', value)}
                isInvalid={!!errors.artistName}
                errorMessage={errors.artistName}
                isRequired
                startContent={
                  <MusicalNoteIcon className='w-5 h-5 text-gray-400' />
                }
              />

              {/* Genre */}
              <Select
                label='Primary Genre'
                placeholder='Select your primary genre'
                selectedKeys={formData.genre ? [formData.genre] : []}
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange('genre', selected || '');
                }}
                isInvalid={!!errors.genre}
                errorMessage={errors.genre}
                isRequired
              >
                {GENRES.map(genre => (
                  <SelectItem key={genre}>{genre}</SelectItem>
                ))}
              </Select>

              {/* Bio */}
              <Textarea
                label='Bio'
                placeholder='Tell us about yourself, your music, and your journey...'
                value={formData.bio}
                onValueChange={value => handleInputChange('bio', value)}
                rows={4}
                startContent={<UserIcon className='w-5 h-5 text-gray-400' />}
              />

              {/* Location */}
              <Input
                label='Location'
                placeholder='City, Country'
                value={formData.location}
                onValueChange={value => handleInputChange('location', value)}
                startContent={<MapPinIcon className='w-5 h-5 text-gray-400' />}
              />

              {/* Website */}
              <Input
                label='Website'
                placeholder='https://yourwebsite.com'
                value={formData.website}
                onValueChange={value => handleInputChange('website', value)}
                isInvalid={!!errors.website}
                errorMessage={errors.website}
                startContent={
                  <GlobeAltIcon className='w-5 h-5 text-gray-400' />
                }
              />

              {/* Profile Image */}
              <ImageUpload
                label='Profile Image'
                preview={profileImagePreview}
                onImageChange={handleImageChange}
                onError={handleImageError}
                aspectRatio={1}
                minWidth={500}
                minHeight={500}
                maxWidth={1000}
                maxHeight={1000}
                maxFileSize={5}
                previewSize='md'
                disabled={isSubmitting || isUploadingImage}
              />

              {/* Error Message */}
              {errors.submit && (
                <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <p className='text-red-600 dark:text-red-400 text-sm'>
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className='flex gap-4 pt-4'>
                <Button
                  type='button'
                  variant='light'
                  className='flex-1'
                  onPress={() => router.push('/profile/select')}
                >
                  Back
                </Button>
                <Button
                  type='submit'
                  color='primary'
                  className='flex-1'
                  isLoading={isSubmitting || loading || isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading Image...' : 'Create Profile'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
