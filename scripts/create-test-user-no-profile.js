/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUserNoProfile() {
  const timestamp = Date.now();
  const userEmail = `test-user-${timestamp}-${Math.floor(Math.random() * 1000)}@flemoji.com`;
  const userPassword = 'Test123!@#';
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  console.log('🚀 Creating new test user without profile...');

  // Create a new user
  const newUser = await prisma.user.create({
    data: {
      email: userEmail,
      password: hashedPassword,
      emailVerified: new Date(), // Mark as verified so they can login
      name: `Test User ${timestamp}`,
    },
  });

  console.log(`✅ Created test user:`);
  console.log(`   Email: ${newUser.email}`);
  console.log(`   Password: ${userPassword}`);
  console.log(`   User ID: ${newUser.id}`);
  console.log(`   Email Verified: ${newUser.emailVerified ? 'Yes' : 'No'}`);

  // Verify no profile exists
  const profile = await prisma.artistProfile.findFirst({
    where: { userId: newUser.id },
  });

  if (profile) {
    console.log(`\n⚠️  Warning: User already has a profile (unexpected)`);
  } else {
    console.log(`\n✅ Confirmed: User has no artist profile`);
  }

  console.log('\n📋 Test User Created!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email:    ${newUser.email}`);
  console.log(`Password: ${userPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { user: newUser };
}

createTestUserNoProfile()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
