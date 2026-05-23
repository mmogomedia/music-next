# Artist Career Readiness Audit — Agentic System Plan

> **Status:** Design phase — not yet implemented
> **Branch target:** `feat/artist-readiness-audit`
> **Author:** Tatenda + Claude
> **Date:** 2026-03-25

---

## 1. Problem Statement

Artists on Flemoji have data scattered across Flemoji itself, TikTok, Spotify, YouTube, and SoundCloud — but no single place that tells them _where the gaps are_ and _what to do next_. Crucially, artists are not all the same — a prolific social media poster has different readiness needs than a seasoned live performer with management. The audit must be **type-aware**.

The system consolidates everything into one **Career Readiness Score (0–100)** with prioritised, contextual action items tailored to who the artist actually is.

This system must:

- Plug into the existing RouterAgent pipeline
- Reuse PULSE³ platform connections (no extra login friction)
- Surface results in both AI chat and a persistent dashboard section
- Adapt recommendations based on **artist type** (independent, managed, live performer, etc.)
- Ground its judgements in a **curated industry knowledge base** built on the existing Articles/Learn system
- Be **extensible** — Flemoji will add release scheduling, pre-save campaigns, and press kit features in future

---

## 2. Artist Type System

This is the foundation everything else adapts to. An artist who doesn't post on social media is not broken — they may need management, not a TikTok strategy.

### Artist Types

| Type               | Description                               | Social expectation                 | Priority focus                                        |
| ------------------ | ----------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `independent`      | DIY artist, self-manages everything       | High — must post own content       | Social consistency, release planning, business setup  |
| `managed`          | Has a manager or team                     | Medium — team handles some content | Profile quality, team structure, distribution         |
| `label_signed`     | Signed to a label                         | Low — label handles marketing      | Profile completeness, split sheets, platform presence |
| `live_performer`   | Gigs are primary revenue/discovery        | Low online, high live              | Booking links, press kit, live promotion              |
| `session_producer` | Studio artist, credited on others' tracks | Very low                           | Split sheets, credits, licensing, Flemoji profile     |
| `social_first`     | Social media is primary discovery engine  | Very high                          | Posting cadence, engagement, platform diversity       |

### How Artist Type is Established

**Onboarding questionnaire** — shown on first audit run (or during artist profile setup). 4 questions max:

1. "How would you describe your artist journey?" → Independent / Working with a team / Label signed
2. "Where do fans discover you most?" → Social media / Live shows / Streaming platforms / Word of mouth
3. "Do you manage your own social media?" → Yes, myself / I have help / I don't use social media
4. "What's your primary goal right now?" → More streams / More gigs / Getting signed / Building a team

Answers map to an `artistType` enum stored on `ArtistProfile`. The audit runs **after** the questionnaire.

For artists who skip the questionnaire → default to `independent` (most common, safest assumption, can be changed).

### Schema addition

```prisma
// Add to ArtistProfile model
artistType    ArtistType  @default(INDEPENDENT)
careerStage   CareerStage @default(EMERGING)

enum ArtistType {
  INDEPENDENT
  MANAGED
  LABEL_SIGNED
  LIVE_PERFORMER
  SESSION_PRODUCER
  SOCIAL_FIRST
}

enum CareerStage {
  EMERGING    // < 1k followers, < 10 tracks
  DEVELOPING  // 1k-10k followers, 10+ tracks
  ESTABLISHED // 10k+ followers, consistent releases
}
```

---

## 3. Knowledge Base (Two-Layer System)

The audit agent needs curated, updatable industry knowledge — not hardcoded strings in code. Two complementary layers:

### Layer 1 — Articles System (long-form guidance)

The existing `Article` model (with pgvector embeddings and `searchArticlesTool`) becomes the **industry knowledge library**.

- Admin creates articles tagged with the category `audit-knowledge`
- Examples: "What every independent artist needs before releasing music", "How to prepare for management as a South African artist", "Why split sheets matter before your first 1000 streams"
- The audit agent calls `searchArticlesTool` per dimension, retrieving the most relevant articles
- Surfaced articles are shown in the audit report as **"Learn more"** links

