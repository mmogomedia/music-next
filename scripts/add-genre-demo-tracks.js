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

// Demo tracks for each genre
const GENRE_DEMO_TRACKS = {
  Amapiano: [
    {
      title: 'Amapiano Groove',
      artistName: 'DJ Maphorisa',
      genre: 'Amapiano',
      duration: 240,
      playCount: 125000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'amapiano-groove-dj-maphorisa',
      filePath: 'demo-tracks/amapiano/amapiano-groove.mp3',
    },
    {
      title: 'Piano Keys',
      artistName: 'Kabza De Small',
      genre: 'Amapiano',
      duration: 280,
      playCount: 98000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1511379938545-c1a6a9a05c74?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'piano-keys-kabza-de-small',
      filePath: 'demo-tracks/amapiano/piano-keys.mp3',
    },
    {
      title: 'Vibes & Melodies',
      artistName: 'Focalistic',
      genre: 'Amapiano',
      duration: 220,
      playCount: 156000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'vibes-melodies-focalistic',
      filePath: 'demo-tracks/amapiano/vibes-melodies.mp3',
    },
  ],
  'Afro House': [
    {
      title: 'House Revolution',
      artistName: 'Black Coffee',
      genre: 'Afro House',
      duration: 320,
      playCount: 89000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1571266028243-e4732b4b4b5a?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'house-revolution-black-coffee',
      filePath: 'demo-tracks/afro-house/house-revolution.mp3',
    },
    {
      title: 'Deep House Vibes',
      artistName: 'Culoe De Song',
      genre: 'Afro House',
      duration: 300,
      playCount: 67000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'deep-house-vibes-culoe-de-song',
      filePath: 'demo-tracks/afro-house/deep-house-vibes.mp3',
    },
    {
      title: 'African Soul',
      artistName: 'DJ Shimza',
      genre: 'Afro House',
      duration: 280,
      playCount: 112000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1511379938545-c1a6a9a05c74?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'african-soul-dj-shimza',
      filePath: 'demo-tracks/afro-house/african-soul.mp3',
    },
  ],
  Kwaito: [
    {
      title: 'Kwaito Classic',
      artistName: 'Arthur Mafokate',
      genre: 'Kwaito',
      duration: 260,
      playCount: 145000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'kwaito-classic-arthur-mafokate',
      filePath: 'demo-tracks/kwaito/kwaito-classic.mp3',
    },
    {
      title: 'Township Vibes',
      artistName: 'Mandoza',
      genre: 'Kwaito',
      duration: 240,
      playCount: 178000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1571266028243-e4732b4b4b5a?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'township-vibes-mandoza',
      filePath: 'demo-tracks/kwaito/township-vibes.mp3',
    },
    {
      title: 'Kwaito Nation',
      artistName: 'Trompies',
      genre: 'Kwaito',
      duration: 220,
      playCount: 134000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'kwaito-nation-trompies',
      filePath: 'demo-tracks/kwaito/kwaito-nation.mp3',
    },
  ],
  Gqom: [
    {
      title: 'Gqom Beat',
      artistName: 'DJ Lag',
      genre: 'Gqom',
      duration: 200,
      playCount: 98000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1511379938545-c1a6a9a05c74?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'gqom-beat-dj-lag',
      filePath: 'demo-tracks/gqom/gqom-beat.mp3',
    },
    {
      title: 'Electronic Pulse',
      artistName: 'Distruction Boyz',
      genre: 'Gqom',
      duration: 180,
      playCount: 156000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'electronic-pulse-distruction-boyz',
      filePath: 'demo-tracks/gqom/electronic-pulse.mp3',
    },
    {
      title: 'Durban Sound',
      artistName: 'Babes Wodumo',
      genre: 'Gqom',
      duration: 190,
      playCount: 189000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1571266028243-e4732b4b4b5a?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'durban-sound-babes-wodumo',
      filePath: 'demo-tracks/gqom/durban-sound.mp3',
    },
  ],
  'Hip Hop': [
    {
      title: 'SA Hip Hop',
      artistName: 'AKA',
      genre: 'Hip Hop',
      duration: 300,
      playCount: 234000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'sa-hip-hop-aka',
      filePath: 'demo-tracks/hip-hop/sa-hip-hop.mp3',
    },
    {
      title: 'Cape Town Flow',
      artistName: 'YoungstaCPT',
      genre: 'Hip Hop',
      duration: 280,
      playCount: 167000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1511379938545-c1a6a9a05c74?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'cape-town-flow-youngstacpt',
      filePath: 'demo-tracks/hip-hop/cape-town-flow.mp3',
    },
    {
      title: 'Jozi Streets',
      artistName: 'Nasty C',
      genre: 'Hip Hop',
      duration: 320,
      playCount: 298000,
      coverImageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
      uniqueUrl: 'jozi-streets-nasty-c',
      filePath: 'demo-tracks/hip-hop/jozi-streets.mp3',
    },
  ],
};

