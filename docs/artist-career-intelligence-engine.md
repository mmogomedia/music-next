# Artist Career Intelligence Engine

> **Status:** Design phase v2 — evolving from `artist-readiness-audit.md`
> **Branch target:** `feat/career-intelligence-engine`
> **Author:** Tatenda + Claude
> **Date:** 2026-03-26

---

## Premise

The original audit system was structurally sound: score four dimensions, surface gaps, suggest actions.

But artists do not operate in a linear system. A Johannesburg amapiano producer who never posts on social media and earns primarily from sync placements has a fundamentally different career model than an independent singer-songwriter building a streaming audience. Giving them the same checklist is not just unhelpful — it is misleading.

Real-world career data confirms:

- Artists rely on **multiple revenue streams simultaneously** (live, streaming, merch, licensing, direct-to-fan)
- Sustainable careers are built through **diversification**, not a single channel
- No two artists follow the same path

This means the audit system, while correct in structure, was missing **career modeling intelligence**.

This document evolves the system from:

> "Audit + gaps + suggestions"

Into:

> **A graph-driven career intelligence system that can answer: "What should this artist do next, and why?"**

---

## 1. What Changes vs What Stays

| Component                                         | Status     | Change                                         |
| ------------------------------------------------- | ---------- | ---------------------------------------------- |
| `AuditRuleSet`                                    | ✅ Keep    | No changes — still drives check weights        |
| Sub-agents (profile, platform, release, business) | ✅ Keep    | Extend outputs only                            |
| `ArtistAudit` model                               | ✅ Keep    | Add `decisionResultId` FK                      |
| `ArtistType` enum                                 | ✅ Keep    | Keep as primary classifier                     |
| `ScoreAggregator`                                 | ✅ Keep    | No changes                                     |
| Audit renderers                                   | ✅ Keep    | Extend to show capability + revenue path       |
| `ArtistProfile`                                   | 🔄 Extend  | Add `revenueModel`, `growthEngine`             |
| `Article`                                         | 🔄 Extend  | Add capability, revenueStream, intent fields   |
| `AuditGap`                                        | 🔄 Extend  | Add `capabilityIds[]`                          |
| `SuggestedActions`                                | 🔄 Promote | Become first-class `Action` objects            |
| **`Capability`**                                  | 🆕 New     | Registry of what artists must be able to DO    |
| **`RevenueStream`**                               | 🆕 New     | How artists earn, with capability requirements |
| **`Action`**                                      | 🆕 New     | First-class execution objects                  |
| **`DecisionEngine`**                              | 🆕 New     | Core intelligence service                      |
| **`DecisionResult`**                              | 🆕 New     | Persisted output of the engine                 |
| **`ActionOutcome`**                               | 🆕 New     | Tracks completed actions for the loop          |

---

## 2. Updated Artist Profile Dimensions

The current `artistType` classifies _what kind of artist_ they are. Two new dimensions model _how they earn_ and _how they grow_ — each with a **primary** (dominant) value and **secondary** (supporting) array.

### Why primary + secondary?

Real artists are not mono-dimensional. A producer who earns primarily from beats but also performs live has a `PRODUCER` primary revenue model and `LIVE_PERFORMER` as secondary. The system:

- Uses **primary** for routing logic and action ranking (clear, deterministic)
- Uses **secondary** to widen the action set and knowledge articles retrieved
- Weights secondary attributes at **0.6×** vs primary at **1.0×** in the DecisionEngine

### 2A. `revenueModel` — How the artist earns

```prisma
enum RevenueModel {
  LIVE_PERFORMER   // Gigs, tours, bookings
  STREAMING_ARTIST // Streaming royalties
  PRODUCER         // Production fees, beats, session work
  SYNC_FOCUSED     // TV, film, ad placements
  MERCH_DRIVEN     // Merchandise and direct product sales
  HYBRID           // No dominant stream (default)
}
```

```prisma
// ArtistProfile additions
primaryRevenueModel    RevenueModel    @default(HYBRID)
secondaryRevenueModels RevenueModel[]  // empty = not yet assessed
```

**How secondary changes recommendations:**
A `primaryRevenueModel: PRODUCER` with `secondaryRevenueModels: [LIVE_PERFORMER]` will receive:

- Primary actions: split sheets, beat licensing, distribution setup
- Secondary actions (weighted lower): press kit, booking link, venue contacts
- Articles: both "Producer Credits & Licensing" AND "Getting Booked: What Venues Look For"

### 2B. `growthEngine` — How the artist is discovered

```prisma
enum GrowthEngine {
  SOCIAL_FIRST         // TikTok/Instagram is primary discovery
  PLAYLIST_DRIVEN      // Spotify/Apple editorial + algorithmic playlists
  LIVE_DISCOVERY       // Fans find them through live shows
  COMMUNITY_DRIVEN     // Word of mouth, local scene, cultural community
  COLLABORATION_DRIVEN // Other artists' audiences discover them
  PRESS_DRIVEN         // Media coverage, blogs, radio
}
```

```prisma
// ArtistProfile additions
primaryGrowthEngine    GrowthEngine    @default(SOCIAL_FIRST)
secondaryGrowthEngines GrowthEngine[]  // empty = not yet assessed
```

**How secondary changes recommendations:**
A `primaryGrowthEngine: COLLABORATION_DRIVEN` with `secondaryGrowthEngines: [PLAYLIST_DRIVEN]` will be advised to:

- Lead with: expanding feature network, credited releases, collab promotion
- Support with: SubmitHub pitching, Spotify profile completeness, release consistency for algorithmic pickup

### Updated `ArtistProfile` schema (full delta)

```prisma
// Replace single-value fields with primary + secondary
primaryRevenueModel    RevenueModel    @default(HYBRID)
secondaryRevenueModels RevenueModel[]
primaryGrowthEngine    GrowthEngine    @default(SOCIAL_FIRST)
secondaryGrowthEngines GrowthEngine[]
```

### Updated onboarding questionnaire (now 7 questions)

Questions 1–6 use **multi-select** where marked, so artists can pick primary + secondary naturally.

