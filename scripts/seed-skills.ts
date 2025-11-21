/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common artist skills with slugs
const SKILLS = [
  {
    name: 'Producer',
    slug: 'producer',
    description: 'Creates beats and produces music',
    order: 10,
  },
  {
    name: 'Vocalist',
    slug: 'vocalist',
    description: 'Sings and performs vocals',
    order: 20,
  },
  {
    name: 'Songwriter',
    slug: 'songwriter',
    description: 'Writes lyrics and composes songs',
    order: 30,
  },
  {
    name: 'Arranger',
    slug: 'arranger',
    description: 'Arranges musical compositions',
    order: 40,
  },
  {
    name: 'Recording Artist',
    slug: 'recording-artist',
    description: 'Records and releases music',
    order: 50,
  },
  {
    name: 'Composer',
    slug: 'composer',
    description: 'Composes original music',
    order: 60,
  },
  {
    name: 'Sound Engineer',
    slug: 'sound-engineer',
    description: 'Mixes and masters audio',
    order: 70,
  },
  {
    name: 'DJ',
    slug: 'dj',
    description: 'Mixes and performs music live',
    order: 80,
  },
  {
    name: 'Instrumentalist',
    slug: 'instrumentalist',
    description: 'Plays musical instruments',
    order: 90,
  },
  {
    name: 'Music Director',
    slug: 'music-director',
    description: 'Directs musical performances',
    order: 100,
  },
];

async function main() {
  console.log('Seeding skills...');

  for (const skill of SKILLS) {
    const created = await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        description: skill.description,
        isActive: true,
        order: skill.order,
      },
      create: {
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        isActive: true,
        order: skill.order,
      },
    });
    console.log(`✓ ${created.name} (${created.slug})`);
  }

  console.log('✓ Skills seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
