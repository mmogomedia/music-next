# Track Completion Gamification & AI Lyrics Processing - Implementation Plan

## Overview

This document outlines the implementation of a gamified track completion system with weighted field scoring and AI-powered lyrics processing.

## 1. Database Schema Updates

### Track Model Additions

```prisma
model Track {
  // ... existing fields
  completionPercentage Int @default(0)  // 0-100
  language             String?          // ISO 639-1 code (e.g., "en", "zu", "xh", "fr", "pt", "sn", "nd", "other")
}
```

### Migration

- Add `completionPercentage` with default 0
- Add `language` as nullable string
- Backfill existing tracks with calculated completion

## 2. Configurable Field Weighting System

### Configuration Structure

Create `src/lib/config/track-completion-config.ts`:

```typescript
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
}

export const COMPLETION_CATEGORIES: Record<WeightCategory, CategoryConfig> = {
  required: {
    name: 'Required',
    totalWeight: 20,
    color: 'red',
  },
  high: {
    name: 'High Priority',
    totalWeight: 40,
    color: 'purple',
  },
  medium: {
    name: 'Medium Priority',
    totalWeight: 35,
    color: 'blue',
  },
  low: {
    name: 'Low Priority',
    totalWeight: 10,
    color: 'gray',
  },
};

export const FIELD_WEIGHTS: FieldWeight[] = [
  // Required (20%)
  { field: 'title', category: 'required', weight: 10, label: 'Title' },
  {
    field: 'primaryArtistIds',
    category: 'required',
    weight: 10,
    label: 'Primary Artists',
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
  { field: 'album', category: 'medium', weight: 5, label: 'Album' },
  { field: 'genreId', category: 'medium', weight: 5, label: 'Genre' },
  { field: 'language', category: 'medium', weight: 5, label: 'Language' },
  {
    field: 'featuredArtistIds',
    category: 'medium',
    weight: 5,
    label: 'Featured Artists',
  },
  { field: 'composer', category: 'medium', weight: 3, label: 'Composer' },
  { field: 'year', category: 'medium', weight: 3, label: 'Year' },
  {
    field: 'releaseDate',
    category: 'medium',
    weight: 3,
    label: 'Release Date',
  },
  { field: 'bpm', category: 'medium', weight: 3, label: 'BPM' },
  { field: 'isrc', category: 'medium', weight: 3, label: 'ISRC' },

  // Low (10%)
  {
    field: 'copyrightInfo',
    category: 'low',
    weight: 3,
    label: 'Copyright Info',
  },
  { field: 'licenseType', category: 'low', weight: 3, label: 'License Type' },
  {
    field: 'distributionRights',
    category: 'low',
    weight: 4,
    label: 'Distribution Rights',
  },
];

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

// To add a new field, simply add it to FIELD_WEIGHTS array with appropriate category and weight
```

## 3. Completion Calculation Utility

### File: `src/lib/utils/track-completion.ts`

```typescript
import { TrackEditorValues } from '@/components/track/TrackEditor';
import {
  FIELD_WEIGHTS,
  FieldWeight,
  WeightCategory,
} from '@/lib/config/track-completion-config';

export interface FieldCompletionStatus {
  field: string;
  label: string;
  category: WeightCategory;
  weight: number;
  completed: boolean;
  value: any;
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
      return typeof value === 'string' && value.trim().length > 0;

    case 'primaryArtistIds':
    case 'featuredArtistIds':
      return Array.isArray(value) && value.length > 0;

    case 'genreId':
      return typeof value === 'string' && value.length > 0;

    case 'albumArtwork':
      return typeof value === 'string' && value.length > 0;

    case 'year':
      return typeof value === 'number' && value > 1900;

    case 'releaseDate':
      return (
        value instanceof Date || (typeof value === 'string' && value.length > 0)
      );

    case 'bpm':
      return typeof value === 'number' && value > 0;

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
  };
}
```

## 4. Language Support

### Language Options

```typescript
// src/lib/config/languages.ts
export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-detect', nativeName: 'Auto-detect' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'nso', name: 'Northern Sotho', nativeName: 'Sesotho sa Leboa' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga' },
  { code: 'ss', name: 'Swati', nativeName: 'SiSwati' },
  { code: 'nr', name: 'Southern Ndebele', nativeName: 'isiNdebele' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'other', name: 'Other', nativeName: 'Other' },
];
```

## 5. AI Lyrics Processing Agent

### File: `src/lib/ai/agents/lyrics-processing-agent.ts`

```typescript
import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { AzureChatOpenAI } from '@langchain/openai';
import type { AIProvider } from '@/types/ai-service';

const LYRICS_PROCESSING_SYSTEM_PROMPT = `You are a lyrics processing assistant for Flemoji, a South African music streaming platform.

