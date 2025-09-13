# Phase 4: Music Upload & Track Management System

## 🎯 Objective

Implement a comprehensive music upload system with advanced track editing capabilities, metadata management, and file protection features. Artists can upload audio files, edit track details, configure privacy settings, and apply advanced protection measures.

## 📋 Prerequisites

- Phase 1, 2, & 3 completed successfully
- Enhanced database schema with comprehensive Track model
- AWS S3 account and credentials configured
- File upload and metadata management dependencies installed
- HeroUI components for advanced form interfaces

## 🚀 Step-by-Step Implementation

### 1. Enhanced Database Schema

The Track model has been significantly enhanced with comprehensive metadata and file protection fields:

```prisma
model Track {
  id              String    @id @default(cuid())
  title           String
  filePath        String    // Store only the file path, not full URL
  uniqueUrl       String    @unique // Unique URL for each track
  coverImageUrl   String?
  albumArtwork    String?   // Album artwork image

  // Basic Metadata
  genre           String?
  album           String?
  artist          String?   // Can be different from profile artist name
  composer        String?
  year            Int?
  releaseDate     DateTime?
  bpm             Int?      // Beats per minute
  isrc            String?   // International Standard Recording Code
  description     String?   @db.Text
  lyrics          String?   @db.Text

  // Technical Details
  duration        Int?      // Duration in seconds
  fileSize        Int?      // File size in bytes
  bitrate         Int?      // Audio bitrate
  sampleRate      Int?      // Audio sample rate
  channels        Int?      // Audio channels (1=mono, 2=stereo)

  // Privacy & Access Control
  isPublic        Boolean   @default(true)
  isDownloadable  Boolean   @default(false)
  isExplicit      Boolean   @default(false)

  // File Protection
  watermarkId     String?   // Unique watermark identifier
  copyrightInfo   String?   @db.Text
  licenseType     String?   // e.g., "All Rights Reserved", "Creative Commons"
  distributionRights String? @db.Text

  // Analytics
  playCount       Int       @default(0)
  likeCount       Int       @default(0)
  downloadCount   Int       @default(0)
  shareCount      Int       @default(0)

  // Relationships
  artistProfileId String
  artistProfile   ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  playEvents      PlayEvent[]
  smartLinks      SmartLink[]

  @@map("tracks")
}
```

### 2. Track Editing Components

#### `src/components/track/TrackEditForm.tsx`

A comprehensive form component for editing track metadata with:

- **Basic Information**: Title, artist, album, genre, description
- **Advanced Metadata**: Composer, year, release date, BPM, ISRC, lyrics
- **Privacy Controls**: Public/private, downloadable, explicit content
- **Copyright Management**: License types, copyright info, distribution rights
- **File Protection Settings**: Watermarking, geo-blocking, time restrictions, device limits

#### `src/components/track/TrackEditModal.tsx`

Modal wrapper for easy integration of the track edit form.

#### `src/components/track/TrackProtectionSettings.tsx`

Advanced protection settings component with:

- **Audio Watermarking**: Invisible tracking markers
- **Geographic Blocking**: Country-based access restrictions
- **Time Restrictions**: Time-based access controls
- **Device Limits**: Mobile/desktop access controls
- **Streaming Limits**: Concurrent streams, daily/weekly limits

### 3. File Protection System

#### `src/lib/file-protection.ts`

Comprehensive file protection utilities including:

- **Watermark Generation**: Unique identifiers for tracking
- **Access Validation**: Multi-layered access control
- **DRM Tokens**: Time-limited access tokens
- **Blockchain Hashing**: Copyright protection
- **Geo-blocking**: Country-based restrictions
- **Device Management**: Device type and limit controls

### 4. API Endpoints

#### `src/app/api/tracks/create/route.ts`

Enhanced track creation with full metadata support.

#### `src/app/api/tracks/update/route.ts`

Comprehensive track update functionality with validation.

### 5. Install File Upload Dependencies

```bash
# File handling and validation
yarn add multer @types/multer
yarn add formidable @types/formidable
yarn add music-metadata
yarn add @aws-sdk/client-s3
yarn add @aws-sdk/s3-request-presigner

# Audio processing
yarn add ffmpeg-static
yarn add fluent-ffmpeg @types/fluent-ffmpeg

# File type validation
yarn add file-type
yarn add mime-types @types/mime-types
```

### 2. AWS S3 Configuration

#### `src/lib/s3.ts`

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Config = {
  bucket: process.env.AWS_S3_BUCKET!,
  region: process.env.AWS_REGION!,
};

export class S3Service {
  // Upload file to S3
  static async uploadFile(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  // Generate presigned URL for direct upload
  static async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  // Generate presigned URL for file access
  static async generateAccessUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }
}
```

### 3. File Upload Utilities

#### `src/lib/upload-utils.ts`

```typescript
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { FileTypeResult } from 'file-type';
import { fileTypeFromBuffer } from 'file-type';

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ProcessedAudioFile {
  filePath: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  originalName: string;
}

