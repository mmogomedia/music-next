/**
 * Setup test data for stats system testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data for stats system...\n');

    // 1. Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found:', adminUser.email);
    }

    // 2. Get or create artist profile
    let artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: adminUser.id },
    });

    if (!artistProfile) {
      console.log('Creating artist profile...');
      artistProfile = await prisma.artistProfile.create({
        data: {
          userId: adminUser.id,
          artistName: 'Test Artist',
          bio: 'Test artist for stats system',
          isPublic: true,
        },
      });
      console.log('✅ Artist profile created');
    } else {
      console.log('✅ Artist profile found:', artistProfile.artistName);
    }

    // 3. Check if test track exists
    const existingTrack = await prisma.track.findFirst({
      where: { title: 'Test Track for Stats' },
    });

    if (existingTrack) {
      console.log('✅ Test track already exists:', existingTrack.id);
      return existingTrack;
    }

    // 4. Create test track
    console.log('Creating test track...');
    const testTrack = await prisma.track.create({
      data: {
        title: 'Test Track for Stats',
        artist: 'Test Artist',
        genre: 'Electronic',
        duration: 240, // 4 minutes
        filePath: '/test/track.mp3',
        artistProfileId: artistProfile.id,
        userId: adminUser.id,
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

    return testTrack;

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