Your role is to:
1. Detect the language of song lyrics
2. Translate lyrics to English if they are not already in English
3. Generate a concise, engaging summary of the lyrics for use as a track description

Guidelines:
- Language detection should be accurate (support South African languages, French, Portuguese, Shona, Ndebele, and others)
- Translations should preserve the meaning and emotion of the original lyrics
- Summaries should be 2-3 sentences, capturing the main theme, mood, and message
- Summaries should be engaging and suitable for a music streaming platform
- If lyrics are already in English, skip translation and only provide summary

Return your response in JSON format:
{
  "detectedLanguage": "en|zu|xh|af|fr|pt|sn|nd|other",
  "translatedLyrics": "translated text if translation was needed, otherwise null",
  "summary": "concise summary of the lyrics"
}`;

export class LyricsProcessingAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'azure-openai') {
    super('LyricsProcessingAgent', LYRICS_PROCESSING_SYSTEM_PROMPT);

    this.model = new AzureChatOpenAI({
      azureOpenAIApiDeploymentName:
        process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
      azureOpenAIApiVersion:
        process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
      temperature: 0.7,
    });
  }

  async processLyrics(
    lyrics: string,
    providedLanguage?: string
  ): Promise<{
    detectedLanguage: string;
    translatedLyrics?: string;
    summary: string;
  }> {
    const prompt =
      providedLanguage && providedLanguage !== 'auto'
        ? `Process these lyrics. The language is ${providedLanguage}. ${providedLanguage !== 'en' ? 'Translate to English and ' : ''}Generate a summary:\n\n${lyrics}`
        : `Detect the language, ${lyrics.includes('en') ? 'translate to English if needed, and ' : ''}generate a summary of these lyrics:\n\n${lyrics}`;

    const response = await this.model.invoke([
      { role: 'system', content: LYRICS_PROCESSING_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    // Parse JSON response
    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      // Fallback: try to extract summary from text
      return {
        detectedLanguage: providedLanguage || 'en',
        summary: response.content as string,
      };
    }
  }
}
```

## 6. API Endpoint for Lyrics Processing

### File: `src/app/api/ai/process-lyrics/route.ts`

- Rate limiting: 10 requests per hour per user (using in-memory or Redis)
- Error handling with retry option
- Returns: `{ summary, translatedLyrics?, detectedLanguage }`

## 7. UI Components

### TrackEditor Updates

1. **Completion Display** (top of form):
   - Progress bar (0-100%)
   - Badge: "X% Complete" with color coding
   - Expandable breakdown showing:
     - Fields by category (Required, High, Medium, Low)
     - Each field with checkmark/X, weight, and status

2. **Language Field** (Metadata tab):
   - Select dropdown with all supported languages
   - Default: "Auto-detect"

3. **AI Button** (Description section):
   - Placement: Above description textarea
   - States: Default, Loading, Success, Error
   - Disabled if lyrics empty
   - Rate limit indicator

4. **Preview Dialog**:
   - Shows AI-generated summary
   - Options: Replace, Prepend, Append, Cancel
   - Confirmation if description has existing content

### CompletionBadge Component

- Reusable badge for track lists
- Color coding: Red (0-40%), Yellow (41-70%), Green (71-100%)
- Tooltip with breakdown on hover

## 8. Rate Limiting

### Implementation

- Use in-memory Map for rate limiting (or Redis in production)
- Limit: 10 requests per hour per user
- Store: `Map<userId, { count: number, resetAt: number }>`
- Return 429 with `Retry-After` header

## 9. API Route Updates

### Update `/api/tracks/create` and `/api/tracks/update`

- Calculate completion on save
- Store `completionPercentage` in database
- Store `language` if provided

## 10. Display in Track Lists

### Components to Update

- `TrackCard.tsx`: Add completion badge
- Dashboard track lists: Show completion
- Admin track management: Completion column

## Implementation Order

1. ✅ Database schema + migration
2. ✅ Configuration system (field weights)
3. ✅ Completion calculation utility
4. ✅ Language support config
5. ✅ Lyrics processing agent
6. ✅ API endpoint with rate limiting
7. ✅ TrackEditor UI updates
8. ✅ CompletionBadge component
9. ✅ API route updates (create/update)
10. ✅ Display in track lists

## Testing Checklist

- [ ] Completion calculation accuracy
- [ ] Field weight configuration works
- [ ] Language detection accuracy
- [ ] Translation quality
- [ ] Summary generation quality
- [ ] Rate limiting enforcement
- [ ] UI states (loading, error, success)
- [ ] Preview dialog functionality
- [ ] Completion display in all views
- [ ] Adding new fields to config works correctly
