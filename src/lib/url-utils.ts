/**
 * Utility functions for constructing URLs from file paths
 *
 * Required Environment Variables:
 * - R2_PUBLIC_URL: The public domain for accessing files (e.g., "asset.flemoji.com")
 * - R2_BUCKET_NAME: The R2 bucket name for storing files
 */

/**
 * Get the public URL base from environment variables
 * Used for both audio and image files
 */
export function getPublicUrlBase(): string {
  // Use R2_PUBLIC_URL for all assets
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

  // Throw error if R2_PUBLIC_URL is not set
  throw new Error(
    'R2_PUBLIC_URL environment variable is not configured. Please set it to your R2 public domain (e.g., "asset.flemoji.com")'
  );
}

/**
 * Construct a full URL from a file path
 * Used for both audio and image files
 * @param filePath - The file path stored in the database (e.g., "audio/userId/fileId.mp3" or "image/userId/fileId.jpg")
 * @returns The complete URL for accessing the file
 */
export function constructFileUrl(filePath: string): string {
  if (!filePath) {
    console.error('constructFileUrl: filePath is undefined or null');
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
