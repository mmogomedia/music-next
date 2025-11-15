/**
 * Utility functions for constructing URLs from file paths
 *
 * Required Environment Variables:
 * - R2_PUBLIC_URL: The public domain for accessing files (server-side, e.g., "asset.flemoji.com")
 * - NEXT_PUBLIC_R2_PUBLIC_URL: The public domain for accessing files (client-side, e.g., "https://asset.flemoji.com")
 * - R2_BUCKET_NAME: The R2 bucket name for storing files
 */

/**
 * Get the public URL base from environment variables
 * Used for both audio and image files
 * Works on both server and client side
 */
export function getPublicUrlBase(): string {
  // Try client-side environment variable first (for client components)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  }

  // In server environments, NEXT_PUBLIC vars are also available on process.env
  if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  }

  // Try server-side environment variable (for server components and API routes)
  if (process.env.R2_PUBLIC_URL) {
    const url = process.env.R2_PUBLIC_URL;
    // Ensure it's an absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    } else {
      // If it's a relative URL, prepend https://
      return `https://${url}`;
    }
  }

  // Fallback for development - you can hardcode this temporarily
  if (process.env.NODE_ENV === 'development') {
    return 'https://asset.flemoji.com';
  }

  // Throw error if R2_PUBLIC_URL is not set
  throw new Error(
    'R2_PUBLIC_URL or NEXT_PUBLIC_R2_PUBLIC_URL environment variable is not configured. Please set it to your R2 public domain (e.g., "asset.flemoji.com")'
  );
}

/**
 * Construct a full URL from a file path
 * Used for both audio and image files
 * @param filePath - The file path stored in the database (e.g., "audio/userId/fileId.mp3" or "image/userId/fileId.jpg")
 * @returns The complete URL for accessing the file
 */
export function constructFileUrl(filePath?: string | null): string {
  if (!filePath) {
    return '';
  }

  try {
    const baseUrl = getPublicUrlBase();

    // If filePath already contains the base URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Ensure filePath doesn't start with a slash to avoid double slashes
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullUrl = `${baseUrl}/${cleanPath}`;

    return fullUrl;
  } catch (error) {
    console.error('constructFileUrl: Failed to get public URL base:', error);
    return '';
  }
}

/**
 * Extract file path from a full URL
 * @param fullUrl - The complete URL
 * @returns The file path that should be stored in the database
 */
export function extractFilePath(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  } catch (error) {
    console.error('Error extracting file path from URL:', fullUrl, error);
    return fullUrl; // Fallback to the original string
  }
}
