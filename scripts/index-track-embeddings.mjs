/**
 * Bulk Track Embedding Indexer
 *
 * Run this once after the add_track_embedding migration to generate vector
 * embeddings for all existing tracks that don't have one yet.
 *
 * Usage:
 *   node scripts/index-track-embeddings.mjs
 *
 * Prerequisites:
 *   - DATABASE_URL env var set
 *   - OPENAI_API_KEY env var set
 *   - pgvector extension enabled (migration 20260203191124_enable_pgvector)
 *   - add_track_embedding migration applied (20260228000000_add_track_embedding)
 */

import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 20;
const BATCH_PAUSE_MS = 500; // Rate-limit safety between batches

// ---------------------------------------------------------------------------
// Build embedding text — mirrors buildTrackEmbeddingText() in the service
// ---------------------------------------------------------------------------
function buildEmbeddingText(track) {
  const parts = [];

  if (track.title) parts.push(`"${track.title}"`);
  if (track.artist) parts.push(`by ${track.artist}`);
  if (track.genre) parts.push(`Genre: ${track.genre}.`);
  if (track.description?.trim()) parts.push(track.description.trim());

  const moods = (track.mood ?? []).filter(Boolean);
  if (moods.length > 0) parts.push(`Mood: ${moods.join(', ')}.`);

  const attrs = (track.attributes ?? []).filter(Boolean);
  if (attrs.length > 0) parts.push(`Themes: ${attrs.join(', ')}.`);

  if (track.lyrics?.trim()) {
    parts.push(track.lyrics.trim().slice(0, 500));
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  // Count tracks without embeddings
  const total = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "tracks"
    WHERE embedding IS NULL
  `;
  const totalCount = total[0]?.count ?? 0;

  if (totalCount === 0) {
    console.log('All tracks already have embeddings. Nothing to do.');
    return;
  }

  console.log(`Found ${totalCount} tracks without embeddings. Starting...`);

  let processed = 0;
  let errorCount = 0;

  // Process in batches
  while (true) {
    const tracks = await prisma.$queryRaw`
      SELECT id, title, artist, genre, description, lyrics,
             mood, attributes
      FROM "tracks"
      WHERE embedding IS NULL
      ORDER BY "createdAt" ASC
      LIMIT ${BATCH_SIZE}
    `;

    if (tracks.length === 0) break;

    // Build texts for this batch
    const texts = tracks.map(t => buildEmbeddingText(t));

    // Embed the whole batch in a single API call
    let embeddings;
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 1536,
      });
      embeddings = response.data.map(d => d.embedding);
    } catch (err) {
      console.error(`  Batch embedding request failed: ${err.message}`);
      errorCount += tracks.length;
      processed += tracks.length;
      // Don't retry — skip this batch and continue
      await pause(BATCH_PAUSE_MS);
      continue;
    }

    // Store each embedding
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const embedding = embeddings[i];
      try {
        await prisma.$executeRaw`
          UPDATE "tracks"
          SET
            embedding = ${embedding}::vector(1536),
            "embeddingUpdatedAt" = NOW()
          WHERE id = ${track.id}
        `;
        processed++;
      } catch (err) {
        console.error(
          `  Failed to store embedding for track ${track.id}: ${err.message}`
        );
        errorCount++;
        processed++;
      }
    }

    console.log(`  Indexed ${processed}/${totalCount}...`);

    // Pause between batches to stay within OpenAI rate limits
    await pause(BATCH_PAUSE_MS);
  }

  console.log(
    `Done. ${processed - errorCount} tracks indexed, ${errorCount} errors.`
  );
}

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
