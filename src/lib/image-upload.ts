import { useState } from 'react';
import { api } from './api-client';

/**
 * Utility function for uploading images to R2 storage
 * Returns the file path (key) that should be stored in the database
 */
export async function uploadImageToR2(file: File): Promise<string> {
  const response = await api.upload.image(file);
  return response.data.key; // Return the file path for database storage
}

/**
 * Hook for handling image uploads with error handling and loading states
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const key = await uploadImageToR2(file);
      return key;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    error,
    clearError: () => setError(null),
  };
}
