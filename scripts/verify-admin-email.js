#!/usr/bin/env node

/**
 * Script to verify admin email address
 *
 * Usage:
 *   DATABASE_URL='your-production-url' node scripts/verify-admin-email.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdminEmail() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tatenda@flemoji.com';

    console.log(`🔐 Verifying email for admin account: ${ADMIN_EMAIL}\n`);

    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      console.error(`❌ Admin account not found: ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    if (admin.emailVerified) {
      console.log('✅ Email already verified');
      console.log(`   Verified at: ${admin.emailVerified.toISOString()}\n`);
    } else {
      const updatedAdmin = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          emailVerified: new Date(),
        },
      });

      console.log('✅ Email verified successfully!');
      console.log(`   Email: ${updatedAdmin.email}`);
      console.log(
        `   Verified at: ${updatedAdmin.emailVerified.toISOString()}\n`
      );
    }
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminEmail();
