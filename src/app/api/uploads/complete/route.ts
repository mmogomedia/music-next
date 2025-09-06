import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, key, size, mime } = await request.json();

    if (!jobId || !key || !size || !mime) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, key, size, mime' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the user
    const uploadJob = await prisma.uploadJob.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
      },
    });

    if (!uploadJob) {
      return NextResponse.json(
        { error: 'Upload job not found' },
        { status: 404 }
      );
    }

    // Check if key matches (it might be different due to how we generate it)
    if (uploadJob.key !== key) {
      // Update the key to match what was actually uploaded
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: { key },
      });
    }

    // Update job status to uploaded
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: 'UPLOADED',
        fileSize: size,
        fileType: mime,
      },
    });

    // Create track record - store only the file path, not full URL
    const filePath = key; // The key already contains the full path

    const track = await prisma.track.create({
      data: {
        title: uploadJob.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        artistId: session.user.id,
        filePath: filePath, // Store only the file path
        genre: 'Unknown', // Default genre, can be updated later
        album: 'Single', // Default album
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        duration: 0, // Will be updated when we process the audio
        playCount: 0,
      },
    });

    // Update job status to completed
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      jobId,
      trackId: track.id,
      status: 'COMPLETED',
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
