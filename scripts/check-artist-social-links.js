#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkArtistSocialLinks() {
  try {
    console.log('🔍 Checking artist profile social links...\n');

    const artistProfile = await prisma.artistProfile.findFirst({
      where: {
        user: {
          email: 'tjmakunike@gmail.com',
        },
      },
      select: {
        id: true,
        artistName: true,
        socialLinks: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!artistProfile) {
      console.log('❌ No artist profile found.');
      process.exit(0);
    }

    console.log(`✅ Found artist profile: ${artistProfile.artistName}`);
    console.log(
      `   User: ${artistProfile.user.name} (${artistProfile.user.email})\n`
    );

    const socialLinks = artistProfile.socialLinks;

    if (!socialLinks || !socialLinks.tiktok) {
      console.log('❌ No TikTok connection found in socialLinks.');
      process.exit(0);
    }

    console.log('📱 TikTok Connection in socialLinks:');
    console.log('=====================================');
    console.log(JSON.stringify(socialLinks.tiktok, null, 2));
    console.log('=====================================\n');

    console.log('✅ All checks complete!');
  } catch (error) {
    console.error('\n❌ Error checking social links:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkArtistSocialLinks();
