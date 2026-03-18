#!/usr/bin/env node
/* eslint-env node */
/* global Set */

/**
 * Copy Tracks from Production to Development Database
 *
 * This script copies tracks and their playlist associations from production to development.
 * It handles dependencies (users, artist profiles, genres) automatically.
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." DATABASE_URL_DEV="postgresql://..." node scripts/copy-tracks-prod-to-dev.js
 *
 * Or set environment variables:
 *   export DATABASE_URL_PROD="postgresql://..."
 *   export DATABASE_URL_DEV="postgresql://..."
 *   node scripts/copy-tracks-prod-to-dev.js
 */

/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL_PROD = process.env.DATABASE_URL_PROD;
const DATABASE_URL_DEV =
  process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!DATABASE_URL_PROD) {
  console.error(
    '\n❌ Error: DATABASE_URL_PROD environment variable is not set.'
  );
  console.log('\nTo get your production DATABASE_URL:');
  console.log(
    '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables'
  );
  console.log('2. Find DATABASE_URL for Production environment');
  console.log('3. Copy the value');
  console.log('\nThen run:');
  console.log(
    '  DATABASE_URL_PROD="your-production-url" node scripts/copy-tracks-prod-to-dev.js'
  );
  console.log('\nOr set it in your shell:');
  console.log('  export DATABASE_URL_PROD="your-production-url"');
  console.log('  node scripts/copy-tracks-prod-to-dev.js');
  process.exit(1);
}

if (!DATABASE_URL_DEV) {
  console.error(
    '\n❌ Error: DATABASE_URL_DEV or DATABASE_URL environment variable is not set.'
  );
  console.log(
    '\nMake sure you have DATABASE_URL in your .env.local file, or set DATABASE_URL_DEV'
  );
  process.exit(1);
}

// Create Prisma clients for both databases
const prismaProd = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_PROD,
    },
  },
});

const prismaDev = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_DEV,
    },
  },
});

async function copyGenres(prismaProd, prismaDev) {
  console.log('\n📋 Copying genres...');
  try {
    const genres = await prismaProd.genre.findMany();
    console.log(`   Production: ${genres.length} genres`);

    if (genres.length === 0) {
      console.log('   ⏭️  No genres to copy');
      return 0;
    }

    let copied = 0;
    for (const genre of genres) {
      try {
        await prismaDev.genre.upsert({
          where: { id: genre.id },
          update: genre,
          create: genre,
        });
        copied++;
      } catch (error) {
        if (
          !error.message.includes('duplicate') &&
          !error.message.includes('unique')
        ) {
          console.warn(
            `   ⚠️  Error copying genre ${genre.name}:`,
            error.message
          );
        }
      }
    }

    console.log(`   ✅ Copied ${copied} genres`);
    return copied;
  } catch (error) {
    console.error(`   ❌ Error copying genres:`, error.message);
    return 0;
  }
}

