/* global Promise */
/**
 * Test script to verify AI improvements
 * Tests each quick action and monitors tool calls
 */

const testMessages = [
  {
    id: 'trending',
    message: 'Show me the trending music right now',
    expectedIntent: 'discovery',
    expectedAgent: 'DiscoveryAgent',
    expectedTools: ['get_trending_tracks'],
    maxToolCalls: 1,
  },
  {
    id: 'genres',
    message: 'What music genres are available?',
    expectedIntent: 'discovery',
    expectedAgent: 'DiscoveryAgent',
    expectedTools: ['get_genres'],
    maxToolCalls: 1,
  },
  {
    id: 'provinces',
    message: 'Show me music from different provinces',
    expectedIntent: 'discovery',
    expectedAgent: 'DiscoveryAgent',
    expectedTools: ['get_province_stats', 'get_playlists_by_genre'],
    maxToolCalls: 2,
  },
  {
    id: 'discover',
    message: 'Help me discover new music based on my preferences',
    expectedIntent: 'recommendation',
    expectedAgent: 'RecommendationAgent',
    expectedTools: ['get_trending_tracks', 'get_featured_playlists'],
    maxToolCalls: 3,
  },
];

async function testMessage(test) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test: ${test.id}`);
  console.log(`Message: "${test.message}"`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test.message,
        context: {
          userId: 'test-user',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const toolCalls = [];
    let intent = null;
    let agent = null;
    let finalMessage = null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'routing_decision') {
              intent = data.intent;
              agent = data.agent;
              console.log(
                `✓ Intent: ${intent} (confidence: ${data.confidence})`
              );
              console.log(`✓ Agent: ${agent}`);
            }

            if (data.type === 'calling_tool') {
              toolCalls.push({
                tool: data.tool,
                parameters: data.parameters,
                originalMessage: data.originalMessage,
              });
              console.log(`  → Tool: ${data.tool}`);
              if (data.parameters) {
                console.log(
                  `    Parameters: ${JSON.stringify(data.parameters, null, 2)}`
                );
              }
            }

            if (data.type === 'tool_result') {
              console.log(`  ✓ Result: ${data.resultCount || 'N/A'} items`);
            }

            if (data.type === 'agent_response' && data.message) {
              finalMessage = data.message;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Test Results
    console.log(`\n${'-'.repeat(80)}`);
    console.log('RESULTS:');
    console.log(`${'-'.repeat(80)}`);

    const intentMatch = intent === test.expectedIntent;
    const agentMatch = agent === test.expectedAgent;
    const toolCountOK = toolCalls.length <= test.maxToolCalls;
    const expectedToolsUsed = test.expectedTools.some(tool =>
      toolCalls.some(tc => tc.tool === tool)
    );

    console.log(
      `Intent: ${intentMatch ? '✓' : '✗'} (expected: ${test.expectedIntent}, got: ${intent})`
    );
    console.log(
      `Agent: ${agentMatch ? '✓' : '✗'} (expected: ${test.expectedAgent}, got: ${agent})`
    );
    console.log(
      `Tool Calls: ${toolCountOK ? '✓' : '✗'} (${toolCalls.length} calls, max: ${test.maxToolCalls})`
    );
    console.log(`Expected Tools Used: ${expectedToolsUsed ? '✓' : '✗'}`);

    console.log(`\nTool Calls Made:`);
    toolCalls.forEach((tc, i) => {
      console.log(`  ${i + 1}. ${tc.tool}`);
    });

    const allPassed =
      intentMatch && agentMatch && toolCountOK && expectedToolsUsed;
    console.log(`\n${allPassed ? '✓ PASS' : '✗ FAIL'}\n`);

    return {
      test: test.id,
      passed: allPassed,
      intent,
      agent,
      toolCalls: toolCalls.length,
      toolNames: toolCalls.map(tc => tc.tool),
      finalMessage: `${finalMessage?.substring(0, 100)}...`,
    };
  } catch (error) {
    console.error(`✗ ERROR: ${error.message}\n`);
    return {
      test: test.id,
      passed: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('\n🧪 AI Improvements Test Suite');
  console.log('Testing tool call minimization and intent classification\n');

  const results = [];

  for (const test of testMessages) {
    const result = await testMessage(test);
    results.push(result);

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    } else if (!result.passed) {
      console.log(
        `  Tool Calls: ${result.toolCalls} (tools: ${result.toolNames?.join(', ') || 'N/A'})`
      );
    }
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total: ${passed}/${total} tests passed`);
  console.log(`${'='.repeat(80)}\n`);

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
