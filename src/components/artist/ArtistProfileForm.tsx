'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  MapPinIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import {
  ArtistProfile,
  CreateArtistProfileData,
  UpdateArtistProfileData,
} from '@/types/artist-profile';
import ImageUpload from '@/components/ui/ImageUpload';
import { uploadImageToR2 } from '@/lib/image-upload';
import { FCard, FButton, FInput, FTextarea } from '@/components/ui';

interface ArtistProfileFormProps {
  profile?: ArtistProfile;
  onSave: (_data: CreateArtistProfileData | UpdateArtistProfileData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ArtistProfileForm({
  profile,
  onSave,
  onCancel,
  isLoading = false,
}: ArtistProfileFormProps) {
  const [formData, setFormData] = useState({
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        artistName: profile.artistName || '',
        bio: profile.bio || '',
        profileImage: profile.profileImage || '',
        coverImage: profile.coverImage || '',
        location: profile.location || '',
        website: profile.website || '',
        genre: profile.genre || '',
        slug: profile.slug || '',
      });
      setProfileImagePreview(profile.profileImage || '');
      setCoverImagePreview(profile.coverImage || '');
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.artistName.trim()) {
      newErrors.artistName = 'Artist name is required';
    }
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    if (formData.slug && !isValidSlug(formData.slug)) {
      newErrors.slug = 'Slug can only contain letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      const urlToTest =
        url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `https://${url}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const isValidSlug = (slug: string) => /^[a-zA-Z0-9-]+$/.test(slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const finalFormData = { ...formData };

      if (profileImageFile) {
        setIsUploadingImage(true);
        try {
          finalFormData.profileImage =
            await handleImageUpload(profileImageFile);
        } catch (error) {
          console.error('Error uploading profile image:', error);
          setErrors(prev => ({
            ...prev,
            profileImage: 'Failed to upload profile image. Please try again.',
          }));
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (coverImageFile) {
        setIsUploadingImage(true);
        try {
          finalFormData.coverImage = await handleImageUpload(coverImageFile);
        } catch (error) {
          console.error('Error uploading cover image:', error);
          setErrors(prev => ({
            ...prev,
            coverImage: 'Failed to upload cover image. Please try again.',
          }));
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      onSave(finalFormData);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const generateSlug = () => {
    const slug = formData.artistName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    handleInputChange('slug', slug);
  };

  const handleImageUpload = async (file: File): Promise<string> =>
    uploadImageToR2(file);

  return (
    <FCard variant='default' padding='md' className='w-full max-w-2xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <UserIcon className='w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0' />
        <div>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            {profile ? 'Edit Artist Profile' : 'Create Artist Profile'}
          </h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {profile
              ? 'Update your artist information'
              : 'Set up your artist identity'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Artist Name */}
        <FInput
          id='artistName'
          label='Artist Name *'
          value={formData.artistName}
          onChange={e => handleInputChange('artistName', e.target.value)}
          placeholder='Enter your artist name'
          startContent={<MusicalNoteIcon className='w-5 h-5 text-gray-400' />}
          isInvalid={!!errors.artistName}
          errorMessage={errors.artistName}
        />

        {/* Bio */}
        <FTextarea
          id='bio'
          label='Bio'
          value={formData.bio}
          onChange={e => handleInputChange('bio', e.target.value)}
          placeholder='Tell us about your music, style, and story...'
          minRows={3}
          maxRows={6}
        />

        {/* Profile Image */}
        <ImageUpload
          label='Profile Image'
          preview={profileImagePreview}
          onImageChange={file => setProfileImageFile(file)}
          onError={err => setErrors(prev => ({ ...prev, profileImage: err }))}
          aspectRatio={1}
          minWidth={500}
          minHeight={500}
          maxWidth={1000}
          maxHeight={1000}
          maxFileSize={5}
          previewSize='md'
          disabled={isLoading || isUploadingImage}
        />

        {/* Cover Image */}
        <ImageUpload
          label='Cover Image'
          preview={coverImagePreview}
          onImageChange={file => setCoverImageFile(file)}
          onError={err => setErrors(prev => ({ ...prev, coverImage: err }))}
          aspectRatio={16 / 9}
          minWidth={800}
          minHeight={450}
          maxWidth={1920}
          maxHeight={1080}
          maxFileSize={5}
          previewSize='lg'
          disabled={isLoading || isUploadingImage}
        />

        {/* Location */}
        <FInput
          id='location'
          label='Location'
          value={formData.location}
          onChange={e => handleInputChange('location', e.target.value)}
          placeholder='City, Country'
          startContent={<MapPinIcon className='w-5 h-5 text-gray-400' />}
        />

        {/* Website */}
        <FInput
          id='website'
          label='Website'
          value={formData.website}
          onChange={e => handleInputChange('website', e.target.value)}
          placeholder='https://yourwebsite.com'
          startContent={<GlobeAltIcon className='w-5 h-5 text-gray-400' />}
          isInvalid={!!errors.website}
          errorMessage={errors.website}
        />

        {/* Genre */}
        <FInput
          id='genre'
          label='Genre'
          value={formData.genre}
          onChange={e => handleInputChange('genre', e.target.value)}
          placeholder='e.g., Electronic, Pop, Rock, Hip Hop'
          startContent={<MusicalNoteIcon className='w-5 h-5 text-gray-400' />}
        />

        {/* Custom Slug */}
        <div>
          <div className='flex gap-2'>
            <FInput
              id='slug'
              label='Custom URL Slug'
              value={formData.slug}
              onChange={e => handleInputChange('slug', e.target.value)}
              placeholder='your-custom-url'
              startContent={<LinkIcon className='w-5 h-5 text-gray-400' />}
              isInvalid={!!errors.slug}
              errorMessage={errors.slug}
              className='flex-1'
            />
            <div className='flex items-end pb-0.5'>
              <FButton type='button' variant='outline' onPress={generateSlug}>
                Generate
              </FButton>
            </div>
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            This will be your profile URL: flemoji.com/artist/
            {formData.slug || 'your-custom-url'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4'>
          <FButton
            type='button'
            variant='ghost'
            onPress={onCancel}
            isDisabled={isLoading}
          >
            Cancel
          </FButton>
          <FButton
            type='submit'
            variant='primary'
            isLoading={isLoading || isUploadingImage}
            isDisabled={!formData.artistName.trim()}
          >
            {isUploadingImage
              ? 'Uploading Image...'
              : profile
                ? 'Update Profile'
                : 'Create Profile'}
          </FButton>
        </div>
      </form>
    </FCard>
  );
}