**No new infrastructure needed** — this is already built.

**Seed articles to create** (admin task, not code):

| Article title                                               | Dimension        | Artist types              |
| ----------------------------------------------------------- | ---------------- | ------------------------- |
| The Independent Artist Pre-Release Checklist                | Release Planning | independent, social_first |
| Why You Need a Manager (And When)                           | Business         | independent               |
| Social Media Isn't For Everyone — Here's What To Do Instead | Platform         | managed, live_performer   |
| How to Complete Your Streaming Profiles                     | Profile          | all                       |
| Split Sheets: The Contract That Saves Friendships           | Business         | all                       |
| Getting Booked: What Venues Look For Online                 | Profile          | live_performer            |
| Building a Press Kit From Scratch                           | Release Planning | managed, label_signed     |
| Producer Credits & Licensing: The Basics                    | Business         | session_producer          |

### Layer 2 — AuditRuleSet (structured benchmarks per type)

A new Prisma model that stores **machine-readable rules** — thresholds, minimum values, and recommendations — per `artistType` and `dimension`.

```prisma
model AuditRuleSet {
  id          String     @id @default(cuid())
  artistType  ArtistType
  dimension   String     // 'profile' | 'platform' | 'release' | 'business'
  checkId     String     // matches AuditCheck.id in the agent
  required    Boolean    @default(true)
  weight      Float      // contribution to dimension score
  threshold   Json?      // e.g. { "min": 500, "unit": "followers" }
  guidance    String     // shown to artist if check fails
  actionLabel String     // e.g. "Upload a profile photo"
  actionUrl   String?    // optional deep link within Flemoji

  @@unique([artistType, dimension, checkId])
  @@index([artistType])
  @@map("audit_rule_sets")
}
```

This means:

- A `managed` artist failing the "TikTok posting cadence" check gets guidance: _"Work with your social media manager to establish a consistent posting schedule"_ — not _"Post more on TikTok yourself"_
- A `live_performer` gets: _"Add a booking link or contact email to your profile"_ for a social gap — not _"Create a TikTok account"_
- A `session_producer` has social checks marked `required: false`, so they don't tank the score

**Rule sets are seeded via migration or admin UI** — not hardcoded in agent logic. This makes the knowledge base updatable without deploys.

### How the Two Layers Work Together

```
AuditOrchestratorAgent runs
    │
    ├── Fetches AuditRuleSet records for this artistType (Layer 2)
    │   → determines which checks to run and their weights
    │
    ├── Runs sub-agents with the adapted rule sets
    │   → each check passes/fails with impact score
    │
    ├── For each top gap → calls searchArticlesTool (Layer 1)
    │   → retrieves 1-2 relevant articles per gap
    │
    └── Assembles report: score + gaps + article links + contextual guidance
```

---

## 4. High-Level Architecture

```
User input (chat or dashboard button)
          │
          ▼
   RouterAgent (new 'audit' intent)
          │
          ├─ [first time?] → ArtistTypeQuestionnaire
          │                  → store artistType on ArtistProfile
          │
          ▼
 AuditOrchestratorAgent
  │
  ├── Fetch AuditRuleSet[] for artistType (Layer 2)
  │
  ├── Run sub-agents in parallel (with adapted rules)
  │   ├── ProfileAuditAgent       ← Flemoji DB
  │   ├── PlatformAuditAgent      ← PULSE³ PulsePlatformData
  │   ├── ReleasePlanningAgent    ← Tracks, smart/quick links
  │   └── BusinessReadinessAgent  ← Split sheets, distribution
  │
  ├── ScoreAggregator → weighted 0–100
  │
  ├── searchArticlesTool per top gap (Layer 1)
  │
  └── Persist ArtistAudit + return ArtistAuditResponse
          │
     ┌────┴────┐
     ▼         ▼
AI Chat      Dashboard AuditSection
Renderer     (persistent, with history)
```

---

## 5. Intent Routing

### File: `src/lib/ai/agents/router-intent-detector.ts`

