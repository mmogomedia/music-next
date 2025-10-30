import { conversationStore } from './conversation-store';
import { preferenceTracker } from './preference-tracker';

export interface BuiltContext {
  filters?: {
    genre?: string;
    province?: string;
  };
  summary?: string;
}

export class ContextBuilder {
  buildContext(userId?: string): BuiltContext {
    if (!userId) return {};
    const recent = conversationStore.getConversation(userId, 6);
    const prefs = preferenceTracker.get(userId);

    // choose top genre preference if any
    const topGenre = Object.entries(prefs.genres).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const summary = recent
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(-500);

    return {
      filters: topGenre ? { genre: topGenre } : undefined,
      summary,
    };
  }
}

export const contextBuilder = new ContextBuilder();
