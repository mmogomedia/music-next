/**
 * Seed script for track completion rules
 * Run with: npx tsx prisma/seed-completion-rules.ts
 */

/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultRules = [
  // Required (20%)
  {
    field: 'title',
    label: 'Title',
    category: 'required' as const,
    weight: 10,
    description: 'Track title',
    group: 'Basic Info',
    isRequired: true,
    isActive: true,
    order: 0,
  },
  {
    field: 'primaryArtistIds',
    label: 'Primary Artists',
    category: 'required' as const,
    weight: 10,
    description: 'Main performing artists',
    group: 'Basic Info',
    isRequired: true,
    isActive: true,
    order: 1,
  },

  // High (40%)
  {
    field: 'lyrics',
    label: 'Lyrics',
    category: 'high' as const,
    weight: 25,
    description: 'Song lyrics',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 10,
  },
  {
    field: 'description',
    label: 'Description',
    category: 'high' as const,
    weight: 10,
    description: 'Track description',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 11,
  },
  {
    field: 'albumArtwork',
    label: 'Album Artwork',
    category: 'high' as const,
    weight: 5,
    description: 'Cover image',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 2,
  },

  // Medium (35%)
  {
    field: 'album',
    label: 'Album',
    category: 'medium' as const,
    weight: 5,
    description: 'Album name',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 3,
  },
  {
    field: 'genreId',
    label: 'Genre',
    category: 'medium' as const,
    weight: 5,
    description: 'Music genre',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 4,
  },
  {
    field: 'language',
    label: 'Language',
    category: 'medium' as const,
    weight: 5,
    description: 'Primary language of the track',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 12,
  },
  {
    field: 'featuredArtistIds',
    label: 'Featured Artists',
    category: 'medium' as const,
    weight: 5,
    description: 'Featured or guest artists',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 5,
  },
  {
    field: 'composer',
    label: 'Composer',
    category: 'medium' as const,
    weight: 3,
    description: 'Song composer',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 6,
  },
  {
    field: 'year',
    label: 'Year',
    category: 'medium' as const,
    weight: 3,
    description: 'Release year',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 7,
  },
  {
    field: 'releaseDate',
    label: 'Release Date',
    category: 'medium' as const,
    weight: 3,
    description: 'Specific release date',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 8,
  },
  {
    field: 'bpm',
    label: 'BPM',
    category: 'medium' as const,
    weight: 3,
    description: 'Beats per minute',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 9,
  },
  {
    field: 'isrc',
    label: 'ISRC',
    category: 'medium' as const,
    weight: 3,
    description: 'International Standard Recording Code',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 10,
  },

  // Low (5%)
  {
    field: 'copyrightInfo',
    label: 'Copyright Info',
    category: 'low' as const,
    weight: 2,
    description: 'Copyright information',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 20,
  },
  {
    field: 'licenseType',
    label: 'License Type',
    category: 'low' as const,
    weight: 1,
    description: 'License type (only counts if not default)',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 21,
  },
  {
    field: 'distributionRights',
    label: 'Distribution Rights',
    category: 'low' as const,
    weight: 2,
    description: 'Distribution rights and restrictions',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 22,
  },
];

async function main() {
  console.log('Seeding track completion rules...');

  for (const rule of defaultRules) {
    await prisma.trackCompletionRule.upsert({
      where: { field: rule.field },
      update: rule,
      create: rule,
    });
    console.log(`✓ ${rule.field}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
