const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPlaylistTypes() {
  try {
    console.log('🌱 Seeding playlist types...');

    // Check if types already exist
    const existingTypes = await prisma.playlistTypeDefinition.findMany();
    if (existingTypes.length > 0) {
      console.log('✅ Playlist types already exist, skipping seed');
      return;
    }

    // Create default playlist types
    const playlistTypes = [
      {
        name: 'Genre',
        slug: 'genre',
        description: 'Curated music by specific genres',
        icon: '🎵',
        color: '#3B82F6',
        maxInstances: -1, // unlimited
        requiresProvince: false,
        defaultMaxTracks: 20,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Featured',
        slug: 'featured',
        description: 'Premium handpicked content',
        icon: '🏆',
        color: '#8B5CF6',
        maxInstances: 1, // only one featured playlist
        requiresProvince: false,
        defaultMaxTracks: 5,
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Top Ten',
        slug: 'top-ten',
        description: 'Trending and popular tracks',
        icon: '📊',
        color: '#F59E0B',
        maxInstances: 1, // only one top ten playlist
        requiresProvince: false,
        defaultMaxTracks: 10,
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'Province',
        slug: 'province',
        description: 'Geographic-based music curation',
        icon: '🏙️',
        color: '#10B981',
        maxInstances: 9, // one per province
        requiresProvince: true,
        defaultMaxTracks: 15,
        displayOrder: 4,
        isActive: true,
      },
    ];

    for (const typeData of playlistTypes) {
      const type = await prisma.playlistTypeDefinition.create({
        data: typeData,
      });
      console.log(`✅ Created playlist type: ${type.name} (${type.slug})`);
    }

    console.log('🎉 Successfully seeded playlist types!');
  } catch (error) {
    console.error('❌ Error seeding playlist types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlaylistTypes();
