import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

export class ConversationStore {
  private static instance: ConversationStore;

  static getInstance(): ConversationStore {
    if (!ConversationStore.instance) {
      ConversationStore.instance = new ConversationStore();
    }
    return ConversationStore.instance;
  }

  async storeMessage(
    userId: string,
    conversationId: string,
    message: StoredMessage,
    title?: string
  ): Promise<void> {
    if (!userId) return;

    try {
      // Check if this is the first message in the conversation
      const messageCount = await prisma.aIConversationMessage.count({
        where: { conversationId },
      });
      const isFirstMessage = messageCount === 0;

      // Upsert conversation to ensure it exists
      await prisma.aIConversation.upsert({
        where: { id: conversationId },
        update: {},
        create: {
          id: conversationId,
          userId,
          title: title || this.generateTitle(message.content),
        },
      });

      // If first message and title not provided, auto-generate from first user message
      if (isFirstMessage && !title && message.role === 'user') {
        await prisma.aIConversation.update({
          where: { id: conversationId },
          data: { title: this.generateTitle(message.content) },
        });
      }

      // Store message
      await prisma.aIConversationMessage.create({
        data: {
          conversationId,
          role: message.role,
          content: message.content,
          data: message.data,
        },
      });
    } catch (error) {
      // Non-blocking error handling
      logger.error('Failed to store conversation message:', error);
    }
  }

  private generateTitle(firstMessage: string): string {
    // Generate a simple title from the first message
    const trimmed = firstMessage.trim().slice(0, 60);
    return trimmed || 'New Conversation';
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    try {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    } catch (error) {
      logger.error('Failed to update conversation title:', error);
    }
  }

  async getConversation(
    userId: string,
    conversationId: string,
    limit = 10
  ): Promise<StoredMessage[]> {
    if (!userId) return [];

    try {
      const messages = await prisma.aIConversationMessage.findMany({
        where: {
          conversation: {
            id: conversationId,
            userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
        data: msg.data,
      }));
    } catch (error) {
      logger.error('Failed to get conversation:', error);
      return [];
    }
  }

  async getUserConversations(
    userId: string
  ): Promise<Array<{ id: string; title: string | null; updatedAt: Date }>> {
    if (!userId) return [];

    try {
      const conversations = await prisma.aIConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 20, // Last 20 conversations
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      });

      return conversations;
    } catch (error) {
      logger.error('Failed to get user conversations:', error);
      return [];
    }
  }
}

export const conversationStore = ConversationStore.getInstance();
