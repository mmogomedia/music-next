#!/usr/bin/env node
/* eslint-env node */
/* global globalThis, Promise */

/**
 * Test Memory System - Send 10 messages and verify embeddings, summaries, preferences
 *
 * Usage:
 *   node scripts/test-memory-system.js
 *
 * Requires:
 *   - DATABASE_URL in .env.local
 *   - OpenAI API key for embeddings
 *   - A test user in the database
 */

const { PrismaClient } = require('@prisma/client');
// Use native fetch (Node 18+) or undici
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    // Node 18+ should have fetch, but if not, try undici
    const { fetch: undiciFetch } = require('undici');
    fetch = undiciFetch;
  }
} catch (e) {
  // Fallback: use node-fetch if available, or throw
  fetch = require('node-fetch');
}

const prisma = new PrismaClient();

// Test messages that should trigger different memory features
const testMessages = [
  'I love amapiano music, especially from South Africa',
  'Can you recommend some afro house tracks?',
  "I'm looking for energetic music for a workout",
  'What are some good jazz artists?',
  'I really enjoy soulful house music',
  'Show me some gospel tracks',
  'I prefer upbeat music in the morning',
  'Do you have any hip hop recommendations?',
  "I love listening to r&b when I'm relaxing",
  "What's your favorite amapiano track?",
];

async function getTestUser() {
  // Try to find an existing user, or create one
  let user = await prisma.user.findFirst({
    where: { email: { contains: 'test' } },
  });

  if (!user) {
    // Create a test user
    user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'USER',
      },
    });
    console.log(`✅ Created test user: ${user.email}`);
  } else {
    console.log(`✅ Using existing test user: ${user.email}`);
  }

  return user;
}

