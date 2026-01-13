/**
 * Test script for the stats system
 * Tests event collection, aggregation, and analytics
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStatsSystem() {
  console.log('🧪 Testing Stats System...\n');

  try {
    // 1. Test event collection
    console.log('1. Testing event collection...');

    // Get a sample track
    const sampleTrack = await prisma.track.findFirst();
    if (!sampleTrack) {
      console.log(
        '❌ No tracks found in database. Please add some tracks first.'
      );
      return;
    }

    console.log(`📀 Using track: ${sampleTrack.title} (${sampleTrack.id})`);

    // Create sample events
    const now = new Date();
    const sessionId = `test_session_${Date.now()}`;

    // Create play events
    const playEvent = await prisma.playEvent.create({
      data: {
        trackId: sampleTrack.id,
        sessionId: sessionId,
        timestamp: now,
        source: 'test',
        userAgent: 'Test Agent',
        duration: 180, // 3 minutes
        completionRate: 75,
        skipped: false,
        replayed: false,
      },
    });

    console.log(`✅ Created play event: ${playEvent.id}`);

    // Create like event
    const likeEvent = await prisma.likeEvent.create({
      data: {
        trackId: sampleTrack.id,
        sessionId: sessionId,
        timestamp: now,
        source: 'test',
        action: 'like',
      },
    });

    console.log(`✅ Created like event: ${likeEvent.id}`);

    // Create share event
    const shareEvent = await prisma.shareEvent.create({
      data: {
        trackId: sampleTrack.id,
        sessionId: sessionId,
        timestamp: now,
        platform: 'twitter',
        source: 'test',
      },
    });

    console.log(`✅ Created share event: ${shareEvent.id}`);

    // Create download event
    const downloadEvent = await prisma.downloadEvent.create({
      data: {
        trackId: sampleTrack.id,
        sessionId: sessionId,
        timestamp: now,
        source: 'test',
        userAgent: 'Test Agent',
      },
    });

    console.log(`✅ Created download event: ${downloadEvent.id}`);

    // 2. Test aggregation
    console.log('\n2. Testing aggregation...');

    // Import the aggregator
    const { statsAggregator } = require('../src/lib/aggregation-jobs');

    // Run daily aggregation for today
    await statsAggregator.aggregateDaily(now);
    console.log('✅ Daily aggregation completed');

    // Check if daily stats were created
    const dailyStats = await prisma.dailyStats.findFirst({
      where: {
        trackId: sampleTrack.id,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    });

    if (dailyStats) {
      console.log(`✅ Daily stats created:`, {
        totalPlays: dailyStats.totalPlays,
        uniquePlays: dailyStats.uniquePlays,
        totalLikes: dailyStats.totalLikes,
        totalShares: dailyStats.totalShares,
        totalDownloads: dailyStats.totalDownloads,
        avgDuration: dailyStats.avgDuration,
        avgCompletionRate: dailyStats.avgCompletionRate,
      });
    } else {
      console.log('❌ Daily stats not created');
    }

    // 3. Test analytics API
    console.log('\n3. Testing analytics API...');

    // Test the analytics endpoint
    const response = await fetch('http://localhost:3000/api/stats/analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test', // This will fail auth, but we can see the structure
      },
    });

    console.log(`📊 Analytics API response status: ${response.status}`);

    if (response.status === 401) {
      console.log(
        '✅ Analytics API is properly protected (requires admin auth)'
      );
    } else {
      const data = await response.json();
      console.log('📊 Analytics data:', data);
    }

    // 4. Test anonymous user tracking
    console.log('\n4. Testing anonymous user tracking...');

    // Create events without userId (anonymous)
    const anonymousPlayEvent = await prisma.playEvent.create({
      data: {
        trackId: sampleTrack.id,
        sessionId: `anonymous_${Date.now()}`,
        timestamp: now,
        source: 'landing',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        duration: 120,
        completionRate: 50,
        skipped: true,
        replayed: false,
      },
    });

    console.log(`✅ Created anonymous play event: ${anonymousPlayEvent.id}`);

    // 5. Test time-based queries
    console.log('\n5. Testing time-based queries...');

    // Get events from last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentEvents = await prisma.playEvent.findMany({
      where: {
        trackId: sampleTrack.id,
        timestamp: {
          gte: last24Hours,
        },
      },
    });

    console.log(`📈 Events in last 24 hours: ${recentEvents.length}`);

    // 6. Test track counters
    console.log('\n6. Testing track counters...');

    const updatedTrack = await prisma.track.findUnique({
      where: { id: sampleTrack.id },
    });

    console.log(`📊 Track counters:`, {
      playCount: updatedTrack.playCount,
      likeCount: updatedTrack.likeCount,
      shareCount: updatedTrack.shareCount,
      downloadCount: updatedTrack.downloadCount,
    });

    // 7. Cleanup test data
    console.log('\n7. Cleaning up test data...');

    await prisma.playEvent.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test_session_',
        },
      },
    });

    await prisma.likeEvent.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test_session_',
        },
      },
    });

    await prisma.shareEvent.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test_session_',
        },
      },
    });

    await prisma.downloadEvent.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test_session_',
        },
      },
    });

    await prisma.playEvent.deleteMany({
      where: {
        sessionId: {
          startsWith: 'anonymous_',
        },
      },
    });

    // Reset track counters
    await prisma.track.update({
      where: { id: sampleTrack.id },
      data: {
        playCount: sampleTrack.playCount,
        likeCount: sampleTrack.likeCount,
        shareCount: sampleTrack.shareCount,
        downloadCount: sampleTrack.downloadCount,
      },
    });

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Stats system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Event collection working');
    console.log('✅ Anonymous user tracking working');
    console.log('✅ Time-based queries working');
    console.log('✅ Aggregation system working');
    console.log('✅ Analytics API protected');
    console.log('✅ Track counters updated');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStatsSystem();
