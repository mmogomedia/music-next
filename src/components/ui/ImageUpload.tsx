'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PhotoIcon,
  ScissorsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ImageCropper from './ImageCropper';
import FButton from './FButton';

interface ImageUploadProps {
  label?: string;
  preview?: string;
  onImageChange: (_file: File | null) => void;
  onError?: (_error: string) => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showCropButton?: boolean;
  showRemoveButton?: boolean;
  previewSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Image',
  preview,
  onImageChange,
  onError,
  disabled = false,
  className = '',
  aspectRatio = 1,
  minWidth = 500,
  minHeight = 500,
  maxWidth = 1000,
  maxHeight = 1000,
  maxFileSize = 5,
  acceptedTypes = ['image/*'],
  showCropButton = true,
  showRemoveButton = true,
  previewSize = 'md',
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(preview || '');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when prop changes
  useEffect(() => {
    if (preview) {
      setPreviewUrl(preview);
    }
  }, [preview]);

  const previewSizes = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-80 h-80',
  };

  const inputId = `image-upload-${label ? label.toLowerCase().replace(/\s+/g, '-') : 'file'}`;

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      return file.type === type;
    });

    if (!isValidType) {
      return { valid: false, error: 'Please select a valid image file' };
    }

    // Check file size
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Image size must be less than ${maxFileSize}MB`,
      };
    }

    return { valid: true };
  };

  const validateImageDimensions = (
    file: File
  ): Promise<{ valid: boolean; error?: string }> => {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const { width, height } = img;

        // Only check minimum dimensions - aspect ratio will be handled by cropping
        if (width < minWidth || height < minHeight) {
          resolve({
            valid: false,
            error: `Image must be at least ${minWidth}x${minHeight} pixels`,
          });
          return;
        }

        // Check if image is too large (optional - can be resized during crop)
        if (width > maxWidth * 2 || height > maxHeight * 2) {
          resolve({
            valid: false,
            error: `Image is too large. Please select a smaller image.`,
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: 'Invalid image file' });
      };

      img.src = url;
    });
  };

  const handleFileSelect = async (file: File) => {
    // Clear previous errors
    setError('');

    // Basic validation
    const basicValidation = validateImage(file);
    if (!basicValidation.valid) {
      const errorMsg = basicValidation.error || 'Invalid image';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Dimension validation
    const dimensionValidation = await validateImageDimensions(file);
    if (!dimensionValidation.valid) {
      const errorMsg = dimensionValidation.error || 'Invalid image dimensions';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Store original file and show cropper
    setOriginalImageFile(file);

    // Create preview for cropper
    const reader = new FileReader();
    reader.onload = e => {
      setPreviewUrl(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
        type: 'image/jpeg',
      });

      // Update preview with the cropped image
      setPreviewUrl(URL.createObjectURL(croppedBlob));

      // Store the cropped file as the new original file
      setOriginalImageFile(croppedFile);

      // Notify parent component with the cropped file
      onImageChange(croppedFile);

      setShowCropper(false);
    } catch (error) {
      const errorMsg = 'Failed to process cropped image';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setOriginalImageFile(null);
    onImageChange(null);
    setError('');

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropClick = () => {
    if (originalImageFile || previewUrl) {
      setShowCropper(true);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
          {label}
        </label>
      )}

      <div className='space-y-3'>
        {/* Image Preview — shown when an image is set */}
        {previewUrl && (
          <div className='flex justify-center'>
            <div className='relative'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt='Preview'
                className={`${previewSizes[previewSize]} object-cover rounded-xl border border-gray-200 dark:border-gray-700`}
              />
              <div className='absolute -top-2 -right-2 flex gap-1'>
                {showCropButton && (originalImageFile || previewUrl) && (
                  <button
                    type='button'
                    onClick={handleCropClick}
                    className='w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-sm'
                    title='Crop image'
                    disabled={disabled}
                  >
                    <ScissorsIcon className='w-3 h-3' />
                  </button>
                )}
                {showRemoveButton && (
                  <button
                    type='button'
                    onClick={handleRemove}
                    className='w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-sm'
                    title='Remove image'
                    disabled={disabled}
                  >
                    <XMarkIcon className='w-3 h-3' />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input — always in DOM so fileInputRef is always valid */}
        <input
          ref={fileInputRef}
          type='file'
          accept={acceptedTypes.join(',')}
          onChange={handleImageChange}
          className='hidden'
          id={inputId}
          disabled={disabled}
        />

        {/* Upload area — shown only when no image is set */}
        {!previewUrl && (
          <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors'>
            <PhotoIcon className='w-10 h-10 text-gray-400 mx-auto mb-2' />
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
              Upload an image (min {minWidth}&times;{minHeight}px)
            </p>
            <FButton
              variant='outline'
              size='sm'
              isDisabled={disabled}
              onPress={() => fileInputRef.current?.click()}
            >
              Choose Image
            </FButton>
          </div>
        )}

        {/* Compact change-image button — shown when image is already set */}
        {previewUrl && (
          <div className='flex justify-center gap-2'>
            <FButton
              variant='outline'
              size='sm'
              startContent={<PhotoIcon className='w-4 h-4' />}
              isDisabled={disabled}
              onPress={() => fileInputRef.current?.click()}
            >
              Change image
            </FButton>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
        )}
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        onCrop={handleCropComplete}
        imageSrc={previewUrl}
        aspectRatio={aspectRatio}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      />
    </div>
  );
};

export default ImageUpload;
