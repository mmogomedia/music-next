/**
 * Utility functions for constructing URLs from file paths
 */

/**
 * Get the public URL base from environment variables
 */
export function getPublicUrlBase(): string {
  // First try R2_PUBLIC_URL if set
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

  // Fallback to custom domain
  return 'https://audio.flemoji.com';
}

/**
 * Construct a full URL from a file path
 * @param filePath - The file path stored in the database
 * @returns The complete URL for accessing the file
 */
export function constructFileUrl(filePath: string): string {
  const baseUrl = getPublicUrlBase();

  // Ensure filePath doesn't start with a slash to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  return `${baseUrl}/${cleanPath}`;
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
