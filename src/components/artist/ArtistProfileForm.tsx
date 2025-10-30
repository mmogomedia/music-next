'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Card, CardBody } from '@heroui/react';
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
      // Set the preview for existing images
      setProfileImagePreview(profile.profileImage || '');
      setCoverImagePreview(profile.coverImage || '');
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
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
      // If URL doesn't start with protocol, add https://
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

  const isValidSlug = (slug: string) => {
    return /^[a-zA-Z0-9-]+$/.test(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const finalFormData = { ...formData };

      // Upload profile image if a new one was selected
      if (profileImageFile) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await handleImageUpload(profileImageFile);
          finalFormData.profileImage = imageUrl;
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

      // Upload cover image if a new one was selected
      if (coverImageFile) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await handleImageUpload(coverImageFile);
          finalFormData.coverImage = imageUrl;
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

  const handleImageUpload = async (file: File): Promise<string> => {
    const key = await uploadImageToR2(file);
    return key;
  };

  const handleImageChange = (file: File | null) => {
    setProfileImageFile(file);
  };

  const handleImageError = (error: string) => {
    setErrors(prev => ({ ...prev, profileImage: error }));
  };

  const handleCoverImageChange = (file: File | null) => {
    setCoverImageFile(file);
  };

  const handleCoverImageError = (error: string) => {
    setErrors(prev => ({ ...prev, coverImage: error }));
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardBody className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
            <UserIcon className='w-6 h-6 text-white' />
          </div>
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
          <div>
            <label
              htmlFor='artistName'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Artist Name *
            </label>
            <Input
              id='artistName'
              value={formData.artistName}
              onChange={e => handleInputChange('artistName', e.target.value)}
              placeholder='Enter your artist name'
              startContent={
                <MusicalNoteIcon className='w-5 h-5 text-gray-400' />
              }
              isInvalid={!!errors.artistName}
              errorMessage={errors.artistName}
              className='w-full'
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor='bio'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Bio
            </label>
            <Textarea
              id='bio'
              value={formData.bio}
              onChange={e => handleInputChange('bio', e.target.value)}
              placeholder='Tell us about your music, style, and story...'
              minRows={3}
              maxRows={6}
              className='w-full'
            />
          </div>

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
            disabled={isLoading || isUploadingImage}
          />

          {/* Cover Image */}
          <ImageUpload
            label='Cover Image'
            preview={coverImagePreview}
            onImageChange={handleCoverImageChange}
            onError={handleCoverImageError}
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
          <div>
            <label
              htmlFor='location'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Location
            </label>
            <Input
              id='location'
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder='City, Country'
              startContent={<MapPinIcon className='w-5 h-5 text-gray-400' />}
              className='w-full'
            />
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor='website'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Website
            </label>
            <Input
              id='website'
              value={formData.website}
              onChange={e => handleInputChange('website', e.target.value)}
              placeholder='https://yourwebsite.com'
              startContent={<GlobeAltIcon className='w-5 h-5 text-gray-400' />}
              isInvalid={!!errors.website}
              errorMessage={errors.website}
              className='w-full'
            />
          </div>

          {/* Genre */}
          <div>
            <label
              htmlFor='genre'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Genre
            </label>
            <Input
              id='genre'
              value={formData.genre}
              onChange={e => handleInputChange('genre', e.target.value)}
              placeholder='e.g., Electronic, Pop, Rock, Hip Hop'
              startContent={
                <MusicalNoteIcon className='w-5 h-5 text-gray-400' />
              }
              className='w-full'
            />
          </div>

          {/* Custom Slug */}
          <div>
            <label
              htmlFor='slug'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Custom URL Slug
            </label>
            <div className='flex gap-2'>
              <Input
                id='slug'
                value={formData.slug}
                onChange={e => handleInputChange('slug', e.target.value)}
                placeholder='your-custom-url'
                startContent={<LinkIcon className='w-5 h-5 text-gray-400' />}
                isInvalid={!!errors.slug}
                errorMessage={errors.slug}
                className='flex-1'
              />
              <Button
                type='button'
                variant='bordered'
                onClick={generateSlug}
                className='px-4'
              >
                Generate
              </Button>
            </div>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
              This will be your profile URL: flemoji.com/artist/
              {formData.slug || 'your-custom-url'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='bordered'
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              color='primary'
              isLoading={isLoading || isUploadingImage}
              disabled={!formData.artistName.trim()}
            >
              {isUploadingImage
                ? 'Uploading Image...'
                : profile
                  ? 'Update Profile'
                  : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