```typescript
function isAuditIntent(message: string): boolean {
  const patterns = [
    /audit/i,
    /career research/i,
    /readiness/i,
    /how ready am i/i,
    /check my profile/i,
    /research my (career|profile|platforms)/i,
    /what am i missing/i,
    /gaps in my (profile|career|marketing)/i,
    /do i need (a manager|management|a team)/i,
    /career check/i,
    /artist audit/i,
  ];
  return patterns.some(p => p.test(message));
}
```

Add to `analyzeIntent()` after `isHelpIntent` check:

```typescript
if (isAuditIntent(lowerMessage)) {
  return { intent: 'audit', confidence: 0.9, method: 'keyword' };
}
```

Add `'audit'` to `AgentIntent` union and map in `getAgentForIntent()`.

---

## 6. Agent Files

### 6.1 `src/lib/ai/agents/audit-orchestrator-agent.ts`

- Checks if artist has `artistType` set → if not, returns questionnaire response first
- Fetches `AuditRuleSet[]` for the artist's type
- Runs 4 sub-agents via `Promise.all` with adapted rules
- Calls `searchArticlesTool` for top 3 gaps
- Computes score via `ScoreAggregator`
- Persists to `ArtistAudit`
- Returns `ArtistAuditResponse`

### 6.2 `src/lib/ai/agents/audit/profile-audit-agent.ts`

Checks Flemoji profile completeness. Checks adapt by artist type:

| Check             | All types     | managed/label only | live_performer only  |
| ----------------- | ------------- | ------------------ | -------------------- |
| Artist name       | ✅            |                    |                      |
| Bio ≥ 50 chars    | ✅            |                    |                      |
| Profile image     | ✅            |                    |                      |
| Cover image       | ✅            |                    |                      |
| Genre tags        | ✅            |                    |                      |
| Social links      | weight varies | lower weight       | booking link instead |
| ≥1 track uploaded | ✅            |                    |                      |
| Press kit link    |               | ✅ required        | ✅ required          |

### 6.3 `src/lib/ai/agents/audit/platform-audit-agent.ts`

Reads `PulsePlatformData` (no new API calls if data < 7 days old).

- **`independent` / `social_first`**: all platforms required, cadence checked
- **`managed`**: platforms checked but cadence is advisory only ("your team should be posting")
- **`live_performer`**: YouTube presence matters (live videos), TikTok advisory
- **`session_producer`**: SoundCloud (beats), Spotify (credits) — TikTok/Instagram not required
- If platform not connected → `status: 'unverified'`, weight halved (not zeroed)

### 6.4 `src/lib/ai/agents/audit/release-planning-agent.ts`

Checks release infrastructure using Flemoji data.

Checks: smart links, quick links, cover art, track metadata, release cadence.

**Extensibility hooks** (activate when Flemoji feature ships, no code change needed):

- `releaseScheduled` — release calendar
- `preSaveCampaign` — pre-save link
- `pressKitComplete` — press kit builder
- `distributionStatus` — multi-platform distribution tracker

### 6.5 `src/lib/ai/agents/audit/business-readiness-agent.ts`

Checks business infrastructure.

Checks: split sheets, splits sum to 100%, email verified, distribution platform linked, no pending split invites.

For `label_signed`: split sheet is label's responsibility — check is `required: false`, replaced with "Confirm your label agreement covers all tracks".

### 6.6 `src/lib/ai/agents/audit/score-aggregator.ts`

```typescript
export const BASE_WEIGHTS = {
  profile: 0.25,
  platform: 0.25,
  release: 0.3,
  business: 0.2,
};

// Weights shift by artist type
export const TYPE_WEIGHT_OVERRIDES: Record<
  ArtistType,
  Partial<typeof BASE_WEIGHTS>
> = {
  SOCIAL_FIRST: {
    platform: 0.35,
    release: 0.25,
    business: 0.15,
    profile: 0.25,
  },
  LIVE_PERFORMER: {
    platform: 0.15,
    release: 0.2,
    business: 0.25,
    profile: 0.4,
  },
  SESSION_PRODUCER: {
    platform: 0.1,
    release: 0.25,
    business: 0.4,
    profile: 0.25,
  },
  MANAGED: { platform: 0.2, release: 0.3, business: 0.25, profile: 0.25 },
  LABEL_SIGNED: { platform: 0.2, release: 0.2, business: 0.3, profile: 0.3 },
  INDEPENDENT: BASE_WEIGHTS,
};
```

