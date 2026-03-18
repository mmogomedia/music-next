/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding league tiers...');

  const defaultTiers = [
    {
      code: 'TIER1',
      name: 'Top 20',
      targetSize: 20,
      minScore: 70,
      maxScore: null,
      refreshIntervalHours: 24,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'TIER2',
      name: 'Watchlist',
      targetSize: 100,
      minScore: 50,
      maxScore: 70,
      refreshIntervalHours: 12,
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const tierData of defaultTiers) {
    const existing = await prisma.leagueTier.findUnique({
      where: { code: tierData.code },
    });

    if (existing) {
      console.log(`Tier ${tierData.code} already exists, updating...`);
      await prisma.leagueTier.update({
        where: { code: tierData.code },
        data: tierData,
      });
      console.log(`Updated tier: ${tierData.code} - ${tierData.name}`);
    } else {
      await prisma.leagueTier.create({
        data: tierData,
      });
      console.log(`Created tier: ${tierData.code} - ${tierData.name}`);
    }
  }

  console.log('League tiers seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding league tiers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
