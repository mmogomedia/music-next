const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// South African music genres
const SOUTH_AFRICAN_GENRES = [
  'Amapiano',
  'Afro House',
  'Kwaito',
  'Gqom',
  'Bacardi',
  'Afro Pop',
  'Hip Hop',
  'R&B',
  'Jazz',
  'Soul',
  'Gospel',
  'Maskandi',
  'Isicathamiya',
  'Mbaqanga',
  'Bubblegum',
];

async function addTracksToGenrePlaylists() {
  try {
    console.log('🎵 Adding existing tracks to genre playlists...');

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'dev@dev.com' },
    });

    if (!admin) {
      throw new Error(
        'Admin user not found. Please run create-admin.js first.'
      );
    }

    console.log(`✅ Found admin user: ${admin.name}`);

    // Process each genre
    for (const genre of SOUTH_AFRICAN_GENRES) {
      console.log(`\n🎶 Processing genre: ${genre}`);

      // Find playlist for this genre
      const playlist = await prisma.playlist.findFirst({
        where: {
          name: genre,
          type: 'GENRE',
        },
      });

      if (!playlist) {
        console.log(`❌ Playlist not found for ${genre}`);
        continue;
      }

      console.log(`✅ Found playlist: ${playlist.name}`);

      // Find tracks for this genre
      const tracks = await prisma.track.findMany({
        where: {
          genre: genre,
          isPublic: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`📀 Found ${tracks.length} tracks for ${genre}`);

      // Add tracks to playlist
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // Check if track is already in playlist
        const existingPlaylistTrack = await prisma.playlistTrack.findFirst({
          where: {
            playlistId: playlist.id,
            trackId: track.id,
          },
        });

        if (existingPlaylistTrack) {
          console.log(`⏭️  Track already in playlist: ${track.title}`);
          continue;
        }

        // Add track to playlist
        await prisma.playlistTrack.create({
          data: {
            playlistId: playlist.id,
            trackId: track.id,
            order: i + 1,
            addedBy: admin.id,
          },
        });

        console.log(`✅ Added track to ${playlist.name}: ${track.title}`);
      }
    }

    console.log('\n🎉 Successfully added tracks to all genre playlists!');
  } catch (error) {
    console.error('❌ Error adding tracks to genre playlists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTracksToGenrePlaylists();
