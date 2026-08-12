#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script sets up the database from scratch and creates an admin account.
 * Perfect for fresh installations or development environments.
 *
 * Usage:
 *   node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const { createPrismaClient } = require('./lib/prisma.cjs');
const bcrypt = require('bcryptjs');

const prisma = createPrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Flemoji Database');
    console.log('==============================\n');

    // Step 1: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('yarn prisma:generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated\n');

    // Step 2: Push database schema
    console.log('🗄️  Pushing database schema...');
    execSync('yarn db:push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed\n');

    // Step 3: Check if admin already exists
    console.log('👤 Checking for existing admin account...');
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✅ Admin account already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
    } else {
      // Step 4: Create admin account
      console.log('🔐 Creating admin account...');
      const adminPassword = 'dev';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const admin = await prisma.user.create({
        data: {
          name: 'Dev',
          email: 'dev@dev.com',
          password: hashedPassword,
          role: 'ADMIN',
          isPremium: true,
        },
      });

      console.log('✅ Admin account created:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}\n`);
    }

    // Step 5: Verify setup
    console.log('🔍 Verifying database setup...');
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    console.log(`✅ Database setup complete!`);
    console.log(`   Total users: ${userCount}`);
    console.log(`   Admin users: ${adminCount}\n`);

    console.log('🎉 Setup Complete!');
    console.log('==================');
    console.log('You can now start the development server:');
    console.log('  yarn dev');
    console.log('\nAdmin login credentials:');
    console.log('  Email: dev@dev.com');
    console.log('  Password: dev');
    console.log('\nAdmin dashboard: http://localhost:3000/admin/dashboard');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase();
