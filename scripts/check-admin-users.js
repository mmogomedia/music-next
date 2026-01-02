#!/usr/bin/env node

/**
 * Script to check admin users in production database
 *
 * Usage:
 *   DATABASE_URL='your-production-url' node scripts/check-admin-users.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in production database...\n');

    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isPremium: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database.\n');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   Premium: ${user.isPremium ? 'Yes' : 'No'}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