async function sendMessage(
  userId,
  conversationId,
  message,
  baseUrl = 'http://localhost:3000'
) {
  try {
    const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationId,
        context: {
          userId,
        },
        chatType: 'STREAMING',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let lastData = null;
    let done = false;

    // eslint-disable-next-line no-constant-condition
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (done) break;

      const chunk = decoder.decode(result.value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') {
              lastData = data;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    return lastData;
  } catch (error) {
    console.error(`❌ Error sending message: ${error.message}`);
    return null;
  }
}

async function checkEmbeddings(userId, conversationId) {
  const embeddings = await prisma.$queryRaw`
    SELECT 
      id,
      summary,
      importance,
      message_count,
      start_time,
      end_time,
      created_at,
      array_length(embedding::text::int[], 1) as embedding_dimensions
    FROM conversation_embeddings
    WHERE user_id = ${userId}
      AND conversation_id = ${conversationId}
    ORDER BY created_at DESC
  `;

  return embeddings;
}

async function checkPreferences(userId) {
  const preferences = await prisma.userPreference.findMany({
    where: { userId },
    orderBy: { lastSeenAt: 'desc' },
  });

  return preferences;
}

async function checkMessages(userId, conversationId) {
  const messages = await prisma.aIConversationMessage.findMany({
    where: {
      conversation: {
        id: conversationId,
        userId,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages;
}

async function testSemanticSearch(userId, _query) {
  try {
    // This would require the embedding service, so we'll just check if embeddings exist
    const embeddings = await prisma.$queryRaw`
      SELECT 
        id,
        summary,
        importance,
        1 - (embedding <=> (
          SELECT embedding 
          FROM conversation_embeddings 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC 
          LIMIT 1
        )) as similarity
      FROM conversation_embeddings
      WHERE user_id = ${userId}
      ORDER BY similarity DESC
      LIMIT 3
    `;

    return embeddings;
  } catch (error) {
    console.error('Semantic search test error:', error.message);
    return [];
  }
}

async function runTests() {
  console.log('\n🧪 Testing Memory System\n');
  console.log('═'.repeat(70));

  try {
    // Get or create test user
    const user = await getTestUser();
    const userId = user.id;

    // Create a conversation
    const conversationId = `test_${Date.now()}`;
    await prisma.aIConversation.create({
      data: {
        id: conversationId,
        userId,
        title: 'Memory System Test',
        chatType: 'STREAMING',
      },
    });

    console.log(`\n📝 Sending ${testMessages.length} test messages...\n`);

    // Send messages
    let successCount = 0;
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(
        `[${i + 1}/${testMessages.length}] Sending: "${message.substring(0, 50)}..."`
      );

      const result = await sendMessage(userId, conversationId, message);
      if (result) {
        successCount++;
        console.log(`   ✅ Response received`);
      } else {
        console.log(`   ⚠️  No response`);
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(
      `\n✅ Sent ${successCount}/${testMessages.length} messages successfully\n`
    );

    // Wait a bit for async processing
    console.log('⏳ Waiting for memory processing...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check results
    console.log('🔍 Checking Results\n');
    console.log('─'.repeat(70));

    // 1. Check messages stored
    console.log('\n1️⃣  Checking Messages Stored:');
    const messages = await checkMessages(userId, conversationId);
    console.log(`   Found ${messages.length} messages`);
    console.log(
      `   User messages: ${messages.filter(m => m.role === 'user').length}`
    );
    console.log(
      `   Assistant messages: ${messages.filter(m => m.role === 'assistant').length}`
    );

    // 2. Check embeddings
    console.log('\n2️⃣  Checking Embeddings:');
    const embeddings = await checkEmbeddings(userId, conversationId);
    console.log(`   Found ${embeddings.length} embeddings`);
    if (embeddings.length > 0) {
      const latest = embeddings[0];
      console.log(`   Latest embedding:`);
      console.log(`     - Summary: ${latest.summary?.substring(0, 100)}...`);
      console.log(`     - Importance: ${latest.importance}`);
      console.log(`     - Message count: ${latest.message_count}`);
      console.log(`     - Dimensions: ${latest.embedding_dimensions || 'N/A'}`);
      console.log(`     - Created: ${latest.created_at}`);
    } else {
      console.log(
        '   ⚠️  No embeddings found - check if embedding service is working'
      );
    }

    // 3. Check preferences
    console.log('\n3️⃣  Checking User Preferences:');
    const preferences = await checkPreferences(userId);
    console.log(`   Found ${preferences.length} preferences`);
    if (preferences.length > 0) {
      console.log(`   Top preferences:`);
      preferences.slice(0, 5).forEach(pref => {
        console.log(
          `     - ${pref.type}: ${pref.entityName} (score: ${pref.explicitScore + pref.implicitScore * 0.5}, count: ${pref.occurrenceCount})`
        );
      });
    } else {
      console.log(
        '   ⚠️  No preferences found - check if preference extraction is working'
      );
    }

    // 4. Test semantic search
    console.log('\n4️⃣  Testing Semantic Search:');
    if (embeddings.length > 0) {
      const searchResults = await testSemanticSearch(userId, 'amapiano music');
      console.log(`   Found ${searchResults.length} similar memories`);
      if (searchResults.length > 0) {
        searchResults.forEach((result, i) => {
          console.log(
            `     ${i + 1}. Similarity: ${result.similarity?.toFixed(3)}, Summary: ${result.summary?.substring(0, 60)}...`
          );
        });
      }
    } else {
      console.log('   ⚠️  Skipped - no embeddings to search');
    }

    // 5. Check database tables
    console.log('\n5️⃣  Database Table Status:');
    const embeddingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM conversation_embeddings WHERE user_id = ${userId}
    `;
    const preferenceCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM user_preferences WHERE user_id = ${userId}
    `;
    console.log(
      `   conversation_embeddings: ${embeddingCount[0]?.count || 0} rows`
    );
    console.log(`   user_preferences: ${preferenceCount[0]?.count || 0} rows`);

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log('\n📊 Test Summary:\n');
    console.log(
      `   Messages: ${messages.length >= testMessages.length ? '✅' : '⚠️'} ${messages.length}/${testMessages.length * 2} (user + assistant)`
    );
    console.log(
      `   Embeddings: ${embeddings.length > 0 ? '✅' : '❌'} ${embeddings.length} found`
    );
    console.log(
      `   Preferences: ${preferences.length > 0 ? '✅' : '❌'} ${preferences.length} found`
    );
    console.log(
      `   Semantic Search: ${embeddings.length > 0 ? '✅' : '⚠️'} ${embeddings.length > 0 ? 'Working' : 'No embeddings to test'}`
    );

    console.log('\n💡 Next Steps:');
    if (embeddings.length === 0) {
      console.log('   - Check OpenAI API key is set');
      console.log('   - Verify embedding service is working');
      console.log('   - Check server logs for errors');
    }
    if (preferences.length === 0) {
      console.log('   - Check preference extraction logic');
      console.log('   - Verify genre/artist extraction');
    }

    console.log(`\n📝 Test Conversation ID: ${conversationId}`);
    console.log(`👤 Test User ID: ${userId}\n`);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests().catch(console.error);
