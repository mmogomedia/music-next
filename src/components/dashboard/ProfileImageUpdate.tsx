'use client';

import React, { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import ImageUpload from '@/components/ui/ImageUpload';
import { uploadImageToR2 } from '@/lib/image-upload';
import FCard from '@/components/ui/FCard';
import FButton from '@/components/ui/FButton';

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
    return uploadImageToR2(file);
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
    } catch (err) {
      console.error('Error updating profile image:', err);
      setError('Failed to update profile image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <FCard variant='default' padding='md'>
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <UserIcon className='w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0' />
          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
            Update Profile Image
          </h3>
        </div>

        <ImageUpload
          label='Profile Image'
          preview={profileImagePreview}
          onImageChange={file => setProfileImageFile(file)}
          onError={err => setError(err)}
          aspectRatio={1}
          minWidth={500}
          minHeight={500}
          maxWidth={1000}
          maxHeight={1000}
          maxFileSize={5}
          previewSize='lg'
          disabled={isLoading || isUploadingImage}
        />

        {error && (
          <div className='p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg'>
            <p className='text-rose-600 dark:text-rose-400 text-sm'>{error}</p>
          </div>
        )}

        <div className='flex gap-3 justify-end'>
          <FButton
            variant='ghost'
            onPress={onCancel}
            isDisabled={isLoading || isUploadingImage}
          >
            Cancel
          </FButton>
          <FButton
            variant='primary'
            onPress={handleSave}
            isLoading={isLoading || isUploadingImage}
            isDisabled={!profileImageFile}
          >
            {isUploadingImage ? 'Uploading...' : 'Update Image'}
          </FButton>
        </div>
      </div>
    </FCard>
  );
}
