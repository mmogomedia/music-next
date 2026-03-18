import type {
  IStorageAdapter,
  StoredMessage,
  ChatType,
  ConversationSummary,
} from './interfaces/storage';
import type { ILogger } from './interfaces/logger';
import type { MemoryConfig } from './config';

export class ConversationStore {
  constructor(
    private storage: IStorageAdapter, // eslint-disable-line no-unused-vars
    private logger: ILogger, // eslint-disable-line no-unused-vars
    private config: MemoryConfig // eslint-disable-line no-unused-vars
  ) {}

  async storeMessage(
    userId: string,
    conversationId: string,
    message: StoredMessage,
    title?: string,
    chatType?: ChatType
  ): Promise<void> {
    if (!userId) return;

    try {
      const messageCount = await this.storage.countMessages(conversationId);
      const isFirstMessage = messageCount === 0;

      await this.storage.upsertConversation({
        conversationId,
        userId,
        title: title || this.generateTitle(message.content),
        chatType: chatType || 'OTHER',
      });

      if (isFirstMessage && !title && message.role === 'user') {
        await this.storage.updateConversationTitle(
          conversationId,
          this.generateTitle(message.content)
        );
      }

      await this.storage.createMessage({
        conversationId,
        role: message.role,
        content: message.content,
        data: message.data,
      });
    } catch (error) {
      this.logger.error('Failed to store conversation message:', error);
    }
  }

  private generateTitle(firstMessage: string): string {
    const trimmed = firstMessage.trim().slice(0, 60);
    return trimmed || 'New Conversation';
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    try {
      await this.storage.updateConversationTitle(conversationId, title);
    } catch (error) {
      this.logger.error('Failed to update conversation title:', error);
    }
  }

  async getConversation(
    userId: string,
    conversationId: string,
    limit = 10
  ): Promise<StoredMessage[]> {
    if (!userId) return [];

    try {
      return await this.storage.getConversationMessages(
        userId,
        conversationId,
        limit
      );
    } catch (error) {
      this.logger.error('Failed to get conversation:', error);
      return [];
    }
  }

  async getUserConversations(
    userId: string,
    chatType?: ChatType
  ): Promise<ConversationSummary[]> {
    this.logger.debug(
      '[ConversationStore] getUserConversations called with userId:',
      userId,
      'chatType:',
      chatType
    );

    if (!userId) {
      this.logger.warn(
        '[ConversationStore] ❌ No userId provided, returning empty array'
      );
      return [];
    }

    try {
      this.logger.debug(
        '[ConversationStore] Querying database for conversations...'
      );

      // For STREAMING: show STREAMING + OTHER (legacy conversations)
      const effectiveChatType: ChatType | ChatType[] | undefined =
        chatType === 'STREAMING' ? ['STREAMING', 'OTHER'] : chatType;

      const conversations = await this.storage.getUserConversations(
        userId,
        effectiveChatType
      );

      this.logger.info('[ConversationStore] ✅ Database query successful:', {
        count: conversations.length,
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt.toISOString(),
        })),
      });

      return conversations;
    } catch (error) {
      this.logger.error('Failed to get user conversations:', error);
      return [];
    }
  }

  async deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      await this.storage.deleteConversation(userId, conversationId);
    } catch (error) {
      this.logger.error('Failed to delete conversation:', error);
      throw error;
    }
  }
}
