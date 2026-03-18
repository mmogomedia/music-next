import type { IStorageAdapter } from './interfaces/storage';
import type { IEmbeddingAdapter } from './interfaces/embedding';
import type { ILogger } from './interfaces/logger';
import { DEFAULT_CONFIG, type MemoryConfig } from './config';
import { ConversationStore } from './conversation-store';
import { EpisodicMemoryManager } from './episodic-memory-manager';
import { SemanticMemoryManager } from './semantic-memory-manager';
import { MemoryOrchestrator } from './memory-orchestrator';
import { ContextBuilder } from './context-builder';

export type { IStorageAdapter, IEmbeddingAdapter, ILogger, MemoryConfig };

export { DEFAULT_CONFIG };

export type {
  StoredMessage,
  ConversationSummary,
  PreferenceType,
  ChatType,
} from './interfaces/storage';

export type { EpisodicMemory } from './episodic-memory-manager';
export type { EnhancedContext } from './memory-orchestrator';
export type { BuiltContext } from './context-builder';
export type { UserPreferenceScore } from './semantic-memory-manager';

export interface MemorySystemConfig {
  storage: IStorageAdapter;
  embedder?: IEmbeddingAdapter | null;
  logger?: ILogger;
  options?: Partial<MemoryConfig>;
}

class ConsoleLogger implements ILogger {
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args); // eslint-disable-line no-console
  }
  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args); // eslint-disable-line no-console
  }
  info(message: string, ...args: unknown[]): void {
    console.error(message, ...args); // console.log banned in ESLint
  }
  debug(message: string, ...args: unknown[]): void {
    console.error(message, ...args); // console.log banned in ESLint
  }
}

export function createMemorySystem(cfg: MemorySystemConfig) {
  const logger = cfg.logger ?? new ConsoleLogger();
  const config = { ...DEFAULT_CONFIG, ...cfg.options };
  const embedder = cfg.embedder ?? null;

  const conversation = new ConversationStore(cfg.storage, logger, config);
  const episodic = new EpisodicMemoryManager(
    cfg.storage,
    embedder,
    logger,
    config
  );
  const semantic = new SemanticMemoryManager(cfg.storage, logger, config);
  const orchestrator = new MemoryOrchestrator(
    episodic,
    semantic,
    logger,
    config
  );
  const contextBuilder = new ContextBuilder(conversation, semantic, config);

  return { conversation, episodic, semantic, orchestrator, contextBuilder };
}
