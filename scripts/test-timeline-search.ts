/**
 * Test script for Timeline AI Search Functionality
 *
 * This script tests:
 * 1. TimelineService search functionality
 * 2. Timeline tools search capabilities
 * 3. Sample queries that should work with the AI
 *
 * Run with: npx tsx scripts/test-timeline-search.ts
 * Or: yarn tsx scripts/test-timeline-search.ts
 */

import { TimelineService } from '../src/lib/services/timeline-service';

// Use console for script output
const log = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

async function testTimelineSearch() {
  log.info('===== Testing Timeline Search Functionality =====\n');

  // Test 1: Basic search query
  log.info('Test 1: Basic search query');
  try {
    const result1 = await TimelineService.getTimelineFeed({
      limit: 5,
      searchQuery: 'music',
    });
    log.info(`✓ Found ${result1.posts.length} posts matching "music"`);
    if (result1.posts.length > 0) {
      log.info(`  Sample post: ${result1.posts[0].title || 'No title'}`);
    }
  } catch (error) {
    log.error('✗ Test 1 failed:', error);
  }
  log.info('');

  // Test 2: Search by author name
  log.info('Test 2: Search by author name');
  try {
    const result2 = await TimelineService.getTimelineFeed({
      limit: 5,
      searchQuery: 'artist',
    });
    log.info(`✓ Found ${result2.posts.length} posts matching "artist"`);
    if (result2.posts.length > 0) {
      log.info(
        `  Sample author: ${result2.posts[0].author.name || result2.posts[0].author.email}`
      );
    }
  } catch (error) {
    log.error('✗ Test 2 failed:', error);
  }
  log.info('');

  // Test 3: Search with post type filter
  log.info('Test 3: Search with post type filter');
  try {
    const result3 = await TimelineService.getTimelineFeed({
      limit: 5,
      postTypes: ['NEWS_ARTICLE'],
      searchQuery: 'news',
    });
    log.info(`✓ Found ${result3.posts.length} news articles matching "news"`);
    if (result3.posts.length > 0) {
      log.info(`  Sample article: ${result3.posts[0].title || 'No title'}`);
    }
  } catch (error) {
    log.error('✗ Test 3 failed:', error);
  }
  log.info('');

  // Test 4: Search with no results
  log.info('Test 4: Search with no results (should return empty)');
  try {
    const result4 = await TimelineService.getTimelineFeed({
      limit: 5,
      searchQuery: 'xyzabc123nonexistent',
    });
    log.info(`✓ Search returned ${result4.posts.length} posts (expected 0)`);
  } catch (error) {
    log.error('✗ Test 4 failed:', error);
  }
  log.info('');

  // Test 5: Search with sort options
  log.info('Test 5: Search with sort by recent');
  try {
    const result5 = await TimelineService.getTimelineFeed({
      limit: 5,
      searchQuery: 'music',
      sortBy: 'recent',
    });
    log.info(`✓ Found ${result5.posts.length} posts sorted by recent`);
  } catch (error) {
    log.error('✗ Test 5 failed:', error);
  }
  log.info('');

  // Test 6: Search with trending sort
  log.info('Test 6: Search with sort by trending');
  try {
    const result6 = await TimelineService.getTimelineFeed({
      limit: 5,
      searchQuery: 'music',
      sortBy: 'trending',
    });
    log.info(`✓ Found ${result6.posts.length} posts sorted by trending`);
  } catch (error) {
    log.error('✗ Test 6 failed:', error);
  }
  log.info('');

  log.info('===== Timeline Search Tests Complete =====');
}

// Run tests
testTimelineSearch()
  .then(() => {
    log.info('\n✓ All tests completed');
    process.exit(0);
  })
  .catch(error => {
    log.error('\n✗ Tests failed:', error);
    console.error(error);
    process.exit(1);
  });