### Career Readiness Tiers

| Score  | Tier            | Label            |
| ------ | --------------- | ---------------- |
| 80–100 | `tour_ready`    | 🟢 Release Ready |
| 60–79  | `developing`    | 🟡 Developing    |
| 40–59  | `needs_work`    | 🟠 Needs Work    |
| 0–39   | `just_starting` | 🔴 Just Starting |

---

## 7. Database Schema

### `ArtistAudit` model

```prisma
model ArtistAudit {
  id              String        @id @default(cuid())
  artistProfileId String
  artistProfile   ArtistProfile @relation("ArtistAudits", fields: [artistProfileId], references: [id])

  artistType      ArtistType
  overallScore    Float
  profileScore    Float
  platformScore   Float
  releaseScore    Float
  businessScore   Float
  tier            String        // 'release_ready' | 'developing' | 'needs_work' | 'just_starting'

  report          Json          // Full AuditScore object
  gaps            Json          // AuditGap[] (top 5)
  articleLinks    Json          // Article[] retrieved for each gap

  createdAt       DateTime      @default(now())

  @@index([artistProfileId])
  @@index([createdAt])
  @@map("artist_audits")
}
```

### `AuditRuleSet` model (see Section 3 above)

### `ArtistProfile` additions

```prisma
artistType    ArtistType  @default(INDEPENDENT)
careerStage   CareerStage @default(EMERGING)
```

### Enums

```prisma
enum ArtistType {
  INDEPENDENT
  MANAGED
  LABEL_SIGNED
  LIVE_PERFORMER
  SESSION_PRODUCER
  SOCIAL_FIRST
}

enum CareerStage {
  EMERGING
  DEVELOPING
  ESTABLISHED
}
```

Migration: `yarn db:migrate --name add_artist_audit_and_type_system`

---

## 8. Response Types

### New types in `src/types/ai-responses.ts`

```typescript
export interface AuditCheck {
  id: string;
  label: string;
  passed: boolean;
  impact: number;
  status: 'pass' | 'fail' | 'unverified' | 'not_applicable';
  guidance?: string; // type-contextual message if failed
  actionLabel?: string;
  actionUrl?: string; // deep link in Flemoji if available
}

export interface AuditGap {
  dimension: 'profile' | 'platform' | 'release' | 'business';
  checkId: string;
  label: string;
  impact: number;
  priority: 'high' | 'medium' | 'low';
  guidance: string; // contextual to artistType
  articleLinks: { title: string; slug: string }[]; // from Articles system
}

export interface AuditDimensionResult {
  score: number;
  checks: AuditCheck[];
  gaps: AuditGap[];
}

export interface ArtistAuditResponse extends BaseAIResponse {
  type: 'artist_audit';
  data: {
    reportId: string;
    artistType: string;
    overallScore: number;
    tier: 'release_ready' | 'developing' | 'needs_work' | 'just_starting';
    dimensions: {
      profile: AuditDimensionResult;
      platform: AuditDimensionResult;
      release: AuditDimensionResult;
      business: AuditDimensionResult;
    };
    topGaps: AuditGap[];
    actions: SuggestedAction[];
  };
}
```

Also add a **questionnaire response type** for artists who haven't set their type yet:

```typescript
export interface ArtistTypeQuestionnaireResponse extends BaseAIResponse {
  type: 'artist_type_questionnaire';
  data: {
    questions: { id: string; label: string; options: string[] }[];
  };
}
```

---

## 9. Renderer

### `src/components/ai/response-renderers/artist-audit-renderer.tsx`

