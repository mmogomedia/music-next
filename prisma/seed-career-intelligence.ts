/**
 * Seed: Career Intelligence Engine
 *
 * Seeds the static registries required by the engine:
 * - Capabilities (12)
 * - RevenueStreams (6)
 * - RevenueStreamCapability mappings
 * - AuditCheckCapability mappings (23 checks)
 * - Actions (~22 seeded)
 * - ActionRevenueStream mappings
 *
 * Run: npx tsx prisma/seed-career-intelligence.ts
 */

import {
  PrismaClient,
  ArtistType,
  ActionEffort,
  RevenueModel,
  GrowthEngine,
} from '@prisma/client';

const prisma = new PrismaClient();

// ── CAPABILITIES ──────────────────────────────────────

const CAPABILITIES = [
  {
    id: 'AUDIENCE_GROWTH',
    label: 'Audience Growth',
    description: 'Growing fanbase across channels',
    category: 'growth',
  },
  {
    id: 'CONTENT_CREATION',
    label: 'Content Creation',
    description: 'Consistently creating and publishing digital content',
    category: 'creative',
  },
  {
    id: 'CONSISTENT_RELEASE',
    label: 'Consistent Release',
    description: 'Releasing music on a regular, predictable cadence',
    category: 'creative',
  },
  {
    id: 'DIGITAL_DISTRIBUTION',
    label: 'Digital Distribution',
    description: 'Getting music onto streaming and download platforms',
    category: 'growth',
  },
  {
    id: 'LIVE_PERFORMANCE',
    label: 'Live Performance',
    description: 'Performing live professionally',
    category: 'performance',
  },
  {
    id: 'BUSINESS_ADMIN',
    label: 'Business Admin',
    description: 'Contracts, splits, royalties, and legal basics',
    category: 'business',
  },
  {
    id: 'SYNC_LICENSING',
    label: 'Sync Licensing',
    description: 'Licensing music for TV, film, ads, and games',
    category: 'business',
  },
  {
    id: 'DIRECT_TO_FAN',
    label: 'Direct to Fan',
    description: 'Selling directly to fans (merch, events, memberships)',
    category: 'growth',
  },
  {
    id: 'INDUSTRY_NETWORKING',
    label: 'Industry Networking',
    description:
      'Building label, manager, publisher, and booking relationships',
    category: 'business',
  },
  {
    id: 'PRESS_MEDIA',
    label: 'Press & Media',
    description: 'Getting media coverage, interviews, and press placement',
    category: 'growth',
  },
  {
    id: 'COLLABORATION',
    label: 'Collaboration',
    description: 'Working with other artists and producers effectively',
    category: 'creative',
  },
  {
    id: 'MONETIZE_AUDIENCE',
    label: 'Monetise Audience',
    description: 'Converting audience attention into revenue',
    category: 'business',
  },
];

// ── REVENUE STREAMS ───────────────────────────────────

const REVENUE_STREAMS = [
  {
    id: 'STREAMING',
    label: 'Streaming',
    description:
      'Royalties from Spotify, Apple Music, TIDAL, and other streaming platforms',
    supportingPlatforms: [
      'Spotify',
      'Apple Music',
      'TIDAL',
      'YouTube Music',
      'Amazon Music',
    ],
    requiredCapabilities: ['DIGITAL_DISTRIBUTION', 'CONSISTENT_RELEASE'],
  },
  {
    id: 'LIVE_PERFORMANCE',
    label: 'Live Performance',
    description: 'Income from gigs, tours, residencies, and live events',
    supportingPlatforms: [
      'Eventbrite',
      'Bandsintown',
      'TicketSource',
      'Howler',
    ],
    requiredCapabilities: [
      'LIVE_PERFORMANCE',
      'AUDIENCE_GROWTH',
      'PRESS_MEDIA',
    ],
  },
  {
    id: 'MERCHANDISE',
    label: 'Merchandise',
    description: 'Physical and digital merch sales direct to fans',
    supportingPlatforms: ['Shopify', 'Bandcamp', 'Spring', 'Printful'],
    requiredCapabilities: [
      'AUDIENCE_GROWTH',
      'DIRECT_TO_FAN',
      'CONTENT_CREATION',
    ],
  },
  {
    id: 'SYNC_LICENSING',
    label: 'Sync Licensing',
    description: 'Placements in TV, film, ads, games, and other media',
    supportingPlatforms: ['Musicbed', 'Artlist', 'SubmitHub', 'Songtradr'],
    requiredCapabilities: [
      'SYNC_LICENSING',
      'CONSISTENT_RELEASE',
      'BUSINESS_ADMIN',
    ],
  },
  {
    id: 'DIRECT_TO_FAN',
    label: 'Direct to Fan',
    description:
      'Subscriptions, memberships, and direct sales through fan platforms',
    supportingPlatforms: ['Patreon', 'Bandcamp', 'Substack', 'Ko-fi'],
    requiredCapabilities: [
      'AUDIENCE_GROWTH',
      'CONTENT_CREATION',
      'DIRECT_TO_FAN',
    ],
  },
  {
    id: 'PRODUCTION_SERVICES',
    label: 'Production Services',
    description:
      'Income from beat sales, session work, production credits, and features',
    supportingPlatforms: ['BeatStars', 'Airbit', 'SoundBetter', 'Fiverr Music'],
    requiredCapabilities: [
      'COLLABORATION',
      'BUSINESS_ADMIN',
      'DIGITAL_DISTRIBUTION',
    ],
  },
];

