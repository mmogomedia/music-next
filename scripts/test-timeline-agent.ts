/**
 * Test script for Timeline Agent (Full Integration Test)
 *
 * This script tests the complete flow:
 * 1. TimelineAgent initialization
 * 2. Tool integration with LangChain
 * 3. Agent processing with real queries
 *
 * Run with: npx tsx scripts/test-timeline-agent.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { TimelineAgent } from '../src/lib/ai/agents/timeline-agent';

// Use console for script output
const log = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  success: (...args: any[]) => console.log('✅', ...args),
  fail: (...args: any[]) => console.error('❌', ...args),
};

async function testTimelineAgent() {
  log.info('===== Testing Timeline Agent (Full Integration) =====\n');

  try {
    // Test 1: Agent initialization
    log.info('Test 1: Agent initialization');
    const agent = new TimelineAgent('azure-openai');
    log.success('Agent initialized successfully\n');

    // Test 2: Simple query (should use tools)
    log.info('Test 2: Simple query - "Show me news articles"');
    try {
      const response1 = await agent.process('Show me news articles', {
        userId: 'test-user-id',
      });
      log.success(
        `Response received: ${response1.message.substring(0, 100)}...`
      );
      log.info(`  Metadata:`, response1.metadata);
      log.info('');
    } catch (error: any) {
      log.fail('Test 2 failed:', error.message);
      if (error.message.includes('toTool')) {
        log.error(
          '  → This is the error you encountered! The agent was trying to call .toTool() on tools.'
        );
      }
      log.info('');
    }

    // Test 3: Search query
    log.info('Test 3: Search query - "Find posts about music"');
    try {
      const response2 = await agent.process('Find posts about music', {
        userId: 'test-user-id',
      });
      log.success(
        `Response received: ${response2.message.substring(0, 100)}...`
      );
      log.info(`  Metadata:`, response2.metadata);
      log.info('');
    } catch (error: any) {
      log.fail('Test 3 failed:', error.message);
      log.info('');
    }

    // Test 4: Featured content query
    log.info('Test 4: Featured content query - "Show me featured content"');
    try {
      const response3 = await agent.process('Show me featured content', {
        userId: 'test-user-id',
      });
      log.success(
        `Response received: ${response3.message.substring(0, 100)}...`
      );
      log.info(`  Metadata:`, response3.metadata);
      log.info('');
    } catch (error: any) {
      log.fail('Test 4 failed:', error.message);
      log.info('');
    }

    log.info('===== Timeline Agent Tests Complete =====');
  } catch (error: any) {
    log.fail('Failed to initialize agent:', error.message);
    console.error(error);
  }
}

// Run tests
testTimelineAgent()
  .then(() => {
    log.info('\n✓ All tests completed');
    process.exit(0);
  })
  .catch(error => {
    log.fail('\n✗ Tests failed:', error);
    console.error(error);
    process.exit(1);
  });
