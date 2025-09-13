import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  handleAuthError,
  handleValidationError,
  handleConfigError,
  handleFileUploadError,
} from '@/lib/api-error-handler';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: process.env.R2_REGION!,
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  let file: File | undefined;

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return handleAuthError();
    }

    const formData = await request.formData();
    file = formData.get('image') as File;

    if (!file) {
      return handleValidationError('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return handleValidationError(
        'Invalid file type. Please select an image file.'
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return handleValidationError('File too large. Maximum size is 5MB.');
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with user folder structure
    const fileExtension = file.name.split('.').pop();
    const jobId = uuidv4();
    const fileName = `${jobId}.${fileExtension}`;
    const key = `image/${session.user.id}/${fileName}`;

    // Get R2 configuration from environment variables
    const r2BucketName = process.env.R2_BUCKET_NAME;
    const r2PublicUrl = process.env.R2_PUBLIC_URL;

    if (!r2BucketName) {
      return handleConfigError('R2_BUCKET_NAME');
    }

    if (!r2PublicUrl) {
      return handleConfigError('R2_PUBLIC_URL', 'asset.flemoji.com');
    }

    // Upload to Cloudflare R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key, // Use the full path with user folder
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return only the key/path for database storage (following the same pattern as music uploads)
    return NextResponse.json({
      key: key, // Return the file path for database storage
      fileName: fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return handleFileUploadError(
      error instanceof Error ? error : new Error(String(error)),
      {
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
      }
    );
  }
}