```
┌─────────────────────────────────────────────────────┐
│  🎵 Career Readiness Audit · Independent Artist     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│   [ 72 ]   Developing  🟡                          │
│   Career Readiness Score                            │
│                                                     │
│  Profile  Platform  Release  Business               │
│    88        65       60       70                   │
│  ▓▓▓▓▓▓▓  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓                │
│                                                     │
│  Fix these first:                                   │
│  ① Add smart link for latest release      +20 pts  │
│    → "Independent Artist Pre-Release..."  [Learn]   │
│  ② Increase TikTok posting cadence        +15 pts  │
│    → "Social Consistency Guide"           [Learn]   │
│  ③ Complete split sheet for latest track  +12 pts  │
│    → "Split Sheets: The Basics"           [Learn]   │
│                                                     │
│  [View full report]  [What should I focus on?]      │
└─────────────────────────────────────────────────────┘
```

Key elements:

- Artist type label in subtitle ("Independent Artist")
- Big score + tier chip
- 4 dimension pills with mini progress bars
- Top 3 gaps with impact points and linked article titles
- `<SuggestedActions>` chips at the bottom

---

## 10. Dashboard Integration

### New tab in `src/app/dashboard/DashboardContent.tsx`

- "Audit" tab, only visible to artists (`hasArtistProfile === true`)
- Renders `<AuditSection />`

### `src/components/dashboard/artist/AuditSection.tsx`

- If no audit exists → empty state with "Run your first audit" CTA
- If audit exists → full breakdown (all checks per dimension, expandable)
- Shows audit history (score over time, simple trend)
- "Re-run Audit" button → POST `/api/ai/artist-audit`
- Links to relevant articles from the Learn section

### `src/app/api/ai/artist-audit/route.ts`

- `GET` — returns latest audit for the authenticated artist
- `POST` — triggers new audit (calls `AuditOrchestratorAgent.process()` server-side, streams or returns JSON)

---

## 11. Knowledge Base Admin Workflow

The **Articles admin** is already built. To power the audit knowledge base:

1. Admin creates articles in the Articles section tagged with relevant `cluster` (create an "Audit Knowledge" cluster)
2. Each article covers a specific gap or artist type scenario
3. The audit agent calls `searchArticlesTool` with a query like `"independent artist TikTok consistency"` and retrieves the most semantically relevant article(s)
4. Article links surface in the audit report — both in chat and dashboard

This means **the knowledge base improves without code changes** — just new articles.

**Suggested first articles to seed** (admin task):

- "The Independent Artist Pre-Release Checklist"
- "When You Need a Manager (And What to Look For)"
- "Social Media Isn't For Everyone — Here's What To Do Instead"
- "How to Complete Your Streaming Profiles"
- "Split Sheets: The Contract That Saves Friendships"
- "Getting Booked: What Venues Look For Online"
- "Producer Credits & Licensing: The Basics"
- "Building a Press Kit From Scratch"

---

## 12. Implementation Steps

> Ordered for safe, testable delivery. Each step independently committable.

| Step | Task                                                                                  | Files                                                                         |
| ---- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Schema + migration (ArtistAudit, AuditRuleSet, ArtistType enum, ArtistProfile fields) | `prisma/schema.prisma`                                                        |
| 2    | Seed AuditRuleSet records for each artist type                                        | migration seed / admin script                                                 |
| 3    | Add response types (ArtistAuditResponse, ArtistTypeQuestionnaireResponse)             | `src/types/ai-responses.ts`                                                   |
| 4    | Audit service layer (batch data fetching, no N+1 queries)                             | `src/lib/services/audit-service.ts`                                           |
| 5    | Score aggregator + type-weight overrides                                              | `src/lib/ai/agents/audit/score-aggregator.ts`                                 |
| 6    | Sub-agents (profile, platform, release, business)                                     | `src/lib/ai/agents/audit/*.ts`                                                |
| 7    | Orchestrator agent (parallel run + article lookup + persist)                          | `src/lib/ai/agents/audit-orchestrator-agent.ts`                               |
| 8    | Intent routing (keyword + agent mapping)                                              | `router-intent-detector.ts`, `router-agent.ts`                                |
| 9    | Questionnaire renderer                                                                | `src/components/ai/response-renderers/artist-type-questionnaire-renderer.tsx` |
| 10   | Audit renderer                                                                        | `src/components/ai/response-renderers/artist-audit-renderer.tsx`              |
| 11   | Register both renderers                                                               | `src/components/ai/response-renderers/index.tsx`                              |
| 12   | API route (GET + POST)                                                                | `src/app/api/ai/artist-audit/route.ts`                                        |
| 13   | Dashboard AuditSection component                                                      | `src/components/dashboard/artist/AuditSection.tsx`                            |
| 14   | Dashboard audit page + tab                                                            | `src/app/dashboard/audit/page.tsx`, `DashboardContent.tsx`                    |
| 15   | Seed knowledge base articles                                                          | Admin UI (not code)                                                           |
| 16   | Tests                                                                                 | `__tests__/` co-located                                                       |

