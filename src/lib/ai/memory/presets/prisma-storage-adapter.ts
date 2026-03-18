import type { PrismaClient, ChatType as PrismaChatType } from '@prisma/client';
import type {
  IStorageAdapter,
  StoredMessage,
  ChatType,
  ConversationSummary,
  UpsertPreferenceParams,
  RawPreference,
  StoreEmbeddingParams,
  EmbeddingSearchResult,
  GenreRecord,
} from '../core/interfaces/storage';

export class PrismaStorageAdapter implements IStorageAdapter {
  constructor(private prisma: PrismaClient) {} // eslint-disable-line no-unused-vars

  // ── Conversations ──────────────────────────────────────────────────────────

  async upsertConversation(p: {
    conversationId: string;
    userId: string;
    title: string;
    chatType: ChatType;
  }): Promise<void> {
    await this.prisma.aIConversation.upsert({
      where: { id: p.conversationId },
      update: { chatType: p.chatType },
      create: {
        id: p.conversationId,
        userId: p.userId,
        title: p.title,
        chatType: p.chatType,
      },
    });
  }

  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
    limit: number
  ): Promise<StoredMessage[]> {
    const messages = await this.prisma.aIConversationMessage.findMany({
      where: {
        conversation: { id: conversationId, userId },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt,
      data: msg.data as unknown,
    }));
  }

  async getUserConversations(
    userId: string,
    chatType?: ChatType | ChatType[]
  ): Promise<ConversationSummary[]> {
    const where: {
      userId: string;
      chatType?: { in: PrismaChatType[] } | PrismaChatType;
    } = { userId };

    if (Array.isArray(chatType)) {
      where.chatType = { in: chatType as PrismaChatType[] };
    } else if (chatType) {
      where.chatType = chatType as PrismaChatType;
    }

    return this.prisma.aIConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, updatedAt: true, chatType: true },
    });
  }

  async countMessages(conversationId: string): Promise<number> {
    return this.prisma.aIConversationMessage.count({
      where: { conversationId },
    });
  }

  async createMessage(p: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    data?: unknown;
  }): Promise<{ id: string }> {
    const msg = await this.prisma.aIConversationMessage.create({
      data: {
        conversationId: p.conversationId,
        role: p.role,
        content: p.content,
        data: p.data ?? undefined,
      },
      select: { id: true },
    });
    return { id: msg.id };
  }

  async deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<void> {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new Error('Unauthorized: Conversation does not belong to user');
    }

    await this.prisma.aIConversation.delete({ where: { id: conversationId } });
  }

  // ── Preferences ────────────────────────────────────────────────────────────

  async upsertPreference(p: UpsertPreferenceParams): Promise<void> {
    const scoreIncrement = p.explicit
      ? 1.0 // explicitScoreIncrement default
      : 0.5; // implicitScoreIncrement default

    await this.prisma.userPreference.upsert({
      where: {
        userId_type_entityName: {
          userId: p.userId,
          type: p.type,
          entityName: p.entityName.toLowerCase(),
        },
      },
      update: {
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
        explicitScore: p.explicit ? { increment: scoreIncrement } : undefined,
        implicitScore: !p.explicit ? { increment: scoreIncrement } : undefined,
        sentiment: (p.sentiment + p.sentiment * 0.1) / 2,
      },
      create: {
        userId: p.userId,
        type: p.type,
        entityName: p.entityName.toLowerCase(),
        entityId: p.entityId,
        explicitScore: p.explicit ? scoreIncrement : 0,
        implicitScore: !p.explicit ? scoreIncrement : 0,
        sentiment: p.sentiment,
        confidence: p.explicit ? 0.9 : 0.5,
        occurrenceCount: 1,
      },
    });
  }

  async getPreferences(p: {
    userId: string;
    type?: string;
  }): Promise<RawPreference[]> {
    const prefs = await this.prisma.userPreference.findMany({
      where: {
        userId: p.userId,
        ...(p.type && { type: p.type as never }),
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return prefs.map(pref => ({
      entityName: pref.entityName,
      type: pref.type as RawPreference['type'],
      explicitScore: pref.explicitScore,
      implicitScore: pref.implicitScore,
      confidence: pref.confidence,
      sentiment: pref.sentiment,
      lastSeenAt: pref.lastSeenAt,
      halfLifeDays: pref.halfLifeDays,
    }));
  }

  // ── Episodic (pgvector) ────────────────────────────────────────────────────

  async storeEmbedding(p: StoreEmbeddingParams): Promise<void> {
    // Column names must match Prisma-generated camelCase columns (no @map decorators).
    // PostgreSQL requires double-quotes to preserve camelCase identifiers.
    // messageId is intentionally omitted — synthetic IDs from the pipeline don't
    // exist in ai_conversation_messages, so we leave it null.
    await this.prisma.$executeRaw`INSERT INTO conversation_embeddings (
        id, "conversationId", "userId", summary,
        embedding, importance, "messageCount", "startTime", "endTime"
      ) VALUES (
        gen_random_uuid()::text,
        ${p.conversationId},
        ${p.userId},
        ${p.summary},
        ${p.embedding}::vector(1536),
        ${p.importance},
        ${p.messageCount},
        ${p.startTime},
        ${p.endTime}
      )`;
  }

  async searchEmbeddings(p: {
    userId: string;
    queryEmbedding: number[];
    limit: number;
    minImportance: number;
  }): Promise<EmbeddingSearchResult[]> {
    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        summary: string;
        importance: number;
        similarity: number;
        start_time: Date;
        end_time: Date;
      }>
    >`
      SELECT
        id,
        summary,
        importance,
        1 - (embedding <=> ${p.queryEmbedding}::vector(1536)) as similarity,
        "startTime" as start_time,
        "endTime" as end_time
      FROM conversation_embeddings
      WHERE "userId" = ${p.userId}
        AND importance >= ${p.minImportance}
      ORDER BY
        embedding <=> ${p.queryEmbedding}::vector(1536)
      LIMIT ${p.limit}
    `;

    return results.map(r => ({
      id: r.id,
      summary: r.summary,
      importance: r.importance,
      similarity: r.similarity,
      startTime: r.start_time,
      endTime: r.end_time,
    }));
  }

  // ── Genre lookup ───────────────────────────────────────────────────────────

  async getActiveGenres(): Promise<GenreRecord[]> {
    const genres = await this.prisma.genre.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, aliases: true },
    });

    return genres.map(g => ({
      name: g.name,
      slug: g.slug,
      aliases: Array.isArray(g.aliases) ? (g.aliases as string[]) : [],
    }));
  }
}