1. "How would you describe your artist journey?" → Independent / With a team / Label signed / Producer / Session artist
2. "Where do fans discover you?" _(multi-select, mark your top pick)_ → Social media / Live shows / Streaming playlists / Through other artists / Word of mouth / Press & media
3. "Do you manage your own social media?" → Yes, myself / I have help / I don't use social media
4. "Where does your music income come from?" _(multi-select, mark your top pick)_ → Live gigs / Streaming / Production/beats / Sync/licensing / Merch / I don't earn from music yet
5. "What's your primary goal right now?" → More streams / More gigs / Getting signed / Building a team / Licensing my music
6. "How many tracks have you released?" → 0 / 1–5 / 6–20 / 20+ _(maps to `careerStage`)_
7. **"How many times have you collaborated with other artists?"** → Never / 1–3 times / 4–10 times / More than 10 times _(maps to `collaborationScore` + informs `COLLABORATION` capability level)_

> **Q7 rationale:** Collaboration history is a strong career signal. Artists with 4+ collabs already have `COLLABORATION` capability partially demonstrated — the audit should reflect this rather than flagging it as a full gap. We also cross-reference Flemoji's actual data (split sheets, `featuredArtistIds` on tracks) to verify and enrich this self-reported answer.

### Collaboration data enrichment

The questionnaire answer is a starting point. The system also checks:

- Number of tracks where the artist appears in `featuredArtistIds` (collaborations as featured)
- Number of split sheets with other artists (formal collaboration)
- Number of tracks with `primaryArtistIds.length > 1` (joint releases)

These are merged into a `collaborationScore` (0–100) stored on `ArtistCapability` for the `COLLABORATION` capability:

| Signal                        | Weight |
| ----------------------------- | ------ |
| Self-reported (questionnaire) | 20%    |
| Featured on other tracks      | 30%    |
| Split sheets created          | 30%    |
| Joint primary releases        | 20%    |

---

## 3. Capability Layer

