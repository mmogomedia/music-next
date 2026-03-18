/**
 * Track Embedding Service
 *
 * Generates and stores 1536-dim vector embeddings for tracks using OpenAI's
 * text-embedding-3-small model. Enables semantic similarity search via pgvector.
 *
 * @module TrackEmbeddingService
 */

import { prisma } from '@/lib/db';
import { OpenAIEmbeddingAdapter } from './memory/presets/openai-embedding-adapter';
import type { Track } from '@prisma/client';

/**
 * Fields used to build the embedding text for a track.
 * Subset of the full Track model — only semantic content fields.
 */
export interface TrackFields {
  title: string;
  artist?: string | null;
  genre?: string | null;
  description?: string | null;
  lyrics?: string | null;
  mood?: string[];
  attributes?: string[];
}

// Lazy singleton — avoids build-time initialisation errors
let _embeddingAdapter: OpenAIEmbeddingAdapter | null = null;

function getEmbeddingAdapter(): OpenAIEmbeddingAdapter {
  if (!_embeddingAdapter) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        '[TrackEmbeddingService] OPENAI_API_KEY is not set — cannot generate embeddings.'
      );
    }
    _embeddingAdapter = new OpenAIEmbeddingAdapter(
      apiKey,
      'text-embedding-3-small',
      1536
    );
  }
  return _embeddingAdapter;
}

/**
 * Build a rich plain-text representation of a track for embedding.
 * Combines all semantic fields into a single string that captures
 * title, artist, genre, theme/mood, description, and lyrics excerpt.
 */
export function buildTrackEmbeddingText(track: TrackFields): string {
  const parts: string[] = [];

  // Title and artist — most important signals
  if (track.title) {
    parts.push(`"${track.title}"`);
  }
  if (track.artist) {
    parts.push(`by ${track.artist}`);
  }

  // Genre
  if (track.genre) {
    parts.push(`Genre: ${track.genre}.`);
  }

  // Description
  if (track.description?.trim()) {
    parts.push(track.description.trim());
  }

  // Mood tags
  const moods = (track.mood ?? []).filter(Boolean);
  if (moods.length > 0) {
    parts.push(`Mood: ${moods.join(', ')}.`);
  }

  // Attribute / theme tags
  const attrs = (track.attributes ?? []).filter(Boolean);
  if (attrs.length > 0) {
    parts.push(`Themes: ${attrs.join(', ')}.`);
  }

  // Lyrics excerpt (first 500 chars)
  if (track.lyrics?.trim()) {
    const excerpt = track.lyrics.trim().slice(0, 500);
    parts.push(excerpt);
  }

  return parts.join(' ');
}

/**
 * Embed an arbitrary text string.
 * Used at query time to embed the user's search query before cosine search.
 */
export async function embedText(text: string): Promise<number[]> {
  const adapter = getEmbeddingAdapter();
  return adapter.embed(text);
}

/**
 * Generate a vector embedding for a track.
 */
export async function generateTrackEmbedding(
  track: TrackFields
): Promise<number[]> {
  const text = buildTrackEmbeddingText(track);
  return embedText(text);
}

/**
 * Store a track embedding in the database via raw SQL.
 * Uses the same pattern as PrismaStorageAdapter.storeEmbedding.
 */
export async function storeTrackEmbedding(
  trackId: string,
  embedding: number[]
): Promise<void> {
  // Prisma raw template literal — embedding is passed as a JS array which
  // Prisma serialises as a PostgreSQL array literal, then cast to vector(1536).
  await prisma.$executeRaw`
    UPDATE "tracks"
    SET
      embedding = ${embedding}::vector(1536),
      "embeddingUpdatedAt" = NOW()
    WHERE id = ${trackId}
  `;
}

/**
 * Fire-and-forget: generate embedding for a track and store it.
 * Never throws — logs errors silently so the caller is never blocked.
 */
export function enqueueTrackEmbedding(
  track: TrackFields & { id: string }
): void {
  // Run async but don't await — caller continues immediately
  generateTrackEmbedding(track)
    .then(embedding => storeTrackEmbedding(track.id, embedding))
    .catch(err => {
      console.error(
        '[TrackEmbeddingService] Failed to enqueue embedding for track',
        track.id,
        err
      );
    });
}

/**
 * Returns true if any semantic field changed between the old and new track data.
 * Used in the update route to skip re-embedding when only non-semantic fields changed.
 */
export function semanticFieldsChanged(
  prev: Track,
  next: Partial<Track>
): boolean {
  const fields: (keyof Track)[] = [
    'title',
    'artist',
    'genre',
    'description',
    'lyrics',
    'mood',
    'attributes',
  ];

  return fields.some(field => {
    const prevVal = prev[field];
    const nextVal = next[field];

    // Both undefined/null — no change
    if (prevVal == null && nextVal == null) return false;
    // One is null/undefined — changed
    if (prevVal == null || nextVal == null) return true;

    // Arrays: compare sorted JSON
    if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
      return (
        JSON.stringify([...(prevVal as string[])].sort()) !==
        JSON.stringify([...(nextVal as string[])].sort())
      );
    }

    return prevVal !== nextVal;
  });
}
