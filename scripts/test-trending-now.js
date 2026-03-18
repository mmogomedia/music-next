/**
 * Test script specifically for "Trending Now" quick action
 * Verifies it returns the top ten playlist
 */

async function testTrendingNow() {
  console.log('\n🧪 Testing "Trending Now" Quick Action');
  console.log('='.repeat(80));
  console.log('Message: "Show me trending music right now"');
  console.log('Expected: Top ten playlist (via get_top_charts + get_playlist)');
  console.log(`${'='.repeat(80)}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Show me trending music right now',
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
    let responseData = null;

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
              console.log(`✓ Agent: ${agent}\n`);
            }

            if (data.type === 'calling_tool') {
              toolCalls.push({
                tool: data.tool,
                parameters: data.parameters,
              });
              console.log(`→ Tool: ${data.tool}`);
              if (data.parameters) {
                console.log(
                  `  Parameters: ${JSON.stringify(data.parameters, null, 2)}`
                );
              }
            }

            if (data.type === 'tool_result') {
              console.log(`✓ Result: ${data.resultCount || 'N/A'} items\n`);
            }

            if (data.type === 'agent_response') {
              if (data.message) {
                finalMessage = data.message;
              }
              if (data.data) {
                responseData = data.data;
              }
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
    console.log('-'.repeat(80));

    // const expectedTools = ['get_top_charts', 'get_playlist'];
    const hasTopCharts = toolCalls.some(tc => tc.tool === 'get_top_charts');
    const hasPlaylist = toolCalls.some(tc => tc.tool === 'get_playlist');
    const toolCountOK = toolCalls.length >= 2 && toolCalls.length <= 3;
    const correctTools = hasTopCharts && hasPlaylist;

    console.log(
      `Intent: ${intent === 'discovery' ? '✓' : '✗'} (got: ${intent})`
    );
    console.log(
      `Agent: ${agent === 'DiscoveryAgent' ? '✓' : '✗'} (got: ${agent})`
    );
    console.log(
      `Tool Calls: ${toolCountOK ? '✓' : '✗'} (${toolCalls.length} calls)`
    );
    console.log(`Has get_top_charts: ${hasTopCharts ? '✓' : '✗'}`);
    console.log(`Has get_playlist: ${hasPlaylist ? '✓' : '✗'}`);

    console.log(`\nTool Calls Made:`);
    toolCalls.forEach((tc, i) => {
      console.log(`  ${i + 1}. ${tc.tool}`);
      if (tc.parameters) {
        console.log(`     Params: ${JSON.stringify(tc.parameters)}`);
      }
    });

    if (responseData) {
      console.log(`\nResponse Data Type: ${responseData.type || 'N/A'}`);
      if (responseData.type === 'playlist' && responseData.data) {
        console.log(`✓ Playlist Response Detected`);
        console.log(`  Playlist: ${responseData.data.name || 'N/A'}`);
        console.log(`  Tracks: ${responseData.data.tracks?.length || 0}`);
      }
    }

    if (finalMessage) {
      console.log(`\nFinal Message (first 200 chars):`);
      console.log(`  ${finalMessage.substring(0, 200)}...`);
    }

    const allPassed =
      intent === 'discovery' &&
      agent === 'DiscoveryAgent' &&
      correctTools &&
      toolCountOK;

    console.log(`\n${'-'.repeat(80)}`);
    console.log(allPassed ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log(`${'-'.repeat(80)}\n`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}\n`);
    process.exit(1);
  }
}

testTrendingNow();
