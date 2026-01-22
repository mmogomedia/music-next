#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTikTokConnection() {
  try {
    console.log('🔍 Checking TikTok connections in database...\n');

    // Check Account table for TikTok connections
    const tiktokAccounts = await prisma.account.findMany({
      where: {
        provider: 'tiktok',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        userId: 'desc',
      },
    });

    console.log(`✅ Found ${tiktokAccounts.length} TikTok connection(s)\n`);

    if (tiktokAccounts.length === 0) {
      console.log('❌ No TikTok connections found in database.');
      process.exit(0);
    }

    tiktokAccounts.forEach((account, index) => {
      console.log(`\n📱 Connection ${index + 1}:`);
      console.log('=====================================');
      console.log(`User ID: ${account.userId}`);
      console.log(`User Email: ${account.user.email || 'N/A'}`);
      console.log(`User Name: ${account.user.name || 'N/A'}`);
      console.log(`Provider: ${account.provider}`);
      console.log(`Provider Account ID: ${account.providerAccountId}`);
      console.log(
        `Access Token: ${account.access_token ? '✅ Present' : '❌ Missing'}`
      );
      console.log(
        `Refresh Token: ${account.refresh_token ? '✅ Present' : '❌ Missing'}`
      );
      console.log(
        `Expires At: ${account.expires_at ? new Date(account.expires_at * 1000).toISOString() : 'N/A'}`
      );
      console.log(`Token Type: ${account.token_type || 'N/A'}`);
      console.log(`Scope: ${account.scope || 'N/A'}`);
      console.log('=====================================\n');
    });

    // Check for any TikTok-related data in other tables
    console.log('\n🔍 Checking for additional TikTok data...\n');

    // Check if there are any artist profiles for these users
    const userIds = tiktokAccounts.map(acc => acc.userId);
    const artistProfiles = await prisma.artistProfile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        id: true,
        userId: true,
        artistName: true,
      },
    });

    console.log(
      `✅ Found ${artistProfiles.length} artist profile(s) for TikTok-connected users\n`
    );
    artistProfiles.forEach(profile => {
      console.log(`  - ${profile.artistName} (User ID: ${profile.userId})`);
    });

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('\n❌ Error checking database:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTikTokConnection();
