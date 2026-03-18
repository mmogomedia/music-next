import type { IStorageAdapter, PreferenceType } from './interfaces/storage';
import type { ILogger } from './interfaces/logger';
import type { MemoryConfig } from './config';

export interface UserPreferenceScore {
  entityName: string;
  type: PreferenceType;
  score: number;
  confidence: number;
  sentiment: number;
}

export class SemanticMemoryManager {
  constructor(
    private storage: IStorageAdapter, // eslint-disable-line no-unused-vars
    private logger: ILogger, // eslint-disable-line no-unused-vars
    private config: MemoryConfig // eslint-disable-line no-unused-vars
  ) {}

  async updatePreference(params: {
    userId: string;
    type: PreferenceType;
    entityName: string;
    entityId?: string;
    explicit?: boolean;
    sentiment?: number;
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
      await this.storage.upsertPreference({
        userId,
        type,
        entityName: entityName.toLowerCase(),
        entityId,
        explicit,
        sentiment,
      });
    } catch (error) {
      this.logger.error('[SemanticMemory] Failed to update preference:', error);
    }
  }

  async getPreferences(params: {
    userId: string;
    type?: PreferenceType;
    limit?: number;
    minScore?: number;
  }): Promise<UserPreferenceScore[]> {
    const {
      userId,
      type,
      limit = this.config.preferenceLimit,
      minScore = this.config.minPreferenceScore,
    } = params;

    try {
      const preferences = await this.storage.getPreferences({ userId, type });

      const now = Date.now();
      const decayedPreferences = preferences.map(pref => {
        const daysSinceLastSeen =
          (now - pref.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);

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

      return decayedPreferences
        .filter(p => p.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('[SemanticMemory] Failed to get preferences:', error);
      return [];
    }
  }

  async getTopPreferences(params: {
    userId: string;
    type: PreferenceType;
    limit?: number;
  }): Promise<string[]> {
    const preferences = await this.getPreferences(params);
    return preferences.map(p => p.entityName);
  }

  async extractPreferencesFromText(params: {
    userId: string;
    text: string;
    explicit?: boolean;
  }): Promise<void> {
    const { userId, text, explicit = false } = params;

    const genres = await this.extractGenres(text);
    for (const genre of genres) {
      await this.updatePreference({
        userId,
        type: 'GENRE',
        entityName: genre,
        explicit,
      });
    }

    const moods = this.extractMoods(text);
    for (const mood of moods) {
      await this.updatePreference({
        userId,
        type: 'MOOD',
        entityName: mood,
        explicit,
      });
    }

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

  async updateFromResults(
    userId: string,
    result: Record<string, unknown>
  ): Promise<void> {
    if (!userId || !result) return;

    const tracks: Record<string, unknown>[] =
      (result?.data as { tracks?: Record<string, unknown>[] })?.tracks ??
      (result?.tracks as Record<string, unknown>[]) ??
      [];
    if (tracks.length === 0) return;

    const updates: Promise<void>[] = [];

    for (const track of tracks) {
      if (track?.genre) {
        updates.push(
          this.updatePreference({
            userId,
            type: 'GENRE',
            entityName: String(track.genre),
            explicit: false,
          })
        );
      }

      const artistName =
        track?.artist ||
        (track?.artistProfile as { artistName?: string } | undefined)
          ?.artistName;
      if (artistName) {
        updates.push(
          this.updatePreference({
            userId,
            type: 'ARTIST',
            entityName: String(artistName),
            explicit: false,
          })
        );
      }
    }

    await Promise.allSettled(updates);
  }

  private async extractGenres(text: string): Promise<string[]> {
    const lowerText = text.toLowerCase();

    try {
      const genres = await this.storage.getActiveGenres();
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
      this.logger.error('[SemanticMemory] Failed to extract genres:', error);
      return [];
    }
  }

  private extractMoods(text: string): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];

    for (const [mood, keywords] of Object.entries(this.config.moodKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        found.push(mood);
      }
    }

    return found;
  }

  private extractArtists(text: string): string[] {
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    return capitalizedWords ? [...new Set(capitalizedWords)] : [];
  }
}
