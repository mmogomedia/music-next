/**
 * One-time script to seed demo test accounts.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-demo-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Demo1234!', 12);
  const now = new Date();

  // --- Fan user (no artist profile) ---
  const fan = await prisma.user.upsert({
    where: { email: 'demo.fan@flemoji.test' },
    update: { emailVerified: now, isActive: true },
    create: {
      email: 'demo.fan@flemoji.test',
      name: 'Demo Fan',
      password,
      emailVerified: now,
      isActive: true,
      role: 'USER',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  });
  console.log('✅ Fan user:', fan.email);

  // --- Artist user (with artist profile) ---
  const artist = await prisma.user.upsert({
    where: { email: 'demo.artist@flemoji.test' },
    update: { emailVerified: now, isActive: true, role: 'ARTIST' },
    create: {
      email: 'demo.artist@flemoji.test',
      name: 'Demo Artist',
      password,
      emailVerified: now,
      isActive: true,
      role: 'ARTIST',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  });
  console.log('✅ Artist user:', artist.email);

  // Create artist profile if it doesn't exist
  const existingProfile = await prisma.artistProfile.findFirst({
    where: { userId: artist.id },
  });

  if (!existingProfile) {
    const profile = await prisma.artistProfile.create({
      data: {
        userId: artist.id,
        artistName: 'Demo Artist',
        bio: 'A demo artist account for testing the Flemoji dashboard.',
        slug: 'demo-artist',
        isPublic: true,
        isVerified: false,
        isActive: true,
      },
    });
    console.log('✅ Artist profile created:', profile.artistName);
  } else {
    console.log('ℹ️  Artist profile already exists');
  }

  console.log('\n🎵 Demo accounts ready:');
  console.log('   Fan:    demo.fan@flemoji.test    / Demo1234!');
  console.log('   Artist: demo.artist@flemoji.test / Demo1234!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
