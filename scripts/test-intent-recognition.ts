/**
 * Intent Recognition Test
 *
 * Comprehensive test of router agent's intent detection capabilities
 *
 * Run: npx tsx scripts/test-intent-recognition.ts
 */

import { RouterAgent } from '../src/lib/ai/agents';

const router = new RouterAgent();

interface TestCase {
  query: string;
  expectedIntent: 'discovery' | 'playback' | 'recommendation';
  description?: string;
}

const testCases: TestCase[] = [
  // Discovery Intent Tests
  {
    query: 'Find me Amapiano tracks',
    expectedIntent: 'discovery',
    description: 'Basic discovery query',
  },
  {
    query: 'Search for tracks',
    expectedIntent: 'discovery',
    description: 'Simple search',
  },
  {
    query: 'Show me playlists',
    expectedIntent: 'discovery',
    description: 'Browse playlists',
  },
  {
    query: 'Find artists from Johannesburg',
    expectedIntent: 'discovery',
    description: 'Location-based search',
  },
  {
    query: 'Tell me about DJ Maphorisa',
    expectedIntent: 'discovery',
    description: 'Artist information',
  },
  {
    query: 'What tracks are trending',
    expectedIntent: 'discovery',
    description: 'Trending content',
  },
  {
    query: 'Browse hip hop music',
    expectedIntent: 'discovery',
    description: 'Genre browsing',
  },

  // Playback Intent Tests
  {
    query: 'Play this song',
    expectedIntent: 'playback',
    description: 'Direct play command',
  },
  {
    query: 'Start playing music',
    expectedIntent: 'playback',
    description: 'Play action',
  },
  {
    query: 'Add to queue',
    expectedIntent: 'playback',
    description: 'Queue management',
  },
  {
    query: 'Shuffle the playlist',
    expectedIntent: 'playback',
    description: 'Shuffle action',
  },
  {
    query: 'Queue this track',
    expectedIntent: 'playback',
    description: 'Add to queue',
  },
  {
    query: 'Pause the music',
    expectedIntent: 'playback',
    description: 'Pause action',
  },
  {
    query: 'Next song',
    expectedIntent: 'playback',
    description: 'Skip action',
  },
  {
    query: 'Resume playback',
    expectedIntent: 'playback',
    description: 'Resume action',
  },

  // Recommendation Intent Tests
  {
    query: 'What should I listen to?',
    expectedIntent: 'recommendation',
    description: 'Open recommendation',
  },
  {
    query: 'Recommend me music',
    expectedIntent: 'recommendation',
    description: 'Direct recommendation',
  },
  {
    query: 'Suggest similar tracks',
    expectedIntent: 'recommendation',
    description: 'Similar content',
  },
  {
    query: 'Show me new music',
    expectedIntent: 'recommendation',
    description: 'New releases',
  },
  {
    query: 'What else is good?',
    expectedIntent: 'recommendation',
    description: 'Casual recommendation',
  },
  {
    query: 'Help me find fresh tracks',
    expectedIntent: 'recommendation',
    description: 'Discovery with recommendation intent',
  },

  // Edge Cases
  {
    query: 'Hello',
    expectedIntent: 'discovery',
    description: 'Default fallback',
  },
  {
    query: 'Thanks',
    expectedIntent: 'discovery',
    description: 'No clear intent',
  },
];

function runIntentTests() {
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║         Router Agent - Intent Recognition Tests             ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n'
  );

  let passedTests = 0;
  const totalTests = testCases.length;
  const failedTests: Array<{ query: string; expected: string; got: string }> =
    [];

  testCases.forEach((testCase, index) => {
    const decision = router.getRoutingDecision(testCase.query);
    const passed = decision.intent === testCase.expectedIntent;

    if (passed) {
      passedTests++;
      console.log(
        `✅ [${index + 1}/${totalTests}] ${testCase.description || 'Test'}`
      );
      console.log(`   Query: "${testCase.query}"`);
      console.log(
        `   Intent: ${decision.intent} (confidence: ${decision.confidence.toFixed(2)})`
      );
      console.log(`   Agent: ${decision.agent}\n`);
    } else {
      failedTests.push({
        query: testCase.query,
        expected: testCase.expectedIntent,
        got: decision.intent,
      });
      console.log(
        `❌ [${index + 1}/${totalTests}] ${testCase.description || 'Test'}`
      );
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Expected: ${testCase.expectedIntent}`);
      console.log(`   Got: ${decision.intent}`);
      console.log(`   Confidence: ${decision.confidence.toFixed(2)}\n`);
    }
  });

  // Summary
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                         Test Summary                         ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n'
  );
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`
  );

  if (failedTests.length > 0) {
    console.log('❌ Failed Tests:\n');
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. "${test.query}"`);
      console.log(`   Expected: ${test.expected}, Got: ${test.got}\n`);
    });
  } else {
    console.log('🎉 All tests passed!\n');
  }
}

// Run tests
runIntentTests();
