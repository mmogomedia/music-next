const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrphanedPlaylistTracks() {
  try {
    console.log('🔍 Checking for orphaned playlist tracks...');
    
    // Find all PlaylistTrack records
    const playlistTracks = await prisma.playlistTrack.findMany({
      include: {
        playlist: true,
        track: true,
      },
    });

    console.log(`📊 Found ${playlistTracks.length} playlist tracks`);

    // Check each playlist track to see if it has a corresponding approved submission
    const orphanedTracks = [];
    
    for (const playlistTrack of playlistTracks) {
      const approvedSubmission = await prisma.playlistSubmission.findFirst({
        where: {
          playlistId: playlistTrack.playlistId,
          trackId: playlistTrack.trackId,
          status: 'APPROVED',
        },
      });

      if (!approvedSubmission) {
        orphanedTracks.push(playlistTrack);
        console.log(`❌ Orphaned track: "${playlistTrack.track.title}" in playlist "${playlistTrack.playlist.name}"`);
        console.log(`   - PlaylistTrack ID: ${playlistTrack.id}`);
        console.log(`   - Submission ID: ${playlistTrack.submissionId || 'null'}`);
      }
    }

    if (orphanedTracks.length === 0) {
      console.log('✅ No orphaned playlist tracks found!');
      return;
    }

    console.log(`\n🚨 Found ${orphanedTracks.length} orphaned playlist tracks`);
    console.log('These tracks are in playlists but have no corresponding approved submissions.');
    
    // Ask if user wants to clean them up
    console.log('\n💡 To clean up orphaned tracks, run:');
    console.log('node scripts/cleanup-orphaned-playlist-tracks.js --cleanup');
    
    if (process.argv.includes('--cleanup')) {
      console.log('\n🧹 Cleaning up orphaned tracks...');
      
      for (const orphanedTrack of orphanedTracks) {
        await prisma.playlistTrack.delete({
          where: { id: orphanedTrack.id },
        });
        
        // Decrement playlist track count
        await prisma.playlist.update({
          where: { id: orphanedTrack.playlistId },
          data: {
            currentTracks: {
              decrement: 1,
            },
          },
        });
        
        console.log(`✅ Removed orphaned track: "${orphanedTrack.track.title}" from "${orphanedTrack.playlist.name}"`);
      }
      
      console.log(`\n🎉 Cleanup complete! Removed ${orphanedTracks.length} orphaned tracks.`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedPlaylistTracks();
