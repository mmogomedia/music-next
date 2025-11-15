#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Dedicated script to ensure the production database has a secure admin account.
 *
 * By default it will create (or report on) the admin user for
 *   email: tatenda@flemoji.com
 *
 * Credentials can be overridden at runtime with environment variables:
 *   ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
 *
 * A strong random password is generated automatically when ADMIN_PASSWORD
 * is not provided. The generated password is printed to stdout so it can be
 * stored securely after execution.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tatenda@flemoji.com';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Flemoji Admin';
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || crypto.randomBytes(24).toString('base64url'); // ~32 chars, URL safe

async function ensureAdmin() {
  try {
    console.log('🔐 Ensuring Flemoji admin account exists…');

    if (!ADMIN_EMAIL || !ADMIN_EMAIL.includes('@')) {
      throw new Error(
        'ADMIN_EMAIL is missing or invalid. Provide a valid email address.'
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingUser) {
      console.log('♻️  Admin account found — refreshing credentials…');
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

      const updatedUser = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          name: ADMIN_NAME,
          password: passwordHash,
          role: 'ADMIN',
          isPremium: true,
          isActive: true,
        },
      });

      console.log('🎉 Admin credentials updated successfully!');
      console.log('========================================');
      console.log(`Email   : ${updatedUser.email}`);
      console.log(`Name    : ${updatedUser.name}`);
      console.log(`Role    : ${updatedUser.role}`);
      console.log(`Premium : ${updatedUser.isPremium ? 'Yes' : 'No'}`);
      console.log('');
      console.log('🔑 Store this password securely:');
      console.log(`   ${ADMIN_PASSWORD}`);
      return;
    }

    console.log('👤 Creating new admin user…');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: passwordHash,
        role: 'ADMIN',
        isPremium: true,
        isActive: true,
      },
    });

    console.log('🎉 Admin account created successfully!');
    console.log('=====================================');
    console.log(`Email   : ${adminUser.email}`);
    console.log(`Name    : ${adminUser.name}`);
    console.log(`Role    : ${adminUser.role}`);
    console.log(`Premium : ${adminUser.isPremium ? 'Yes' : 'No'}`);
    console.log('');
    console.log('🔑 Store this password securely:');
    console.log(`   ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Failed to ensure admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdmin();
