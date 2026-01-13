const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNonAdminUsers() {
  try {
    const nonAdminUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN',
        },
        isActive: true,
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
        createdAt: 'desc',
      },
      take: 20, // Get first 20 non-admin users
    });

    console.log('\n=== Non-Admin Users ===');
    console.log(`Found ${nonAdminUsers.length} non-admin users:\n`);

    if (nonAdminUsers.length === 0) {
      console.log('No non-admin users found.');
    } else {
      nonAdminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Premium: ${user.isPremium}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error fetching non-admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNonAdminUsers();
