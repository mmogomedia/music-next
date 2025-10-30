/**
 * Test script for Artist Strength Scoring System
 * This script tests the complete strength scoring pipeline
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStrengthScoring() {
  console.log('🧪 Testing Artist Strength Scoring System...\n');

  try {
    // 1. Check if we have artists and tracks
    const artistCount = await prisma.artistProfile.count();
    const trackCount = await prisma.track.count();
    
    console.log(`📊 Database Status:`);
    console.log(`   - Artists: ${artistCount}`);
    console.log(`   - Tracks: ${trackCount}\n`);

    if (artistCount === 0 || trackCount === 0) {
      console.log('❌ No artists or tracks found. Please run setup-test-data.js first.');
      return;
    }

    // 2. Check existing events
    const playEvents = await prisma.playEvent.count();
    const likeEvents = await prisma.likeEvent.count();
    const shareEvents = await prisma.shareEvent.count();
    
    console.log(`📈 Event Data:`);
    console.log(`   - Play Events: ${playEvents}`);
    console.log(`   - Like Events: ${likeEvents}`);
    console.log(`   - Share Events: ${shareEvents}\n`);

    // 3. Test strength scoring via API
    console.log('🔬 Testing Strength Scoring API...');
    
    const testArtist = await prisma.artistProfile.findFirst({
      where: { isActive: true },
      select: { id: true, artistName: true },
    });

    if (!testArtist) {
      console.log('❌ No active artists found for testing.');
      return;
    }

    console.log(`   - Testing with artist: ${testArtist.artistName} (${testArtist.id})`);

    // Test API endpoint
    const response = await fetch(`http://localhost:3000/api/stats/artist/${testArtist.id}/strength?timeRange=7d`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Strength scoring API working!');
      console.log(`   - Overall Score: ${data.data.scores.overallScore.toFixed(2)}`);
      console.log(`   - Engagement: ${data.data.scores.engagementScore.toFixed(2)}`);
      console.log(`   - Growth: ${data.data.scores.growthScore.toFixed(2)}`);
      console.log(`   - Quality: ${data.data.scores.qualityScore.toFixed(2)}`);
      console.log(`   - Potential: ${data.data.scores.potentialScore.toFixed(2)}`);
    } else {
      console.log('❌ Strength scoring API failed:', await response.text());
    }

    // 4. Test top artists API
    console.log('\n🏆 Testing Top Artists API...');
    
    const topResponse = await fetch('http://localhost:3000/api/stats/artists/top?timeRange=7d&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (topResponse.ok) {
      const topData = await topResponse.json();
      console.log('✅ Top artists API working!');
      console.log(`   - Found ${topData.data.artists.length} artists`);
      
      if (topData.data.artists.length > 0) {
        console.log(`   - Top artist: ${topData.data.artists[0].artistName} (Score: ${topData.data.artists[0].overallScore.toFixed(2)})`);
      }
    } else {
      console.log('❌ Top artists API failed:', await topResponse.text());
    }

    // 5. Check database for stored scores
    console.log('\n💾 Checking Stored Strength Scores...');
    
    const storedScores = await prisma.artistStrengthScore.findMany({
      include: {
        artist: {
          select: { artistName: true },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: 5,
    });

    if (storedScores.length > 0) {
      console.log('✅ Found stored strength scores:');
      storedScores.forEach((score, index) => {
        console.log(`   ${index + 1}. ${score.artist.artistName}: ${score.overallScore.toFixed(2)} (${score.timeRange})`);
      });
    } else {
      console.log('⚠️  No stored strength scores found. Run batch calculation to generate scores.');
    }

    // 6. Test batch calculation API
    console.log('\n🔄 Testing Batch Calculation API...');
    
    const batchResponse = await fetch('http://localhost:3000/api/stats/batch-calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timeRange: '7d' }),
    });

    if (batchResponse.ok) {
      const batchData = await batchResponse.json();
      console.log('✅ Batch calculation started successfully!');
      console.log(`   - Status: ${batchData.data.status}`);
      console.log(`   - Time Range: ${batchData.data.timeRange}`);
    } else {
      console.log('❌ Batch calculation API failed:', await batchResponse.text());
    }

    console.log('\n🎉 Strength Scoring System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Check the admin dashboard for the new Strength Scoring tab');
    console.log('   2. Monitor real-time stats collection in the music player');
    console.log('   3. Run batch calculations regularly to update scores');
    console.log('   4. Use the strength scores for artist discovery and scouting');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStrengthScoring();
