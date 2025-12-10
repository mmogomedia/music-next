import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';

/**
 * Help Agent
 *
 * Handles queries about how to use Flemoji.
 * Provides helpful information about system features and usage.
 */
export class HelpAgent extends BaseAgent {
  /**
   * Create a new HelpAgent instance
   */
  constructor() {
    super('HelpAgent', '');
  }

  /**
   * Process help queries about using Flemoji
   * @param message - User message asking about system usage
   * @param context - Optional agent context
   * @returns Agent response with helpful information about using Flemoji
   */
  async process(
    message: string,
    _context?: AgentContext
  ): Promise<AgentResponse> {
    const response = this.buildHelpResponse(message);

    return {
      message: response,
      data: {
        type: 'text',
        message: response,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Build helpful response based on the question
   * @param message - User's help question
   * @returns Helpful response message
   */
  private buildHelpResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Search/Find related questions
    if (
      /\b(search|find|look for|discover|browse)\b/i.test(lowerMessage) ||
      /\b(how|what|where)\s+(can|do|to)\s+(i|you)\s+(search|find|look|discover|browse)/i.test(
        lowerMessage
      )
    ) {
      return `You can search for music by simply asking me in natural language! Just type what you're looking for. Here are some examples:

• **Search by genre**: "Play Amapiano tracks" or "Find Afrobeats music"
• **Search by artist**: "Show me songs by Kabza De Small" or "Play Major League DJz"
• **Search by mood**: "Find upbeat music" or "Show me chill songs"
• **Search by location**: "Show me music from Gauteng" or "Find artists from Cape Town"
• **Search by title**: "Play Desert Dreams" or "Find Fire Energy"

Just type your request in the chat box and I'll help you discover the music you're looking for!`;
    }

    // Play/Listen related questions
    if (
      /\b(play|listen|hear|stream)\b/i.test(lowerMessage) ||
      /\b(how|what|where)\s+(can|do|to)\s+(i|you)\s+(play|listen|hear|stream)/i.test(
        lowerMessage
      )
    ) {
      return `You can play music by asking me! Just tell me what you want to play. For example:

• **Play specific songs**: "Play Desert Dreams" or "Play Fire Energy 31"
• **Play by genre**: "Play Amapiano" or "Play some Gospel music"
• **Play by artist**: "Play Kabza De Small" or "Play Major League DJz"
• **Play by mood**: "Play upbeat music" or "Play something chill"

Once I find the music, you can click on any track to play it. I can also create playlists for you!`;
    }

    // General "what can you do" questions
    if (
      /\b(what|which)\s+(can|does|do)\s+(you|this|it|the system|flemoji)\s+(do|help|offer|provide|support)/i.test(
        lowerMessage
      ) ||
      /\b(what|how)\s+(are|is)\s+(you|this|it|the system|flemoji)/i.test(
        lowerMessage
      )
    ) {
      return `I'm your music assistant for Flemoji! I can help you with:

🎵 **Discover Music**
• Find songs, artists, playlists, and genres
• Search by mood, location, or style
• Browse South African music catalog

🎧 **Play Music**
• Play specific tracks or artists
• Create playlists based on your preferences
• Queue up music for your listening session

💡 **Get Recommendations**
• Personalized music suggestions
• Discover new artists and tracks
• Find music for different moods and occasions

📚 **Learn About Music**
• Get information about artists and genres
• Learn about the South African music industry
• Explore music culture and history

Just ask me anything in natural language! For example:
• "Play Amapiano tracks"
• "Show me songs by Kabza De Small"
• "Find upbeat music for a party"
• "Recommend some new artists"

What would you like to explore?`;
    }

    // Navigation/Usage questions
    if (
      /\b(how|where|what)\s+(to|can|do|is)\s+(use|navigate|access|get started|begin)/i.test(
        lowerMessage
      ) ||
      /\b(getting started|how to use|user guide|tutorial|help me)/i.test(
        lowerMessage
      )
    ) {
      return `Getting started with Flemoji is easy! Here's how:

1. **Search for Music**: Just type what you're looking for in the chat box
   - Example: "Play Amapiano tracks" or "Find songs by Kabza De Small"

2. **Play Music**: Click on any track I show you to start playing

3. **Get Recommendations**: Ask me for suggestions
   - Example: "What should I listen to?" or "Recommend some music"

4. **Explore**: Browse by genre, artist, mood, or location
   - Example: "Show me Gospel music" or "Find music from Gauteng"

5. **Ask Questions**: I can help you learn about artists, genres, and the music industry
   - Example: "Tell me about Kabza De Small" or "What is Amapiano?"

Just start typing in the chat box - I'll help you discover amazing South African music! 🎵`;
    }

    // Default help response
    return `I'm here to help you discover and enjoy South African music on Flemoji! 

You can ask me to:
• **Search for music**: "Play Amapiano tracks" or "Find songs by Kabza De Small"
• **Get recommendations**: "What should I listen to?" or "Recommend some music"
• **Learn about music**: "Tell me about Amapiano" or "Who is Kabza De Small?"
• **Play music**: Just ask me to play anything and I'll find it for you

Just type your request in natural language and I'll help you! What would you like to do?`;
  }
}
