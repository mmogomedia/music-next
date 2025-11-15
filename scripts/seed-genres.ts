import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GENRES = [
  { name: 'Amapiano', slug: 'amapiano' },
  { name: '3 Step', slug: '3-step', aliases: ['3Step', '3-Step'] },
  { name: 'Afropop', slug: 'afropop', aliases: ['Afro Pop'] },
  { name: 'Hip Hop', slug: 'hip-hop', aliases: ['HipHop'] },
  { name: 'Trap', slug: 'trap' },
  { name: 'House', slug: 'house' },
];

async function main() {
  console.log('Seeding genres...');
  let order = 0;
  for (const g of GENRES) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        isActive: true,
        order,
        aliases: (g as any).aliases || [],
      },
      create: {
        name: g.name,
        slug: g.slug,
        isActive: true,
        order,
        aliases: (g as any).aliases || [],
      },
    });
    console.log(`✓ ${genre.name} (${genre.slug})`);
    order += 10;
  }

  // Ensure some common aliases exist
  await prisma.genre.updateMany({
    where: { slug: 'amapiano' },
    data: { aliases: ['Piano'] },
  });
  console.log('✓ Genres seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });


