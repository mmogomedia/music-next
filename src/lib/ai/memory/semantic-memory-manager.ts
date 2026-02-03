import { prisma } from '@/lib/db';
import { PreferenceType } from '@prisma/client';

export interface UserPreferenceScore {
  entityName: string;
  type: PreferenceType;
  score: number; // Decayed score
  confidence: number;
  sentiment: number;
}

export class SemanticMemoryManager {
  /**
   * Update user preference (explicit or implicit)
   */
  async updatePreference(params: {
    userId: string;
    type: PreferenceType;
    entityName: string;
    entityId?: string;
    explicit?: boolean; // User explicitly stated
    sentiment?: number; // 0-1 (0=dislike, 1=love)
  }): Promise<void> {
    const {
      userId,
      type,
      entityName,
      entityId,
      explicit = false,
      sentiment = 0.5,
    } = params;

    try {
      const scoreIncrement = explicit ? 1.0 : 0.5;

      await prisma.userPreference.upsert({
        where: {
          userId_type_entityName: {
            userId,
            type,
            entityName: entityName.toLowerCase(),
          },
        },
        update: {
          occurrenceCount: { increment: 1 },
          lastSeenAt: new Date(),
          explicitScore: explicit ? { increment: scoreIncrement } : undefined,
          implicitScore: !explicit ? { increment: scoreIncrement } : undefined,
          sentiment: (sentiment + sentiment * 0.1) / 2, // Moving average
        },
        create: {
          userId,
          type,
          entityName: entityName.toLowerCase(),
          entityId,
          explicitScore: explicit ? scoreIncrement : 0,
          implicitScore: !explicit ? scoreIncrement : 0,
          sentiment,
          confidence: explicit ? 0.9 : 0.5,
          occurrenceCount: 1,
        },
      });
    } catch (error) {
      console.error('[SemanticMemory] Failed to update preference:', error);
    }
  }

  /**
   * Get user preferences with temporal decay
   */
  async getPreferences(params: {
    userId: string;
    type?: PreferenceType;
    limit?: number;
    minScore?: number;
  }): Promise<UserPreferenceScore[]> {
    const { userId, type, limit = 20, minScore = 0.1 } = params;

    try {
      const preferences = await prisma.userPreference.findMany({
        where: {
          userId,
          ...(type && { type }),
        },
        orderBy: {
          lastSeenAt: 'desc',
        },
      });

      // Apply temporal decay
      const now = Date.now();
      const decayedPreferences = preferences.map(pref => {
        const daysSinceLastSeen =
          (now - pref.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);

        // Exponential decay: score * e^(-ln(2) * days / halfLife)
        const decayFactor = Math.exp(
          -Math.log(2) * (daysSinceLastSeen / pref.halfLifeDays)
        );

        const baseScore = pref.explicitScore + pref.implicitScore * 0.5;
        const decayedScore = baseScore * decayFactor;

        return {
          entityName: pref.entityName,
          type: pref.type,
          score: decayedScore,
          confidence: pref.confidence * decayFactor,
          sentiment: pref.sentiment,
        };
      });

      // Filter and sort
      return decayedPreferences
        .filter(p => p.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('[SemanticMemory] Failed to get preferences:', error);
      return [];
    }
  }

  /**
   * Get top N preferences by type
   */
  async getTopPreferences(params: {
    userId: string;
    type: PreferenceType;
    limit?: number;
  }): Promise<string[]> {
    const preferences = await this.getPreferences(params);
    return preferences.map(p => p.entityName);
  }

  /**
   * Extract and store preferences from conversation
   */
  async extractPreferencesFromText(params: {
    userId: string;
    text: string;
    explicit?: boolean;
  }): Promise<void> {
    const { userId, text, explicit = false } = params;

    // Genre extraction
    const genres = await this.extractGenres(text);
    for (const genre of genres) {
      await this.updatePreference({
        userId,
        type: 'GENRE',
        entityName: genre,
        explicit,
      });
    }

    // Mood extraction
    const moods = this.extractMoods(text);
    for (const mood of moods) {
      await this.updatePreference({
        userId,
        type: 'MOOD',
        entityName: mood,
        explicit,
      });
    }

    // Artist extraction (simplified - can be enhanced with NER)
    const artists = this.extractArtists(text);
    for (const artist of artists) {
      await this.updatePreference({
        userId,
        type: 'ARTIST',
        entityName: artist,
        explicit,
      });
    }
  }

  /**
   * Extract genres from text using database
   */
  private async extractGenres(text: string): Promise<string[]> {
    const lowerText = text.toLowerCase();

    try {
      const genres = await prisma.genre.findMany({
        where: { isActive: true },
        select: { name: true, slug: true, aliases: true },
      });

      const found: string[] = [];

      for (const genre of genres) {
        if (lowerText.includes(genre.name.toLowerCase())) {
          found.push(genre.name);
        } else if (lowerText.includes(genre.slug.toLowerCase())) {
          found.push(genre.name);
        } else if (Array.isArray(genre.aliases)) {
          for (const alias of genre.aliases) {
            if (
              typeof alias === 'string' &&
              lowerText.includes(alias.toLowerCase())
            ) {
              found.push(genre.name);
              break;
            }
          }
        }
      }

      return [...new Set(found)];
    } catch (error) {
      console.error('[SemanticMemory] Failed to extract genres:', error);
      return [];
    }
  }

  /**
   * Extract moods from text
   */
  private extractMoods(text: string): string[] {
    const moodKeywords: Record<string, string[]> = {
      Energetic: ['energetic', 'upbeat', 'lively', 'pump up'],
      Chill: ['chill', 'relaxing', 'calm', 'mellow'],
      Melancholic: ['sad', 'melancholic', 'emotional', 'somber'],
      Happy: ['happy', 'joyful', 'cheerful', 'uplifting'],
      Focus: ['focus', 'concentration', 'study', 'work'],
      Party: ['party', 'dance', 'club', 'celebration'],
    };

    const lowerText = text.toLowerCase();
    const found: string[] = [];

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        found.push(mood);
      }
    }

    return found;
  }

  /**
   * Extract artists from text (simplified)
   */
  private extractArtists(text: string): string[] {
    // This is a simplified version
    // In production, use NER (Named Entity Recognition) or database lookup
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    return capitalizedWords ? [...new Set(capitalizedWords)] : [];
  }
}

export const semanticMemoryManager = new SemanticMemoryManager();