async function copyUsers(prismaProd, prismaDev) {
  console.log('\n📋 Copying users (for track ownership)...');
  try {
    // Get users who own tracks
    const trackOwners = await prismaProd.track.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = trackOwners.map(t => t.userId);
    if (userIds.length === 0) {
      console.log('   ⏭️  No track owners to copy');
      return 0;
    }

    const users = await prismaProd.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isPremium: true,
        isActive: true,
        stripeCustomerId: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        marketingConsent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`   Production: ${users.length} users`);

    let copied = 0;
    for (const user of users) {
      try {
        await prismaDev.user.upsert({
          where: { id: user.id },
          update: {
            ...user,
            password: null, // Don't copy passwords
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
          create: {
            ...user,
            password: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        copied++;
      } catch (error) {
        if (
          !error.message.includes('duplicate') &&
          !error.message.includes('unique')
        ) {
          console.warn(
            `   ⚠️  Error copying user ${user.email}:`,
            error.message
          );
        }
      }
    }

    console.log(`   ✅ Copied ${copied} users`);
    return copied;
  } catch (error) {
    console.error(`   ❌ Error copying users:`, error.message);
    return 0;
  }
}

async function copyArtistProfiles(prismaProd, prismaDev) {
  console.log('\n📋 Copying artist profiles (for tracks)...');
  try {
    // Get artist profiles referenced by tracks
    const trackArtists = await prismaProd.track.findMany({
      where: {
        OR: [
          { artistProfileId: { not: null } },
          { primaryArtistIds: { isEmpty: false } },
        ],
      },
      select: {
        artistProfileId: true,
        primaryArtistIds: true,
      },
    });

    const artistIds = new Set();
    trackArtists.forEach(t => {
      if (t.artistProfileId) artistIds.add(t.artistProfileId);
      if (t.primaryArtistIds)
        t.primaryArtistIds.forEach(id => artistIds.add(id));
    });

    if (artistIds.size === 0) {
      console.log('   ⏭️  No artist profiles to copy');
      return 0;
    }

    const profiles = await prismaProd.artistProfile.findMany({
      where: { id: { in: Array.from(artistIds) } },
    });

    console.log(`   Production: ${profiles.length} artist profiles`);

    let copied = 0;
    for (const profile of profiles) {
      try {
        await prismaDev.artistProfile.upsert({
          where: { id: profile.id },
          update: profile,
          create: profile,
        });
        copied++;
      } catch (error) {
        if (
          !error.message.includes('duplicate') &&
          !error.message.includes('unique')
        ) {
          console.warn(
            `   ⚠️  Error copying artist profile ${profile.artistName}:`,
            error.message
          );
        }
      }
    }

    console.log(`   ✅ Copied ${copied} artist profiles`);
    return copied;
  } catch (error) {
    console.error(`   ❌ Error copying artist profiles:`, error.message);
    return 0;
  }
}

async function copyTracks(prismaProd, prismaDev) {
  console.log('\n📋 Copying tracks...');
  try {
    const tracks = await prismaProd.track.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`   Production: ${tracks.length} tracks`);

    if (tracks.length === 0) {
      console.log('   ⏭️  No tracks to copy');
      return 0;
    }

    // Clear existing tracks in dev
    await prismaDev.playlistTrack.deleteMany({});
    await prismaDev.track.deleteMany({});
    console.log('   🗑️  Cleared existing tracks in dev');

    let copied = 0;
    let skipped = 0;

    for (const track of tracks) {
      try {
        await prismaDev.track.create({
          data: track,
        });
        copied++;
        if (copied % 10 === 0) {
          process.stdout.write(
            `   📊 Progress: ${copied}/${tracks.length} tracks\r`
          );
        }
      } catch (error) {
        if (
          error.message.includes('duplicate') ||
          error.message.includes('unique')
        ) {
          skipped++;
        } else {
          console.warn(
            `\n   ⚠️  Error copying track ${track.title}:`,
            error.message
          );
        }
      }
    }

    console.log(`\n   ✅ Copied ${copied} tracks`);
    if (skipped > 0) {
      console.log(`   ⏭️  Skipped ${skipped} duplicate tracks`);
    }

    return copied;
  } catch (error) {
    console.error(`   ❌ Error copying tracks:`, error.message);
    return 0;
  }
}

async function copyPlaylistTracks(prismaProd, prismaDev) {
  console.log('\n📋 Copying playlist track associations...');
  try {
    const playlistTracks = await prismaProd.playlistTrack.findMany({
      include: {
        playlist: { select: { id: true } },
        track: { select: { id: true } },
      },
    });

    console.log(
      `   Production: ${playlistTracks.length} playlist track associations`
    );

    if (playlistTracks.length === 0) {
      console.log('   ⏭️  No playlist tracks to copy');
      return 0;
    }

    // Verify playlists exist in dev
    const playlistIds = [...new Set(playlistTracks.map(pt => pt.playlistId))];
    const devPlaylists = await prismaDev.playlist.findMany({
      where: { id: { in: playlistIds } },
      select: { id: true },
    });
    const devPlaylistIds = new Set(devPlaylists.map(p => p.id));

    // Verify tracks exist in dev
    const trackIds = [...new Set(playlistTracks.map(pt => pt.trackId))];
    const devTracks = await prismaDev.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true },
    });
    const devTrackIds = new Set(devTracks.map(t => t.id));

    let copied = 0;
    let skipped = 0;

    for (const pt of playlistTracks) {
      // Skip if playlist or track doesn't exist in dev
      if (!devPlaylistIds.has(pt.playlistId) || !devTrackIds.has(pt.trackId)) {
        skipped++;
        continue;
      }

      try {
        await prismaDev.playlistTrack.upsert({
          where: {
            playlistId_trackId: {
              playlistId: pt.playlistId,
              trackId: pt.trackId,
            },
          },
          update: {
            order: pt.order,
            addedAt: pt.addedAt,
            addedBy: pt.addedBy,
            submissionId: pt.submissionId,
          },
          create: {
            playlistId: pt.playlistId,
            trackId: pt.trackId,
            order: pt.order,
            addedAt: pt.addedAt,
            addedBy: pt.addedBy,
            submissionId: pt.submissionId,
          },
        });
        copied++;
      } catch (error) {
        if (
          !error.message.includes('duplicate') &&
          !error.message.includes('unique')
        ) {
          console.warn(`   ⚠️  Error copying playlist track:`, error.message);
        }
      }
    }

    console.log(`   ✅ Copied ${copied} playlist track associations`);
    if (skipped > 0) {
      console.log(
        `   ⏭️  Skipped ${skipped} (playlist or track not found in dev)`
      );
    }

    // Update playlist currentTracks counts
    console.log('\n📊 Updating playlist track counts...');
    const playlists = await prismaDev.playlist.findMany({
      include: {
        _count: { select: { tracks: true } },
      },
    });

    for (const playlist of playlists) {
      const actualCount = playlist._count.tracks;
      if (playlist.currentTracks !== actualCount) {
        await prismaDev.playlist.update({
          where: { id: playlist.id },
          data: { currentTracks: actualCount },
        });
      }
    }

    console.log('   ✅ Updated playlist track counts');

    return copied;
  } catch (error) {
    console.error(`   ❌ Error copying playlist tracks:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('\n🚀 Copying Tracks from Production to Development Database\n');
  console.log(`Production: ${DATABASE_URL_PROD.replace(/:([^:]*@)/, ':***@')}`);
  console.log(
    `Development: ${DATABASE_URL_DEV.replace(/:([^:]*@)/, ':***@')}\n`
  );

  try {
    // Test connections
    console.log('🔌 Testing database connections...');
    await prismaProd.$connect();
    await prismaDev.$connect();
    console.log('✅ Connected to both databases\n');

    const stats = {
      genres: 0,
      users: 0,
      artistProfiles: 0,
      tracks: 0,
      playlistTracks: 0,
    };

    // Copy dependencies first
    stats.genres = await copyGenres(prismaProd, prismaDev);
    stats.users = await copyUsers(prismaProd, prismaDev);
    stats.artistProfiles = await copyArtistProfiles(prismaProd, prismaDev);

    // Copy tracks
    stats.tracks = await copyTracks(prismaProd, prismaDev);

    // Copy playlist associations
    stats.playlistTracks = await copyPlaylistTracks(prismaProd, prismaDev);

    console.log('\n\n✨ Copy Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Genres: ${stats.genres}`);
    console.log(`   Users: ${stats.users}`);
    console.log(`   Artist Profiles: ${stats.artistProfiles}`);
    console.log(`   Tracks: ${stats.tracks}`);
    console.log(`   Playlist Track Associations: ${stats.playlistTracks}`);

    console.log(
      '\n✅ Development database has been populated with tracks from production!'
    );
    console.log('⚠️  Note: User passwords were not copied for security.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prismaProd.$disconnect();
    await prismaDev.$disconnect();
  }
}

main();