Capabilities are the **skills and infrastructure** an artist must have to unlock revenue streams. They are the bridge between gaps (what's missing) and outcomes (what that unlocks).

### Capability Registry

```typescript
export const CAPABILITIES = {
  AUDIENCE_GROWTH: 'Growing fanbase across channels',
  CONTENT_CREATION: 'Consistently creating and publishing digital content',
  CONSISTENT_RELEASE: 'Releasing music on a regular, predictable cadence',
  DIGITAL_DISTRIBUTION: 'Getting music onto streaming and download platforms',
  LIVE_PERFORMANCE: 'Performing live professionally',
  BUSINESS_ADMIN: 'Contracts, splits, royalties, and legal basics',
  SYNC_LICENSING: 'Licensing music for TV, film, ads, and games',
  DIRECT_TO_FAN: 'Selling directly to fans (merch, events, memberships)',
  INDUSTRY_NETWORKING:
    'Building label, manager, publisher, and booking relationships',
  PRESS_MEDIA: 'Getting media coverage, interviews, and press placement',
  COLLABORATION: 'Working with other artists and producers effectively',
  MONETIZE_AUDIENCE: 'Converting audience attention into revenue',
} as const;

export type CapabilityId = keyof typeof CAPABILITIES;
```

### Prisma model

```prisma
model Capability {
  id          String  @id  // matches CAPABILITIES key, e.g. 'AUDIENCE_GROWTH'
  label       String
  description String
  category    String  // 'growth' | 'business' | 'creative' | 'performance'

  // Relations
  gapMappings         AuditCheckCapability[]
  revenueRequirements RevenueStreamCapability[]
  actions             Action[]
  artistCapabilities  ArtistCapability[]

  @@map("capabilities")
}
```

---

## 4. Revenue Stream Model

Revenue streams are **how artists earn money**. Each stream requires certain capabilities to unlock. Making this explicit allows the system to show artists exactly what capability gaps are blocking specific income streams.

### Revenue Stream Registry

| Stream                | Required Capabilities                               | Supporting Platforms                            |
| --------------------- | --------------------------------------------------- | ----------------------------------------------- |
| `STREAMING`           | DIGITAL_DISTRIBUTION, CONSISTENT_RELEASE            | Spotify, Apple Music, TIDAL, YouTube Music      |
| `LIVE_PERFORMANCE`    | LIVE_PERFORMANCE, AUDIENCE_GROWTH, PRESS_MEDIA      | Eventbrite, Bandsintown, TicketSource           |
| `MERCHANDISE`         | AUDIENCE_GROWTH, DIRECT_TO_FAN, CONTENT_CREATION    | Shopify, Bandcamp, Spring                       |
| `SYNC_LICENSING`      | SYNC_LICENSING, CONSISTENT_RELEASE, BUSINESS_ADMIN  | Musicbed, Artlist, SubmitHub, music supervisors |
| `DIRECT_TO_FAN`       | AUDIENCE_GROWTH, CONTENT_CREATION, DIRECT_TO_FAN    | Patreon, Bandcamp, Substack                     |
| `PRODUCTION_SERVICES` | COLLABORATION, BUSINESS_ADMIN, DIGITAL_DISTRIBUTION | BeatStars, Airbit, SoundBetter                  |

### Prisma models

```prisma
model RevenueStream {
  id                   String  @id  // e.g. 'STREAMING'
  label                String
  description          String
  supportingPlatforms  String[]

  // Relations
  requiredCapabilities RevenueStreamCapability[]
  actions              Action[]

  @@map("revenue_streams")
}

model RevenueStreamCapability {
  revenueStreamId String
  capabilityId    String
  required        Boolean  @default(true)  // false = helpful but not blocking

  revenueStream   RevenueStream @relation(fields: [revenueStreamId], references: [id])
  capability      Capability    @relation(fields: [capabilityId], references: [id])

  @@id([revenueStreamId, capabilityId])
  @@map("revenue_stream_capabilities")
}
```

---

## 5. Gap → Capability Mapping

Every `AuditCheck` now maps to one or more `Capability` IDs. This mapping is seeded in the DB and drives the graph traversal.

### Full Mapping Table

| AuditCheck ID                | Gap                      | Missing Capabilities                         |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| `profile_bio`                | No bio written           | `PRESS_MEDIA`                                |
| `profile_image`              | No profile image         | `PRESS_MEDIA`, `AUDIENCE_GROWTH`             |
| `profile_cover`              | No cover image           | `PRESS_MEDIA`                                |
| `profile_genre`              | No genre tags            | `DIGITAL_DISTRIBUTION`                       |
| `profile_social_links`       | No social links          | `AUDIENCE_GROWTH`                            |
| `profile_tracks`             | No tracks uploaded       | `CONSISTENT_RELEASE`, `DIGITAL_DISTRIBUTION` |
| `platform_tiktok_connected`  | TikTok not connected     | `CONTENT_CREATION`, `AUDIENCE_GROWTH`        |
| `platform_tiktok_cadence`    | TikTok posting < 1/week  | `CONTENT_CREATION`                           |
| `platform_tiktok_followers`  | < 500 TikTok followers   | `AUDIENCE_GROWTH`                            |
| `platform_spotify_connected` | Spotify not connected    | `DIGITAL_DISTRIBUTION`                       |
| `platform_spotify_listeners` | < 100 monthly listeners  | `AUDIENCE_GROWTH`, `CONSISTENT_RELEASE`      |
| `platform_youtube_connected` | YouTube not connected    | `CONTENT_CREATION`, `AUDIENCE_GROWTH`        |
| `platform_youtube_uploads`   | No uploads in 60 days    | `CONTENT_CREATION`                           |
| `release_smart_link`         | No smart link            | `DIGITAL_DISTRIBUTION`, `MONETIZE_AUDIENCE`  |
| `release_quick_link`         | No quick link            | `DIGITAL_DISTRIBUTION`                       |
| `release_cover_art`          | No cover art             | `PRESS_MEDIA`                                |
| `release_metadata`           | Incomplete metadata      | `DIGITAL_DISTRIBUTION`                       |
| `release_cadence`            | No release in 90 days    | `CONSISTENT_RELEASE`                         |
| `business_split_sheet`       | No split sheet           | `BUSINESS_ADMIN`                             |
| `business_splits_complete`   | Splits don't sum to 100% | `BUSINESS_ADMIN`                             |
| `business_email_verified`    | Email unverified         | `BUSINESS_ADMIN`                             |
| `business_distribution`      | No distribution link     | `DIGITAL_DISTRIBUTION`                       |
| `business_pending_splits`    | Pending split invites    | `BUSINESS_ADMIN`, `COLLABORATION`            |

### Prisma junction model

```prisma
model AuditCheckCapability {
  checkId      String     // matches AuditCheck.id
  capabilityId String
  weight       Float      @default(1.0)  // how much this gap impacts the capability

  capability   Capability @relation(fields: [capabilityId], references: [id])

  @@id([checkId, capabilityId])
  @@map("audit_check_capabilities")
}
```

---

## 6. Action System (First-Class Objects)

Actions are no longer strings in a `SuggestedAction[]` array. They are persistent, typed, ranked objects.

```
Gap → Action → builds Capability → unlocks Revenue Stream
```

### Action model

```prisma
model Action {
  id                    String      @id @default(cuid())
  label                 String
  description           String
  capabilityId          String
  dimension             String      // 'profile' | 'platform' | 'release' | 'business'
  effort                ActionEffort
  timeToComplete        String      // "30 minutes", "1 week", "ongoing"
  expectedImpact        Float       // audit score points if completed
  artistTypeRelevance   ArtistType[]
  revenueModelRelevance RevenueModel[]
  actionUrl             String?     // deep link within Flemoji if applicable
  isActive              Boolean     @default(true)

  // Relations
  capability      Capability    @relation(fields: [capabilityId], references: [id])
  revenueStreams  ActionRevenueStream[]
  outcomes        ActionOutcome[]

  @@index([capabilityId])
  @@index([dimension])
  @@map("actions")
}

enum ActionEffort {
  LOW    // < 1 hour
  MEDIUM // 1 day to 1 week
  HIGH   // 1 week+
}

model ActionRevenueStream {
  actionId        String
  revenueStreamId String

  action        Action        @relation(fields: [actionId], references: [id])
  revenueStream RevenueStream @relation(fields: [revenueStreamId], references: [id])

  @@id([actionId, revenueStreamId])
  @@map("action_revenue_streams")
}
```

### Example seeded actions

| Action                                  | Capability           | Effort | Impact | Revenue unlocked           |
| --------------------------------------- | -------------------- | ------ | ------ | -------------------------- |
| Create a TikTok account                 | AUDIENCE_GROWTH      | LOW    | +10    | DIRECT_TO_FAN, MERCHANDISE |
| Post 3 TikTok videos this week          | CONTENT_CREATION     | MEDIUM | +12    | DIRECT_TO_FAN              |
| Complete your Spotify artist profile    | DIGITAL_DISTRIBUTION | LOW    | +15    | STREAMING                  |
| Create a split sheet in Flemoji         | BUSINESS_ADMIN       | LOW    | +18    | All streams                |
| Add a smart link to your latest release | DIGITAL_DISTRIBUTION | LOW    | +20    | STREAMING, DIRECT_TO_FAN   |
| Upload a professional profile photo     | PRESS_MEDIA          | LOW    | +12    | LIVE_PERFORMANCE           |
| Release a new track                     | CONSISTENT_RELEASE   | HIGH   | +25    | STREAMING, DIRECT_TO_FAN   |
| Write a bio (min 100 words)             | PRESS_MEDIA          | LOW    | +10    | LIVE_PERFORMANCE           |
| Connect your YouTube channel            | CONTENT_CREATION     | LOW    | +8     | STREAMING, DIRECT_TO_FAN   |
| Register with a PRO (SAMRO)             | BUSINESS_ADMIN       | MEDIUM | +22    | SYNC_LICENSING, STREAMING  |

---

## 7. Artist Capability State

The current audit assesses gaps but doesn't persist **what capabilities the artist currently has**. This enables the system loop.

```prisma
model ArtistCapability {
  id              String     @id @default(cuid())
  artistProfileId String
  capabilityId    String
  level           Float      // 0.0–1.0, assessed from audit scores
  assessedAt      DateTime   @default(now())
  source          String     // 'audit' | 'manual' | 'action_outcome'

  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])
  capability    Capability    @relation(fields: [capabilityId], references: [id])

  @@unique([artistProfileId, capabilityId])
  @@index([artistProfileId])
  @@map("artist_capabilities")
}
```

---

## 8. Decision Engine

This is the core upgrade. The `DecisionEngine` service sits between the audit output and the artist's action queue.

### File: `src/lib/services/decision-engine.ts`

```typescript
export class DecisionEngine {
  async compute(
    audit: ArtistAudit,
    profile: ArtistProfile
  ): Promise<DecisionResult> {
    // STEP 1: Get top gaps by impact (deterministic)
    const topGaps = (audit.gaps as AuditGap[])
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10);

    // STEP 2: Map gaps → missing capabilities (DB lookup)
    const capabilityMaps = await prisma.auditCheckCapability.findMany({
      where: { checkId: { in: topGaps.map(g => g.checkId) } },
      include: { capability: true },
    });
    const missingCapabilities = deduplicateCapabilities(capabilityMaps);

    // STEP 3: Map capabilities → blocked revenue streams (DB lookup)
    const blockedRevenue = await computeBlockedRevenue(missingCapabilities);

    // STEP 4: Fetch and filter available actions (deterministic)
    const actions = await prisma.action.findMany({
      where: {
        capabilityId: { in: missingCapabilities.map(c => c.id) },
        isActive: true,
        artistTypeRelevance: { has: profile.artistType },
      },
      include: { revenueStreams: { include: { revenueStream: true } } },
      orderBy: { expectedImpact: 'desc' },
    });

    // STEP 5: Rank actions (deterministic scoring)
    const rankedActions = rankActions(actions, {
      missingCapabilities,
      blockedRevenue,
      profile,
    });

    // STEP 6: ONE LLM call — narrative explanation only
    const reasoning = await generateReasoning({
      profile,
      topCapabilities: missingCapabilities.slice(0, 3),
      topBlockedRevenue: blockedRevenue.slice(0, 3),
      topActions: rankedActions.slice(0, 5),
    });

    // STEP 7: Compute revenue unlock path
    const revenueUnlockPath = computeUnlockPath(rankedActions, blockedRevenue);

    // STEP 8: Persist and return
    const result = await prisma.decisionResult.create({
      data: {
        auditId: audit.id,
        artistProfileId: profile.id,
        missingCapabilities: missingCapabilities.map(c => c.id),
        blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
        rankedActions: rankedActions.slice(0, 5).map(a => a.id),
        reasoning,
        revenueUnlockPath,
      },
    });

    return {
      id: result.id,
      prioritizedActions: rankedActions.slice(0, 5),
      missingCapabilities,
      blockedRevenue,
      revenueUnlockPath,
      reasoning,
    };
  }
}
```

### Action Ranking Algorithm (deterministic)

Secondary attributes are included in ranking at **0.6× weight** — they widen the action set without overriding the primary path.

```typescript
function rankActions(
  actions: Action[],
  context: RankingContext
): RankedAction[] {
  const { profile } = context;

  return actions
    .map(action => {
      const impactScore = (action.expectedImpact / 30) * 0.4;
      const effortScore = effortInverse[action.effort] * 0.25;
      const revenueScore = revenueUnlockValue(action, context) * 0.35;

      // Relevance multiplier: primary match = 1.0, secondary match = 0.6, no match = 0.3
      const revenueRelevance = action.revenueModelRelevance.includes(
        profile.primaryRevenueModel
      )
        ? 1.0
        : profile.secondaryRevenueModels.some(m =>
              action.revenueModelRelevance.includes(m)
            )
          ? 0.6
          : 0.3;

      const growthRelevance = action.growthEngineRelevance?.includes(
        profile.primaryGrowthEngine
      )
        ? 1.0
        : profile.secondaryGrowthEngines.some(g =>
              action.growthEngineRelevance?.includes(g)
            )
          ? 0.6
          : 1.0; // growth engine is advisory — no penalty for mismatch

      const baseScore = impactScore + effortScore + revenueScore;
      return {
        ...action,
        rankScore: baseScore * revenueRelevance * growthRelevance,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}

// Revenue unlock value: higher if the action unblocks a stream the artist is close to unlocking
function revenueUnlockValue(action: Action, context: RankingContext): number {
  return (
    action.revenueStreams.reduce((score, { revenueStream }) => {
      const blocked = context.blockedRevenue.find(
        b => b.revenueStreamId === revenueStream.id
      );
      if (!blocked) return score;
      // Higher score if stream is nearly unlocked (only 1-2 caps missing)
      const completionBonus = blocked.blockedBy.length === 1 ? 1.0 : 0.6;
      return score + completionBonus;
    }, 0) / action.revenueStreams.length
  );
}
```

### `DecisionResult` Prisma model

```prisma
model DecisionResult {
  id                  String   @id @default(cuid())
  auditId             String   @unique
  artistProfileId     String
  missingCapabilities String[] // Capability IDs
  blockedRevenue      String[] // RevenueStream IDs
  rankedActions       String[] // Action IDs (ordered)
  reasoning           String   // LLM-generated narrative
  revenueUnlockPath   Json     // { stream, requiredActions[], completionPct }[]
  createdAt           DateTime @default(now())

  audit         ArtistAudit   @relation(fields: [auditId], references: [id])
  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])

  @@index([artistProfileId])
  @@map("decision_results")
}
```

---

## 9. Action Outcome & System Loop

The system loop closes when artists mark actions as complete and the system re-audits the affected dimensions.

### `ActionOutcome` model

```prisma
model ActionOutcome {
  id              String   @id @default(cuid())
  actionId        String
  artistProfileId String
  completedAt     DateTime @default(now())
  selfReported    Boolean  @default(true)   // false = system-verified
  impactDelta     Float?   // actual score change after partial re-audit

  action        Action        @relation(fields: [actionId], references: [id])
  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])

  @@index([artistProfileId])
  @@map("action_outcomes")
}
```

### Loop triggers

| Event                  | Trigger                                     | Dimensions re-audited   |
| ---------------------- | ------------------------------------------- | ----------------------- |
| Action marked complete | `POST /api/ai/artist-audit/action-complete` | dimension of the action |
| New track uploaded     | Track create webhook                        | `release`               |
| Platform connected     | PULSE³ connection webhook                   | `platform`              |
| Monthly schedule       | Cron job                                    | Full re-audit           |

### Partial re-audit design

```typescript
// src/lib/services/partial-reaudit-service.ts
export async function partialReAudit(
  profileId: string,
  dimensions: AuditDimension[]
): Promise<Partial<ArtistAudit>> {
  const profile = await getArtistProfileById(profileId);
  const latestAudit = await getLatestAudit(profileId);

  // Run only the affected sub-agents
  const results = await Promise.all(
    dimensions.map(dim => runSubAgent(dim, profile))
  );

  // Merge with existing audit (keep unchanged dimensions)
  const updatedAudit = mergeAuditResults(latestAudit, results, dimensions);

  // Recompute overall score
  const newScore = ScoreAggregator.compute(updatedAudit);

  // Persist delta
  await prisma.artistAudit.update({
    where: { id: latestAudit.id },
    data: { ...newScore, updatedAt: new Date() },
  });

  // Re-run DecisionEngine with new audit
  await new DecisionEngine().compute(updatedAudit, profile);

  return updatedAudit;
}
```

---

## 10. Article Graph Node Upgrade

Articles are currently passive knowledge. They must become **structured knowledge nodes** that the DecisionEngine can retrieve and rank by relevance to the artist's current state.

### Why many-to-many for capabilities?

An article does not build exactly one capability. _"The Independent Artist Pre-Release Checklist"_ builds `DIGITAL_DISTRIBUTION`, `CONSISTENT_RELEASE`, and `PRESS_MEDIA` simultaneously. A single `capabilityId` FK would mean the retrieval system misses that article when the artist's gap is `CONSISTENT_RELEASE` or `PRESS_MEDIA`.

The same applies to revenue streams — _"How to Diversify Your Music Income"_ is relevant to `STREAMING`, `DIRECT_TO_FAN`, and `MERCHANDISE` at once.

The solution is a **many-to-many junction** with an `isPrimary` flag so the engine knows which capability/stream the article is _most_ focused on without discarding secondary links.

### Updated `Article` model

```prisma
// Remove from Article model:
//   capabilityId    String?     ← replaced by junction
//   revenueStreamId String?     ← replaced by junction

// Add to Article model:
intent       ArticleIntent       @default(EDUCATIONAL)
artistTypes  ArtistType[]
careerStages CareerStage[]
capabilities ArticleCapability[]
revenues     ArticleRevenueStream[]

enum ArticleIntent {
  EDUCATIONAL  // Teaches a concept ("What is a split sheet?")
  STRATEGIC    // Guides a decision ("When should you sign to a label?")
  TACTICAL     // Step-by-step how-to ("How to create a smart link in 5 minutes")
}
```

### Junction models

```prisma
model ArticleCapability {
  articleId    String
  capabilityId String
  isPrimary    Boolean @default(false) // true = main focus; false = supporting

  article    Article    @relation(fields: [articleId], references: [id])
  capability Capability @relation(fields: [capabilityId], references: [id])

  @@id([articleId, capabilityId])
  @@map("article_capabilities")
}

model ArticleRevenueStream {
  articleId       String
  revenueStreamId String
  isPrimary       Boolean @default(false)

  article       Article       @relation(fields: [articleId], references: [id])
  revenueStream RevenueStream @relation(fields: [revenueStreamId], references: [id])

  @@id([articleId, revenueStreamId])
  @@map("article_revenue_streams")
}
```

### Example — how a single article maps to multiple nodes

| Article                                             | Capabilities (✅ = isPrimary)                                     | Revenue streams                             |
| --------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| "The Independent Artist Pre-Release Checklist"      | `DIGITAL_DISTRIBUTION` ✅ · `CONSISTENT_RELEASE` · `PRESS_MEDIA`  | `STREAMING` ✅ · `DIRECT_TO_FAN`            |
| "Split Sheets: The Contract That Saves Friendships" | `BUSINESS_ADMIN` ✅ · `COLLABORATION`                             | All streams                                 |
| "Social Media Isn't For Everyone"                   | `AUDIENCE_GROWTH` ✅ · `CONTENT_CREATION` · `INDUSTRY_NETWORKING` | `MERCHANDISE` · `DIRECT_TO_FAN`             |
| "Producer Credits & Licensing: The Basics"          | `BUSINESS_ADMIN` ✅ · `SYNC_LICENSING` · `COLLABORATION`          | `SYNC_LICENSING` ✅ · `PRODUCTION_SERVICES` |
| "Getting Booked: What Venues Look For Online"       | `PRESS_MEDIA` ✅ · `INDUSTRY_NETWORKING`                          | `LIVE_PERFORMANCE` ✅                       |

### How articles plug into the graph

```
Gap (no split sheet)
  → Capability: BUSINESS_ADMIN
    → Action: "Create a split sheet in Flemoji"
      → Article (TACTICAL, isPrimary=BUSINESS_ADMIN):
          "How to create a split sheet"          ← action level
      → Article (EDUCATIONAL, isPrimary=BUSINESS_ADMIN):
          "Why split sheets matter"               ← capability level
    → Article (STRATEGIC, careerStage=EMERGING):
          "When to hire a music lawyer"           ← career stage level

  → Also surfaces via secondary capability link:
    → Article (TACTICAL, secondary=COLLABORATION):
          "Split Sheets: The Contract That Saves Friendships"
```

### How `DecisionEngine` retrieves articles (updated)

1. **Per action** — `ArticleCapability` where `capabilityId = action.capabilityId AND isPrimary = true AND intent = TACTICAL`
2. **Per capability** — `ArticleCapability` where `capabilityId IN missingCapabilities AND intent = EDUCATIONAL` (primary ranked above secondary)
3. **Per artist profile** — `searchArticlesTool` semantic search filtered by `artistType` + `careerStage` (strategic articles)

A single article can surface at multiple points in the same audit result. Output is deduped by `articleId` before rendering.

---

## 11. Updated Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                  CAREER INTELLIGENCE ENGINE                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ARTIST PROFILE                        │   │
│  │  artistType │ revenueModel │ growthEngine │ careerStage  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    AUDIT ENGINE                          │   │
│  │                                                          │   │
│  │  ProfileAudit  PlatformAudit  ReleaseAudit  BizAudit   │   │
│  │       └──────────────┬──────────────────────┘           │   │
│  │                       ▼                                  │   │
│  │            AuditResult { score, gaps[] }                 │   │
│  │            (driven by AuditRuleSet — unchanged)          │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GRAPH LAYER                           │   │
│  │                                                          │   │
│  │  Gap ──────────► MissingCapability                       │   │
│  │  (AuditCheckCapability map)   │                          │   │
│  │                               ▼                          │   │
│  │                       BlockedRevenueStream               │   │
│  │                       (RevenueStreamCapability map)      │   │
│  │                                                          │   │
│  │  Gap ──────────► Action ──────► RevenueUnlock            │   │
│  │                     │                                    │   │
│  │                     └──► Article (Knowledge Node)        │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  DECISION ENGINE                         │   │
│  │                                                          │   │
│  │  1. rank(actions, artistProfile)   [deterministic]      │   │
│  │  2. map(capabilities → revenue)    [deterministic]      │   │
│  │  3. revenueUnlockPath()            [deterministic]      │   │
│  │  4. LLM.explain(result)            [ONE call, narrative] │   │
│  │                                                          │   │
│  │  → DecisionResult { actions, caps, revenue, reasoning }  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│          ┌──────────────────┼──────────────────┐                │
│          ▼                  ▼                   ▼                │
│   AI Chat Renderer  Dashboard Section    Action Queue            │
│   (ArtistAudit +    (AuditSection +      (ActionOutcome          │
│    DecisionResult)   RevenueUnlockPath)   → partial re-audit)    │
│          │                                      │                │
│          └──────────────────────────────────────┘                │
│                         SYSTEM LOOP                              │
│         Action complete → partial re-audit → new Decision        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 12. Complete Updated Prisma Schema (delta only)

```prisma
// ── NEW ENUMS ─────────────────────────────────────────

enum RevenueModel {
  LIVE_PERFORMER
  STREAMING_ARTIST
  PRODUCER
  SYNC_FOCUSED
  HYBRID
}

enum GrowthEngine {
  SOCIAL_FIRST
  PLAYLIST_DRIVEN
  LIVE_DISCOVERY
  COMMUNITY_DRIVEN
  COLLABORATION_DRIVEN
}

enum ArticleIntent {
  EDUCATIONAL
  STRATEGIC
  TACTICAL
}

enum ActionEffort {
  LOW
  MEDIUM
  HIGH
}

// ── EXTEND EXISTING MODELS ────────────────────────────

// ArtistProfile: add
//   primaryRevenueModel    RevenueModel   @default(HYBRID)
//   secondaryRevenueModels RevenueModel[]
//   primaryGrowthEngine    GrowthEngine   @default(SOCIAL_FIRST)
//   secondaryGrowthEngines GrowthEngine[]

// Article: add
//   intent          ArticleIntent       @default(EDUCATIONAL)
//   artistTypes     ArtistType[]
//   careerStages    CareerStage[]
//   capabilities    ArticleCapability[]   ← replaces single capabilityId FK
//   revenues        ArticleRevenueStream[] ← replaces single revenueStreamId FK
// Article: remove
//   capabilityId    String?   ← replaced by ArticleCapability junction
//   revenueStreamId String?   ← replaced by ArticleRevenueStream junction

// ArtistAudit: add
//   decisionResultId String? @unique  (set after DecisionEngine runs)

// ── NEW MODELS ────────────────────────────────────────

model Capability {
  id          String @id  // e.g. 'AUDIENCE_GROWTH'
  label       String
  description String
  category    String  // 'growth' | 'business' | 'creative' | 'performance'

  gapMappings          AuditCheckCapability[]
  revenueRequirements  RevenueStreamCapability[]
  actions              Action[]
  artistCapabilities   ArtistCapability[]

  @@map("capabilities")
}

model RevenueStream {
  id                  String   @id  // e.g. 'STREAMING'
  label               String
  description         String
  supportingPlatforms String[]

  requiredCapabilities RevenueStreamCapability[]
  actions              ActionRevenueStream[]

  @@map("revenue_streams")
}

model RevenueStreamCapability {
  revenueStreamId String
  capabilityId    String
  required        Boolean @default(true)

  revenueStream RevenueStream @relation(fields: [revenueStreamId], references: [id])
  capability    Capability    @relation(fields: [capabilityId], references: [id])

  @@id([revenueStreamId, capabilityId])
  @@map("revenue_stream_capabilities")
}

model AuditCheckCapability {
  checkId      String
  capabilityId String
  weight       Float  @default(1.0)

  capability Capability @relation(fields: [capabilityId], references: [id])

  @@id([checkId, capabilityId])
  @@map("audit_check_capabilities")
}

model Action {
  id                    String       @id @default(cuid())
  label                 String
  description           String
  capabilityId          String
  dimension             String
  effort                ActionEffort
  timeToComplete        String
  expectedImpact        Float
  artistTypeRelevance   ArtistType[]
  revenueModelRelevance RevenueModel[]   // actions ranked 1.0× for primary match, 0.6× for secondary
  growthEngineRelevance GrowthEngine[]   // advisory — used to surface growth-specific articles
  actionUrl             String?
  isActive              Boolean      @default(true)

  capability     Capability            @relation(fields: [capabilityId], references: [id])
  revenueStreams ActionRevenueStream[]
  outcomes       ActionOutcome[]

  @@index([capabilityId])
  @@index([dimension])
  @@map("actions")
}

model ActionRevenueStream {
  actionId        String
  revenueStreamId String

  action        Action        @relation(fields: [actionId], references: [id])
  revenueStream RevenueStream @relation(fields: [revenueStreamId], references: [id])

  @@id([actionId, revenueStreamId])
  @@map("action_revenue_streams")
}

model ArtistCapability {
  id              String   @id @default(cuid())
  artistProfileId String
  capabilityId    String
  level           Float    // 0.0–1.0
  assessedAt      DateTime @default(now())
  source          String   // 'audit' | 'manual' | 'action_outcome'

  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])
  capability    Capability    @relation(fields: [capabilityId], references: [id])

  @@unique([artistProfileId, capabilityId])
  @@index([artistProfileId])
  @@map("artist_capabilities")
}

model ActionOutcome {
  id              String   @id @default(cuid())
  actionId        String
  artistProfileId String
  completedAt     DateTime @default(now())
  selfReported    Boolean  @default(true)
  impactDelta     Float?

  action        Action        @relation(fields: [actionId], references: [id])
  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])

  @@index([artistProfileId])
  @@map("action_outcomes")
}

model DecisionResult {
  id                  String   @id @default(cuid())
  auditId             String   @unique
  artistProfileId     String
  missingCapabilities String[]
  blockedRevenue      String[]
  rankedActions       String[]
  reasoning           String
  revenueUnlockPath   Json
  createdAt           DateTime @default(now())

  audit         ArtistAudit   @relation(fields: [auditId], references: [id])
  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id])

  @@index([artistProfileId])
  @@map("decision_results")
}

// ── ARTICLE JUNCTION MODELS ───────────────────────────

model ArticleCapability {
  articleId    String
  capabilityId String
  isPrimary    Boolean @default(false)

  article    Article    @relation(fields: [articleId], references: [id])
  capability Capability @relation(fields: [capabilityId], references: [id])

  @@id([articleId, capabilityId])
  @@map("article_capabilities")
}

model ArticleRevenueStream {
  articleId       String
  revenueStreamId String
  isPrimary       Boolean @default(false)

  article       Article       @relation(fields: [articleId], references: [id])
  revenueStream RevenueStream @relation(fields: [revenueStreamId], references: [id])

  @@id([articleId, revenueStreamId])
  @@map("article_revenue_streams")
}
```

---

## 13. Updated Audit Flow

```
1. TRIGGER
   User types "audit my career" OR clicks "Run Audit" in dashboard

2. ARTIST TYPE CHECK
   Does ArtistProfile have artistType + revenueModel + growthEngine set?
   → No: return ArtistTypeQuestionnaireResponse (6 questions)
   → Yes: continue

3. FETCH RULE SETS
   Load AuditRuleSet[] filtered by artistType
   Load AuditCheckCapability[] (gap → capability map)
   Load RevenueStreamCapability[] (capability → revenue map)

4. RUN SUB-AGENTS (parallel)
   ProfileAuditAgent   → { score, checks[], gaps[] }
   PlatformAuditAgent  → { score, checks[], gaps[] }
   ReleasePlanningAgent → { score, checks[], gaps[] }
   BusinessReadinessAgent → { score, checks[], gaps[] }

5. SCORE AGGREGATION
   ScoreAggregator.compute(dimensions, artistType) → { overall, tier, dimensions }

6. PERSIST AUDIT
   prisma.artistAudit.create(...)
   prisma.artistCapability.upsertMany(...)  ← save assessed capability levels

7. DECISION ENGINE
   DecisionEngine.compute(audit, profile)
   → topGaps → missingCapabilities → blockedRevenue → rankedActions
   → ONE LLM call for reasoning narrative
   → persist DecisionResult

8. ARTICLE ENRICHMENT
   For each of top 5 actions → fetch linked tactical article
   For each missing capability → fetch linked educational article
   (via searchArticlesTool, filtered by capabilityId + artistType)

9. RETURN ArtistAuditResponse
   {
     score + tier,
     dimension scores,
     topGaps (with capabilityIds),
     missingCapabilities,
     blockedRevenue (with % complete),
     prioritizedActions (ranked),
     revenueUnlockPath,
     reasoning,
     articleLinks (per action + capability)
   }

10. PERSIST + NOTIFY
    Save to ArtistAudit
    Emit SSE: audit_complete
    (Optional) Send email summary via Resend
```

---

## 14. Example Execution (End-to-End)

### Artist: Independent amapiano producer, no social media, 3 tracks on Flemoji

**Profile:**

```
artistType:   SESSION_PRODUCER
revenueModel: PRODUCER
growthEngine: COLLABORATION_DRIVEN
careerStage:  EMERGING
```

**Audit runs. Gaps found:**

```
profile_bio          → no bio                 impact: 10
profile_social_links → no social links        impact: 8
platform_tiktok      → not connected          impact: 15  ← SESSION_PRODUCER: required=false
platform_spotify     → not connected          impact: 12
release_smart_link   → no smart link          impact: 20
release_cadence      → 90+ days since release impact: 25
business_split_sheet → no split sheet         impact: 18
business_distribution→ no distro link         impact: 15
```

**Step 5 — Score:**

```
Profile score:  62  (bio missing, image present, no social — lower weight for SESSION_PRODUCER)
Platform score: 55  (TikTok NOT required for this type, Spotify is)
Release score:  45  (no smart link + release cadence)
Business score: 40  (split sheet critical for producers)

Overall: 51  → Tier: NEEDS_WORK 🟠
```

**Step 7 — Decision Engine:**

_Gap → Capability mapping:_

```
release_cadence      → CONSISTENT_RELEASE (highest impact)
business_split_sheet → BUSINESS_ADMIN (critical for producer income)
release_smart_link   → DIGITAL_DISTRIBUTION
platform_spotify     → DIGITAL_DISTRIBUTION
profile_bio          → PRESS_MEDIA
```

_Missing capabilities (ranked by frequency):_

```
1. DIGITAL_DISTRIBUTION  (3 gaps point here)
2. BUSINESS_ADMIN        (2 gaps)
3. CONSISTENT_RELEASE    (1 gap, highest impact)
4. PRESS_MEDIA           (1 gap)
```

_Blocked revenue streams:_

```
STREAMING         → blocked by: DIGITAL_DISTRIBUTION, CONSISTENT_RELEASE    → 30% complete
PRODUCTION_SERVICES → blocked by: BUSINESS_ADMIN, DIGITAL_DISTRIBUTION      → 35% complete
SYNC_LICENSING    → blocked by: BUSINESS_ADMIN, DIGITAL_DISTRIBUTION, SYNC_LICENSING → 15% complete
```

_Ranked actions (after scoring impact × effort × revenue unlock):_

```
#1 Create a split sheet in Flemoji
   → Capability: BUSINESS_ADMIN | Effort: LOW | Impact: +18
   → Unlocks: PRODUCTION_SERVICES (only 1 cap away from unlocking)
   → Rank score: 0.87

#2 Add a smart link to your latest track
   → Capability: DIGITAL_DISTRIBUTION | Effort: LOW | Impact: +20
   → Unlocks: STREAMING, PRODUCTION_SERVICES
   → Rank score: 0.84

#3 Complete your Spotify for Artists profile
   → Capability: DIGITAL_DISTRIBUTION | Effort: LOW | Impact: +12
   → Unlocks: STREAMING
   → Rank score: 0.72

#4 Release a new track (it's been 90+ days)
   → Capability: CONSISTENT_RELEASE | Effort: HIGH | Impact: +25
   → Unlocks: STREAMING
   → Rank score: 0.68  (high impact but HIGH effort reduces rank)

#5 Register with SAMRO (SA performing rights org)
   → Capability: BUSINESS_ADMIN | Effort: MEDIUM | Impact: +22
   → Unlocks: SYNC_LICENSING, STREAMING royalties
   → Rank score: 0.65
```

_Revenue unlock path:_

```
Complete actions #1 + #2 → PRODUCTION_SERVICES unlocks  (earn from beats/features)
Complete actions #1 + #2 + #3 → STREAMING partially unlocks
Complete all 5 → estimated score improvement: 51 → 74 (DEVELOPING tier)
```

_LLM narrative (one call):_

> "You're an emerging amapiano producer with strong creative output but a gap in business infrastructure that's blocking your income potential. Your most immediate revenue opportunity is **production services** — earning from beats, features, and session work — and you're just two quick actions away from unlocking it: a split sheet and a smart link. Focus there first before worrying about social media, which matters less for your path than it does for independent artists."

---

## 15. New Files to Create

```
src/lib/services/decision-engine.ts              ← DecisionEngine class
src/lib/services/partial-reaudit-service.ts      ← Partial re-audit on action complete
src/lib/services/capability-service.ts           ← Capability + revenue graph lookups
src/lib/services/action-service.ts               ← Action CRUD + ranking helpers
src/lib/ai/agents/audit/score-aggregator.ts      ← Add revenueModel weight overrides
src/app/api/ai/artist-audit/action-complete/route.ts  ← Mark action complete + trigger re-audit
docs/artist-career-intelligence-engine.md        ← This document
```

## 16. Modified Files

```
prisma/schema.prisma                             ← All new models + enum additions
src/lib/ai/agents/audit-orchestrator-agent.ts    ← Wire DecisionEngine after audit
src/lib/ai/agents/audit/score-aggregator.ts      ← Add revenueModel + growthEngine weight overrides
src/types/ai-responses.ts                        ← Extend ArtistAuditResponse with decision fields
src/components/ai/response-renderers/artist-audit-renderer.tsx  ← Show revenue path + ranked actions
src/components/dashboard/artist/AuditSection.tsx  ← Add action queue + capability map
src/app/dashboard/DashboardContent.tsx           ← No change needed
```

---

## 17. Implementation Order

| Step | Task                                                              | Priority |
| ---- | ----------------------------------------------------------------- | -------- |
| 1    | Schema migration (all new models + enum additions)                | Critical |
| 2    | Seed Capability registry (12 capabilities)                        | Critical |
| 3    | Seed RevenueStream registry (6 streams)                           | Critical |
| 4    | Seed AuditCheckCapability map (23 check→capability rows)          | Critical |
| 5    | Seed RevenueStreamCapability map                                  | Critical |
| 6    | Seed Action registry (~20 initial actions)                        | Critical |
| 7    | `capability-service.ts` — graph lookups                           | High     |
| 8    | `decision-engine.ts` — core ranking logic                         | High     |
| 9    | Extend `AuditOrchestratorAgent` to call DecisionEngine            | High     |
| 10   | Extend `ArtistAuditResponse` type                                 | High     |
| 11   | Extend `ArtistAuditRenderer` — show revenue path + ranked actions | High     |
| 12   | `partial-reaudit-service.ts`                                      | Medium   |
| 13   | `action-complete` API route                                       | Medium   |
| 14   | Update `AuditSection` dashboard — action queue                    | Medium   |
| 15   | Article model migration (add capability + intent fields)          | Medium   |
| 16   | Update onboarding questionnaire (6 questions)                     | Low      |
| 17   | Tests for DecisionEngine ranking logic                            | Low      |

---

## 18. Design Constraints (Non-Negotiable)

- `AuditRuleSet` is NOT replaced — it still drives check weights
- All sub-agents are NOT replaced — their outputs are extended
- `ScoreAggregator` logic is NOT changed — only weight profiles added
- **LLM is called exactly once** — only for the narrative explanation in `DecisionEngine`. All logic (gap mapping, capability resolution, revenue path, action ranking) is deterministic
- Dashboard compatibility maintained — `ArtistAudit` model structure unchanged, `decisionResultId` is additive

---

## 19. Open Questions

- [ ] Should artists be able to manually mark capabilities as "acquired" (e.g. "I have a manager") even without audit evidence?
- [ ] Should the revenue unlock path be visible on the public artist profile as a trust signal?
- [ ] Should `PRODUCTION_SERVICES` revenue stream be included for all artist types or only `SESSION_PRODUCER` / `HYBRID`?
- [ ] Who seeds and maintains the Action registry — admin UI, migration file, or both?
- [ ] Should `ActionOutcome.selfReported` actions be verified by checking Flemoji data (e.g. if action is "upload a track", verify a new track exists)?
- [ ] Rate-limit on full re-audits to prevent spam? (Suggested: 1 per 24h, partial re-audits unlimited)