---

## 13. Files to Create / Modify

### New files

```
src/lib/ai/agents/audit-orchestrator-agent.ts
src/lib/ai/agents/audit/profile-audit-agent.ts
src/lib/ai/agents/audit/platform-audit-agent.ts
src/lib/ai/agents/audit/release-planning-agent.ts
src/lib/ai/agents/audit/business-readiness-agent.ts
src/lib/ai/agents/audit/score-aggregator.ts
src/lib/services/audit-service.ts
src/components/ai/response-renderers/artist-audit-renderer.tsx
src/components/ai/response-renderers/artist-type-questionnaire-renderer.tsx
src/components/dashboard/artist/AuditSection.tsx
src/app/api/ai/artist-audit/route.ts
src/app/dashboard/audit/page.tsx
docs/artist-readiness-audit.md    ← public-facing system docs
```

### Modified files

```
prisma/schema.prisma                              ← ArtistAudit, AuditRuleSet, enums, ArtistProfile fields
src/lib/ai/agents/router-intent-detector.ts       ← isAuditIntent()
src/lib/ai/agents/router-agent.ts                 ← intent union + agent mapping
src/types/ai-responses.ts                         ← new types + union
src/components/ai/response-renderers/index.tsx    ← register renderers
src/app/dashboard/DashboardContent.tsx            ← Audit tab
```

---

## 14. Current Agent System — Quality Assessment

> An audit of the existing 13 agents was run against 10 good-practice criteria. Summary below. Audit agents should be built to address these gaps.

### Overall score: **8.2 / 10** — Production-grade with hardening needed

| Agent                | Score  | Key gap                                                                       |
| -------------------- | ------ | ----------------------------------------------------------------------------- |
| RouterIntentDetector | 9/10   | Regex not cached; `extractDiscoveryMetadata` too long                         |
| RouterAgent          | 8.5/10 | 10 agent instances held in memory; duplicate regex patterns                   |
| PreferencesAgent     | 8.5/10 | Hardcoded limits (12 genres, 6 moods); no pagination                          |
| TimelineAgent        | 8.5/10 | 150-line system prompt embedded in code, not in agent-prompts.ts              |
| BaseAgent            | 9/10   | `formatContext()` under-utilised                                              |
| DiscoveryAgent       | 8/10   | Tool errors not retried; genre extraction duplicates RouterIntentDetector     |
| ClarificationAgent   | 8/10   | Hardcoded genre list; missing `await` on `buildGenreQuestion()`               |
| HelpAgent            | 7.5/10 | Brittle `isKnowledgeQuery` regex (singular/plural mismatch)                   |
| RecommendationAgent  | 7/10   | **No deterministic fast path — always calls LLM even when preferences exist** |
| IndustryInfoAgent    | 7/10   | Placeholder only; logs but doesn't redirect                                   |

### Top 5 systemic issues to fix (prioritised)

1. **Add fast path to RecommendationAgent** — if `context.preferences` has genres, call `getTrendingInGenres` directly. Saves 30–40% latency on personalized queries.
2. **Timeout all LLM calls** — `IntentClassifierAgent` and `ClarificationAgent` have no timeout; can hang indefinitely. Add 10s max.
3. **Consolidate duplicate regex patterns** — `isMetaQuestion()` appears in both `RouterAgent` and `FallbackAgent`. Centralise in `RouterIntentDetector`.
4. **Move embedded prompts** — `TimelineAgent` has its system prompt in the agent file. All prompts belong in `agent-prompts.ts`.
5. **Add retry logic for tool failures** — one retry with 500ms backoff before surfacing an error to the user.

