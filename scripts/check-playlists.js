#!/usr/bin/env node

// Load environment variables from .env.production if it exists
const envFile = process.env.ENV_FILE || '.env.production';
require('dotenv').config({ path: envFile });

const { createPrismaClient } = require('./lib/prisma.cjs');

const prisma = createPrismaClient();

async function checkPlaylists() {
  try {
    console.log('🔍 Checking playlists in database...\n');

    // Count playlists
    const playlistCount = await prisma.playlist.count();
    console.log(`📊 Total playlists: ${playlistCount}`);

    if (playlistCount === 0) {
      console.log('\n⚠️  No playlists found in database.');
      return { hasPlaylists: false, count: 0 };
    }

    // Count by type
    const playlistsByType = await prisma.playlist.groupBy({
      by: ['playlistTypeId'],
      _count: true,
    });

    console.log('\n📋 Playlists by type:');
    for (const group of playlistsByType) {
      const type = await prisma.playlistTypeDefinition.findUnique({
        where: { id: group.playlistTypeId },
        select: { name: true, slug: true },
      });
      console.log(
        `  • ${type?.name || 'Unknown'} (${type?.slug || 'N/A'}): ${group._count}`
      );
    }

    // List all playlists
    const playlists = await prisma.playlist.findMany({
      include: {
        playlistType: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📝 All playlists:');
    playlists.forEach((playlist, index) => {
      console.log(
        `  ${index + 1}. ${playlist.name} (${playlist.playlistType?.name || 'Unknown'})`
      );
      console.log(
        `     Status: ${playlist.status}, Province: ${playlist.province || 'N/A'}`
      );
    });

    return { hasPlaylists: true, count: playlistCount, playlists };
  } catch (error) {
    console.error('❌ Error checking playlists:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPlaylists()
  .then(result => {
    if (result.hasPlaylists) {
      console.log(`\n✅ Database has ${result.count} playlist(s).`);
      process.exit(0);
    } else {
      console.log('\n💡 Run the seeding scripts to populate playlists.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