async function addGenreDemoTracks() {
  try {
    console.log('🎵 Adding demo tracks for genre playlists...');

    // Find admin user and their artist profile
    const admin = await prisma.user.findFirst({
      where: { email: 'dev@dev.com' },
      include: { artistProfile: true },
    });

    if (!admin) {
      throw new Error(
        'Admin user not found. Please run create-admin.js first.'
      );
    }

    if (!admin.artistProfile) {
      throw new Error(
        'Admin user has no artist profile. Please run create-admin-artist-profile.js first.'
      );
    }

    console.log(
      `✅ Found admin user: ${admin.name} with artist profile: ${admin.artistProfile.artistName}`
    );

    // Process each genre
    for (const genre of SOUTH_AFRICAN_GENRES) {
      console.log(`\n🎶 Processing genre: ${genre}`);

      // Find or create playlist for this genre
      let playlist = await prisma.playlist.findFirst({
        where: {
          name: genre,
          type: 'GENRE',
        },
      });

      if (!playlist) {
        console.log(`📝 Creating playlist for ${genre}...`);
        playlist = await prisma.playlist.create({
          data: {
            name: genre,
            description: `Curated ${genre} tracks from South African artists`,
            type: 'GENRE',
            status: 'ACTIVE',
            submissionStatus: 'OPEN',
            maxTracks: 50,
            maxSubmissionsPerArtist: 3,
            coverImage:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
            createdByUser: { connect: { id: admin.id } },
          },
        });
        console.log(`✅ Created playlist: ${playlist.name}`);
      } else {
        console.log(`✅ Found existing playlist: ${playlist.name}`);
      }

      // Get demo tracks for this genre (use first 3 tracks or create generic ones)
      const demoTracks = GENRE_DEMO_TRACKS[genre] || [
        {
          title: `${genre} Track 1`,
          artistName: 'Demo Artist',
          genre: genre,
          duration: 240,
          playCount: 50000,
          coverImageUrl:
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
          uniqueUrl: `${genre.toLowerCase()}-track-1-demo`,
          filePath: `demo-tracks/${genre.toLowerCase()}/${genre.toLowerCase()}-track-1.mp3`,
        },
        {
          title: `${genre} Track 2`,
          artistName: 'Demo Artist',
          genre: genre,
          duration: 280,
          playCount: 45000,
          coverImageUrl:
            'https://images.unsplash.com/photo-1511379938545-c1a6a9a05c74?w=400&h=400&fit=crop&crop=center',
          uniqueUrl: `${genre.toLowerCase()}-track-2-demo`,
          filePath: `demo-tracks/${genre.toLowerCase()}/${genre.toLowerCase()}-track-2.mp3`,
        },
        {
          title: `${genre} Track 3`,
          artistName: 'Demo Artist',
          genre: genre,
          duration: 260,
          playCount: 40000,
          coverImageUrl:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
          uniqueUrl: `${genre.toLowerCase()}-track-3-demo`,
          filePath: `demo-tracks/${genre.toLowerCase()}/${genre.toLowerCase()}-track-3.mp3`,
        },
      ];

      // Create tracks for this genre
      demoTracks.forEach(async (trackData, trackIndex) => {
        try {
          // Check if track already exists
          const existingTrack = await prisma.track.findFirst({
            where: { uniqueUrl: trackData.uniqueUrl },
          });

          if (existingTrack) {
            console.log(`⏭️  Track already exists: ${trackData.title}`);
            return;
          }

          // Create track
          const track = await prisma.track.create({
            data: {
              title: trackData.title,
              artist: trackData.artistName,
              genre: trackData.genre,
              duration: trackData.duration,
              playCount: trackData.playCount,
              coverImageUrl: trackData.coverImageUrl,
              uniqueUrl: trackData.uniqueUrl,
              filePath: trackData.filePath,
              isPublic: true,
              userId: admin.id,
              artistProfileId: admin.artistProfile.id,
            },
          });

          console.log(`✅ Created track: ${track.title} by ${track.artist}`);

          // Add track to playlist
          await prisma.playlistTrack.create({
            data: {
              playlistId: playlist.id,
              trackId: track.id,
              order: trackIndex + 1,
              addedByUser: { connect: { id: admin.id } },
            },
          });

          console.log(`✅ Added track to ${playlist.name} playlist`);
        } catch (trackError) {
          console.error(
            `❌ Error creating track ${trackData.title}:`,
            trackError.message
          );
        }
      });
    }

    console.log('\n🎉 Successfully added demo tracks for all genre playlists!');
    console.log('\n📊 Summary:');
    console.log(`- Processed ${SOUTH_AFRICAN_GENRES.length} genres`);
    console.log('- Each genre has 3 demo tracks');
    console.log('- Tracks are linked to their respective genre playlists');
  } catch (error) {
    console.error('❌ Error adding genre demo tracks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addGenreDemoTracks();
