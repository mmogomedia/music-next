#!/usr/bin/env node

/**
 * Script to verify email for a user
 *
 * Usage:
 *   node scripts/verify-email.js <email>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmail() {
  try {
    const email = process.argv[2] || 'tjmakunike@gmail.com';

    console.log(`🔍 Looking for user: ${email}...\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(
      `   Currently verified: ${user.emailVerified ? 'Yes' : 'No'}\n`
    );

    if (user.emailVerified) {
      console.log('ℹ️  Email is already verified.');
      console.log(`   Verified at: ${user.emailVerified}`);
      return;
    }

    // Verify email by setting emailVerified to current date
    console.log('✅ Verifying email...');
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log('\n✅ Email verified successfully!');
    console.log('=====================================');
    console.log(`Email: ${verifiedUser.email}`);
    console.log(`Verified at: ${verifiedUser.emailVerified}`);
    console.log(
      '\n🔑 The user can now log in without email verification errors.'
    );
  } catch (error) {
    console.error('\n❌ Error verifying email:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmail();
