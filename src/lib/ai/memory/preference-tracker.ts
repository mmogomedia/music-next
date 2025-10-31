import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

type Counter = Record<string, number>;

export interface UserPreferences {
  genres: Counter;
  artists: Counter;
}

export class PreferenceTracker {
  private static instance: PreferenceTracker;

  static getInstance(): PreferenceTracker {
    if (!PreferenceTracker.instance) {
      PreferenceTracker.instance = new PreferenceTracker();
    }
    return PreferenceTracker.instance;
  }

  async get(userId: string): Promise<UserPreferences> {
    if (!userId) return { genres: {}, artists: {} };

    try {
      const prefs = await prisma.aIPreferences.findUnique({
        where: { userId },
      });

      if (!prefs) {
        return { genres: {}, artists: {} };
      }

      return {
        genres: (prefs.genres as Counter) || {},
        artists: (prefs.artists as Counter) || {},
      };
    } catch (error) {
      logger.error('Failed to get preferences:', error);
      return { genres: {}, artists: {} };
    }
  }

  async updateFromMessage(userId: string, text: string): Promise<void> {
    if (!userId || !text) return;

    try {
      const currentPrefs = await this.get(userId);
      const lower = text.toLowerCase();

      // Simple genre extraction
      const knownGenres = [
        'amapiano',
        'afro house',
        'afrobeat',
        'house',
        'hip hop',
        'gospel',
        'jazz',
        'r&b',
        'pop',
      ];

      let updated = false;
      for (const genre of knownGenres) {
        if (lower.includes(genre)) {
          currentPrefs.genres[genre] = (currentPrefs.genres[genre] || 0) + 1;
          updated = true;
        }
      }

      if (updated) {
        await prisma.aIPreferences.upsert({
          where: { userId },
          update: {
            genres: currentPrefs.genres,
          },
          create: {
            userId,
            genres: currentPrefs.genres,
            artists: {},
          },
        });
      }
    } catch (error) {
      logger.error('Failed to update preferences from message:', error);
    }
  }

  async updateFromResults(userId: string, result: any): Promise<void> {
    if (!userId || !result) return;

    try {
      const currentPrefs = await this.get(userId);
      const tracks = result?.data?.tracks ?? result?.tracks ?? [];

      let updated = false;

      for (const track of tracks) {
        if (track?.genre) {
          const key = String(track.genre);
          currentPrefs.genres[key] = (currentPrefs.genres[key] || 0) + 1;
          updated = true;
        }

        const artistName = track?.artist || track?.artistProfile?.artistName;
        if (artistName) {
          const key = String(artistName);
          currentPrefs.artists[key] = (currentPrefs.artists[key] || 0) + 1;
          updated = true;
        }
      }

      if (updated) {
        await prisma.aIPreferences.upsert({
          where: { userId },
          update: {
            genres: currentPrefs.genres,
            artists: currentPrefs.artists,
          },
          create: {
            userId,
            genres: currentPrefs.genres,
            artists: currentPrefs.artists,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to update preferences from results:', error);
    }
  }
}

export const preferenceTracker = PreferenceTracker.getInstance();
