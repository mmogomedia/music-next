import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Genres for testing
const GENRES = [
  'Amapiano',
  'Afrobeat',
  'House',
  'Gqom',
  'Afropop',
  'Hip Hop',
  'R&B',
  'Jazz',
  'Soul',
  'Reggae',
];

// Attributes for testing
const ATTRIBUTES = [
  'women empowerment',
  'self-love',
  'uplifting',
  'healing',
  'celebration',
  'motivation',
  'love',
  'party',
  'reflection',
  'freedom',
  'unity',
  'culture',
  'heritage',
  'resilience',
  'joy',
];

// Moods for testing
const MOODS = [
  'uplifting',
  'energetic',
  'melancholic',
  'romantic',
  'party',
  'chill',
  'introspective',
  'celebratory',
  'motivational',
  'peaceful',
  'nostalgic',
  'powerful',
  'dreamy',
  'groovy',
  'soulful',
];

// Artist names for variety
const ARTISTS = [
  'DJ Maphorisa',
  'Kabza De Small',
  'Major League DJz',
  'Uncle Waffles',
  'Blaq Diamond',
  'Ami Faku',
  'Mafikizolo',
  'Black Coffee',
  'Da Capo',
  'Mango Groove',
  'Ladysmith Black Mambazo',
  'Johnny Clegg',
  'Miriam Makeba',
  'Hugh Masekela',
  'Brenda Fassie',
  'Lucky Dube',
  'Freshlyground',
  'The Soil',
  'Beatenberg',
  'Jeremy Loops',
];

// Track titles
const TRACK_TITLES = [
  'Midnight Groove',
  'Sunset Vibes',
  'City Lights',
  'Ocean Waves',
  'Mountain High',
  'Desert Dreams',
  'Forest Echoes',
  'River Flow',
  'Sky Dance',
  'Earth Rhythm',
  'Fire Energy',
  'Water Spirit',
  'Wind Freedom',
  'Star Light',
  'Moon Glow',
  'Sun Rise',
  'Cloud Nine',
  'Thunder Power',
  'Lightning Strike',
  'Rainbow Bridge',
];

// Descriptions for tracks
const DESCRIPTIONS = [
  'An uplifting track that celebrates life and joy.',
  'A powerful anthem for women empowerment and self-love.',
  'A soulful reflection on love and relationships.',
  'An energetic party track that gets you moving.',
  'A healing song for moments of reflection and peace.',
  'A motivational track to inspire and uplift.',
  'A celebration of culture and heritage.',
  'A romantic ballad about love and connection.',
  'A groovy track perfect for dancing.',
  'An introspective journey through emotions.',
  'A powerful message of unity and togetherness.',
  'A nostalgic trip down memory lane.',
  'A dreamy soundscape for relaxation.',
  'A powerful anthem of resilience and strength.',
  'A joyful celebration of life and happiness.',
];

/**
 * Generate a random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random elements from an array
 */
function randomPick<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate a track with varied properties for testing
 * Fully randomized for realistic variety
 */