// ── AUDIT CHECK → CAPABILITY MAP ─────────────────────

const AUDIT_CHECK_CAPABILITIES: {
  checkId: string;
  capabilityId: string;
  weight: number;
}[] = [
  { checkId: 'profile_bio', capabilityId: 'PRESS_MEDIA', weight: 1.0 },
  { checkId: 'profile_image', capabilityId: 'PRESS_MEDIA', weight: 0.8 },
  { checkId: 'profile_image', capabilityId: 'AUDIENCE_GROWTH', weight: 0.6 },
  { checkId: 'profile_cover', capabilityId: 'PRESS_MEDIA', weight: 0.6 },
  {
    checkId: 'profile_genre',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 0.7,
  },
  {
    checkId: 'profile_social_links',
    capabilityId: 'AUDIENCE_GROWTH',
    weight: 1.0,
  },
  {
    checkId: 'profile_tracks',
    capabilityId: 'CONSISTENT_RELEASE',
    weight: 1.0,
  },
  {
    checkId: 'profile_tracks',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 0.8,
  },
  {
    checkId: 'platform_tiktok_connected',
    capabilityId: 'CONTENT_CREATION',
    weight: 1.0,
  },
  {
    checkId: 'platform_tiktok_connected',
    capabilityId: 'AUDIENCE_GROWTH',
    weight: 0.8,
  },
  {
    checkId: 'platform_tiktok_cadence',
    capabilityId: 'CONTENT_CREATION',
    weight: 1.0,
  },
  {
    checkId: 'platform_tiktok_followers',
    capabilityId: 'AUDIENCE_GROWTH',
    weight: 1.0,
  },
  {
    checkId: 'platform_spotify_connected',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 1.0,
  },
  {
    checkId: 'platform_spotify_listeners',
    capabilityId: 'AUDIENCE_GROWTH',
    weight: 0.8,
  },
  {
    checkId: 'platform_spotify_listeners',
    capabilityId: 'CONSISTENT_RELEASE',
    weight: 0.6,
  },
  {
    checkId: 'platform_youtube_connected',
    capabilityId: 'CONTENT_CREATION',
    weight: 0.9,
  },
  {
    checkId: 'platform_youtube_connected',
    capabilityId: 'AUDIENCE_GROWTH',
    weight: 0.7,
  },
  {
    checkId: 'platform_youtube_uploads',
    capabilityId: 'CONTENT_CREATION',
    weight: 1.0,
  },
  {
    checkId: 'release_smart_link',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 1.0,
  },
  {
    checkId: 'release_smart_link',
    capabilityId: 'MONETIZE_AUDIENCE',
    weight: 0.8,
  },
  {
    checkId: 'release_quick_link',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 0.7,
  },
  { checkId: 'release_cover_art', capabilityId: 'PRESS_MEDIA', weight: 0.9 },
  {
    checkId: 'release_metadata',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 0.8,
  },
  {
    checkId: 'release_cadence',
    capabilityId: 'CONSISTENT_RELEASE',
    weight: 1.0,
  },
  {
    checkId: 'business_split_sheet',
    capabilityId: 'BUSINESS_ADMIN',
    weight: 1.0,
  },
  {
    checkId: 'business_splits_complete',
    capabilityId: 'BUSINESS_ADMIN',
    weight: 0.9,
  },
  {
    checkId: 'business_email_verified',
    capabilityId: 'BUSINESS_ADMIN',
    weight: 0.7,
  },
  {
    checkId: 'business_distribution',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    weight: 0.9,
  },
  {
    checkId: 'business_pending_splits',
    capabilityId: 'BUSINESS_ADMIN',
    weight: 0.8,
  },
  {
    checkId: 'business_pending_splits',
    capabilityId: 'COLLABORATION',
    weight: 0.7,
  },
];

