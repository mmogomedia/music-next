#!/usr/bin/env node
/* eslint-env node */
/* global globalThis, Promise */

/**
 * Send Test Messages (Fast) - Send messages with minimal delays
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const testMessages = [
  'I love amapiano music',
  'Show me afro house tracks',
  'I need energetic workout music',
  'What jazz artists do you recommend?',
  'I enjoy soulful house',
  'Play some gospel',
  'I like upbeat morning music',
  'Any hip hop suggestions?',
  'I love r&b for relaxing',
  'Favorite amapiano track?',
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

async function sendMessage(userId, conversationId, message) {
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId,
        context: { userId },
        chatType: 'STREAMING',
      }),
    });

    if (!response.ok) return { success: false };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let hasComplete = false;
    let done = false;

    // eslint-disable-next-line no-constant-condition
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (done) break;
      const chunk = decoder.decode(result.value, { stream: true });
      if (chunk.includes('"type":"complete"')) hasComplete = true;
    }

    return { success: hasComplete };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 Sending 10 Test Messages (Fast Mode)\n');

  try {
    const user = await prisma.user.findFirst({
      where: { email: { contains: 'test' } },
      orderBy: { createdAt: 'desc' },
    });

    if (!user) {
      console.log('❌ No test user found');
      return;
    }

    const conversationId = `test_fast_${Date.now()}`;
    await prisma.aIConversation.create({
      data: {
        id: conversationId,
        userId: user.id,
        title: 'Fast Test',
        chatType: 'STREAMING',
      },
    });

    console.log(`User: ${user.email}`);
    console.log(`Conversation: ${conversationId}\n`);

    let success = 0;
    for (let i = 0; i < testMessages.length; i++) {
      process.stdout.write(`[${i + 1}/10] `);
      const result = await sendMessage(
        user.id,
        conversationId,
        testMessages[i]
      );
      console.log(result.success ? '✅' : '❌');
      if (result.success) success++;
      await new Promise(r => setTimeout(r, 1000)); // 1 second delay
    }

    console.log(`\n✅ ${success}/10 messages sent`);
    console.log('\n⏳ Waiting 10 seconds for processing...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Quick check
    const messages = await prisma.aIConversationMessage.count({
      where: { conversation: { id: conversationId } },
    });
    const embeddings = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM conversation_embeddings 
      WHERE "conversationId" = ${conversationId}
    `;
    const preferences = await prisma.userPreference.count({
      where: { userId: user.id },
    });

    console.log('📊 Results:');
    console.log(`   Messages: ${messages}`);
    console.log(`   Embeddings: ${embeddings[0]?.count || 0}`);
    console.log(`   Preferences: ${preferences}`);
    console.log(`\n💡 Run: node scripts/verify-memory-system.js ${user.id}\n`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
