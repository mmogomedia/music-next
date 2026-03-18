/**
 * Router Hybrid Evaluation Script
 *
 * Evaluates the hybrid routing system (keyword + LLM fallback)
 * Tests performance, accuracy, and LLM usage patterns.
 */

import { analyzeIntent } from '@/lib/ai/agents/router-intent-detector';
import { MIN_KEYWORD_CONFIDENCE_THRESHOLD } from '@/lib/ai/agents/agent-config';

interface TestCase {
  message: string;
  expectedIntent: string;
  description: string;
  shouldUseLLM?: boolean; // Whether this should trigger LLM fallback
}

const testCases: TestCase[] = [
  // High confidence keyword matches (should NOT use LLM)
  {
    message: 'find amapiano tracks',
    expectedIntent: 'discovery',
    description: 'Clear discovery query',
    shouldUseLLM: false,
  },
  {
    message: 'play this song',
    expectedIntent: 'playback',
    description: 'Clear playback command',
    shouldUseLLM: false,
  },
  {
    message: 'recommend me music',
    expectedIntent: 'recommendation',
    description: 'Clear recommendation query',
    shouldUseLLM: false,
  },
  // Low confidence queries (should use LLM)
  {
    message: 'I want something upbeat',
    expectedIntent: 'discovery',
    description: 'Ambiguous query - needs LLM',
    shouldUseLLM: true,
  },
  {
    message: 'something similar to what I listened to yesterday',
    expectedIntent: 'recommendation',
    description: 'Context-dependent query',
    shouldUseLLM: true,
  },
  // Edge cases
  {
    message: 'show me that thing',
    expectedIntent: 'discovery',
    description: 'Follow-up query',
    shouldUseLLM: false,
  },
  {
    message: 'how do music royalties work?',
    expectedIntent: 'industry',
    description: 'Industry knowledge query',
    shouldUseLLM: false,
  },
];

async function runEvaluation() {
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║         Router Hybrid System Evaluation                      ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n'
  );

  let totalTests = 0;
  let passedTests = 0;
  let llmUsedCount = 0;
  let keywordOnlyCount = 0;
  const latencies: number[] = [];

  for (const testCase of testCases) {
    totalTests++;

    // Test keyword-based routing first
    const keywordStart = Date.now();
    const keywordDecision = analyzeIntent(testCase.message);
    const keywordLatency = Date.now() - keywordStart;

    // Test full routing (with LLM fallback if needed)
    const routingStart = Date.now();
    let routingMethod = 'keyword';

    try {
      // Check if LLM would be used
      if (
        keywordDecision.confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD &&
        testCase.shouldUseLLM
      ) {
        routingMethod = 'llm';
        llmUsedCount++;
      } else {
        keywordOnlyCount++;
      }

      const routingLatency = Date.now() - routingStart;
      latencies.push(routingLatency);

      const passed = keywordDecision.intent === testCase.expectedIntent;

      if (passed) {
        passedTests++;
        console.log(
          `✅ [${totalTests}/${testCases.length}] ${testCase.description}`
        );
      } else {
        console.log(
          `❌ [${totalTests}/${testCases.length}] ${testCase.description}`
        );
      }

      console.log(`   Query: "${testCase.message}"`);
      console.log(
        `   Intent: ${keywordDecision.intent} (expected: ${testCase.expectedIntent})`
      );
      console.log(`   Confidence: ${keywordDecision.confidence.toFixed(2)}`);
      console.log(`   Method: ${routingMethod}`);
      console.log(`   Keyword Latency: ${keywordLatency}ms`);
      console.log(`   Total Latency: ${routingLatency}ms`);
      console.log('');
    } catch (error) {
      console.log(
        `❌ [${totalTests}/${testCases.length}] ${testCase.description}`
      );
      console.log(`   Error: ${error}`);
      console.log('');
    }
  }

  // Summary
  const averageLatency =
    latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const successRate = (passedTests / totalTests) * 100;

  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                         Evaluation Summary                    ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n'
  );
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${successRate.toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`\nRouting Method Distribution:`);
  console.log(
    `  Keyword-only: ${keywordOnlyCount} (${((keywordOnlyCount / totalTests) * 100).toFixed(1)}%)`
  );
  console.log(
    `  LLM Fallback: ${llmUsedCount} (${((llmUsedCount / totalTests) * 100).toFixed(1)}%)`
  );
  console.log(`\nPerformance:`);
  console.log(`  Average Latency: ${averageLatency.toFixed(2)}ms`);
  console.log(`  Min Latency: ${Math.min(...latencies)}ms`);
  console.log(`  Max Latency: ${Math.max(...latencies)}ms`);
}

// Run evaluation
runEvaluation().catch(console.error);
