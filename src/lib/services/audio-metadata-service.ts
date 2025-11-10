/**
 * Service for extracting metadata from audio files
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { parseBuffer, type IAudioMetadata } from 'music-metadata';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: process.env.R2_REGION!,
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface ExtractedMetadata {
  duration: number | null;
  bpm: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  releaseDate?: Date | null;
}

/**
 * Extract metadata from an audio file stored in R2
 * @param filePath - The file path in R2 (e.g., "audio/userId/fileId.mp3")
 * @returns Extracted metadata or null if extraction fails
 */
export async function extractAudioMetadata(
  filePath: string
): Promise<ExtractedMetadata | null> {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      console.error('R2_BUCKET_NAME environment variable is not set');
      return null;
    }

    // Download the file from R2
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      console.error('No file body returned from R2');
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // Parse metadata from buffer
    const metadata: IAudioMetadata = await parseBuffer(buffer);

    // Extract duration in seconds (convert from milliseconds if needed)
    const duration = metadata.format.duration
      ? Math.round(metadata.format.duration)
      : null;

    // Extract BPM from common tags
    let bpm: number | null = null;
    if (metadata.common.bpm) {
      const bpmValue = Array.isArray(metadata.common.bpm)
        ? metadata.common.bpm[0]
        : metadata.common.bpm;
      bpm = typeof bpmValue === 'number' ? Math.round(bpmValue) : null;
    }

    // Extract technical metadata
    const bitrate = metadata.format.bitrate || null;
    const sampleRate = metadata.format.sampleRate || null;
    const channels = metadata.format.numberOfChannels || null;

    // Extract common metadata
    const title = metadata.common.title?.[0] || undefined;
    const artist = metadata.common.artist?.[0] || undefined;
    const album = metadata.common.album?.[0] || undefined;
    const genre = metadata.common.genre?.[0] || undefined;

    // Extract year and convert to release date
    let year: number | undefined;
    let releaseDate: Date | null = null;

    if (metadata.common.date) {
      const dateValue = Array.isArray(metadata.common.date)
        ? metadata.common.date[0]
        : metadata.common.date;

      if (dateValue) {
        try {
          releaseDate = new Date(dateValue);
          if (!isNaN(releaseDate.getTime())) {
            year = releaseDate.getFullYear();
          } else {
            releaseDate = null;
          }
        } catch {
          releaseDate = null;
        }
      }
    } else if (metadata.common.year) {
      const yearValue = Array.isArray(metadata.common.year)
        ? metadata.common.year[0]
        : metadata.common.year;
      year = typeof yearValue === 'number' ? yearValue : undefined;
      if (year) {
        releaseDate = new Date(year, 0, 1); // January 1st of the year
      }
    }

    return {
      duration,
      bpm,
      bitrate,
      sampleRate,
      channels,
      title,
      artist,
      album,
      genre,
      year,
      releaseDate,
    };
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    return null;
  }
}
