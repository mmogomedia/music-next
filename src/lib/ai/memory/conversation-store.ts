export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class ConversationStore {
  private static instance: ConversationStore;
  private userIdToMessages = new Map<string, StoredMessage[]>();

  static getInstance(): ConversationStore {
    if (!ConversationStore.instance) {
      ConversationStore.instance = new ConversationStore();
    }
    return ConversationStore.instance;
  }

  storeMessage(userId: string, message: StoredMessage): void {
    if (!userId) return;
    const list = this.userIdToMessages.get(userId) ?? [];
    list.push(message);
    // keep last 50
    const trimmed = list.slice(-50);
    this.userIdToMessages.set(userId, trimmed);
  }

  getConversation(userId: string, limit = 10): StoredMessage[] {
    if (!userId) return [];
    const list = this.userIdToMessages.get(userId) ?? [];
    return list.slice(Math.max(0, list.length - limit));
  }
}

export const conversationStore = ConversationStore.getInstance();
