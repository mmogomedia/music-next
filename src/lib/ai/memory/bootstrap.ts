/**
 * Flemoji-specific wiring of the portable memory core.
 * NOT part of the portable core/ folder.
 *
 * Routes and agents should import named exports from this file rather than
 * reaching into core/ directly.
 */
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { createMemorySystem } from './core';
import { PrismaStorageAdapter } from './presets/prisma-storage-adapter';
import { OpenAIEmbeddingAdapter } from './presets/openai-embedding-adapter';

const sys = createMemorySystem({
  storage: new PrismaStorageAdapter(prisma),
  embedder: process.env.OPENAI_API_KEY
    ? new OpenAIEmbeddingAdapter(process.env.OPENAI_API_KEY)
    : null,
  logger,
});

export const conversationStore = sys.conversation;
export const semanticMemoryManager = sys.semantic;
export const memoryOrchestrator = sys.orchestrator;
export const contextBuilder = sys.contextBuilder;

// Re-export types that consumers may need
export type { StoredMessage, ChatType } from './core/interfaces/storage';
export type { EnhancedContext } from './core/memory-orchestrator';
export type { BuiltContext } from './core/context-builder';
