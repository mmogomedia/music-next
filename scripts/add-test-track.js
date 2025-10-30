/**
 * Add a test track for stats system testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestTrack() {
  try {
    // Get the first user (admin)
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!user) {
      console.log('❌ No admin user found');
      return;
    }

    // Get the first artist profile
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: user.id },
    });

    if (!artistProfile) {
      console.log('❌ No artist profile found');
      return;
    }

    // Check if test track already exists
    const existingTrack = await prisma.track.findFirst({
      where: { title: 'Test Track for Stats' },
    });

    if (existingTrack) {
      console.log('✅ Test track already exists:', existingTrack.id);
      return;
    }

    // Create test track
    const testTrack = await prisma.track.create({
      data: {
        title: 'Test Track for Stats',
        artist: 'Test Artist',
        genre: 'Electronic',
        duration: 240, // 4 minutes
        filePath: '/test/track.mp3',
        artistProfileId: artistProfile.id,
        userId: user.id,
        uniqueUrl: `test-track-${Date.now()}`,
        isPublic: true,
        playCount: 0,
        likeCount: 0,
        shareCount: 0,
        downloadCount: 0,
      },
    });

    console.log('✅ Test track created:', {
      id: testTrack.id,
      title: testTrack.title,
      artist: testTrack.artist,
    });

  } catch (error) {
    console.error('❌ Error creating test track:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestTrack();
