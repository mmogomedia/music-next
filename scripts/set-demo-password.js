#!/usr/bin/env node

/**
 * Script to set password for demo@flemoji.com
 *
 * Usage:
 *   node scripts/set-demo-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setDemoPassword() {
  try {
    const email = 'demo@flemoji.com';
    const password = 'demo123'; // Simple password for demo account

    console.log(`🔍 Looking for user: ${email}...\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(`   Role: ${user.role}\n`);

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    console.log('💾 Updating password...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log('\n✅ Password updated successfully!');
    console.log('=====================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n🔑 You can now log in with these credentials.');
    console.log('🌐 Visit: http://localhost:3000/login');
  } catch (error) {
    console.error('\n❌ Error setting password:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setDemoPassword();
