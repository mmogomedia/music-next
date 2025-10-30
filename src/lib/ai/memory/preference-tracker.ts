type Counter = Record<string, number>;

export interface UserPreferences {
  genres: Counter;
  artists: Counter;
}

export class PreferenceTracker {
  private static instance: PreferenceTracker;
  private userIdToPrefs = new Map<string, UserPreferences>();

  static getInstance(): PreferenceTracker {
    if (!PreferenceTracker.instance) {
      PreferenceTracker.instance = new PreferenceTracker();
    }
    return PreferenceTracker.instance;
  }

  get(userId: string): UserPreferences {
    if (!userId) return { genres: {}, artists: {} };
    const prefs = this.userIdToPrefs.get(userId);
    if (prefs) return prefs;
    const init = { genres: {}, artists: {} };
    this.userIdToPrefs.set(userId, init);
    return init;
  }

  updateFromMessage(userId: string, text: string): void {
    if (!userId || !text) return;
    const prefs = this.get(userId);
    const lower = text.toLowerCase();
    // naive extraction
    const knownGenres = [
      'amapiano',
      'afro house',
      'afrobeat',
      'house',
      'hip hop',
    ];
    for (const g of knownGenres) {
      if (lower.includes(g)) {
        prefs.genres[g] = (prefs.genres[g] ?? 0) + 1;
      }
    }
  }

  updateFromResults(userId: string, result: any): void {
    if (!userId || !result) return;
    const prefs = this.get(userId);
    // tracks
    const tracks = result?.data?.tracks ?? result?.tracks ?? [];
    for (const t of tracks) {
      if (t?.genre) {
        const key = String(t.genre);
        prefs.genres[key] = (prefs.genres[key] ?? 0) + 1;
      }
      const artistName = t?.artist || t?.artistProfile?.artistName;
      if (artistName) {
        const key = String(artistName);
        prefs.artists[key] = (prefs.artists[key] ?? 0) + 1;
      }
    }
  }
}

export const preferenceTracker = PreferenceTracker.getInstance();