// ── ACTIONS ───────────────────────────────────────────

const ACTIONS: {
  label: string;
  description: string;
  capabilityId: string;
  dimension: string;
  effort: ActionEffort;
  timeToComplete: string;
  expectedImpact: number;
  artistTypeRelevance: ArtistType[];
  revenueModelRelevance: RevenueModel[];
  growthEngineRelevance: GrowthEngine[];
  actionUrl?: string;
  revenueStreamIds: string[];
}[] = [
  // PROFILE
  {
    label: 'Write your artist bio',
    description:
      'Write a compelling bio (minimum 100 words) that tells your story, influences, and what makes you unique.',
    capabilityId: 'PRESS_MEDIA',
    dimension: 'profile',
    effort: ActionEffort.LOW,
    timeToComplete: '30 minutes',
    expectedImpact: 10,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.LIVE_PERFORMER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [
      GrowthEngine.PRESS_DRIVEN,
      GrowthEngine.LIVE_DISCOVERY,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['LIVE_PERFORMANCE', 'SYNC_LICENSING'],
  },
  {
    label: 'Upload a professional profile photo',
    description:
      'Add a high-quality profile photo that represents your artist brand. Square format, minimum 800x800px.',
    capabilityId: 'PRESS_MEDIA',
    dimension: 'profile',
    effort: ActionEffort.LOW,
    timeToComplete: '15 minutes',
    expectedImpact: 12,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.LIVE_PERFORMER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.MERCH_DRIVEN,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.PRESS_DRIVEN,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['LIVE_PERFORMANCE', 'MERCHANDISE'],
  },
  {
    label: 'Add your social media links',
    description:
      'Connect your TikTok, Instagram, Twitter/X, and other social profiles so fans and bookers can find you everywhere.',
    capabilityId: 'AUDIENCE_GROWTH',
    dimension: 'profile',
    effort: ActionEffort.LOW,
    timeToComplete: '10 minutes',
    expectedImpact: 8,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
    ],
    revenueModelRelevance: [
      RevenueModel.LIVE_PERFORMER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.MERCH_DRIVEN,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.COMMUNITY_DRIVEN,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['DIRECT_TO_FAN', 'MERCHANDISE'],
  },
  // PLATFORM
  {
    label: 'Create a TikTok account',
    description:
      'Set up a TikTok profile with your artist name, bio, and profile photo. Start posting music content to reach new audiences.',
    capabilityId: 'AUDIENCE_GROWTH',
    dimension: 'platform',
    effort: ActionEffort.LOW,
    timeToComplete: '30 minutes',
    expectedImpact: 10,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.MERCH_DRIVEN,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.COMMUNITY_DRIVEN,
    ],
    revenueStreamIds: ['DIRECT_TO_FAN', 'MERCHANDISE'],
  },
  {
    label: 'Post 3 TikTok videos this week',
    description:
      'Create and post 3 pieces of music content — behind the scenes, snippets, or challenges. Consistency builds algorithmic reach.',
    capabilityId: 'CONTENT_CREATION',
    dimension: 'platform',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '1 week',
    expectedImpact: 12,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.MERCH_DRIVEN,
    ],
    growthEngineRelevance: [GrowthEngine.SOCIAL_FIRST],
    revenueStreamIds: ['DIRECT_TO_FAN', 'MERCHANDISE'],
  },
  {
    label: 'Complete your Spotify for Artists profile',
    description:
      'Claim your Spotify for Artists profile, add a bio, pick your artist photo, and pin your latest release.',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    dimension: 'platform',
    effort: ActionEffort.LOW,
    timeToComplete: '1 hour',
    expectedImpact: 15,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
    ],
    growthEngineRelevance: [
      GrowthEngine.PLAYLIST_DRIVEN,
      GrowthEngine.SOCIAL_FIRST,
    ],
    revenueStreamIds: ['STREAMING'],
  },
  {
    label: 'Connect your YouTube channel',
    description:
      'Link your YouTube channel to your Flemoji profile. Upload at least one music video or lyric video to establish your video presence.',
    capabilityId: 'CONTENT_CREATION',
    dimension: 'platform',
    effort: ActionEffort.LOW,
    timeToComplete: '45 minutes',
    expectedImpact: 8,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.MERCH_DRIVEN,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.PLAYLIST_DRIVEN,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['STREAMING', 'DIRECT_TO_FAN'],
  },
  // RELEASE
  {
    label: 'Add a smart link to your latest release',
    description:
      'Create a smart link that routes fans to their preferred streaming platform. Share it on all your social profiles.',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    dimension: 'release',
    effort: ActionEffort.LOW,
    timeToComplete: '20 minutes',
    expectedImpact: 20,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.PLAYLIST_DRIVEN,
      GrowthEngine.COLLABORATION_DRIVEN,
    ],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'DIRECT_TO_FAN'],
  },
  {
    label: 'Add cover art to all your tracks',
    description:
      'Upload cover art (minimum 3000x3000px, square) to every track that is missing it. Cover art is required by streaming platforms.',
    capabilityId: 'PRESS_MEDIA',
    dimension: 'release',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '2–3 hours',
    expectedImpact: 14,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [
      GrowthEngine.PLAYLIST_DRIVEN,
      GrowthEngine.SOCIAL_FIRST,
    ],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING'],
  },
  {
    label: 'Complete metadata on all your tracks',
    description:
      'Fill in genre, mood, BPM, key, and ISRC codes for all your tracks. Complete metadata improves discoverability on streaming platforms.',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    dimension: 'release',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '1–2 hours',
    expectedImpact: 12,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [GrowthEngine.PLAYLIST_DRIVEN],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING'],
  },
  {
    label: 'Release a new track',
    description:
      "It's been more than 90 days since your last release. Consistent output is the #1 driver of algorithmic streaming growth.",
    capabilityId: 'CONSISTENT_RELEASE',
    dimension: 'release',
    effort: ActionEffort.HIGH,
    timeToComplete: '1–4 weeks',
    expectedImpact: 25,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [
      GrowthEngine.PLAYLIST_DRIVEN,
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.COLLABORATION_DRIVEN,
    ],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'DIRECT_TO_FAN', 'SYNC_LICENSING'],
  },
  // BUSINESS
  {
    label: 'Create a split sheet in Flemoji',
    description:
      'Document who owns what percentage of each track. Split sheets are legally required to collect royalties and essential for any collaboration.',
    capabilityId: 'BUSINESS_ADMIN',
    dimension: 'business',
    effort: ActionEffort.LOW,
    timeToComplete: '20 minutes',
    expectedImpact: 18,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.PRODUCER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.SYNC_FOCUSED,
      RevenueModel.LIVE_PERFORMER,
    ],
    growthEngineRelevance: [GrowthEngine.COLLABORATION_DRIVEN],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING', 'PRODUCTION_SERVICES'],
  },
  {
    label: 'Resolve your pending split sheet invites',
    description:
      'You have pending split sheet invitations. Complete them so all collaborators are properly credited and royalties can flow correctly.',
    capabilityId: 'BUSINESS_ADMIN',
    dimension: 'business',
    effort: ActionEffort.LOW,
    timeToComplete: '15 minutes',
    expectedImpact: 14,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.PRODUCER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [GrowthEngine.COLLABORATION_DRIVEN],
    actionUrl: '/dashboard',
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING', 'PRODUCTION_SERVICES'],
  },
  {
    label: 'Register with SAMRO (SA performing rights organisation)',
    description:
      'Register as a composer/songwriter with SAMRO to collect performance and broadcast royalties in South Africa and internationally.',
    capabilityId: 'BUSINESS_ADMIN',
    dimension: 'business',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '1–2 days',
    expectedImpact: 22,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.SYNC_FOCUSED,
      RevenueModel.LIVE_PERFORMER,
      RevenueModel.PRODUCER,
    ],
    growthEngineRelevance: [],
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING', 'LIVE_PERFORMANCE'],
  },
  {
    label: 'Set up distribution for your music',
    description:
      'Use a digital distributor (DistroKid, TuneCore, Amuse, or similar) to get your music on Spotify, Apple Music, and other platforms.',
    capabilityId: 'DIGITAL_DISTRIBUTION',
    dimension: 'business',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '1–3 days',
    expectedImpact: 20,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
      RevenueModel.SYNC_FOCUSED,
    ],
    growthEngineRelevance: [GrowthEngine.PLAYLIST_DRIVEN],
    revenueStreamIds: ['STREAMING', 'SYNC_LICENSING', 'PRODUCTION_SERVICES'],
  },
  {
    label: 'Verify your email address',
    description:
      'Verify your Flemoji email address to unlock full account functionality, receive payment notifications, and protect your profile.',
    capabilityId: 'BUSINESS_ADMIN',
    dimension: 'business',
    effort: ActionEffort.LOW,
    timeToComplete: '5 minutes',
    expectedImpact: 8,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.LIVE_PERFORMER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.PRODUCER,
      RevenueModel.SYNC_FOCUSED,
      RevenueModel.MERCH_DRIVEN,
      RevenueModel.HYBRID,
    ],
    growthEngineRelevance: [],
    actionUrl: '/profile',
    revenueStreamIds: [],
  },
  // PRODUCER-SPECIFIC
  {
    label: 'List your production services',
    description:
      'Add your production rates, genres you work in, and notable credits to your Flemoji profile so artists can find and book you.',
    capabilityId: 'COLLABORATION',
    dimension: 'business',
    effort: ActionEffort.LOW,
    timeToComplete: '30 minutes',
    expectedImpact: 16,
    artistTypeRelevance: [ArtistType.SESSION_PRODUCER, ArtistType.HYBRID],
    revenueModelRelevance: [RevenueModel.PRODUCER],
    growthEngineRelevance: [
      GrowthEngine.COLLABORATION_DRIVEN,
      GrowthEngine.COMMUNITY_DRIVEN,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['PRODUCTION_SERVICES'],
  },
  // LIVE PERFORMER
  {
    label: 'Add a booking contact to your profile',
    description:
      'Add a dedicated booking email or contact form link so venues and promoters can reach you directly for bookings.',
    capabilityId: 'LIVE_PERFORMANCE',
    dimension: 'profile',
    effort: ActionEffort.LOW,
    timeToComplete: '10 minutes',
    expectedImpact: 12,
    artistTypeRelevance: [
      ArtistType.PERFORMER,
      ArtistType.INDEPENDENT,
      ArtistType.HYBRID,
      ArtistType.SIGNED_ARTIST,
    ],
    revenueModelRelevance: [RevenueModel.LIVE_PERFORMER],
    growthEngineRelevance: [
      GrowthEngine.LIVE_DISCOVERY,
      GrowthEngine.PRESS_DRIVEN,
    ],
    actionUrl: '/artist-profile',
    revenueStreamIds: ['LIVE_PERFORMANCE'],
  },
  // MERCH / DIRECT TO FAN
  {
    label: 'Set up a Bandcamp or merch store',
    description:
      'Launch a direct-to-fan store where you can sell music, merch, and exclusive content without platform middlemen.',
    capabilityId: 'DIRECT_TO_FAN',
    dimension: 'business',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '3–5 hours',
    expectedImpact: 18,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.HYBRID,
    ],
    revenueModelRelevance: [
      RevenueModel.MERCH_DRIVEN,
      RevenueModel.STREAMING_ARTIST,
    ],
    growthEngineRelevance: [
      GrowthEngine.SOCIAL_FIRST,
      GrowthEngine.COMMUNITY_DRIVEN,
    ],
    revenueStreamIds: ['MERCHANDISE', 'DIRECT_TO_FAN'],
  },
  // NETWORKING
  {
    label: 'Collaborate on a track with another Flemoji artist',
    description:
      "Reach out to another artist on Flemoji to collaborate. Joint releases expose you to each other's audiences and generate split sheet practice.",
    capabilityId: 'COLLABORATION',
    dimension: 'release',
    effort: ActionEffort.HIGH,
    timeToComplete: 'Ongoing',
    expectedImpact: 20,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.PERFORMER,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [
      RevenueModel.PRODUCER,
      RevenueModel.STREAMING_ARTIST,
      RevenueModel.LIVE_PERFORMER,
    ],
    growthEngineRelevance: [
      GrowthEngine.COLLABORATION_DRIVEN,
      GrowthEngine.COMMUNITY_DRIVEN,
    ],
    actionUrl: '/browse',
    revenueStreamIds: ['PRODUCTION_SERVICES', 'STREAMING'],
  },
  // SYNC
  {
    label: 'Submit to a sync licensing platform',
    description:
      'Register your catalogue on Musicbed, Artlist, or SubmitHub Music Licensing to get your music considered for TV, film, and ad placements.',
    capabilityId: 'SYNC_LICENSING',
    dimension: 'business',
    effort: ActionEffort.MEDIUM,
    timeToComplete: '2–4 hours',
    expectedImpact: 20,
    artistTypeRelevance: [
      ArtistType.INDEPENDENT,
      ArtistType.SONGWRITER,
      ArtistType.HYBRID,
      ArtistType.SESSION_PRODUCER,
    ],
    revenueModelRelevance: [RevenueModel.SYNC_FOCUSED, RevenueModel.PRODUCER],
    growthEngineRelevance: [],
    revenueStreamIds: ['SYNC_LICENSING'],
  },
];

