const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupAllSubmissions() {
  try {
    console.log('🧹 Starting cleanup of all submissions...');
    
    // Get counts before cleanup
    const [playlistSubmissionsCount, playlistTracksCount] = await Promise.all([
      prisma.playlistSubmission.count(),
      prisma.playlistTrack.count(),
    ]);

    console.log(`📊 Current data:`);
    console.log(`   - Playlist Submissions: ${playlistSubmissionsCount}`);
    console.log(`   - Playlist Tracks: ${playlistTracksCount}`);

    if (playlistSubmissionsCount === 0 && playlistTracksCount === 0) {
      console.log('✅ No submissions or playlist tracks to clean up!');
      return;
    }

    console.log('\n⚠️  WARNING: This will delete ALL playlist submissions and tracks!');
    console.log('This action cannot be undone.');
    
    if (!process.argv.includes('--confirm')) {
      console.log('\n💡 To confirm and proceed, run:');
      console.log('node scripts/cleanup-all-submissions.js --confirm');
      console.log('\nThis will:');
      console.log('   - Delete all PlaylistSubmission records');
      console.log('   - Delete all PlaylistTrack records');
      console.log('   - Reset playlist currentTracks counts to 0');
      console.log('   - Keep all playlists, tracks, and users intact');
      return;
    }

    console.log('\n🚀 Proceeding with cleanup...');

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete all playlist tracks first (due to foreign key constraints)
      console.log('🗑️  Deleting playlist tracks...');
      const deletedTracks = await tx.playlistTrack.deleteMany();
      console.log(`   ✅ Deleted ${deletedTracks.count} playlist tracks`);

      // Delete all playlist submissions
      console.log('🗑️  Deleting playlist submissions...');
      const deletedSubmissions = await tx.playlistSubmission.deleteMany();
      console.log(`   ✅ Deleted ${deletedSubmissions.count} playlist submissions`);

      // Reset playlist track counts
      console.log('🔄 Resetting playlist track counts...');
      const updatedPlaylists = await tx.playlist.updateMany({
        data: { currentTracks: 0 },
      });
      console.log(`   ✅ Reset track counts for ${updatedPlaylists.count} playlists`);
    });

    // Verify cleanup
    const [finalSubmissionsCount, finalTracksCount] = await Promise.all([
      prisma.playlistSubmission.count(),
      prisma.playlistTrack.count(),
    ]);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📊 Final data:`);
    console.log(`   - Playlist Submissions: ${finalSubmissionsCount}`);
    console.log(`   - Playlist Tracks: ${finalTracksCount}`);
    
    console.log('\n✅ Database is now clean and ready for new submissions!');
    console.log('💡 All playlists, tracks, and users remain intact.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllSubmissions();
