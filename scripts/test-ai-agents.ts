/**
 * Test Script for AI Agents
 *
 * Run this script to test the AI agent system:
 * npx tsx scripts/test-ai-agents.ts
 *
 * or
 *
 * yarn test:agents
 */

import { RouterAgent } from '../src/lib/ai/agents';
import { MusicService } from '../src/lib/services';

async function testRouterAgent() {
  console.log('\n🧪 Testing Router Agent Intent Recognition\n');

  const router = new RouterAgent('openai');

  const testQueries = [
    'Find me Amapiano tracks',
    'Play the top playlist',
    'Recommend me music',
    'Show me trending tracks',
    'What should I listen to?',
    'Search for artists from Johannesburg',
  ];

  for (const query of testQueries) {
    const decision = router.getRoutingDecision(query);
    console.log(`Query: "${query}"`);
    console.log(`  → Agent: ${decision.agent}`);
    console.log(`  → Intent: ${decision.intent}`);
    console.log(`  → Confidence: ${decision.confidence.toFixed(2)}\n`);
  }
}

async function testServiceLayer() {
  console.log('\n🧪 Testing Service Layer\n');

  try {
    // Test track search by genre
    console.log('1. Searching for Amapiano tracks by genre...');
    const tracks = await MusicService.searchTracks('', {
      genre: 'Amapiano',
      limit: 5,
    });
    console.log(`   Found ${tracks.length} tracks\n`);

    if (tracks.length > 0) {
      console.log('   Sample track:');
      console.log(`   - Title: ${tracks[0].title}`);
      console.log(
        `   - Artist: ${tracks[0].artist || tracks[0].artistProfile?.artistName || 'Unknown'}`
      );
      console.log(`   - Genre: ${tracks[0].genre || 'N/A'}`);
      console.log(`   - Plays: ${tracks[0].playCount}`);
    }

    // Test general search
    console.log('\n2. Testing general search for "Caeser"...');
    const searchTracks = await MusicService.searchTracks('Caeser', {
      limit: 5,
    });
    console.log(`   Found ${searchTracks.length} tracks by search query\n`);

    // Test title search
    console.log('3. Testing title search for "Awukhuzeki"...');
    const titleTracks = await MusicService.searchTracks('Awukhuzeki', {
      limit: 5,
    });
    console.log(`   Found ${titleTracks.length} tracks by title\n`);
  } catch (error) {
    console.error('Error testing service layer:', error);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Flemoji AI Agent System Test');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test service layer first
  await testServiceLayer();

  // Test router agent
  await testRouterAgent();

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Tests Complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);