// ── MAIN SEED FUNCTION ────────────────────────────────

async function main() {
  console.error('🌱 Seeding Career Intelligence Engine...\n');

  // 1. Capabilities
  console.error('  → Upserting capabilities...');
  await Promise.all(
    CAPABILITIES.map(cap =>
      prisma.capability.upsert({
        where: { id: cap.id },
        update: cap,
        create: cap,
      })
    )
  );
  console.error(`     ✓ ${CAPABILITIES.length} capabilities`);

  // 2. Revenue Streams (without relations first)
  console.error('  → Upserting revenue streams...');
  await Promise.all(
    REVENUE_STREAMS.map(({ requiredCapabilities: _, ...rs }) =>
      prisma.revenueStream.upsert({
        where: { id: rs.id },
        update: rs,
        create: rs,
      })
    )
  );
  console.error(`     ✓ ${REVENUE_STREAMS.length} revenue streams`);

  // 3. Revenue Stream → Capability mappings
  console.error('  → Upserting revenue stream capability maps...');
  let rscCount = 0;
  for (const rs of REVENUE_STREAMS) {
    for (const capId of rs.requiredCapabilities) {
      await prisma.revenueStreamCapability.upsert({
        where: {
          revenueStreamId_capabilityId: {
            revenueStreamId: rs.id,
            capabilityId: capId,
          },
        },
        update: { required: true },
        create: { revenueStreamId: rs.id, capabilityId: capId, required: true },
      });
      rscCount++;
    }
  }
  console.error(`     ✓ ${rscCount} revenue stream capability mappings`);

  // 4. AuditCheck → Capability mappings
  console.error('  → Upserting audit check capability maps...');
  await Promise.all(
    AUDIT_CHECK_CAPABILITIES.map(acc =>
      prisma.auditCheckCapability.upsert({
        where: {
          checkId_capabilityId: {
            checkId: acc.checkId,
            capabilityId: acc.capabilityId,
          },
        },
        update: { weight: acc.weight },
        create: acc,
      })
    )
  );
  console.error(
    `     ✓ ${AUDIT_CHECK_CAPABILITIES.length} audit check capability mappings`
  );

  // 5. Actions + ActionRevenueStream mappings
  console.error('  → Upserting actions...');
  for (const action of ACTIONS) {
    const { revenueStreamIds, ...actionData } = action;

    const created = await prisma.action.upsert({
      where: {
        id: `action_${action.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 50)}`,
      },
      update: actionData,
      create: {
        id: `action_${action.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 50)}`,
        ...actionData,
      },
    });

    // Revenue stream links
    for (const rsId of revenueStreamIds) {
      await prisma.actionRevenueStream.upsert({
        where: {
          actionId_revenueStreamId: {
            actionId: created.id,
            revenueStreamId: rsId,
          },
        },
        update: {},
        create: { actionId: created.id, revenueStreamId: rsId },
      });
    }
  }
  console.error(`     ✓ ${ACTIONS.length} actions`);

  console.error('\n✅ Career Intelligence Engine seed complete!\n');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
