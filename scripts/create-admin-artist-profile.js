const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminArtistProfile() {
  try {
    console.log('🎵 Creating artist profile for admin user...');

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('❌ No admin user found. Please run the seed script first.');
      return;
    }

    // Check if artist profile already exists
    const existingProfile = await prisma.artistProfile.findFirst({
      where: { userId: admin.id },
    });

    if (existingProfile) {
      console.log('✅ Admin user already has an artist profile');
      return;
    }

    // Create artist profile
    const artistProfile = await prisma.artistProfile.create({
      data: {
        userId: admin.id,
        artistName: 'Flemoji Admin',
        bio: 'Official Flemoji admin account for managing platform content',
        slug: 'flemoji-admin',
        isPublic: true,
        isVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Created artist profile:', artistProfile.artistName);
  } catch (error) {
    console.error('❌ Error creating artist profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminArtistProfile();
