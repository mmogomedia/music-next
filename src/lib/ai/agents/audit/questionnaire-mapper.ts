/**
 * Questionnaire Mapper
 *
 * Pure functions that map raw questionnaire answers to derived
 * ArtistProfile fields. No DB access — called in the API route
 * after validation so the logic is testable in isolation.
 */

import type {
  ArtistType,
  CareerStage,
  RevenueModel,
  GrowthEngine,
} from '@prisma/client';

// ── Raw answer shapes ─────────────────────────────────────────────────────────

export interface RawAnswers {
  journeyType: string; // Q1 — single select
  discoveryRanked: string[]; // Q2 — ordered multi-select, max 3
  socialManaged: string; // Q3 — single select
  incomeRanked: string[]; // Q4 — ordered multi-select, max 3
  primaryGoal: string; // Q5 — single select
  trackCount: string; // Q6 — single select
  collaborations: string; // Q7 — single select
}

export interface DerivedValues {
  artistType: ArtistType;
  revenueModels: RevenueModel[];
  growthEngines: GrowthEngine[];
  careerStage: CareerStage;
  collabBand: string; // 'none' | 'few' | 'some' | 'many'
}

// ── Mapping tables ────────────────────────────────────────────────────────────

const JOURNEY_TO_ARTIST_TYPE: Record<string, ArtistType> = {
  independent: 'INDEPENDENT',
  session_producer: 'SESSION_PRODUCER',
  signed_artist: 'SIGNED_ARTIST',
  performer: 'PERFORMER',
  songwriter: 'SONGWRITER',
  hybrid: 'HYBRID',
};

const INCOME_TO_REVENUE_MODEL: Record<string, RevenueModel> = {
  live_shows: 'LIVE_PERFORMER',
  streaming: 'STREAMING_ARTIST',
  production: 'PRODUCER',
  sync: 'SYNC_FOCUSED',
  merch: 'MERCH_DRIVEN',
  mixed: 'HYBRID',
};

const DISCOVERY_TO_GROWTH_ENGINE: Record<string, GrowthEngine> = {
  social_media: 'SOCIAL_FIRST',
  playlists: 'PLAYLIST_DRIVEN',
  live_shows: 'LIVE_DISCOVERY',
  word_of_mouth: 'COMMUNITY_DRIVEN',
  collaborations: 'COLLABORATION_DRIVEN',
  press_media: 'PRESS_DRIVEN',
};

const TRACK_COUNT_TO_CAREER_STAGE: Record<string, CareerStage> = {
  '0_5': 'STARTING',
  '6_20': 'EMERGING',
  '21_50': 'DEVELOPING',
  '50_plus': 'ESTABLISHED',
};

const COLLAB_TO_BAND: Record<string, string> = {
  never: 'none',
  occasionally: 'few',
  regularly: 'some',
  central: 'many',
};

// ── Derivation ────────────────────────────────────────────────────────────────

export function deriveArtistType(journeyType: string): ArtistType {
  return JOURNEY_TO_ARTIST_TYPE[journeyType] ?? 'INDEPENDENT';
}

export function deriveRevenueModels(incomeRanked: string[]): RevenueModel[] {
  return incomeRanked
    .map(k => INCOME_TO_REVENUE_MODEL[k])
    .filter((v): v is RevenueModel => Boolean(v))
    .slice(0, 3);
}

export function deriveGrowthEngines(
  discoveryRanked: string[],
  socialManaged: string
): GrowthEngine[] {
  const engines = discoveryRanked
    .map(k => DISCOVERY_TO_GROWTH_ENGINE[k])
    .filter((v): v is GrowthEngine => Boolean(v));

  // If SOCIAL_FIRST isn't already in the list but the artist manages
  // their own social media, insert it at the front — it's a latent signal
  if (!engines.includes('SOCIAL_FIRST') && socialManaged === 'myself') {
    engines.unshift('SOCIAL_FIRST');
  }

  return engines.slice(0, 3);
}

export function deriveCareerStage(trackCount: string): CareerStage {
  return TRACK_COUNT_TO_CAREER_STAGE[trackCount] ?? 'STARTING';
}

export function deriveCollabBand(collaborations: string): string {
  return COLLAB_TO_BAND[collaborations] ?? 'none';
}

/** Single entry-point — call this from the API route. */
export function mapAnswersToDerivedValues(answers: RawAnswers): DerivedValues {
  return {
    artistType: deriveArtistType(answers.journeyType),
    revenueModels: deriveRevenueModels(answers.incomeRanked),
    growthEngines: deriveGrowthEngines(
      answers.discoveryRanked,
      answers.socialManaged
    ),
    careerStage: deriveCareerStage(answers.trackCount),
    collabBand: deriveCollabBand(answers.collaborations),
  };
}
