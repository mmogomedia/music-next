import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const uploadUrl = formData.get('uploadUrl') as string;
    const key = formData.get('key') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!jobId || !uploadUrl || !key) {
      return NextResponse.json(
        { error: 'Missing jobId, uploadUrl, or key' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Upload job not found or already processed' },
        { status: 404 }
      );
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
        throw new Error(
          `R2 upload failed with status: ${uploadResponse.status}`
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
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });

      console.error('R2 upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload to cloud storage' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
