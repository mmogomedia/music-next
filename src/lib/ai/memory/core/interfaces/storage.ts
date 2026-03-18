// Domain types — no @prisma/client dependency
export type PreferenceType =
  | 'GENRE'
  | 'ARTIST'
  | 'TRACK'
  | 'MOOD'
  | 'TEMPO'
  | 'ERA'
  | 'LANGUAGE'
  | 'INSTRUMENT';

export type ChatType = 'STREAMING' | 'TIMELINE' | 'DASHBOARD' | 'OTHER';

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: unknown;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: Date;
  chatType: string;
}

export interface UpsertPreferenceParams {
  userId: string;
  type: PreferenceType;
  entityName: string;
  entityId?: string;
  explicit: boolean;
  sentiment: number;
}

export interface RawPreference {
  entityName: string;
  type: PreferenceType;
  explicitScore: number;
  implicitScore: number;
  confidence: number;
  sentiment: number;
  lastSeenAt: Date;
  halfLifeDays: number;
}

export interface StoreEmbeddingParams {
  conversationId: string;
  userId: string;
  messageIds: string[];
  summary: string;
  embedding: number[];
  importance: number;
  messageCount: number;
  startTime: Date;
  endTime: Date;
}

export interface EmbeddingSearchResult {
  id: string;
  summary: string;
  importance: number;
  similarity: number;
  startTime: Date;
  endTime: Date;
}

export interface GenreRecord {
  name: string;
  slug: string;
  aliases: string[];
}

export interface IStorageAdapter {
  // Conversations
  upsertConversation(_p: {
    conversationId: string;
    userId: string;
    title: string;
    chatType: ChatType;
  }): Promise<void>;
  updateConversationTitle(
    _conversationId: string,
    _title: string
  ): Promise<void>;
  getConversationMessages(
    _userId: string,
    _conversationId: string,
    _limit: number
  ): Promise<StoredMessage[]>;
  getUserConversations(
    _userId: string,
    _chatType?: ChatType | ChatType[]
  ): Promise<ConversationSummary[]>;
  countMessages(_conversationId: string): Promise<number>;
  createMessage(_p: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    data?: unknown;
  }): Promise<{ id: string }>;
  deleteConversation(_userId: string, _conversationId: string): Promise<void>;

  // Preferences
  upsertPreference(_p: UpsertPreferenceParams): Promise<void>;
  getPreferences(_p: {
    userId: string;
    type?: PreferenceType;
  }): Promise<RawPreference[]>;

  // Episodic (vector) — pgvector SQL lives in the adapter, not the manager
  storeEmbedding(_p: StoreEmbeddingParams): Promise<void>;
  searchEmbeddings(_p: {
    userId: string;
    queryEmbedding: number[];
    limit: number;
    minImportance: number;
  }): Promise<EmbeddingSearchResult[]>;

  // Genre lookup
  getActiveGenres(): Promise<GenreRecord[]>;
}
