/**
 * Script to create test users and demo artist profiles for testing
 * Run with: node scripts/create-test-data.js
 */
/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'test-new-user@flemoji.com',
    password: 'Test123!@#',
    name: 'Test New User',
  },
  {
    email: 'test-claimed-user@flemoji.com',
    password: 'Test123!@#',
    name: 'Test Claimed User',
  },
  {
    email: 'test-ready-to-claim@flemoji.com',
    password: 'Test123!@#',
    name: 'Test Ready to Claim',
  },
];

const demoArtists = [
  {
    artistName: 'Amapiano King',
    slug: 'amapiano-king-demo',
    bio: 'South African Amapiano artist with chart-topping hits',
    genre: 'Amapiano',
    country: 'ZA',
    province: 'GP',
    city: 'Johannesburg',
    tracks: [
      { title: 'Midnight Groove', playCount: 2500, likeCount: 120 },
      { title: 'Soweto Nights', playCount: 1800, likeCount: 95 },
      { title: 'Township Vibes', playCount: 1200, likeCount: 78 },
      { title: 'Weekend Party', playCount: 950, likeCount: 65 },
      { title: 'Sunset Drive', playCount: 750, likeCount: 52 },
    ],
  },
  {
    artistName: 'Afrobeat Master',
    slug: 'afrobeat-master-demo',
    bio: 'Nigerian Afrobeat producer and artist',
    genre: 'Afrobeat',
    country: 'NG',
    province: 'LA',
    city: 'Lagos',
    tracks: [
      { title: 'Lagos Nights', playCount: 3200, likeCount: 150 },
      { title: 'African Rhythm', playCount: 2100, likeCount: 110 },
      { title: 'Dance Floor', playCount: 1500, likeCount: 88 },
    ],
  },
  {
    artistName: 'Hip Hop Legend',
    slug: 'hip-hop-legend-demo',
    bio: 'Underground hip hop artist from Cape Town',
    genre: 'Hip Hop',
    country: 'ZA',
    province: 'WC',
    city: 'Cape Town',
    tracks: [
      { title: 'City Streets', playCount: 1900, likeCount: 85 },
      { title: 'Underground Flow', playCount: 1400, likeCount: 72 },
      { title: 'Real Talk', playCount: 1100, likeCount: 68 },
      { title: 'Cape Town Sound', playCount: 900, likeCount: 55 },
    ],
  },
  {
    artistName: 'R&B Soul',
    slug: 'rnb-soul-demo',
    bio: 'Soulful R&B singer',
    genre: 'R&B',
    country: 'ZA',
    province: 'KZN',
    city: 'Durban',
    tracks: [
      { title: 'Love Song', playCount: 2800, likeCount: 135 },
      { title: 'Heartbreak', playCount: 2000, likeCount: 98 },
    ],
  },
];

async function createTestUsers() {
  console.log('\n📝 Creating test users...');
  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        name: userData.name,
        emailVerified: new Date(),
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ ${userData.email} (ID: ${user.id})`);
  }
}

async function createDemoArtists() {
  console.log('\n🎵 Creating demo artist profiles...');

  // Get test user for track creation
  const testUser = await prisma.user.findFirst({
    where: { email: 'test-ready-to-claim@flemoji.com' },
  });

  if (!testUser) {
    console.error('❌ Test user not found. Please create users first.');
    return;
  }

  // Get genres
  const genres = await prisma.genre.findMany({
    where: { isActive: true },
  });
  const genreMap = {};
  genres.forEach(g => {
    genreMap[g.name.toLowerCase()] = g.id;
    genreMap[g.slug.toLowerCase()] = g.id;
  });

  for (const artistData of demoArtists) {
    // Check if artist already exists
    const existing = await prisma.artistProfile.findFirst({
      where: { artistName: artistData.artistName },
    });

    if (existing) {
      // Delete existing artist and tracks
      await prisma.track.deleteMany({
        where: { artistProfileId: existing.id },
      });
      await prisma.artistProfile.delete({
        where: { id: existing.id },
      });
      console.log(`  ↻ Deleted existing: ${artistData.artistName}`);
    }

    // Find genre ID
    const genreId =
      genreMap[artistData.genre.toLowerCase()] ||
      genreMap['amapiano'] ||
      genres[0]?.id;

    // Create artist profile
    const artist = await prisma.artistProfile.create({
      data: {
        artistName: artistData.artistName,
        slug: artistData.slug,
        bio: artistData.bio,
        genreId: genreId,
        country: artistData.country,
        province: artistData.province,
        city: artistData.city,
        isUnclaimed: true,
        isPublic: true,
        isActive: true,
      },
    });

    // Create tracks
    for (let i = 0; i < artistData.tracks.length; i++) {
      const track = artistData.tracks[i];
      await prisma.track.create({
        data: {
          artistProfileId: artist.id,
          title: track.title,
          filePath: `/demo/${artistData.slug}/${track.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
          playCount: track.playCount,
          likeCount: track.likeCount,
          uniqueUrl: `${artistData.slug}-${track.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          userId: testUser.id,
          genreId: genreId,
        },
      });
    }

    console.log(
      `  ✓ ${artistData.artistName} (${artistData.tracks.length} tracks)`
    );
  }
}

async function createClaimedProfile() {
  console.log('\n👤 Creating claimed profile for test-claimed-user...');

  const user = await prisma.user.findFirst({
    where: { email: 'test-claimed-user@flemoji.com' },
  });

  if (!user) {
    console.error('❌ User not found');
    return;
  }

  // Delete existing profile if any
  const existing = await prisma.artistProfile.findFirst({
    where: { userId: user.id },
  });

  if (existing) {
    await prisma.track.deleteMany({
      where: { artistProfileId: existing.id },
    });
    await prisma.artistProfile.delete({
      where: { id: existing.id },
    });
  }

  // Get a genre
  const genre = await prisma.genre.findFirst({
    where: { isActive: true },
  });

  // Create claimed profile
  const profile = await prisma.artistProfile.create({
    data: {
      userId: user.id,
      artistName: 'Claimed Artist Profile',
      slug: 'claimed-artist-profile',
      bio: 'This is a claimed profile for testing',
      genreId: genre?.id,
      isUnclaimed: false,
      isPublic: true,
      isActive: true,
    },
  });

  console.log(`  ✓ Created claimed profile: ${profile.artistName}`);
}

async function main() {
  try {
    console.log('🚀 Starting test data creation...\n');

    await createTestUsers();
    await createDemoArtists();
    await createClaimedProfile();

    console.log('\n✅ Test data creation complete!');
    console.log('\n📋 Summary:');
    console.log(`  - ${testUsers.length} test users created`);
    console.log(`  - ${demoArtists.length} demo artists created`);
    console.log(`  - 1 claimed profile created`);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
