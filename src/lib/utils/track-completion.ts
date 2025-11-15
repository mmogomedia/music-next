/**
 * Track completion calculation utility
 *
 * Calculates completion percentage based on weighted field completion
 */

import { TrackEditorValues } from '@/components/track/TrackEditor';
import {
  FIELD_WEIGHTS,
  type WeightCategory,
} from '@/lib/config/track-completion-config';

export interface FieldCompletionStatus {
  field: string;
  label: string;
  category: WeightCategory;
  weight: number;
  completed: boolean;
  value: any;
  description?: string;
}

export interface CompletionBreakdown {
  percentage: number;
  byCategory: Record<
    WeightCategory,
    {
      completed: number;
      total: number;
      percentage: number;
    }
  >;
  fields: FieldCompletionStatus[];
  isComplete: boolean; // 80% or higher
}

/**
 * Check if a field value is considered "completed"
 */
function isFieldCompleted(field: string, value: any): boolean {
  if (value === null || value === undefined) return false;

  // Handle different field types
  switch (field) {
    case 'title':
    case 'description':
    case 'lyrics':
    case 'copyrightInfo':
    case 'distributionRights':
    case 'composer':
    case 'album':
    case 'isrc':
    case 'language':
      return (
        typeof value === 'string' && value.trim().length > 0 && value !== 'auto'
      );

    case 'primaryArtistIds':
    case 'featuredArtistIds':
      return Array.isArray(value) && value.length > 0;

    case 'genreId':
      return typeof value === 'string' && value.length > 0;

    case 'albumArtwork':
      return typeof value === 'string' && value.length > 0;

    case 'year':
      return (
        typeof value === 'number' &&
        value > 1900 &&
        value <= new Date().getFullYear() + 1
      );

    case 'releaseDate':
      // Accept Date object or string (YYYY-MM-DD format)
      if (value instanceof Date) return true;
      if (typeof value === 'string') {
        // Check if it's a valid date string
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;

    case 'bpm':
      return typeof value === 'number' && value > 0 && value <= 300;

    case 'licenseType':
      // Only count if it's set and not the default
      return (
        typeof value === 'string' &&
        value.length > 0 &&
        value !== 'All Rights Reserved'
      );

    default:
      return false;
  }
}

/**
 * Calculate track completion percentage and breakdown
 */
export function calculateTrackCompletion(
  track: TrackEditorValues
): CompletionBreakdown {
  const fields: FieldCompletionStatus[] = [];
  let totalCompleted = 0;
  let totalWeight = 0;

  const categoryTotals: Record<
    WeightCategory,
    { completed: number; total: number }
  > = {
    required: { completed: 0, total: 0 },
    high: { completed: 0, total: 0 },
    medium: { completed: 0, total: 0 },
    low: { completed: 0, total: 0 },
  };

  // Check each field
  for (const fieldWeight of FIELD_WEIGHTS) {
    const value = (track as any)[fieldWeight.field];
    const completed = isFieldCompleted(fieldWeight.field, value);

    fields.push({
      field: fieldWeight.field,
      label: fieldWeight.label,
      category: fieldWeight.category,
      weight: fieldWeight.weight,
      completed,
      value,
      description: fieldWeight.description,
    });

    totalWeight += fieldWeight.weight;
    if (completed) {
      totalCompleted += fieldWeight.weight;
      categoryTotals[fieldWeight.category].completed += fieldWeight.weight;
    }
    categoryTotals[fieldWeight.category].total += fieldWeight.weight;
  }

  const percentage = Math.round((totalCompleted / totalWeight) * 100);

  // Calculate category percentages
  const byCategory: Record<
    WeightCategory,
    {
      completed: number;
      total: number;
      percentage: number;
    }
  > = {
    required: {
      ...categoryTotals.required,
      percentage:
        categoryTotals.required.total > 0
          ? Math.round(
              (categoryTotals.required.completed /
                categoryTotals.required.total) *
                100
            )
          : 0,
    },
    high: {
      ...categoryTotals.high,
      percentage:
        categoryTotals.high.total > 0
          ? Math.round(
              (categoryTotals.high.completed / categoryTotals.high.total) * 100
            )
          : 0,
    },
    medium: {
      ...categoryTotals.medium,
      percentage:
        categoryTotals.medium.total > 0
          ? Math.round(
              (categoryTotals.medium.completed / categoryTotals.medium.total) *
                100
            )
          : 0,
    },
    low: {
      ...categoryTotals.low,
      percentage:
        categoryTotals.low.total > 0
          ? Math.round(
              (categoryTotals.low.completed / categoryTotals.low.total) * 100
            )
          : 0,
    },
  };

  return {
    percentage,
    byCategory,
    fields,
    isComplete: percentage >= 80,
  };
}

/**
 * Get completion color based on percentage
 * Returns HeroUI-compatible color values
 */
export function getCompletionColor(
  percentage: number
): 'success' | 'warning' | 'danger' {
  if (percentage >= 80) return 'success';
  if (percentage >= 40) return 'warning';
  return 'danger';
}

/**
 * Get completion status text
 */
export function getCompletionStatus(percentage: number): string {
  if (percentage >= 80) return 'Complete';
  if (percentage >= 41) return 'In Progress';
  return 'Needs Work';
}
