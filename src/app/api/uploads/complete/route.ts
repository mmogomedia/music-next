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

    // Get or create artist profile for the user
    let artistProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!artistProfile) {
      // Create a default artist profile if none exists
      artistProfile = await prisma.artistProfile.create({
        data: {
          userId: session.user.id,
          artistName: session.user.name || 'Unknown Artist',
          bio: 'Music artist on Flemoji',
        },
      });
    }

    // Create track record - store only the file path, not full URL
    const filePath = key; // The key already contains the full path

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is missing' },
        { status: 400 }
      );
    }

    const track = await prisma.track.create({
      data: {
        title: uploadJob.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        userId: session.user.id,
        artistProfileId: artistProfile.id,
        filePath: filePath, // Store only the file path
        uniqueUrl: `track-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Generate unique URL
        genre: 'Unknown', // Default genre, can be updated later
        album: 'Single', // Default album
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        duration: 0, // Will be updated when we process the audio
        playCount: 0,
        likeCount: 0,
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
