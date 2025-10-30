/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// South African provinces
const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

// Music genres
const GENRES = ['3 Step', 'Hip Hop', 'Amapiano', 'Afropop'];

async function main() {
  console.log('🌱 Starting playlist seeding...');

  try {
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      throw new Error(
        'No admin user found. Please run the main seed script first.'
      );
    }

    console.log(`👤 Using admin user: ${adminUser.email}`);
    // 1. Create Playlist Type Definitions
    console.log('📋 Creating playlist type definitions...');

    const featuredType = await prisma.playlistTypeDefinition.upsert({
      where: { slug: 'featured' },
      update: {},
      create: {
        name: 'Featured',
        slug: 'featured',
        description: 'Curated featured tracks showcasing the best music',
        icon: '⭐',
        color: '#FFD700',
        maxInstances: 1,
        requiresProvince: false,
        defaultMaxTracks: 10,
        displayOrder: 1,
      },
    });

    const provincialType = await prisma.playlistTypeDefinition.upsert({
      where: { slug: 'province' },
      update: {},
      create: {
        name: 'Provincial',
        slug: 'province',
        description:
          'Regional playlists representing each South African province',
        icon: '🗺️',
        color: '#3B82F6',
        maxInstances: 9,
        requiresProvince: true,
        defaultMaxTracks: 15,
        displayOrder: 2,
      },
    });

    const topTenType = await prisma.playlistTypeDefinition.upsert({
      where: { slug: 'top-ten' },
      update: {},
      create: {
        name: 'Top Ten',
        slug: 'top-ten',
        description: 'Top ten most popular tracks',
        icon: '🏆',
        color: '#F59E0B',
        maxInstances: 1,
        requiresProvince: false,
        defaultMaxTracks: 10,
        displayOrder: 3,
      },
    });

    const genreType = await prisma.playlistTypeDefinition.upsert({
      where: { slug: 'genre' },
      update: {},
      create: {
        name: 'Genre',
        slug: 'genre',
        description: 'Music genre-based playlists',
        icon: '🎵',
        color: '#10B981',
        maxInstances: -1,
        requiresProvince: false,
        defaultMaxTracks: 20,
        displayOrder: 4,
      },
    });

    console.log('✅ Playlist type definitions created');

    // 2. Create Featured Playlist
    console.log('⭐ Creating featured playlist...');

    let featuredPlaylist = await prisma.playlist.findFirst({
      where: {
        name: 'Featured Tracks',
        playlistTypeId: featuredType.id,
      },
    });

    if (!featuredPlaylist) {
      featuredPlaylist = await prisma.playlist.create({
        data: {
          name: 'Featured Tracks',
          description:
            'Handpicked tracks showcasing the best of South African music',
          playlistTypeId: featuredType.id,
          coverImage:
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
          maxTracks: 10,
          status: 'ACTIVE',
          submissionStatus: 'OPEN',
          maxSubmissionsPerArtist: 2,
          createdBy: adminUser.id,
        },
      });
    }

    console.log('✅ Featured playlist created');

    // 3. Create Top Ten Playlist
    console.log('🏆 Creating Top Ten playlist...');

    let topTenPlaylist = await prisma.playlist.findFirst({
      where: {
        name: 'Top Ten',
        playlistTypeId: topTenType.id,
      },
    });

    if (!topTenPlaylist) {
      topTenPlaylist = await prisma.playlist.create({
        data: {
          name: 'Top Ten',
          description:
            'The most popular tracks this week - ranked by plays and engagement',
          playlistTypeId: topTenType.id,
          coverImage:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
          maxTracks: 10,
          status: 'ACTIVE',
          submissionStatus: 'CLOSED', // Admin curated only
          maxSubmissionsPerArtist: 0,
          createdBy: adminUser.id,
        },
      });
    }

    console.log('✅ Top Ten playlist created');

    // 4. Create Provincial Playlists
    console.log('🗺️ Creating provincial playlists...');

    const provincialPlaylists = [];
    for (const province of PROVINCES) {
      let playlist = await prisma.playlist.findFirst({
        where: {
          name: `${province} Vibes`,
          playlistTypeId: provincialType.id,
        },
      });

      if (!playlist) {
        playlist = await prisma.playlist.create({
          data: {
            name: `${province} Vibes`,
            description: `The best music from ${province} - showcasing local talent and regional sounds`,
            playlistTypeId: provincialType.id,
            coverImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=800&h=600&fit=crop`,
            maxTracks: 15,
            status: 'ACTIVE',
            submissionStatus: 'OPEN',
            maxSubmissionsPerArtist: 1,
            province: province,
            createdBy: adminUser.id,
          },
        });
      }
      provincialPlaylists.push(playlist);
    }

    console.log('✅ Provincial playlists created');

    // 5. Create Genre Playlists
    console.log('🎵 Creating genre playlists...');

    const genrePlaylists = [];
    for (const genre of GENRES) {
      let playlist = await prisma.playlist.findFirst({
        where: {
          name: `${genre} Hits`,
          playlistTypeId: genreType.id,
        },
      });

      if (!playlist) {
        playlist = await prisma.playlist.create({
          data: {
            name: `${genre} Hits`,
            description: `The hottest ${genre} tracks right now - fresh sounds and emerging artists`,
            playlistTypeId: genreType.id,
            coverImage: `https://images.unsplash.com/photo-${1600000000000 + Math.floor(Math.random() * 1000000)}?w=800&h=600&fit=crop`,
            maxTracks: 20,
            status: 'ACTIVE',
            submissionStatus: 'OPEN',
            maxSubmissionsPerArtist: 3,
            createdBy: adminUser.id,
          },
        });
      }
      genrePlaylists.push(playlist);
    }

    console.log('✅ Genre playlists created');

    // 6. Summary
    console.log('\n🎉 Playlist seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`• Playlist Types: 4`);
    console.log(`• Featured Playlists: 1`);
    console.log(`• Top Ten Playlists: 1`);
    console.log(`• Provincial Playlists: ${provincialPlaylists.length}`);
    console.log(`• Genre Playlists: ${genrePlaylists.length}`);
    console.log(
      `• Total Playlists: ${2 + provincialPlaylists.length + genrePlaylists.length}`
    );

    console.log('\n📋 Created Playlists:');
    console.log('Featured:');
    console.log(`  • ${featuredPlaylist.name}`);
    console.log(`  • ${topTenPlaylist.name}`);

    console.log('\nProvincial:');
    provincialPlaylists.forEach(playlist => {
      console.log(`  • ${playlist.name}`);
    });

    console.log('\nGenre:');
    genrePlaylists.forEach(playlist => {
      console.log(`  • ${playlist.name}`);
    });
  } catch (error) {
    console.error('❌ Error seeding playlists:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
