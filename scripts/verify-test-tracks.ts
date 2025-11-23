import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTracks() {
  const tracks = await prisma.track.findMany({
    where: { uniqueUrl: { startsWith: 'routing-test-' } },
    select: {
      title: true,
      description: true,
      strength: true,
      attributes: true,
      mood: true,
      genre: true,
      playCount: true,
      downloadCount: true,
    },
    take: 20,
  });

  console.log('\n📋 Sample of Test Tracks:\n');
  tracks.forEach((track, i) => {
    console.log(`${i + 1}. ${track.title}`);
    console.log(`   Genre: ${track.genre}`);
    console.log(`   Strength: ${track.strength}`);
    console.log(`   Description: ${track.description || '❌ MISSING'}`);
    console.log(`   Attributes: ${track.attributes.join(', ') || 'none'}`);
    console.log(`   Moods: ${track.mood.join(', ') || 'none'}`);
    console.log(
      `   Plays: ${track.playCount.toLocaleString()}, Downloads: ${track.downloadCount.toLocaleString()}`
    );
    console.log('');
  });

  // Statistics
  const allTracks = await prisma.track.findMany({
    where: { uniqueUrl: { startsWith: 'routing-test-' } },
    select: {
      description: true,
      strength: true,
      attributes: true,
      mood: true,
      playCount: true,
    },
  });

  console.log('\n📊 Verification Statistics:\n');
  console.log(`Total tracks: ${allTracks.length}`);
  console.log(
    `Tracks with descriptions: ${allTracks.filter(t => t.description).length}`
  );
  console.log(
    `Tracks without descriptions: ${allTracks.filter(t => !t.description).length}`
  );
  console.log(
    `Strength range: ${Math.min(...allTracks.map(t => t.strength))} - ${Math.max(...allTracks.map(t => t.strength))}`
  );
  console.log(
    `Average strength: ${Math.round(allTracks.reduce((sum, t) => sum + t.strength, 0) / allTracks.length)}`
  );
  console.log(`Tracks < 70: ${allTracks.filter(t => t.strength < 70).length}`);
  console.log(`Tracks ≥ 70: ${allTracks.filter(t => t.strength >= 70).length}`);

  const uniqueDescriptions = new Set(
    allTracks.map(t => t.description).filter(Boolean)
  );
  console.log(`Unique descriptions: ${uniqueDescriptions.size}`);

  const tracksWithAttributes = allTracks.filter(t => t.attributes.length > 0);
  console.log(`Tracks with attributes: ${tracksWithAttributes.length}`);
  console.log(
    `Average attributes per track: ${(allTracks.reduce((sum, t) => sum + t.attributes.length, 0) / allTracks.length).toFixed(1)}`
  );

  const tracksWithMoods = allTracks.filter(t => t.mood.length > 0);
  console.log(`Tracks with moods: ${tracksWithMoods.length}`);
  console.log(
    `Average moods per track: ${(allTracks.reduce((sum, t) => sum + t.mood.length, 0) / allTracks.length).toFixed(1)}`
  );

  await prisma.$disconnect();
}

verifyTracks().catch(console.error);
