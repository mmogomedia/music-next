/**
 * Configurable field weighting system for track completion calculation
 *
 * To add a new field:
 * 1. Add it to FIELD_WEIGHTS array with appropriate category and weight
 * 2. Ensure the field exists in TrackEditorValues interface
 * 3. Update isFieldCompleted() in track-completion.ts if needed
 */

export type WeightCategory = 'required' | 'high' | 'medium' | 'low';

export interface FieldWeight {
  field: string;
  category: WeightCategory;
  weight: number; // Percentage points (0-100)
  label: string; // Display name
  description?: string; // Help text
}

export interface CategoryConfig {
  name: string;
  totalWeight: number; // Total percentage for this category
  color: string; // UI color
  description?: string;
}

export const COMPLETION_CATEGORIES: Record<WeightCategory, CategoryConfig> = {
  required: {
    name: 'Required',
    totalWeight: 20,
    color: 'red',
    description: 'Essential fields that must be completed',
  },
  high: {
    name: 'High Priority',
    totalWeight: 40,
    color: 'purple',
    description:
      'Important fields that significantly improve track discoverability',
  },
  medium: {
    name: 'Medium Priority',
    totalWeight: 35,
    color: 'blue',
    description: 'Additional metadata that enhances track information',
  },
  low: {
    name: 'Low Priority',
    totalWeight: 5,
    color: 'gray',
    description: 'Optional fields for legal and distribution information',
  },
};

/**
 * Field weights configuration
 * Total must equal 100%
 *
 * To add a new field, simply add it here with the appropriate category and weight
 */
export const FIELD_WEIGHTS: FieldWeight[] = [
  // Required (20%)
  {
    field: 'title',
    category: 'required',
    weight: 10,
    label: 'Title',
    description: 'Track title',
  },
  {
    field: 'primaryArtistIds',
    category: 'required',
    weight: 10,
    label: 'Primary Artists',
    description: 'Main performing artists',
  },

  // High (40%)
  {
    field: 'lyrics',
    category: 'high',
    weight: 25,
    label: 'Lyrics',
    description: 'Song lyrics',
  },
  {
    field: 'description',
    category: 'high',
    weight: 10,
    label: 'Description',
    description: 'Track description',
  },
  {
    field: 'albumArtwork',
    category: 'high',
    weight: 5,
    label: 'Album Artwork',
    description: 'Cover image',
  },

  // Medium (35%)
  {
    field: 'album',
    category: 'medium',
    weight: 5,
    label: 'Album',
    description: 'Album name',
  },
  {
    field: 'genreId',
    category: 'medium',
    weight: 5,
    label: 'Genre',
    description: 'Music genre',
  },
  {
    field: 'language',
    category: 'medium',
    weight: 5,
    label: 'Language',
    description: 'Primary language of the track',
  },
  {
    field: 'featuredArtistIds',
    category: 'medium',
    weight: 5,
    label: 'Featured Artists',
    description: 'Featured or guest artists',
  },
  {
    field: 'composer',
    category: 'medium',
    weight: 3,
    label: 'Composer',
    description: 'Song composer',
  },
  {
    field: 'year',
    category: 'medium',
    weight: 3,
    label: 'Year',
    description: 'Release year',
  },
  {
    field: 'releaseDate',
    category: 'medium',
    weight: 3,
    label: 'Release Date',
    description: 'Specific release date',
  },
  {
    field: 'bpm',
    category: 'medium',
    weight: 3,
    label: 'BPM',
    description: 'Beats per minute',
  },
  {
    field: 'isrc',
    category: 'medium',
    weight: 3,
    label: 'ISRC',
    description: 'International Standard Recording Code',
  },

  // Low (5%)
  {
    field: 'copyrightInfo',
    category: 'low',
    weight: 2,
    label: 'Copyright Info',
    description: 'Copyright information',
  },
  {
    field: 'licenseType',
    category: 'low',
    weight: 1,
    label: 'License Type',
    description: 'License type (only counts if not default)',
  },
  {
    field: 'distributionRights',
    category: 'low',
    weight: 2,
    label: 'Distribution Rights',
    description: 'Distribution rights and restrictions',
  },
];

// Validation: Ensure total weights equal 100
const totalWeight = FIELD_WEIGHTS.reduce((sum, fw) => sum + fw.weight, 0);
if (totalWeight !== 100) {
  console.warn(
    `Warning: Total field weights (${totalWeight}) do not equal 100. ` +
      `Please adjust weights in track-completion-config.ts`
  );
}

// Helper functions
export function getFieldWeight(field: string): FieldWeight | undefined {
  return FIELD_WEIGHTS.find(fw => fw.field === field);
}

export function getFieldsByCategory(category: WeightCategory): FieldWeight[] {
  return FIELD_WEIGHTS.filter(fw => fw.category === category);
}

export function getTotalWeightForCategory(category: WeightCategory): number {
  return getFieldsByCategory(category).reduce((sum, fw) => sum + fw.weight, 0);
}

/**
 * Get all fields that should be counted for completion
 */
export function getAllTrackFields(): string[] {
  return FIELD_WEIGHTS.map(fw => fw.field);
}