### Design principles for NEW audit agents (build these right from the start)

The audit agents should model best practices the existing system is still evolving towards:

| Principle              | How audit agents implement it                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Single responsibility  | Each sub-agent audits exactly ONE dimension                                                   |
| Deterministic first    | Sub-agents call service layer directly — no LLM for data gathering                            |
| LLM only for narrative | One LLM call at the orchestrator level generates the gap descriptions; no per-agent LLM calls |
| Typed contracts        | All inputs/outputs use Zod-validated types                                                    |
| Timeout protected      | All DB queries and PULSE³ data reads have a 5s timeout                                        |
| Graceful degradation   | Missing platform data → `status: 'unverified'`, score degrades proportionally                 |
| Composable             | Sub-agents can be run independently (useful for partial re-audits)                            |
| Observable             | Orchestrator emits SSE events: `audit_started`, `dimension_complete`, `audit_done`            |
| Config-driven          | Check weights and thresholds live in `AuditRuleSet` DB records — no magic numbers in code     |

---

## 15. Artist Type → Smart Suggestions

This is the core value-add that separates the audit from a generic checklist.

The `artistType` field on `ArtistProfile` doesn't just change what's _checked_ — it changes what's _suggested_. Every `AuditGap` carries a `guidance` string that is resolved from the `AuditRuleSet` record for that artist's type. This means:

| Gap                 | `independent` suggestion                                   | `managed` suggestion                                           | `live_performer` suggestion                                         |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| No TikTok presence  | "Create a TikTok account and post 3x/week"                 | "Brief your social media manager on a consistent content plan" | "Consider hiring a content creator to manage your digital presence" |
| No split sheet      | "Create a split sheet in Flemoji before your next release" | "Confirm your manager has filed splits with your distributor"  | "Your booking agent should have this — ask them"                    |
| Low release cadence | "Aim to release a single every 6–8 weeks"                  | "Work with your manager to build a release calendar"           | "Even a live recording upload keeps your profile active"            |
| No smart link       | "Create a smart link for every release — takes 2 minutes"  | "Your manager should be setting this up pre-release"           | "Add your tour/merch links here too"                                |

The `AuditRuleSet` table stores these guidance strings. Admins can update them without code changes. The knowledge base articles (Layer 1) provide deeper reading for each gap.

### Artist type also drives the SuggestedActions chips

After the audit, the `<SuggestedActions>` chips are tailored:

- `independent` → "How do I get more streams?", "Show me release planning tips", "What's a split sheet?"
- `managed` → "What should my manager be doing?", "How do I grow my team?", "When should I sign to a label?"
- `live_performer` → "How do I get more gigs?", "What should my press kit include?", "How do venues find artists?"
- `session_producer` → "How do I get production credits?", "What's the standard beat licensing fee?", "How do I get featured on tracks?"

---

## 16. Open Questions (resolve before build)

- [ ] Should the artist type questionnaire be part of the existing artist profile onboarding flow (profile setup page) or only triggered at first audit?
- [ ] Rate-limit on Re-run Audit? (e.g. once per 24h to avoid PULSE³ API hammering)
- [ ] Should the audit report be emailable via Resend as a PDF summary?
- [ ] Should artists be able to update their `artistType` themselves in settings, or is it set once?
- [ ] Should the audit be visible to admins to help identify artists who need support?
- [ ] What is the `AuditRuleSet` seed data source — hardcoded migration values, or an admin UI to manage rules?

---

## 17. Future Extensions (post-MVP)

- **Automated re-audit trigger** — when an artist uploads a new track or connects a new platform, run a partial re-audit on the affected dimensions only
- **Team audit** — if `artistType = MANAGED`, audit includes "has manager's email on file", "manager has admin access to Flemoji profile"
- **Peer comparison** — anonymised "artists at your stage average X on platform readiness" benchmarks
- **AI coaching mode** — after the audit, artist can chat directly with an AuditCoachAgent that walks them through fixing each gap step by step
- **Release readiness gate** — before submitting a track, prompt artist to run a release readiness sub-audit first
