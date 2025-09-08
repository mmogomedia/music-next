'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import ImageUpload from '@/components/ui/ImageUpload';

interface ProfileImageUpdateProps {
  currentImage?: string;
  onImageUpdate: (_imageUrl: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProfileImageUpdate({
  currentImage,
  onImageUpdate,
  onCancel,
  isLoading = false,
}: ProfileImageUpdateProps) {
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview] = useState<string>(currentImage || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string>('');

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
    return data.url;
  };

  const handleImageChange = (file: File | null) => {
    setProfileImageFile(file);
  };

  const handleImageError = (error: string) => {
    setError(error);
  };

  const handleSave = async () => {
    if (!profileImageFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setIsUploadingImage(true);
      setError('');

      const imageUrl = await handleImageUpload(profileImageFile);
      await onImageUpdate(imageUrl);
    } catch (error) {
      console.error('Error updating profile image:', error);
      setError('Failed to update profile image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Card>
      <CardBody className='p-6'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <UserIcon className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              Update Profile Image
            </h3>
          </div>

          {/* Image Upload */}
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
            previewSize='lg'
            disabled={isLoading || isUploadingImage}
          />

          {/* Error Message */}
          {error && (
            <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 justify-end'>
            <Button
              variant='light'
              onPress={onCancel}
              disabled={isLoading || isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              color='primary'
              onPress={handleSave}
              isLoading={isLoading || isUploadingImage}
              disabled={!profileImageFile}
            >
              {isUploadingImage ? 'Uploading...' : 'Update Image'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
