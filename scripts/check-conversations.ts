#!/usr/bin/env tsx

/**
 * Diagnostic script to check AI conversations in the database
 * 
 * Usage: yarn tsx scripts/check-conversations.ts [userId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConversations(userId?: string) {
  console.log('🔍 Checking AI Conversations in Database...\n');

  try {
    // 1. Check if we can connect to the database
    console.log('1️⃣  Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful\n');

    // 2. Get all users
    console.log('2️⃣  Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10,
    });
    console.log(`   Found ${users.length} users`);
    users.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.email} (${user.id})`);
    });
    console.log();

    // 3. Check if target user exists
    const targetUserId = userId || users[0]?.id;
    if (!targetUserId) {
      console.log('   ❌ No users found in database');
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      console.log(`   ❌ User ${targetUserId} not found`);
      return;
    }

    console.log(`3️⃣  Checking conversations for user: ${targetUser.email} (${targetUserId})`);
    console.log();

    // 4. Count conversations for user
    const conversationCount = await prisma.aIConversation.count({
      where: { userId: targetUserId },
    });
    console.log(`   Total conversations: ${conversationCount}`);

    // 5. Get all conversations for user
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get first message to check
        },
      },
    });

    if (conversations.length === 0) {
      console.log('   ⚠️  No conversations found for this user');
      console.log('   💡 This might be why the list is empty\n');
    } else {
      console.log(`   ✅ Found ${conversations.length} conversations:\n`);
      conversations.forEach((conv, idx) => {
        console.log(`   Conversation ${idx + 1}:`);
        console.log(`     ID: ${conv.id}`);
        console.log(`     Title: ${conv.title || '(Untitled)'}`);
        console.log(`     Created: ${conv.createdAt.toISOString()}`);
        console.log(`     Updated: ${conv.updatedAt.toISOString()}`);
        console.log(`     Messages: ${conv.messages.length} (showing first only)`);
        if (conv.messages.length > 0) {
          const firstMsg = conv.messages[0];
          console.log(
            `     First message: ${firstMsg.content.substring(0, 50)}...`
          );
        }
        console.log();
      });
    }

    // 6. Check total messages
    const messageCount = await prisma.aIConversationMessage.count({
      where: {
        conversation: {
          userId: targetUserId,
        },
      },
    });
    console.log(`4️⃣  Total messages across all conversations: ${messageCount}\n`);

    // 7. Check database table structure
    console.log('5️⃣  Database table check:');
    const tableInfo = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM ai_conversations
    `;
    console.log(
      `   Total conversations in database: ${tableInfo[0]?.count || 0}`
    );

    const messageTableInfo = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM ai_conversation_messages
    `;
    console.log(
      `   Total messages in database: ${messageTableInfo[0]?.count || 0}`
    );
    console.log();

    // 8. Test the exact query used by the API
    console.log('6️⃣  Testing API query (getUserConversations)...');
    const apiQueryResult = await prisma.aIConversation.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
    console.log(
      `   Query returned ${apiQueryResult.length} conversations:`
    );
    apiQueryResult.forEach((conv, idx) => {
      console.log(
        `   ${idx + 1}. ${conv.title || '(Untitled)'} - ${conv.id}`
      );
    });
    console.log();

    // Summary
    console.log('📊 Summary:');
    console.log(`   User: ${targetUser.email}`);
    console.log(`   Conversations: ${conversationCount}`);
    console.log(`   Messages: ${messageCount}`);
    if (conversationCount === 0) {
      console.log(
        '   ⚠️  No conversations found - user needs to start a chat first'
      );
    } else {
      console.log('   ✅ Conversations exist - should appear in UI');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Diagnostic complete');
  }
}

// Run the diagnostic
const userId = process.argv[2];
checkConversations(userId).catch(console.error);
