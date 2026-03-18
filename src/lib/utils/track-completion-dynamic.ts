/**
 * Dynamic track completion calculation utility
 * Fetches rules from API and falls back to static config if needed
 */

import { TrackEditorValues } from '@/components/track/TrackEditor';
import {
  FIELD_WEIGHTS,
  type WeightCategory,
  type FieldWeight,
} from '@/lib/config/track-completion-config';
import type {
  FieldCompletionStatus,
  CompletionBreakdown,
} from './track-completion';

export interface TrackCompletionRule {
  id: string;
  field: string;
  label: string;
  category: WeightCategory;
  weight: number;
  description?: string | null;
  group?: string | null;
  isRequired: boolean;
  isActive: boolean;
  order: number;
}

/**
 * Fetch completion rules from API
 */
export async function fetchCompletionRules(): Promise<TrackCompletionRule[]> {
  try {
    const response = await fetch('/api/track-completion-rules');
    if (!response.ok) {
      throw new Error('Failed to fetch rules');
    }
    const data = await response.json();
    return data.rules || [];
  } catch (error) {
    console.warn('Failed to fetch completion rules, using defaults:', error);
    return [];
  }
}

/**
 * Convert static FieldWeight to TrackCompletionRule format
 */
function fieldWeightToRule(
  fw: FieldWeight,
  index: number
): TrackCompletionRule {
  return {
    id: `static-${fw.field}`,
    field: fw.field,
    label: fw.label,
    category: fw.category,
    weight: fw.weight,
    description: fw.description,
    group: null,
    isRequired: fw.category === 'required',
    isActive: true,
    order: index,
  };
}

/**
 * Get completion rules (dynamic or fallback to static)
 */
export async function getCompletionRules(): Promise<TrackCompletionRule[]> {
  const dynamicRules = await fetchCompletionRules();
  if (dynamicRules.length > 0) {
    return dynamicRules;
  }
  // Fallback to static config
  return FIELD_WEIGHTS.map(fieldWeightToRule);
}

/**
 * Check if a field value is considered "completed"
 * (Same logic as track-completion.ts)
 */
function isFieldCompleted(field: string, value: any): boolean {
  if (value === null || value === undefined) return false;

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
      if (value instanceof Date) return true;
      if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;

    case 'bpm':
      return typeof value === 'number' && value > 0 && value <= 300;

    case 'licenseType':
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
 * Calculate track completion using dynamic rules
 */
export async function calculateTrackCompletionDynamic(
  track: TrackEditorValues
): Promise<CompletionBreakdown> {
  const rules = await getCompletionRules();
  const activeRules = rules.filter(r => r.isActive);

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

  // Check each rule
  for (const rule of activeRules) {
    const value = (track as any)[rule.field];
    const completed = isFieldCompleted(rule.field, value);

    fields.push({
      field: rule.field,
      label: rule.label,
      category: rule.category,
      weight: rule.weight,
      completed,
      value,
      description: rule.description || undefined,
    });

    totalWeight += rule.weight;
    if (completed) {
      totalCompleted += rule.weight;
      categoryTotals[rule.category].completed += rule.weight;
    }
    categoryTotals[rule.category].total += rule.weight;
  }

  const percentage =
    totalWeight > 0 ? Math.round((totalCompleted / totalWeight) * 100) : 0;

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
