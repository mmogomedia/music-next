export interface MemoryConfig {
  embeddingDimensions: number;
  maxContextTokens: number;
  episodicRetrievalLimit: number;
  episodicMinImportance: number;
  recentMessageLimit: number;
  contextSummaryMaxChars: number;
  explicitScoreIncrement: number;
  implicitScoreIncrement: number;
  explicitConfidence: number;
  implicitConfidence: number;
  preferenceLimit: number;
  minPreferenceScore: number;
  genrePrefsLimit: number;
  artistPrefsLimit: number;
  moodPrefsLimit: number;
  maxSummaryLength: number;
  moodKeywords: Record<string, string[]>;
}

export const DEFAULT_CONFIG: MemoryConfig = {
  embeddingDimensions: 1536,
  maxContextTokens: 2000,
  episodicRetrievalLimit: 3,
  episodicMinImportance: 0.5,
  recentMessageLimit: 6,
  contextSummaryMaxChars: 500,
  explicitScoreIncrement: 1.0,
  implicitScoreIncrement: 0.5,
  explicitConfidence: 0.9,
  implicitConfidence: 0.5,
  preferenceLimit: 20,
  minPreferenceScore: 0.1,
  genrePrefsLimit: 5,
  artistPrefsLimit: 5,
  moodPrefsLimit: 3,
  maxSummaryLength: 500,
  moodKeywords: {
    Energetic: ['energetic', 'upbeat', 'lively', 'pump up'],
    Chill: ['chill', 'relaxing', 'calm', 'mellow'],
    Melancholic: ['sad', 'melancholic', 'emotional', 'somber'],
    Happy: ['happy', 'joyful', 'cheerful', 'uplifting'],
    Focus: ['focus', 'concentration', 'study', 'work'],
    Party: ['party', 'dance', 'club', 'celebration'],
  },
};
