#!/usr/bin/env node

/**
 * Create Admin Account Script
 *
 * This script creates an admin account for the Flemoji platform.
 * It can be run manually when setting up a fresh database.
 *
 * Usage:
 *   node scripts/create-admin.js
 *   node scripts/create-admin.js --email admin@yourdomain.com --password securepassword
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'Dev',
  email: 'dev@dev.com',
  password: 'dev',
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--email') {
      options.email = value;
    } else if (key === '--password') {
      options.password = value;
    } else if (key === '--name') {
      options.name = value;
    }
  }

  return options;
}

// Get user input
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new global.Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  return password && password.length >= 6;
}

async function createAdmin() {
  try {
    console.log('🔐 Flemoji Admin Account Creator');
    console.log('================================\n');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}\n`);

      const overwrite = await askQuestion(
        'Do you want to create another admin? (y/N): '
      );
      if (
        overwrite.toLowerCase() !== 'y' &&
        overwrite.toLowerCase() !== 'yes'
      ) {
        console.log('❌ Admin creation cancelled.');
        return;
      }
    }

    // Parse command line arguments
    const args = parseArgs();

    let adminData = { ...DEFAULT_ADMIN };

    // If no command line args, ask for input
    if (!args.email && !args.password && !args.name) {
      console.log('Enter admin account details (press Enter for defaults):\n');

      const email = await askQuestion(`Email [${DEFAULT_ADMIN.email}]: `);
      if (email.trim()) {
        adminData.email = email.trim();
      }

      const name = await askQuestion(`Name [${DEFAULT_ADMIN.name}]: `);
      if (name.trim()) {
        adminData.name = name.trim();
      }

      const password = await askQuestion(
        `Password [${DEFAULT_ADMIN.password}]: `
      );
      if (password.trim()) {
        adminData.password = password.trim();
      }
    } else {
      // Use command line arguments
      adminData = {
        name: args.name || DEFAULT_ADMIN.name,
        email: args.email || DEFAULT_ADMIN.email,
        password: args.password || DEFAULT_ADMIN.password,
      };
    }

    // Validate inputs
    if (!isValidEmail(adminData.email)) {
      throw new Error('❌ Invalid email format');
    }

    if (!isValidPassword(adminData.password)) {
      throw new Error('❌ Password must be at least 6 characters long');
    }

    if (!adminData.name.trim()) {
      throw new Error('❌ Name is required');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingUser) {
      throw new Error(`❌ User with email ${adminData.email} already exists`);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Create admin user
    console.log('👤 Creating admin account...');
    const admin = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: 'ADMIN',
        isPremium: true,
      },
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('=====================================');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Premium: ${admin.isPremium ? 'Yes' : 'No'}`);
    console.log(`Created: ${admin.createdAt}`);
    console.log('\n🔑 You can now log in with these credentials.');
    console.log('🌐 Visit: http://localhost:3000/login');
  } catch (error) {
    console.error('\n❌ Error creating admin account:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();
