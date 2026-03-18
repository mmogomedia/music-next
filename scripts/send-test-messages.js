#!/usr/bin/env node
/* eslint-env node */
/* global globalThis, Promise */

/**
 * Send Test Messages - Send 10 messages to test memory system
 *
 * Usage:
 *   node scripts/send-test-messages.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

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

let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    const { fetch: undiciFetch } = require('undici');
    fetch = undiciFetch;
  }
} catch (e) {
  fetch = require('node-fetch');
}

async function getOrCreateTestUser() {
  let user = await prisma.user.findFirst({
    where: { email: { contains: 'test' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `test-memory-${Date.now()}@example.com`,
        name: 'Memory Test User',
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
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let lastData = null;
    let hasComplete = false;
    let done = false;

    // eslint-disable-next-line no-constant-condition
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (done) break;

      const chunk = decoder.decode(result.value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') {
              lastData = data;
              hasComplete = true;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    return { success: hasComplete, data: lastData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 Sending Test Messages to Memory System\n');
  console.log('═'.repeat(70));

  try {
    // Get or create test user
    const user = await getOrCreateTestUser();
    const userId = user.id;

    // Create a conversation
    const conversationId = `test_memory_${Date.now()}`;
    await prisma.aIConversation.create({
      data: {
        id: conversationId,
        userId,
        title: 'Memory System Test',
        chatType: 'STREAMING',
      },
    });

    console.log(`\n📝 Sending ${testMessages.length} messages...\n`);
    console.log(`   Conversation ID: ${conversationId}`);
    console.log(`   User ID: ${userId}\n`);

    // Send messages
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      const shortMsg =
        message.length > 50 ? `${message.substring(0, 50)}...` : message;
      process.stdout.write(
        `[${i + 1}/${testMessages.length}] "${shortMsg}" ... `
      );

      const result = await sendMessage(userId, conversationId, message);

      if (result.success) {
        console.log('✅');
        successCount++;
      } else {
        console.log(`❌ ${result.error || 'Failed'}`);
        failCount++;
      }

      // Small delay between messages
      if (i < testMessages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(
      `\n✅ Sent ${successCount}/${testMessages.length} messages successfully`
    );
    if (failCount > 0) {
      console.log(`⚠️  ${failCount} messages failed`);
    }

    // Wait for async processing
    console.log('\n⏳ Waiting 15 seconds for async memory processing...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check results
    console.log('🔍 Checking Results\n');
    console.log('─'.repeat(70));

    // Check messages
    const messages = await prisma.aIConversationMessage.findMany({
      where: {
        conversation: {
          id: conversationId,
          userId,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`\n1️⃣  Messages: ${messages.length} total`);
    console.log(`   - User: ${messages.filter(m => m.role === 'user').length}`);
    console.log(
      `   - Assistant: ${messages.filter(m => m.role === 'assistant').length}`
    );

    // Check embeddings
    const embeddings = await prisma.$queryRaw`
      SELECT 
        id,
        summary,
        importance,
        "messageCount" as message_count,
        "createdAt" as created_at
      FROM conversation_embeddings
      WHERE "userId" = ${userId}
        AND "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
    `;
    console.log(`\n2️⃣  Embeddings: ${embeddings.length} found`);
    if (embeddings.length > 0) {
      embeddings.slice(0, 3).forEach((emb, i) => {
        console.log(
          `   ${i + 1}. Importance: ${emb.importance.toFixed(2)}, Summary: ${emb.summary?.substring(0, 60)}...`
        );
      });
    } else {
      console.log(
        '   ⚠️  No embeddings yet - check OpenAI API key and server logs'
      );
    }

    // Check preferences
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
    console.log(`\n3️⃣  Preferences: ${preferences.length} found`);
    if (preferences.length > 0) {
      preferences.slice(0, 5).forEach(pref => {
        const score =
          Number(pref.explicitScore) + Number(pref.implicitScore) * 0.5;
        console.log(
          `   - ${pref.type}: ${pref.entityName} (score: ${score.toFixed(2)}, count: ${pref.occurrenceCount})`
        );
      });
    }

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log('\n📊 Test Summary:\n');
    console.log(
      `   Messages: ${messages.length >= testMessages.length * 2 ? '✅' : '⚠️'} ${messages.length} (expected ~${testMessages.length * 2})`
    );
    console.log(
      `   Embeddings: ${embeddings.length > 0 ? '✅' : '❌'} ${embeddings.length} found`
    );
    console.log(
      `   Preferences: ${preferences.length > 0 ? '✅' : '❌'} ${preferences.length} found`
    );

    console.log(
      `\n💡 Run verification: node scripts/verify-memory-system.js ${userId}\n`
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
