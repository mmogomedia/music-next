/**
 * Script to create a new test user and demo artist for claim testing
 * Run with: node scripts/create-claim-test-user.js
 */
/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createClaimTestUser() {
  console.log(
    '🚀 Creating new test user and demo artist for claim testing...\n'
  );

  try {
    // Generate random suffix for uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const email = `test-claim-${timestamp}-${randomSuffix}@flemoji.com`;
    const password = 'Test123!@#';

    // Create test user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `Test Claim User ${timestamp}`,
        emailVerified: new Date(), // Auto-verify for testing
      },
    });

    console.log('✅ Created test user:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${user.id}\n`);

    // Get a genre for the demo artist
    const genre = await prisma.genre.findFirst({
      where: { isActive: true },
    });

    if (!genre) {
      console.error('❌ No active genres found. Please seed genres first.');
      return;
    }

    // Create demo artist profile (unclaimed)
    const artistName = `Demo Artist ${timestamp}`;
    const artist = await prisma.artistProfile.create({
      data: {
        artistName,
        slug: `demo-artist-${timestamp}`,
        bio: `Demo artist profile created for claim testing - ${new Date().toISOString()}`,
        genreId: genre.id,
        country: 'ZA',
        province: 'GP',
        city: 'Johannesburg',
        isUnclaimed: true,
        isPublic: true,
        isActive: true,
      },
    });

    console.log('✅ Created demo artist profile:');
    console.log(`   Name: ${artist.artistName}`);
    console.log(`   ID: ${artist.id}`);
    console.log(`   Slug: ${artist.slug}`);
    console.log(`   Status: Unclaimed\n`);

    // Create tracks for the demo artist
    const tracks = [
      {
        title: 'Test Track 1',
        playCount: 1500,
        likeCount: 75,
      },
      {
        title: 'Test Track 2',
        playCount: 1200,
        likeCount: 60,
      },
      {
        title: 'Test Track 3',
        playCount: 900,
        likeCount: 45,
      },
    ];

    for (const trackData of tracks) {
      await prisma.track.create({
        data: {
          artistProfileId: artist.id,
          title: trackData.title,
          filePath: `/demo/${artist.slug}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
          playCount: trackData.playCount,
          likeCount: trackData.likeCount,
          uniqueUrl: `${artist.slug}-${trackData.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`,
          userId: user.id, // Use the test user as the track owner
          genreId: genre.id,
        },
      });
    }

    console.log(`✅ Created ${tracks.length} tracks for demo artist\n`);

    // Update artist stats
    const totalPlays = tracks.reduce((sum, t) => sum + t.playCount, 0);
    const totalLikes = tracks.reduce((sum, t) => sum + t.likeCount, 0);

    await prisma.artistProfile.update({
      where: { id: artist.id },
      data: {
        totalPlays: totalPlays,
        totalLikes: totalLikes,
      },
    });

    console.log('📋 Test Setup Complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log('ARTIST TO CLAIM:');
    console.log(`Name:     ${artist.artistName}`);
    console.log(
      `Search:   "${artist.artistName}" or "${artistName.split(' ')[0]}"`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      user: { email, password, id: user.id },
      artist: { name: artist.artistName, id: artist.id },
    };
  } catch (error) {
    console.error('❌ Error creating test user/artist:', error);
    throw error;
  }
}

async function main() {
  try {
    await createClaimTestUser();
  } catch (error) {
    console.error('Failed to create test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