function generateTrack(index: number) {
  // Fully randomize genre, artist, title, description
  const genre = randomPick(GENRES, 1)[0];
  const artist = randomPick(ARTISTS, 1)[0];
  const titleBase = randomPick(TRACK_TITLES, 1)[0];
  const title = `${titleBase} ${index + 1}`;
  const description = randomPick(DESCRIPTIONS, 1)[0];

  // Randomize strength: 60-100, but ensure ~30% are below 70 for testing
  // Use weighted random: 30% chance of <70, 70% chance of ≥70
  const strength = Math.random() < 0.3 ? randomInt(60, 69) : randomInt(70, 100);

  // Vary play and download counts with realistic distribution
  // Some tracks are popular, most are moderate
  const playCount =
    Math.random() < 0.1
      ? randomInt(100000, 500000) // 10% are very popular
      : Math.random() < 0.3
        ? randomInt(10000, 100000) // 30% are moderately popular
        : randomInt(0, 10000); // 60% are less popular

  const downloadCount = Math.floor((playCount * randomInt(5, 15)) / 100); // Downloads are 5-15% of plays

  // Random attributes (1-4 per track, weighted toward 2-3)
  const attributeCount =
    Math.random() < 0.2
      ? 1 // 20% have 1 attribute
      : Math.random() < 0.7
        ? 2 // 50% have 2 attributes
        : Math.random() < 0.9
          ? 3 // 20% have 3 attributes
          : 4; // 10% have 4 attributes

  const attributes = randomPick(ATTRIBUTES, attributeCount);

  // Random moods (1-3 per track)
  const moodCount = Math.random() < 0.6 ? 1 : Math.random() < 0.9 ? 2 : 3;
  const moods = randomPick(MOODS, moodCount);

  // Ensure some tracks have specific attributes for testing (but randomly distributed)
  // ~30% have "women empowerment", ~20% have "self-love"
  if (Math.random() < 0.3 && !attributes.includes('women empowerment')) {
    attributes.push('women empowerment');
  }
  if (
    Math.random() < 0.2 &&
    !attributes.includes('self-love') &&
    attributes.length < 4
  ) {
    attributes.push('self-love');
  }

  return {
    title,
    artist,
    genre,
    description,
    attributes,
    mood: moods,
    strength,
    playCount,
    downloadCount,
    duration: randomInt(180, 360), // 3-6 minutes
    filePath: `demo-tracks/routing-test/${title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
    uniqueUrl: `routing-test-${title.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    isPublic: true,
  };
}

async function seedRoutingTestTracks() {
  try {
    console.log('🌱 Starting to seed 100 routing test tracks...\n');

    // Get or create admin user
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('⚠️  No admin user found. Creating one...');
      admin = await prisma.user.create({
        data: {
          email: 'admin@routing-test.com',
          name: 'Routing Test Admin',
          role: 'ADMIN',
        },
      });
    }

    // Get or create artist profile for admin
    let artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: admin.id },
    });

    if (!artistProfile) {
      console.log('⚠️  No artist profile found. Creating one...');
      artistProfile = await prisma.artistProfile.create({
        data: {
          userId: admin.id,
          artistName: 'Routing Test Artist',
          slug: 'routing-test-artist',
        },
      });
    }

    // Generate tracks with full randomization
    const tracks = [];
    for (let i = 0; i < 100; i++) {
      tracks.push(generateTrack(i));
    }

    // Shuffle tracks array to ensure complete randomization
    tracks.sort(() => Math.random() - 0.5);

    console.log('📝 Generated 100 track definitions\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tracks.length; i++) {
      const trackData = tracks[i];

      try {
        // Check if track already exists
        const existing = await prisma.track.findFirst({
          where: { uniqueUrl: trackData.uniqueUrl },
        });

        if (existing) {
          console.log(
            `⏭️  [${i + 1}/100] Skipped: ${trackData.title} (already exists)`
          );
          skipped++;
          continue;
        }

        // Create track
        const track = await prisma.track.create({
          data: {
            title: trackData.title,
            artist: trackData.artist,
            genre: trackData.genre,
            description: trackData.description,
            attributes: trackData.attributes,
            mood: trackData.mood,
            strength: trackData.strength,
            playCount: trackData.playCount,
            downloadCount: trackData.downloadCount,
            duration: trackData.duration,
            filePath: trackData.filePath,
            uniqueUrl: trackData.uniqueUrl,
            isPublic: trackData.isPublic,
            userId: admin.id,
            artistProfileId: artistProfile.id,
            primaryArtistIds: [artistProfile.id],
            completionPercentage: trackData.strength, // Use strength as completion
          },
        });

        console.log(
          `✅ [${i + 1}/100] Created: ${track.title} by ${track.artist} (Genre: ${track.genre}, Strength: ${track.strength}, Attributes: ${track.attributes.join(', ')})`
        );
        created++;
      } catch (error) {
        console.error(
          `❌ [${i + 1}/100] Error creating ${trackData.title}:`,
          error instanceof Error ? error.message : String(error)
        );
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} tracks`);
    console.log(`   ⏭️  Skipped: ${skipped} tracks`);
    console.log(`   ❌ Errors: ${errors} tracks`);
    console.log(`   📈 Total: ${created + skipped} tracks`);

    // Print statistics
    const allTracks = await prisma.track.findMany({
      where: { uniqueUrl: { startsWith: 'routing-test-' } },
      select: {
        genre: true,
        strength: true,
        attributes: true,
        mood: true,
      },
    });

    console.log('\n📈 Track Statistics:');
    console.log(`   Total tracks: ${allTracks.length}`);

    const byGenre = allTracks.reduce(
      (acc, track) => {
        acc[track.genre || 'Unknown'] =
          (acc[track.genre || 'Unknown'] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\n   By Genre:');
    Object.entries(byGenre).forEach(([genre, count]) => {
      console.log(`     ${genre}: ${count}`);
    });

    const strengthStats = {
      below70: allTracks.filter(t => t.strength < 70).length,
      above70: allTracks.filter(t => t.strength >= 70).length,
    };

    console.log('\n   By Strength:');
    console.log(`     < 70: ${strengthStats.below70} tracks`);
    console.log(`     ≥ 70: ${strengthStats.above70} tracks`);

    const allAttributes = allTracks.flatMap(t => t.attributes);
    const attributeCounts = allAttributes.reduce(
      (acc, attr) => {
        acc[attr] = (acc[attr] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\n   Top Attributes:');
    Object.entries(attributeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([attr, count]) => {
        console.log(`     ${attr}: ${count}`);
      });

    console.log('\n🎉 Seeding complete!\n');
  } catch (error) {
    console.error('❌ Error seeding routing test tracks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRoutingTestTracks()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
