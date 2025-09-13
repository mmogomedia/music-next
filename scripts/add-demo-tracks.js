const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDemoTracks() {
  try {
    console.log('🎵 Adding demo tracks to playlists...');

    // First, let's find the admin user and playlists
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { artistProfile: true },
    });

    if (!admin) {
      console.log('❌ No admin user found. Please run the seed script first.');
      return;
    }

    if (!admin.artistProfile) {
      console.log(
        '❌ Admin user has no artist profile. Please create one first.'
      );
      return;
    }

    const playlists = await prisma.playlist.findMany();
    console.log(`Found ${playlists.length} playlists`);

    // Demo tracks data
    const demoTracks = [
      {
        title: 'Amapiano Vibes',
        artist: 'DJ Maphorisa',
        genre: 'Amapiano',
        duration: 245, // 4:05
        coverImageUrl:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        playCount: 1250,
        likeCount: 89,
        filePath: 'tracks/demo/amapiano-vibes.mp3',
        uniqueUrl: 'amapiano-vibes-dj-maphorisa',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Cape Town Nights',
        artist: 'Black Coffee',
        genre: 'Deep House',
        duration: 320, // 5:20
        coverImageUrl:
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
        playCount: 2100,
        likeCount: 156,
        filePath: 'tracks/demo/cape-town-nights.mp3',
        uniqueUrl: 'cape-town-nights-black-coffee',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Johannesburg Dreams',
        artist: 'Aka',
        genre: 'Hip Hop',
        duration: 180, // 3:00
        coverImageUrl:
          'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
        playCount: 890,
        likeCount: 67,
        filePath: 'tracks/demo/johannesburg-dreams.mp3',
        uniqueUrl: 'johannesburg-dreams-aka',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Durban Sunset',
        artist: 'Brenda Fassie',
        genre: 'Afro Pop',
        duration: 275, // 4:35
        coverImageUrl:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
        playCount: 1500,
        likeCount: 112,
        filePath: 'tracks/demo/durban-sunset.mp3',
        uniqueUrl: 'durban-sunset-brenda-fassie',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Pretoria Groove',
        artist: 'Sho Madjozi',
        genre: 'Gqom',
        duration: 195, // 3:15
        coverImageUrl:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        playCount: 980,
        likeCount: 78,
        filePath: 'tracks/demo/pretoria-groove.mp3',
        uniqueUrl: 'pretoria-groove-sho-madjozi',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Port Elizabeth Soul',
        artist: 'Ladysmith Black Mambazo',
        genre: 'Isicathamiya',
        duration: 340, // 5:40
        coverImageUrl:
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
        playCount: 750,
        likeCount: 45,
        filePath: 'tracks/demo/port-elizabeth-soul.mp3',
        uniqueUrl: 'port-elizabeth-soul-ladysmith-black-mambazo',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Bloemfontein Blues',
        artist: 'Hugh Masekela',
        genre: 'Jazz',
        duration: 420, // 7:00
        coverImageUrl:
          'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
        playCount: 1100,
        likeCount: 92,
        filePath: 'tracks/demo/bloemfontein-blues.mp3',
        uniqueUrl: 'bloemfontein-blues-hugh-masekela',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Kimberley Gold',
        artist: 'Miriam Makeba',
        genre: 'World Music',
        duration: 280, // 4:40
        coverImageUrl:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
        playCount: 1350,
        likeCount: 103,
        filePath: 'tracks/demo/kimberley-gold.mp3',
        uniqueUrl: 'kimberley-gold-miriam-makeba',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Nelspruit Energy',
        artist: 'DJ Tira',
        genre: 'Kwaito',
        duration: 220, // 3:40
        coverImageUrl:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        playCount: 800,
        likeCount: 56,
        filePath: 'tracks/demo/nelspruit-energy.mp3',
        uniqueUrl: 'nelspruit-energy-dj-tira',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
      {
        title: 'Polokwane Pride',
        artist: 'Mafikizolo',
        genre: 'Afro House',
        duration: 300, // 5:00
        coverImageUrl:
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
        playCount: 950,
        likeCount: 71,
        filePath: 'tracks/demo/polokwane-pride.mp3',
        uniqueUrl: 'polokwane-pride-mafikizolo',
        isPublic: true,
        userId: admin.id,
        artistProfileId: admin.artistProfile.id,
      },
    ];

    // Create tracks
    const createdTracks = [];
    for (const trackData of demoTracks) {
      const track = await prisma.track.create({
        data: trackData,
      });
      createdTracks.push(track);
      console.log(`✅ Created track: ${track.title} by ${track.artist}`);
    }

    // Add tracks to playlists
    const featuredPlaylist = playlists.find(p => p.type === 'FEATURED');
    const topTenPlaylist = playlists.find(p => p.type === 'TOP_TEN');
    const provincePlaylist = playlists.find(p => p.type === 'PROVINCE');
    const genrePlaylist = playlists.find(p => p.type === 'GENRE');

    // Add tracks to featured playlist
    if (featuredPlaylist) {
      await prisma.playlistTrack.createMany({
        data: createdTracks.slice(0, 3).map((track, index) => ({
          playlistId: featuredPlaylist.id,
          trackId: track.id,
          order: index + 1,
          addedBy: admin.id,
        })),
      });
      console.log(`✅ Added 3 tracks to featured playlist`);
    }

    // Add tracks to top ten playlist
    if (topTenPlaylist) {
      await prisma.playlistTrack.createMany({
        data: createdTracks.slice(0, 5).map((track, index) => ({
          playlistId: topTenPlaylist.id,
          trackId: track.id,
          order: index + 1,
          addedBy: admin.id,
        })),
      });
      console.log(`✅ Added 5 tracks to top ten playlist`);
    }

    // Add tracks to province playlist
    if (provincePlaylist) {
      await prisma.playlistTrack.createMany({
        data: createdTracks.slice(0, 4).map((track, index) => ({
          playlistId: provincePlaylist.id,
          trackId: track.id,
          order: index + 1,
          addedBy: admin.id,
        })),
      });
      console.log(`✅ Added 4 tracks to province playlist`);
    }

    // Add tracks to genre playlist
    if (genrePlaylist) {
      await prisma.playlistTrack.createMany({
        data: createdTracks.slice(0, 6).map((track, index) => ({
          playlistId: genrePlaylist.id,
          trackId: track.id,
          order: index + 1,
          addedBy: admin.id,
        })),
      });
      console.log(`✅ Added 6 tracks to genre playlist`);
    }

    // Update playlist track counts
    for (const playlist of playlists) {
      const trackCount = await prisma.playlistTrack.count({
        where: { playlistId: playlist.id },
      });

      await prisma.playlist.update({
        where: { id: playlist.id },
        data: { currentTracks: trackCount },
      });

      console.log(`✅ Updated ${playlist.name} track count to ${trackCount}`);
    }

    console.log('🎉 Demo tracks added successfully!');
  } catch (error) {
    console.error('❌ Error adding demo tracks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoTracks();
