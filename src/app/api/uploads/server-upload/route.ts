import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  handleR2UploadError,
  handleAuthError,
  handleValidationError,
  handleNotFoundError,
  handleServerError,
  handleFileUploadError,
} from '@/lib/api-error-handler';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '120mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return handleAuthError();
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const uploadUrl = formData.get('uploadUrl') as string;
    const key = formData.get('key') as string;

    if (!file) {
      return handleValidationError('No file provided');
    }

    if (!jobId || !uploadUrl || !key) {
      return handleValidationError('Missing jobId, uploadUrl, or key');
    }

    // Verify the job belongs to the user
    const uploadJob = await prisma.uploadJob.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
        status: 'PENDING_UPLOAD',
      },
    });

    if (!uploadJob) {
      return handleNotFoundError('Upload job', jobId);
    }

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to R2 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        return handleR2UploadError(
          uploadResponse,
          uploadUrl,
          key,
          file.size,
          file.type
        );
      }

      // Update job status
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: { status: 'UPLOADED' },
      });

      return NextResponse.json({
        success: true,
        jobId,
        message: 'File uploaded successfully to R2',
      });
    } catch (uploadError) {
      // Update job status to failed
      try {
        await prisma.uploadJob.update({
          where: { id: jobId },
          data: { status: 'FAILED' },
        });
      } catch (dbError) {
        console.error('Failed to update job status:', dbError);
      }

      return handleFileUploadError(
        uploadError instanceof Error
          ? uploadError
          : new Error(String(uploadError)),
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }
      );
    }
  } catch (error) {
    return handleServerError(
      error instanceof Error ? error : new Error(String(error)),
      'server upload'
    );
  }
}
