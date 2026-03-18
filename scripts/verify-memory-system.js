#!/usr/bin/env node

/**
 * Verify Memory System - Check database for embeddings, summaries, preferences
 *
 * Usage:
 *   node scripts/verify-memory-system.js [userId]
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function verifyMemorySystem(userId = null) {
  console.log('\n🔍 Verifying Memory System\n');
  console.log('═'.repeat(70));

  try {
    // Get user
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else {
      // Find most recent user with conversations
      user = await prisma.user.findFirst({
        where: {
          aiConversations: {
            some: {},
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!user) {
      console.log('❌ No user found. Send some messages first!');
      return;
    }

    console.log(`\n👤 Checking user: ${user.email} (${user.id})\n`);

    // 1. Check conversations
    console.log('1️⃣  Conversations:');
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });
    console.log(`   Found ${conversations.length} conversations`);
    if (conversations.length > 0) {
      const latest = conversations[0];
      console.log(`   Latest: ${latest.title || 'Untitled'} (${latest.id})`);

      // Check messages in latest conversation
      const messages = await prisma.aIConversationMessage.findMany({
        where: { conversationId: latest.id },
        orderBy: { createdAt: 'asc' },
      });
      console.log(
        `   Messages in latest: ${messages.length} (${messages.filter(m => m.role === 'user').length} user, ${messages.filter(m => m.role === 'assistant').length} assistant)`
      );
    }

    // 2. Check embeddings
    console.log('\n2️⃣  Embeddings:');
    const embeddings = await prisma.$queryRaw`
      SELECT 
        id,
        summary,
        importance,
        "messageCount" as message_count,
        "startTime" as start_time,
        "endTime" as end_time,
        "createdAt" as created_at,
        1536 as embedding_dimensions
      FROM conversation_embeddings
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;
    console.log(`   Found ${embeddings.length} embeddings`);
    if (embeddings.length > 0) {
      const latest = embeddings[0];
      console.log(`   Latest embedding:`);
      console.log(`     - Summary: ${latest.summary?.substring(0, 80)}...`);
      console.log(`     - Importance: ${latest.importance}`);
      console.log(`     - Message count: ${latest.message_count}`);
      console.log(`     - Dimensions: ${latest.embedding_dimensions || 'N/A'}`);
      console.log(`     - Created: ${latest.created_at}`);

      // Test vector operations
      console.log(`\n   Testing vector similarity search...`);
      try {
        const searchResults = await prisma.$queryRaw`
          SELECT 
            id,
            summary,
            importance,
            1 - (embedding <=> (
              SELECT embedding 
              FROM conversation_embeddings 
              WHERE "userId" = ${user.id} 
              ORDER BY "createdAt" DESC 
              LIMIT 1
            )) as similarity
          FROM conversation_embeddings
          WHERE "userId" = ${user.id}
            AND id != (SELECT id FROM conversation_embeddings WHERE "userId" = ${user.id} ORDER BY "createdAt" DESC LIMIT 1)
          ORDER BY similarity DESC
          LIMIT 3
        `;
        console.log(`     Found ${searchResults.length} similar memories`);
        searchResults.forEach((result, i) => {
          console.log(
            `     ${i + 1}. Similarity: ${result.similarity?.toFixed(3)}, Summary: ${result.summary?.substring(0, 50)}...`
          );
        });
      } catch (error) {
        console.log(`     ⚠️  Search test failed: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  No embeddings found');
      console.log('   💡 Embeddings are created asynchronously after messages');
      console.log('   💡 Check server logs for embedding generation');
    }

    // 3. Check preferences
    console.log('\n3️⃣  User Preferences:');
    const preferences = await prisma.userPreference.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: 'desc' },
    });
    console.log(`   Found ${preferences.length} preferences`);
    if (preferences.length > 0) {
      console.log(`   Top preferences:`);
      preferences.slice(0, 10).forEach(pref => {
        const totalScore =
          Number(pref.explicitScore) + Number(pref.implicitScore) * 0.5;
        console.log(`     - ${pref.type}: ${pref.entityName}`);
        console.log(
          `       Score: ${totalScore.toFixed(2)}, Count: ${pref.occurrenceCount}, Confidence: ${pref.confidence.toFixed(2)}`
        );
      });
    } else {
      console.log('   ⚠️  No preferences found');
      console.log('   💡 Preferences are extracted from messages');
    }

    // 4. Database table counts
    console.log('\n4️⃣  Database Statistics:');
    const embeddingCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM conversation_embeddings WHERE "userId" = ${user.id}
    `;
    const preferenceCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM user_preferences WHERE "userId" = ${user.id}
    `;
    const messageCount = await prisma.aIConversationMessage.count({
      where: {
        conversation: {
          userId: user.id,
        },
      },
    });
    console.log(
      `   conversation_embeddings: ${embeddingCount[0]?.count || 0} rows`
    );
    console.log(`   user_preferences: ${preferenceCount[0]?.count || 0} rows`);
    console.log(`   ai_conversation_messages: ${messageCount} rows`);

    // 5. Check pgvector extension
    console.log('\n5️⃣  pgvector Extension:');
    const extension = await prisma.$queryRaw`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'
    `;
    if (extension.length > 0) {
      console.log(
        `   ✅ Installed: ${extension[0].extname} ${extension[0].extversion}`
      );
    } else {
      console.log(`   ❌ Not installed`);
    }

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log('\n📊 Verification Summary:\n');
    console.log(
      `   Conversations: ${conversations.length > 0 ? '✅' : '⚠️'} ${conversations.length} found`
    );
    console.log(
      `   Messages: ${messageCount > 0 ? '✅' : '⚠️'} ${messageCount} found`
    );
    console.log(
      `   Embeddings: ${embeddings.length > 0 ? '✅' : '❌'} ${embeddings.length} found`
    );
    console.log(
      `   Preferences: ${preferences.length > 0 ? '✅' : '❌'} ${preferences.length} found`
    );
    console.log(
      `   pgvector: ${extension.length > 0 ? '✅' : '❌'} ${extension.length > 0 ? 'Installed' : 'Not installed'}`
    );

    if (embeddings.length === 0) {
      console.log('\n💡 Tips:');
      console.log('   - Embeddings are created asynchronously');
      console.log('   - Wait a few seconds after sending messages');
      console.log('   - Check OpenAI API key is configured');
      console.log('   - Check server logs for errors');
    }

    console.log(`\n👤 User ID: ${user.id}\n`);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Get userId from command line or use null
const userId = process.argv[2] || null;
verifyMemorySystem(userId).catch(console.error);