export class UploadUtils {
  // Validate file type
  static async validateAudioFile(file: UploadedFile): Promise<boolean> {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/m4a',
    ];

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return false;
    }

    // Check file extension
    const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(
      file.buffer
    );
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      return false;
    }

    return true;
  }

  // Validate file size (max 50MB)
  static validateFileSize(size: number): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return size <= maxSize;
  }

  // Save file to temporary directory
  static async saveTempFile(file: UploadedFile): Promise<string> {
    const tempDir = tmpdir();
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(tempDir, fileName);

    await writeFile(filePath, file.buffer);
    return filePath;
  }

  // Get audio duration
  static async getAudioDuration(filePath: string): Promise<number> {
    try {
      const duration = await getAudioDurationInSeconds(filePath);
      return Math.round(duration);
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  // Generate unique S3 key
  static generateS3Key(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    return `uploads/${userId}/${timestamp}-${sanitizedName}.${extension}`;
  }

  // Clean up temporary file
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  // Process uploaded audio file
  static async processAudioFile(
    file: UploadedFile,
    userId: string
  ): Promise<ProcessedAudioFile> {
    // Validate file
    if (!this.validateAudioFile(file)) {
      throw new Error('Invalid audio file type');
    }

    if (!this.validateFileSize(file.size)) {
      throw new Error('File size too large (max 50MB)');
    }

    // Save to temp directory
    const tempFilePath = await this.saveTempFile(file);

    // Get audio duration
    const duration = await this.getAudioDuration(tempFilePath);

    return {
      filePath: tempFilePath,
      duration,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }
}
```

### 4. Upload API Route

#### `src/app/api/upload/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { S3Service } from '@/lib/s3';
import { UploadUtils } from '@/lib/upload-utils';
import { trackSchema } from '@/lib/validations';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is artist or admin
    if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only artists can upload tracks' },
        { status: 403 }
      );
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowEmptyFiles: false,
      filter: part => {
        return (
          part.mimetype?.includes('audio/') || part.mimetype?.includes('image/')
        );
      },
    });

    const [fields, files] = await form.parse(request);

    // Extract metadata
    const metadata = {
      title: fields.title?.[0] || '',
      genre: fields.genre?.[0] || '',
      album: fields.album?.[0] || '',
      description: fields.description?.[0] || '',
      isExplicit: fields.isExplicit?.[0] === 'true',
      releaseDate: fields.releaseDate?.[0]
        ? new Date(fields.releaseDate[0])
        : null,
    };

    // Validate metadata
    const validatedMetadata = trackSchema.parse(metadata);

    // Get audio file
    const audioFile = files.audio?.[0];
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Get cover image (optional)
    const coverImage = files.coverImage?.[0];

    // Process audio file
    const audioBuffer = readFileSync(audioFile.filepath);
    const processedAudio = await UploadUtils.processAudioFile(
      {
        originalname: audioFile.originalFilename || 'audio.mp3',
        buffer: audioBuffer,
        mimetype: audioFile.mimetype || 'audio/mpeg',
        size: audioFile.size || 0,
      },
      session.user.id
    );

    // Upload audio to S3
    const audioKey = UploadUtils.generateS3Key(
      processedAudio.originalName,
      session.user.id
    );
    const audioUrl = await S3Service.uploadFile(
      audioBuffer,
      audioKey,
      processedAudio.mimeType
    );

    // Upload cover image if provided
    let coverImageUrl: string | undefined;
    if (coverImage) {
      const coverBuffer = readFileSync(coverImage.filepath);
      const coverKey = UploadUtils.generateS3Key(
        coverImage.originalFilename || 'cover.jpg',
        session.user.id
      );
      coverImageUrl = await S3Service.uploadFile(
        coverBuffer,
        coverKey,
        coverImage.mimetype || 'image/jpeg'
      );
    }

    // Create track in database
    const track = await prisma.track.create({
      data: {
        title: validatedMetadata.title,
        artistId: session.user.id,
        fileUrl: audioUrl,
        coverImageUrl,
        genre: validatedMetadata.genre,
        album: validatedMetadata.album,
        description: validatedMetadata.description,
        duration: processedAudio.duration,
        isExplicit: validatedMetadata.isExplicit,
        releaseDate: validatedMetadata.releaseDate,
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Clean up temp files
    await UploadUtils.cleanupTempFile(processedAudio.filePath);
    if (coverImage) {
      await UploadUtils.cleanupTempFile(coverImage.filepath);
    }

    return NextResponse.json(
      {
        message: 'Track uploaded successfully',
        track,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tracks
    const tracks = await prisma.track.findMany({
      where: { artistId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Track Management API

#### `src/app/api/tracks/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { S3Service } from '@/lib/s3';
import { trackSchema } from '@/lib/validations';

// Get track by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update track
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the track or is admin
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = trackSchema.parse(body);

    const updatedTrack = await prisma.track.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ track: updatedTrack });
  } catch (error) {
    console.error('Error updating track:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the track or is admin
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from S3
    if (track.fileUrl) {
      const key = track.fileUrl.split('/').pop();
      if (key) {
        await S3Service.deleteFile(key);
      }
    }

    if (track.coverImageUrl) {
      const key = track.coverImageUrl.split('/').pop();
      if (key) {
        await S3Service.deleteFile(key);
      }
    }

    // Delete from database
    await prisma.track.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Upload Form Component

#### `src/components/forms/UploadTrackForm.tsx`

```typescript
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface UploadFormData {
  title: string
  genre: string
  album: string
  description: string
  isExplicit: boolean
  releaseDate: string
}

export default function UploadTrackForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    genre: '',
    album: '',
    description: '',
    isExplicit: false,
    releaseDate: '',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file')
        return
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }

      setAudioFile(file)
      setError('')
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setError('Cover image must be less than 5MB')
        return
      }

      setCoverImage(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setError('Please select an audio file')
      return
    }

    if (!formData.title || !formData.genre) {
      setError('Title and genre are required')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formDataToSend = new FormData()

      // Add metadata
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value.toString())
        }
      })

      // Add files
      formDataToSend.append('audio', audioFile)
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage)
      }

      const response = await fetch('/api/upload/track', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/artist/dashboard?message=Track uploaded successfully!`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Upload failed')
      }
    } catch (error) {
      setError('An error occurred during upload')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      genre: '',
      album: '',
      description: '',
      isExplicit: false,
      releaseDate: '',
    })
    setAudioFile(null)
    setCoverImage(null)
    setError('')
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600">
          Only artists can upload tracks.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Upload New Track
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File *
          </label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required
          />
          {audioFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image (Optional)
          </label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {coverImage && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {coverImage.name} ({(coverImage.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Track Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Track Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter track title"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
            Genre *
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Select a genre</option>
            <option value="Amapiano">Amapiano</option>
            <option value="Gqom">Gqom</option>
            <option value="Afro House">Afro House</option>
            <option value="Kwaito">Kwaito</option>
            <option value="Afro Pop">Afro Pop</option>
            <option value="Afro Soul">Afro Soul</option>
            <option value="Deep House">Deep House</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="R&B">R&B</option>
            <option value="Pop">Pop</option>
            <option value="Electronic">Electronic</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Album */}
        <div>
          <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-2">
            Album
          </label>
          <input
            type="text"
            id="album"
            name="album"
            value={formData.album}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter album name"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter track description"
          />
        </div>

        {/* Release Date */}
        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
            Release Date
          </label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            value={formData.releaseDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Explicit Content */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isExplicit"
            name="isExplicit"
            checked={formData.isExplicit}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isExplicit" className="ml-2 block text-sm text-gray-700">
            This track contains explicit content
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUploading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Track'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
```

### 7. Track List Component

#### `src/components/music/TrackList.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'

interface Track {
  id: string
  title: string
  artist: {
    id: string
    name: string
    image: string | null
  }
  coverImageUrl: string | null
  genre: string
  album: string | null
  duration: number
  playCount: number
  likeCount: number
  isPublished: boolean
  createdAt: string
}

interface TrackListProps {
  tracks: Track[]
  showActions?: boolean
  onTrackUpdate?: (trackId: string, updates: Partial<Track>) => void
  onTrackDelete?: (trackId: string) => void
}

export default function TrackList({
  tracks,
  showActions = false,
  onTrackUpdate,
  onTrackDelete
}: TrackListProps) {
  const { data: session } = useSession()
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Track>>({})

  const handleEdit = (track: Track) => {
    setEditingTrack(track.id)
    setEditForm({
      title: track.title,
      genre: track.genre,
      album: track.album,
    })
  }

  const handleSave = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const result = await response.json()
        onTrackUpdate?.(trackId, result.track)
        setEditingTrack(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating track:', error)
    }
  }

  const handleDelete = async (trackId: string) => {
    if (confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/tracks/${trackId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          onTrackDelete?.(trackId)
        }
      } catch (error) {
        console.error('Error deleting track:', error)
      }
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracks found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {track.coverImageUrl ? (
                <img
                  src={track.coverImageUrl}
                  alt={`${track.title} cover`}
                  className="w-16 h-16 rounded-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Cover</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {track.title}
                </h3>
                {!track.isPublished && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                by {track.artist.name}
              </p>

              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>{track.genre}</span>
                {track.album && <span>• {track.album}</span>}
                <span>• {formatDuration(track.duration)}</span>
                <span>• {track.playCount} plays</span>
                <span>• {track.likeCount} likes</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && session?.user &&
             (session.user.id === track.artist.id || session.user.role === 'ADMIN') && (
              <div className="flex items-center space-x-2">
                {editingTrack === track.id ? (
                  <>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Title"
                    />
                    <select
                      value={editForm.genre || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="Pop">Pop</option>
                      <option value="Rock">Rock</option>
                      <option value="Hip-Hop">Hip-Hop</option>
                      <option value="Electronic">Electronic</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Classical">Classical</option>
                      <option value="Country">Country</option>
                      <option value="R&B">R&B</option>
                      <option value="Alternative">Alternative</option>
                      <option value="Indie">Indie</option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      onClick={() => handleSave(track.id)}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTrack(null)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(track)}
                      className="px-3 py-1 bg-secondary-500 text-white text-sm rounded hover:bg-secondary-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 8. Upload Page

#### `src/app/(dashboard)/artist/upload/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UploadTrackForm from '@/components/forms/UploadTrackForm'

export default async function UploadPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Upload New Track
          </h1>
          <p className="mt-2 text-gray-600">
            Share your music with the world. Upload your track and add all the details.
          </p>
        </div>

        <UploadTrackForm />
      </div>
    </div>
  )
}
```

### 9. Environment Variables Update

Add to `.env.local`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name_here

# File Upload Limits
MAX_FILE_SIZE=52428800
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac,audio/ogg,audio/m4a
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

## 🎵 Enhanced Upload Flow & User Experience

### Post-Upload Track Editing

After successful file upload, the system automatically presents a comprehensive track editing interface:

1. **Success Notification**: Green-themed success card with uploaded filename
2. **Track Edit Form**: Comprehensive metadata editing form appears
3. **Post-Upload Options**:
   - "View Music Library" - Navigate to library tab
   - "Upload Another Track" - Reset form for another upload

### Track Management Features

#### Library Integration

- **Edit Button**: Each track in the library has an edit button
- **Real-time Updates**: Changes reflect immediately in the UI
- **Bulk Operations**: Future support for bulk track management

#### Metadata Management

- **25+ Fields**: Comprehensive metadata including technical details
- **Validation**: Real-time form validation with helpful error messages
- **Auto-generation**: Unique URLs and watermarks generated automatically

### File Protection Features

#### Privacy Controls

- **Public/Private**: Control track visibility
- **Download Permissions**: Configurable download access
- **Explicit Content**: Mark tracks with explicit content warnings

#### Advanced Protection

- **Audio Watermarking**: Invisible tracking markers
- **Geographic Blocking**: Country-based access restrictions
- **Time Restrictions**: Time-based access controls
- **Device Limits**: Mobile/desktop access controls
- **Streaming Limits**: Concurrent streams, daily/weekly limits

#### Copyright Management

- **License Types**: Multiple license options (All Rights Reserved, Creative Commons, etc.)
- **Copyright Information**: Detailed copyright and distribution rights
- **Blockchain Hashing**: Copyright protection via blockchain

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **File upload works** - Can upload audio files successfully
2. **S3 integration functional** - Files stored in cloud storage
3. **Metadata management** - Track information saved correctly
4. **File validation** - Invalid files rejected appropriately
5. **Track CRUD operations** - Create, read, update, delete working
6. **Authorization working** - Only artists can upload tracks
7. **File cleanup** - Temporary files removed after upload
8. **Track editing** - Edit form works with all metadata fields
9. **File protection** - Protection settings save and apply correctly
10. **Privacy controls** - Public/private and download settings work
11. **Unique URLs** - Each track gets a unique, trackable URL
12. **Post-upload flow** - Success notifications and edit form appear

### Test Commands:

```bash
# Test file upload
# 1. Login as artist
# 2. Navigate to upload page
# 3. Upload audio file with metadata
# 4. Verify file appears in track list

# Test track management
# 1. Edit track metadata
# 2. Delete track
# 3. Verify S3 cleanup

# Test authorization
# 1. Try uploading as regular user
# 2. Verify access denied
```

## 🚨 Common Issues & Solutions

### Issue: File upload fails

**Solution**: Check AWS credentials, verify S3 bucket permissions, ensure file size limits

### Issue: Audio duration not detected

**Solution**: Install ffmpeg, verify audio file format support

### Issue: S3 upload errors

**Solution**: Verify bucket CORS settings, check IAM permissions

### Issue: Form validation errors

**Solution**: Ensure all required fields are filled, check file type validation

## 📝 Notes

- Implement proper error handling for large file uploads
- Consider implementing chunked uploads for very large files
- Add progress indicators for better user experience
- Implement file type validation on both client and server
- Consider adding audio format conversion for better compatibility

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 5: Music Streaming Interface](./05-music-streaming.md)
