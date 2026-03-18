# AI Memory System — Complete Reference

> Covers architecture, setup, every configuration value with full rationale, all public APIs,
> the data-flow for each route, adapter contracts, porting to a new project, and every known
> gotcha that can cause silent failures or runtime errors.

---

## Table of Contents

1. [Why Memory Exists](#1-why-memory-exists)
2. [The Five Types of Memory](#2-the-five-types-of-memory)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Setup — Flemoji (existing project)](#5-setup--flemoji-existing-project)
6. [Setup — New Project (porting)](#6-setup--new-project-porting)
7. [Configuration Reference](#7-configuration-reference)
8. [Adapter Interfaces](#8-adapter-interfaces)
9. [Core Classes — Public API](#9-core-classes--public-api)
10. [Presets](#10-presets)
11. [Bootstrap](#11-bootstrap)
12. [Data Flow — Per Request](#12-data-flow--per-request)
13. [Scoring and Decay Algorithms](#13-scoring-and-decay-algorithms)
14. [Importance Scoring Algorithm](#14-importance-scoring-algorithm)
15. [Preference Extraction Algorithms](#15-preference-extraction-algorithms)
16. [Token Budget Management](#16-token-budget-management)
17. [Gotchas and Known Failure Modes](#17-gotchas-and-known-failure-modes)
18. [Verification Queries](#18-verification-queries)
19. [Cost Estimates](#19-cost-estimates)
20. [Retirement: PreferenceTracker](#20-retirement-preferencetracker)
21. [Planned Enhancements](#21-planned-enhancements)

---

## 1. Why Memory Exists

A Large Language Model is stateless. Without any intervention, every request begins with a blank
slate: the model has no knowledge of what the user said five minutes ago, let alone last week.

For a music discovery assistant — where recommendations improve significantly when the system
knows whether the user loves Amapiano, always asks for party playlists, or dislikes slow ballads —
this statelessness is the primary obstacle between a generic chatbot and a genuinely useful
recommendation engine.

The memory system is the infrastructure that bridges that gap. It does three things:

1. **Persists** what the user said and what happened in each conversation.
2. **Enriches** every new request with the most relevant slice of that history.
3. **Updates** a long-running user preference profile silently in the background.

The system is architected so that each of these three jobs is handled by a separate, independently
testable class, and so that none of those classes is coupled to Flemoji's specific database or
embedding provider — only the thin adapter layer at the boundary is project-specific.

---

## 2. The Five Types of Memory

### 2.1 Working Memory

**What it is:** The raw message history from the current conversation session, fetched fresh for
every request.

**How it works:** The route calls `conversationStore.getConversation(userId, conversationId, 6)`.
The last 6 messages are retrieved from `ai_conversation_messages` and passed directly into the
messages array sent to the LLM, so the model literally reads prior turns.

**Why 6 and not more:** Each message occupies roughly 100–300 tokens. At 6 messages the working
memory budget stays under ~1 000 tokens, which leaves room for the system prompt, user message,
and the structured tool results that music agents return. Using 10 or 20 messages will push you
against the model's context window and significantly increase per-request cost. Controlled by
`recentMessageLimit`.

**Lifetime:** Only as long as the conversation exists in the database. No computation required —
this is a straightforward `ORDER BY createdAt ASC LIMIT 6` query.

**Gotcha:** If `conversationId` is not reused across requests (i.e. a fresh ID is generated each
request), `getConversation` always returns an empty array. Working memory only works if the client
sends the same `conversationId` it received in the previous response.

---

### 2.2 Episodic Memory

**What it is:** A searchable archive of past conversation segments stored as 1536-dimensional
vector embeddings. When a new message arrives, the system runs a nearest-neighbour search to find
semantically similar past exchanges and surfaces their summaries.

**Analogy:** "You asked me about soulful house tracks from Cape Town last Tuesday."

**How it works:**

1. After each conversation the SSE route calls `memoryOrchestrator.storeConversation()`.
2. `EpisodicMemoryManager.storeMemory()` calls `summarizeMessages()` to produce a concise
   `Q: … A: …` string and then calls `embedder.embed(summary)` to produce a 1536-float vector.
3. The vector is written to the `conversation_embeddings` table via a raw SQL `INSERT` (because
   Prisma's ORM layer does not support the `vector` type natively).
4. On the next request, `retrieveRelevantMemories()` embeds the new user message and issues a
   `SELECT … ORDER BY embedding <=> queryEmbedding::vector` query using pgvector's `<=>` cosine
   distance operator. Up to 3 results are returned.

**What is returned:** An array of `EpisodicMemory` objects:

```typescript
{
  id: string; // row id in conversation_embeddings
  summary: string; // the Q: … A: … text
  importance: number; // 0.0–1.0 calculated at store-time
  similarity: number; // cosine similarity to current query (0–1, higher = more similar)
  startTime: Date; // timestamp of first message in segment
  endTime: Date; // timestamp of last message in segment
}
```

**Requires:** `OPENAI_API_KEY`. If absent, all episodic memory calls silently return `[]` — no
error is thrown, no crash occurs. This is by design; semantic memory and working memory continue
unaffected.

**Lifetime:** Permanent until manually pruned. Consider a scheduled job that deletes rows where
`importance < 0.3 AND created_at < NOW() - INTERVAL '90 days'`.

---

### 2.3 Semantic Memory

**What it is:** A structured record of what the user likes — genres, artists, moods, and other
preference types — with scores that decay over time so that stale preferences do not perpetually
influence recommendations.

**Analogy:** Knowing someone generally likes jazz without needing to remember any specific jazz
conversation.

**How it works:**

- Every time the user says something ("I love Amapiano"), `extractPreferencesFromText()` detects
  genre/mood/artist mentions and calls `updatePreference()` with `explicit: true`.
- Every time the agent returns tracks, `updateFromResults()` extracts the genres and artist names
  from the result payload and calls `updatePreference()` with `explicit: false`.
- On the next request, `getTopPreferences()` fetches all rows, applies exponential decay, filters
  below a minimum score, and returns the top N entity names.

**Storage:** One row per `(userId, type, entityName)` triple in `user_preferences`. Entity names
are normalised to lowercase before storage.

**Lifetime:** Permanent. The row never gets deleted — the decayed score just approaches zero.
Consider a monthly job that removes rows where the decayed score is below 0.01.

---

### 2.4 Entity Memory _(schema exists, not yet wired)_

**What it is:** A per-conversation record of specific entities (artists, tracks, playlists)
mentioned by the user, with how many times each was mentioned and the user's apparent sentiment.

**Table:** `conversation_entities`

**Current status:** The Prisma model and migration exist. No code currently writes to this table.
It is a planned enhancement — see section 21.

---

### 2.5 Procedural Memory _(planned)_

**What it is:** Patterns about _how_ the user interacts — always searching by mood, preferring
short responses, using the timeline chat vs. the main chat. Not yet implemented.

---

## 3. Folder Structure

```
src/lib/ai/memory/
├── core/                          ← PORTABLE. Copy this to any project.
│   ├── interfaces/
│   │   ├── storage.ts             Domain types + IStorageAdapter contract
│   │   ├── embedding.ts           IEmbeddingAdapter contract
│   │   └── logger.ts              ILogger contract
│   ├── config.ts                  MemoryConfig interface + DEFAULT_CONFIG
│   ├── conversation-store.ts      Working memory CRUD
│   ├── episodic-memory-manager.ts Embedding store + semantic search
│   ├── semantic-memory-manager.ts Preference store + decay + extraction
│   ├── memory-orchestrator.ts     Coordinates all memory reads/writes
│   ├── context-builder.ts         Lightweight genre-filter + summary context
│   └── index.ts                   createMemorySystem() factory + ConsoleLogger
│
├── presets/                       ← Ready-made adapters. Copy with core/.
│   ├── prisma-storage-adapter.ts  IStorageAdapter over any PrismaClient
│   └── openai-embedding-adapter.ts IEmbeddingAdapter over @langchain/openai
│
└── bootstrap.ts                   ← FLEMOJI ONLY. Not portable.
                                     Wires core/ to Flemoji's prisma + logger.
                                     Re-exports named singletons.
```

**Portability rule:** Nothing inside `core/` imports `@/lib/db`, `@prisma/client`, or any
project-specific path alias. The only things `core/` imports are its own sibling files and
nothing else. All external dependencies are injected through the constructor.

---

## 4. Database Schema

All five tables are defined in `prisma/schema.prisma`. Below are the memory-relevant ones with
annotations.

### 4.1 `ai_conversations`

```sql
CREATE TABLE ai_conversations (
  id         TEXT PRIMARY KEY,   -- cuid from Prisma default
  user_id    TEXT NOT NULL,
  title      TEXT,               -- Auto-generated from first message, 60-char max
  chat_type  chat_type NOT NULL DEFAULT 'OTHER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ         -- Auto-updated by Prisma @updatedAt

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ON ai_conversations (user_id);
CREATE INDEX ON ai_conversations (user_id, chat_type);
CREATE INDEX ON ai_conversations (updated_at);
```

**`chat_type` enum values:**

- `STREAMING` — Chat originated from the main landing/streaming page
- `TIMELINE` — Chat originated from the timeline page
- `DASHBOARD` — Chat originated from a dashboard section
- `OTHER` — Default; used when no chatType is passed by the client

**Gotcha:** When `getUserConversations` is called with `chatType = 'STREAMING'`, the
`ConversationStore` automatically expands this to `['STREAMING', 'OTHER']`. This is because early
conversations were stored without an explicit type (defaulting to `OTHER`) and would otherwise be
invisible in the streaming chat's history sidebar. This expansion logic lives in
`core/conversation-store.ts`, not in the adapter.

---

### 4.2 `ai_conversation_messages`

```sql
CREATE TABLE ai_conversation_messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role            TEXT NOT NULL,  -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  data            JSONB,          -- Structured agent response (track lists, etc.)
  created_at      TIMESTAMPTZ DEFAULT NOW()

  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX ON ai_conversation_messages (conversation_id);
```

**`data` column:** Stores the full structured response from the agent (e.g. `TrackListResponse`).
It is nullable. When the client fetches conversation history via `GET /api/ai/conversations/:id`,
the `data` field is included in each message, allowing the frontend to reconstruct rich UI cards
from past assistant responses without re-querying the AI.

**Cascade delete:** Deleting an `ai_conversation` automatically deletes all its messages. The
`deleteConversation` method in `PrismaStorageAdapter` verifies ownership before calling
`prisma.aIConversation.delete()`, relying on this cascade.

---

### 4.3 `conversation_embeddings`

```sql
CREATE TABLE conversation_embeddings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  message_id      TEXT NOT NULL,       -- ID of last message in the segment
  summary         TEXT NOT NULL,       -- Q: … A: … concatenation
  embedding       VECTOR(1536),        -- pgvector column; NOT a standard Prisma type
  importance      FLOAT DEFAULT 0.5,   -- 0.0–1.0 calculated importance score
  message_count   INTEGER DEFAULT 1,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES ai_conversations(id) ON DELETE CASCADE
  CONSTRAINT fk_message FOREIGN KEY (message_id)
    REFERENCES ai_conversation_messages(id) ON DELETE CASCADE
);

CREATE INDEX ON conversation_embeddings (conversation_id);
CREATE INDEX ON conversation_embeddings (user_id);
CREATE INDEX ON conversation_embeddings (importance);
CREATE INDEX ON conversation_embeddings (start_time);
```

**Why raw SQL instead of Prisma ORM for this table?** Prisma does not have native support for the
`vector` type. Attempting to use `prisma.conversationEmbedding.create({ data: { embedding: [...] } })`
will fail at runtime with a serialisation error. The `PrismaStorageAdapter` uses `$executeRaw`
for writes and `$queryRaw` for reads because these bypass Prisma's type system and allow passing
the `::vector(1536)` cast that pgvector requires.

**Gotcha — pgvector extension must be enabled:**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is typically in a Prisma migration file. If it is missing, every call to `storeEmbedding` or
`searchEmbeddings` will throw `ERROR: type "vector" does not exist`. See section 17 for the full
list of failure modes.

**The `<=>` operator** is pgvector's cosine distance operator (lower = more similar). The query
in `searchEmbeddings` computes `1 - cosine_distance` to produce a similarity score where 1.0 is
identical and 0.0 is completely dissimilar.

---

### 4.4 `user_preferences`

```sql
CREATE TABLE user_preferences (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  type             preference_type NOT NULL,
  entity_id        TEXT,            -- Optional FK to Genre/Artist/Track
  entity_name      TEXT NOT NULL,   -- Always lowercase; the canonical name
  explicit_score   FLOAT DEFAULT 0.0,
  implicit_score   FLOAT DEFAULT 0.0,
  confidence       FLOAT DEFAULT 0.5,
  first_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ,     -- Updated every time the preference is touched
  occurrence_count INTEGER DEFAULT 1,
  half_life_days   INTEGER DEFAULT 30,
  sentiment        FLOAT DEFAULT 0.5,  -- 0.0=dislike, 0.5=neutral, 1.0=love

  CONSTRAINT unique_pref UNIQUE (user_id, type, entity_name),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ON user_preferences (user_id, type);
CREATE INDEX ON user_preferences (user_id, last_seen_at);
```

**`preference_type` enum:** `GENRE | ARTIST | TRACK | MOOD | TEMPO | ERA | LANGUAGE | INSTRUMENT`

**`half_life_days`:** Defaults to 30. This is the number of days after which a preference score
halves in value if the entity is never seen again. It lives in the database row, not in the
config, meaning different preference types can theoretically decay at different rates — though
today all rows use the default 30. To change the decay rate for MOOD preferences specifically,
you could `UPDATE user_preferences SET half_life_days = 14 WHERE type = 'MOOD'`.

**`entity_name` is lowercase:** The `SemanticMemoryManager` (and the adapter) always call
`.toLowerCase()` before writing. Searching is also done against the lowercased text. This means
"Amapiano" and "amapiano" will correctly merge into the same row.

**`entity_id`:** Optional reference to the actual `Genre` or `Artist` record. Currently only
populated if you explicitly pass an `entityId` when calling `updatePreference()`. Most auto-
extracted preferences (from text or from results) do not have a matching entity ID.

---

### 4.5 `ai_preferences` _(legacy, write-retired)_

The old `AIPreferences` table (a `userId`-keyed JSON blob storing `{ genres: {}, artists: {} }`)
was used by the retired `PreferenceTracker`. The table still exists in the database and schema
but **no code path writes to it anymore**. It is safe to keep and safe to drop — see section 20.

---

## 5. Setup — Flemoji (existing project)

Everything is already wired. To verify the system is operational:

### 5.1 Check environment variables

```bash
# Required for all memory
echo $DATABASE_URL

# Required for episodic memory (embeddings)
# Optional — system degrades gracefully without it
echo $OPENAI_API_KEY
```

### 5.2 Verify pgvector is enabled

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Should return one row: | vector | 0.x.x |
```

If this returns no rows, run:

```sql
CREATE EXTENSION vector;
```

### 5.3 Verify the embedding table exists

```sql
\d conversation_embeddings
-- Should show a column: embedding | vector(1536)
```

If the table is missing, run:

```bash
yarn prisma:migrate
```

### 5.4 Verify the preference table and unique constraint

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_preferences';
-- Should include: user_preferences_user_id_type_entity_name_key
```

This unique constraint is what makes `upsert` work. If it is missing, every preference update
will insert a new row instead of updating an existing one, leading to duplicate entries and
inflated scores.

### 5.5 Run a quick smoke test

Start the dev server and send a chat message from a logged-in user. Then check:

```sql
-- Working memory: a row should appear
SELECT * FROM ai_conversation_messages ORDER BY created_at DESC LIMIT 3;

-- Semantic memory: preference rows should appear
SELECT type, entity_name, explicit_score, implicit_score
FROM user_preferences
ORDER BY updated_at DESC LIMIT 10;
```

If `OPENAI_API_KEY` is set, send a second message in the same conversation and check:

```sql
-- Episodic memory: embedding should appear
SELECT id, summary, importance, created_at
FROM conversation_embeddings
ORDER BY created_at DESC LIMIT 3;
```

---

## 6. Setup — New Project (porting)

### 6.1 Copy the portable files

Copy these two folders into your project — do not copy `bootstrap.ts`:

```bash
cp -r src/lib/ai/memory/core/     your-project/src/memory/core/
cp -r src/lib/ai/memory/presets/  your-project/src/memory/presets/
```

### 6.2 Install dependencies

The `core/` folder has zero npm dependencies. The presets need:

```bash
# For PrismaStorageAdapter (only if using Prisma)
npm install @prisma/client

# For OpenAIEmbeddingAdapter (only if using OpenAI embeddings)
npm install @langchain/openai
```

### 6.3 Create the database tables

You need these tables in your database:

```sql
-- Enable pgvector (PostgreSQL only; for other DBs write your own IStorageAdapter)
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation tables
CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  chat_type TEXT NOT NULL DEFAULT 'OTHER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_conversation_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodic memory
CREATE TABLE conversation_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  embedding VECTOR(1536),
  importance FLOAT DEFAULT 0.5,
  message_count INTEGER DEFAULT 1,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic memory
CREATE TABLE user_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT NOT NULL,
  explicit_score FLOAT DEFAULT 0.0,
  implicit_score FLOAT DEFAULT 0.0,
  confidence FLOAT DEFAULT 0.5,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  half_life_days INTEGER DEFAULT 30,
  sentiment FLOAT DEFAULT 0.5,
  CONSTRAINT unique_pref UNIQUE (user_id, type, entity_name)
);

-- Genre lookup (only needed if you use SemanticMemoryManager.extractPreferencesFromText)
-- Your adapter's getActiveGenres() can query any table or return a hardcoded list
CREATE TABLE genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  aliases JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE
);
```

### 6.4 Wire it up

```typescript
// your-project/src/memory/bootstrap.ts
import { createMemorySystem } from './core';
import { PrismaStorageAdapter } from './presets/prisma-storage-adapter';
import { OpenAIEmbeddingAdapter } from './presets/openai-embedding-adapter';
import { prisma } from '../db'; // ← your project's Prisma client

const sys = createMemorySystem({
  storage: new PrismaStorageAdapter(prisma),
  embedder: process.env.OPENAI_API_KEY
    ? new OpenAIEmbeddingAdapter(process.env.OPENAI_API_KEY)
    : null,
  // logger: yourLogger,               // Optional; defaults to ConsoleLogger
  // options: { recentMessageLimit: 8 } // Optional config overrides
});

export const conversationStore = sys.conversation;
export const semanticMemoryManager = sys.semantic;
export const memoryOrchestrator = sys.orchestrator;
export const contextBuilder = sys.contextBuilder;
```

### 6.5 Non-Prisma or non-OpenAI project

Implement the two interfaces and pass them to `createMemorySystem`:

```typescript
// Example: MongoDB storage adapter
import type { IStorageAdapter, StoredMessage, ... } from './core/interfaces/storage';

class MongoStorageAdapter implements IStorageAdapter {
  constructor(private db: MongoDatabase) {}

  async upsertConversation(p) {
    await this.db.collection('conversations').updateOne(
      { _id: p.conversationId },
      { $set: { userId: p.userId, title: p.title, chatType: p.chatType } },
      { upsert: true }
    );
  }

  // ... implement all 13 methods
}

// Example: Cohere embedding adapter
import type { IEmbeddingAdapter } from './core/interfaces/embedding';
import { CohereClient } from 'cohere-ai';

class CohereEmbeddingAdapter implements IEmbeddingAdapter {
  private client = new CohereClient({ token: process.env.COHERE_API_KEY! });

  async embed(text: string) {
    const res = await this.client.embed({ texts: [text], model: 'embed-english-v3.0' });
    return res.embeddings[0] as number[];
  }

  async embedBatch(texts: string[]) {
    const res = await this.client.embed({ texts, model: 'embed-english-v3.0' });
    return res.embeddings as number[][];
  }
}
```

**Critical:** If you use a different embedding model, you must change `embeddingDimensions` in
your config options to match that model's output dimensions. The vector column in the database must
also be recreated with the correct dimension. See section 17 for the disaster that happens if
these do not match.

---

## 7. Configuration Reference

Every config value lives in `core/config.ts`. All values have defaults in `DEFAULT_CONFIG`.
Override them by passing `options: Partial<MemoryConfig>` to `createMemorySystem()`.

### `embeddingDimensions` — default: `1536`

**What it controls:** The dimension count cast into the pgvector SQL (`::vector(1536)`). This
must match the output dimension of your `IEmbeddingAdapter.embed()` method and the dimension
declared on the `embedding` column in the `conversation_embeddings` table.

**Why 1536:** OpenAI's `text-embedding-3-small` with `dimensions: 1536` is the chosen model.
Dimensions can be reduced to 512 or 256 to save storage and speed up queries at the cost of some
accuracy. If you reduce the model output dimensions, you must also recreate the column.

**Gotcha — mismatch causes a hard runtime crash:** If `embeddingDimensions: 512` is set in config
but the database column is `vector(1536)`, or vice versa, every `storeEmbedding` and
`searchEmbeddings` call will throw:

```
ERROR: expected 1536 dimensions, not 512
```

This is not caught silently — the `try/catch` in `EpisodicMemoryManager` suppresses it for
`storeMemory` (non-blocking) but `retrieveRelevantMemories` will return `[]` on the same error,
effectively disabling episodic memory silently during retrieval. You will see the error in logs
but the app will not crash.

---

### `maxContextTokens` — default: `2000`

**What it controls:** The total token budget passed to `MemoryOrchestrator.buildEnhancedContext`.
The orchestrator splits this into three sub-budgets:

- Recent messages: `maxTokens × 0.4` = 800 tokens
- Episodic memories: `maxTokens × 0.3` = 600 tokens
- Preferences: `maxTokens × 0.3` = 600 tokens

**Why 2000:** This is the memory context section only. The model's full context includes the
system prompt (~500 tokens), the memory context (~2000 tokens), and the new user message. Keeping
this under 2000 leaves comfortable room without pushing into expensive territory.

**Increasing it:** Setting `maxContextTokens: 4000` will include more history and more memories,
at the cost of higher token usage per request. The route currently passes `maxTokens: 2000`
hardcoded — to respect a different config value the route would need to read from the config.

**Token estimation method:** The system estimates tokens as `Math.ceil(totalChars / 4)`. This is
a rough heuristic (actual GPT-family tokenisation is ~3.5–4 chars per token for English). It
underestimates for code and overestimates for non-Latin scripts. It is good enough for budget
purposes but should not be confused with actual billable token counts.

---

### `episodicRetrievalLimit` — default: `3`

**What it controls:** The maximum number of episodic memories returned by
`retrieveRelevantMemories()`. The pgvector query uses `LIMIT ${limit}`.

**Why 3:** Each episodic memory summary is ~100–500 characters. Three memories inject roughly
300–1500 chars (~75–375 tokens) into the prompt — a reasonable enrichment without dominating the
context. Increasing to 5–10 is reasonable for deeply research-style conversations; decreasing to
1 is appropriate if you want a tighter, more focused assistant.

**Relationship with `episodicMinImportance`:** The `LIMIT` is applied _after_ the `WHERE
importance >= minImportance` filter, so you may get fewer than 3 results if few high-importance
memories exist. This is expected behaviour; do not assume you always get exactly 3.

---

### `episodicMinImportance` — default: `0.5`

**What it controls:** The lower bound on `importance` for episodic memories returned during
retrieval. The pgvector query includes `WHERE importance >= ${minImportance}`.

**Why 0.5:** The importance score is calculated with a base of 0.5 plus four additive bonuses
(see section 14). A score of 0.5 means a conversation with no special signals — no entities, no
questions, no preference indicators, a short exchange. These baseline conversations are not
filtered out but they also receive no bonus retrieval priority. Raising this threshold to 0.7
would only surface conversations that had at least two positive signals.

**Setting it to 0.0:** All stored memories become eligible. In a production system with many
conversations this may degrade retrieval quality — low-importance memories could crowd out high-
importance ones in the cosine search if their embeddings happen to be numerically close.

---

### `recentMessageLimit` — default: `6`

**What it controls:** The number of messages fetched from `ai_conversation_messages` by
`ConversationStore.getConversation()` for use as working memory.

**Why 6:** At 150–300 chars per message, 6 messages is approximately 1 000 chars (~250 tokens),
which fits comfortably within the working memory sub-budget. The messages are fetched in
chronological order (`ORDER BY created_at ASC LIMIT 6`), which means if there are 20 messages in
the conversation you get the _oldest_ 6, not the most recent 6.

**Gotcha — this is the oldest 6, not the newest 6:** The Prisma query uses `take: limit` with
`orderBy: createdAt asc`. If you need the most recent 6, the adapter would need to reverse the
order and then reverse the result. For most cases — where the model needs the chronological
sequence of the conversation — oldest-first is what you want for the messages array.

---

### `contextSummaryMaxChars` — default: `500`

**What it controls:** The maximum length of the `summary` string produced by `ContextBuilder`.
The summary is a plain-text rendering of recent messages (`role: content\nrole: content\n…`)
sliced to this length from the end (keeping the most recent portion).

**Why 500:** This is the `ContextBuilder`'s lightweight fallback — it is used to populate
`agentContext.metadata.summary` and can be used by agents that do not need the full enhanced
context from `MemoryOrchestrator`. 500 chars is ~125 tokens — sufficient to give a routing hint
without being expensive.

---

### `explicitScoreIncrement` — default: `1.0`

**What it controls:** How much `explicitScore` increases each time a preference is confirmed with
`explicit: true`. An explicit preference means the user directly stated their preference ("I love
Amapiano").

**Why 1.0:** This is the reference unit. Explicit preferences are the strongest signal. An artist
a user explicitly names three times accumulates a base score of 3.0, which with no decay and a
0.5 implicit weight gives a composite score of 3.0 — meaning it stays above the 0.1 filter for
many weeks even without re-engagement.

---

### `implicitScoreIncrement` — default: `0.5`

**What it controls:** How much `implicitScore` increases each time a preference is observed with
`explicit: false`. Implicit preferences are inferred from what results were shown (via
`updateFromResults`) or from background text extraction.

**Why 0.5 and not 1.0:** Implicit signals are weaker evidence. A user receiving Amapiano results
does not necessarily like Amapiano — it may be what the algorithm surfaced rather than what they
wanted. At 0.5, the implicit weight in the composite score formula is `implicitScore × 0.5`, so
each implicit exposure contributes effectively 0.25 to the base score vs. 1.0 for an explicit
statement.

---

### `explicitConfidence` — default: `0.9`

**What it controls:** The `confidence` value stored when a preference is _created_ via an
explicit signal. Confidence is a 0.0–1.0 quality score for the preference row.

**Why 0.9:** Near-certain. A user directly stating a preference is the strongest possible signal.
0.9 rather than 1.0 leaves headroom for cases where the extraction was from a question ("do you
have Amapiano?") rather than a declaration.

**Note:** Confidence is currently stored but not used in filtering. It is available for future
features such as "only surface artist preferences above 0.7 confidence" or for displaying a
preference confidence UI to the user.

---

### `implicitConfidence` — default: `0.5`

**What it controls:** The `confidence` value stored when a preference is _created_ via an
implicit signal.

**Why 0.5:** Neutral — we have some evidence but it is uncertain. An implicit observation from
`updateFromResults` could be coincidental (the agent returned a hip-hop track because the query
matched, not because the user likes hip-hop).

---

### `preferenceLimit` — default: `20`

**What it controls:** The maximum number of preferences returned by `getPreferences()` after
decay filtering and sorting.

**Why 20:** An upper bound to prevent returning hundreds of stale, near-zero preferences. In
practice most users will have far fewer active preferences than 20.

---

### `minPreferenceScore` — default: `0.1`

**What it controls:** Preferences with a decayed score below this value are filtered out in
`getPreferences()` (`.filter(p => p.score >= minScore)`).

**Why 0.1:** This corresponds to roughly a preference that was seen once (base score ~0.5) and
not touched in ~60 days (decayFactor ~0.25), giving 0.5 × 0.25 = 0.125 — still above threshold.
After 75 days without re-engagement, such a preference would fall below 0.1 and be excluded. This
feels right for a music discovery app: 2–3 months of no engagement should stop influencing
recommendations.

---

### `genrePrefsLimit` — default: `5`

**What it controls:** The maximum number of genre preferences retrieved by the orchestrator and
passed into `agentContext.metadata.preferences.genres`.

**Why 5:** Five genre preferences inject roughly 30–80 chars into the system prompt. Agents can
meaningfully use 3–5 genres to bias search results; more than 5 starts to dilute the signal and
increase prompt length.

---

### `artistPrefsLimit` — default: `5`

**What it controls:** The maximum number of artist preferences. Same rationale as
`genrePrefsLimit`.

---

### `moodPrefsLimit` — default: `3`

**What it controls:** The maximum number of mood preferences. Moods are broader and fewer are
meaningful at once — you are usually in one or two moods, not five.

---

### `maxSummaryLength` — default: `500`

**What it controls:** The maximum character length of the `Q: … A: …` summary produced by
`EpisodicMemoryManager.summarizeMessages()` before it is truncated and embedded.

**Why 500:** Long summaries produce more accurate embeddings (more content = richer semantic
representation) but are more expensive to embed and store. 500 chars is approximately 125 tokens.
For OpenAI `text-embedding-3-small` with a context limit of 8191 tokens this is very conservative
— you could raise this to 2000 chars if you want richer memory storage. The truncation appends
`…` to signal that the stored summary is partial.

---

### `moodKeywords` — default: a built-in map of 6 moods

**What it controls:** The keyword detection map used by `SemanticMemoryManager.extractMoods()`.
The format is `{ "MoodName": ["keyword1", "keyword2", ...] }`.

**Built-in map:**

```typescript
{
  Energetic:  ['energetic', 'upbeat', 'lively', 'pump up'],
  Chill:      ['chill', 'relaxing', 'calm', 'mellow'],
  Melancholic:['sad', 'melancholic', 'emotional', 'somber'],
  Happy:      ['happy', 'joyful', 'cheerful', 'uplifting'],
  Focus:      ['focus', 'concentration', 'study', 'work'],
  Party:      ['party', 'dance', 'club', 'celebration'],
}
```

**Why these:** These map to the moods used in the track browsing UI and in the discovery agent's
search filters. A user saying "I need something for the gym" should store `Energetic` as a mood
preference, biasing future recommendations. This list should be extended as more mood tags are
added to the track catalogue.

**How to extend:** Pass a custom (or merged) map via `options.moodKeywords`:

```typescript
createMemorySystem({
  ...,
  options: {
    moodKeywords: {
      ...DEFAULT_CONFIG.moodKeywords,
      Romantic: ['romantic', 'love song', 'date night'],
      Spiritual: ['worship', 'gospel', 'praise'],
    }
  }
});
```

---

## 8. Adapter Interfaces

### 8.1 `IStorageAdapter` (`core/interfaces/storage.ts`)

This is the largest interface — 13 methods across four logical groups. You must implement every
method. Any method you cannot implement (e.g. your database does not support vector search) should
throw a clear error or return an empty result, depending on whether the calling code treats that
method as critical.

#### Conversation methods

| Method                                           | Notes                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `upsertConversation(p)`                          | Create or update. Always called before `createMessage`. The `chatType` must be set even for `update` — old conversations may have `OTHER` as default.        |
| `updateConversationTitle(id, title)`             | Called only when `isFirstMessage && !title`. Can be a no-op if your schema stores titles elsewhere.                                                          |
| `getConversationMessages(userId, convId, limit)` | Must verify that `userId` matches the conversation owner. The `where: { conversation: { id, userId } }` join in `PrismaStorageAdapter` does this implicitly. |
| `getUserConversations(userId, chatType?)`        | `chatType` can be a single value or an array (for the `['STREAMING', 'OTHER']` expansion). Must handle both cases.                                           |
| `countMessages(conversationId)`                  | Used only to detect the first message and trigger auto-title generation. Can return a rough count if exact is expensive.                                     |
| `createMessage(p)`                               | Must return `{ id: string }`. The `id` is used for the `messageId` FK in `storeEmbedding`.                                                                   |
| `deleteConversation(userId, convId)`             | Must throw (not return gracefully) if not found or if ownership check fails — the route catches and converts to 404/403.                                     |

#### Preference methods

| Method                | Notes                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upsertPreference(p)` | The `p.entityName` is already lowercased by `SemanticMemoryManager` before this call. The adapter lowercases it again as a belt-and-suspenders measure.                      |
| `getPreferences(p)`   | Returns raw rows. Decay is computed in `SemanticMemoryManager`, not here. Do NOT apply decay in the adapter — it must return raw `explicitScore` and `implicitScore` values. |

#### Episodic methods

| Method                | Notes                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storeEmbedding(p)`   | `p.messageIds` is an array but only the last element is used (`messageIds[messageIds.length - 1]`) as the FK to `ai_conversation_messages`. Design limitation — future versions may store multiple message FKs. |
| `searchEmbeddings(p)` | The `p.queryEmbedding` is a raw `number[]`. The adapter casts it to `::vector(1536)`. The result must include a `similarity` field in range [0, 1].                                                             |

#### Lookup methods

| Method              | Notes                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getActiveGenres()` | Returns `{ name, slug, aliases }` for all active genres. `aliases` is a `string[]` and must be an array (never null/undefined — the caller iterates it directly). If your app has no genre concept, return `[]`. |

---

### 8.2 `IEmbeddingAdapter` (`core/interfaces/embedding.ts`)

```typescript
export interface IEmbeddingAdapter {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

**`embed(text)`:** Returns a single embedding vector. Dimensions must match
`config.embeddingDimensions`.

**`embedBatch(texts)`:** Returns an array of embedding vectors, one per input text, in the same
order. Currently `embedBatch` is not called by any code in the system (the system only uses
`embed` for single-text embedding). It is on the interface for completeness and for future batch
processing of conversation archives.

**Error behaviour:** If the adapter throws, `EpisodicMemoryManager` catches it and returns `[]`
for retrieval or silently skips storing. The error is logged but does not crash the request.

---

### 8.3 `ILogger` (`core/interfaces/logger.ts`)

```typescript
export interface ILogger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
```

**Flemoji's logger** (`@/lib/utils/logger`) satisfies this interface: its `error` and `warn`
methods always emit; its `info`, `debug` methods only emit in development (`NODE_ENV ===
'development'`). This is why the memory system uses `this.logger.error()` for informational
messages like "Stored conversation segment" — because `console.log` is banned by ESLint and the
`logger.info()` would be silenced in production.

**`ConsoleLogger` in `core/index.ts`:** The built-in fallback maps `info` and `debug` to
`console.error` for the same reason (ESLint constraint). In a new project with no ESLint
restriction, you can wire `info` to `console.log` instead.

**Gotcha:** Do not pass the raw Flemoji `Logger` class as a logger to `createMemorySystem` —
pass the `logger` _singleton_ (the exported instance). The singleton is pre-configured; the class
constructor is not intended for external use.

---

## 9. Core Classes — Public API

### 9.1 `ConversationStore`

```typescript
new ConversationStore(storage: IStorageAdapter, logger: ILogger, config: MemoryConfig)
```

#### `storeMessage(userId, conversationId, message, title?, chatType?)`

Persists a single message. Also:

- Creates the conversation row if it does not exist (via `upsertConversation`)
- Auto-generates a title from the first 60 chars of the first user message
- Title is only auto-generated once: `isFirstMessage && !title && message.role === 'user'`

**`chatType` semantics:** If `chatType` is undefined, it defaults to `'OTHER'`. Crucially, if the
conversation already exists with `chatType: 'TIMELINE'` and you call `storeMessage` without a
`chatType`, the adapter's upsert will update `chatType` to `'OTHER'`, effectively demoting the
conversation's type. Always pass the correct `chatType` consistently.

#### `getConversation(userId, conversationId, limit?)`

Returns up to `limit` messages (default 10) in chronological order. Returns `[]` if `userId` is
falsy or on any error.

#### `getUserConversations(userId, chatType?)`

Returns up to 20 conversations ordered by `updatedAt DESC`. Applies the `STREAMING → ['STREAMING', 'OTHER']`
expansion automatically.

#### `updateTitle(conversationId, title)`

Non-throwing. Silently swallows errors.

#### `deleteConversation(userId, conversationId)`

Throws on missing conversation or ownership failure. The calling route must handle the error.

---

### 9.2 `EpisodicMemoryManager`

```typescript
new EpisodicMemoryManager(
  storage: IStorageAdapter,
  embedder: IEmbeddingAdapter | null,
  logger: ILogger,
  config: MemoryConfig
)
```

If `embedder` is `null`, both `storeMemory` and `retrieveRelevantMemories` are no-ops that return
immediately. No error is thrown; no log is emitted (silent disable).

#### `storeMemory({ userId, conversationId, messages })`

Async, non-throwing. Summarises `messages`, embeds the summary, calculates importance, and stores
in `conversation_embeddings`. If any step fails (embedding API down, pgvector error, etc.) the
error is logged and the method returns without throwing.

**`messages` must have IDs:** Each message in the array must have an `id` field. The last
message's `id` is used as the `messageId` FK. In the stream route, these IDs are synthesised
client-side as:

```typescript
id: `msg_${conversationId}_user_${Date.now()}`;
```

These are not the actual database IDs from `ai_conversation_messages` — they are synthetic
identifiers. The FK relationship is therefore loose; if you look up the `message_id` in the
`conversation_embeddings` table it will not match any row in `ai_conversation_messages` for
new-style IDs. This is a known limitation. The FK constraint is currently `ON DELETE CASCADE`
in the Prisma schema but this will cause cascade deletion failures if the message ID does not
exist as a real row. **See gotcha in section 17.**

#### `retrieveRelevantMemories({ userId, query, limit?, minImportance? })`

Returns up to `limit` (default `config.episodicRetrievalLimit = 3`) episodic memories ordered by
cosine similarity to `query`. Only returns memories where `importance >= minImportance`. On error
returns `[]`.

---

### 9.3 `SemanticMemoryManager`

```typescript
new SemanticMemoryManager(storage: IStorageAdapter, logger: ILogger, config: MemoryConfig)
```

#### `updatePreference({ userId, type, entityName, entityId?, explicit?, sentiment? })`

Upserts a single preference. Normalises `entityName` to lowercase. On first insert, sets
`confidence` based on `explicit` (0.9 or 0.5). On subsequent updates, only increments the
appropriate score (explicit or implicit), updates `lastSeenAt`, and updates `sentiment` via a
moving average: `(old + new * 0.1) / 2`.

**Sentiment moving average note:** The formula `(sentiment + sentiment * 0.1) / 2` in the adapter
is unusual — it re-uses the incoming `sentiment` value for both sides, which means the moving
average always biases toward `sentiment * (1 + 0.1) / 2 = sentiment * 0.55`. This is a quirk of
the current implementation, not a deliberate design choice.

#### `getPreferences({ userId, type?, limit?, minScore? })`

Applies exponential decay (see section 13), filters below `minScore`, sorts descending, slices to
`limit`. Returns `UserPreferenceScore[]`:

```typescript
{
  entityName: string;
  type: PreferenceType;
  score: number;
  confidence: number;
  sentiment: number;
}
```

#### `getTopPreferences({ userId, type, limit? })`

Convenience wrapper around `getPreferences` that returns just `string[]` of entity names.

#### `extractPreferencesFromText({ userId, text, explicit? })`

Runs all three extractors sequentially (genre, then mood, then artist) and calls
`updatePreference` for each match. Genre extraction is async (queries the database); mood and
artist extraction are synchronous regex operations.

**Calling order matters:** Genres are extracted first because they are the highest-quality signal
(database-validated matches against active genre names and aliases). Artist extraction runs last
because it is the least reliable (capitalised-word heuristic).

#### `updateFromResults(userId, result)`

Accepts the raw agent response data and extracts genres and artists from the `tracks` array at
either `result.data.tracks` or `result.tracks`. Uses `Promise.allSettled` so a failure to store
one preference does not block others.

---

### 9.4 `MemoryOrchestrator`

```typescript
new MemoryOrchestrator(
  episodic: EpisodicMemoryManager,
  semantic: SemanticMemoryManager,
  logger: ILogger,
  config: MemoryConfig
)
```

#### `buildEnhancedContext({ userId?, conversationId?, currentMessage, recentMessages?, maxTokens? })`

The primary pre-request method. Runs four parallel async operations:

1. `episodic.retrieveRelevantMemories()`
2. `semantic.getTopPreferences({ type: 'GENRE' })`
3. `semantic.getTopPreferences({ type: 'ARTIST' })`
4. `semantic.getTopPreferences({ type: 'MOOD' })`

Returns `EnhancedContext`:

```typescript
{
  recentMessages: string;        // Formatted message history text
  relevantMemories: EpisodicMemory[];
  preferences: {
    genres: string[];
    artists: string[];
    moods: string[];
  };
  tokenCount: number;            // Estimated token usage
  memoryRetrievalTime: number;   // Milliseconds
}
```

If `userId` is falsy (unauthenticated request), returns an empty context immediately with no DB
calls.

If any parallel operation fails, the whole method falls back to an empty context rather than
rethrowing. The error is logged.

#### `storeConversation({ userId, conversationId, messages, userMessage })`

The post-response method. Calls two operations:

1. `episodic.storeMemory()` — embeds the full conversation
2. `semantic.extractPreferencesFromText()` — extracts preferences from `userMessage` only

Both are awaited sequentially. If the first fails, the second still runs (no early return in the
`catch` block). Throws nothing — outer callers use `.catch()`.

---

### 9.5 `ContextBuilder`

```typescript
new ContextBuilder(conversation: ConversationStore, semantic: SemanticMemoryManager, config: MemoryConfig)
```

#### `buildContext(userId?, conversationId?)`

A lightweight alternative to `MemoryOrchestrator.buildEnhancedContext`. Used by the non-SSE route
as a fallback filter hint. Returns:

```typescript
{
  filters?: { genre?: string; province?: string };
  summary?: string;
  metadata?: { previousIntent?: string };
}
```

Fetches `recentMessageLimit` messages and the top 1 genre preference in parallel. The `summary`
is the raw message history truncated to `contextSummaryMaxChars` from the end. The `filters.genre`
is the entity name of the top genre (e.g. `"amapiano"`).

`filters.province` and `metadata.previousIntent` are currently always undefined — they are
structural placeholders for future enhancements.

---

## 10. Presets

### 10.1 `PrismaStorageAdapter`

```typescript
new PrismaStorageAdapter(prisma: PrismaClient)
```

Takes any `PrismaClient` instance — it does not import `@/lib/db`. This is what makes it
portable: you can pass a test client, a connection-pooled client, or a scoped transaction client.

**Prisma types vs. core types:** The adapter imports `ChatType as PrismaChatType` from
`@prisma/client` to satisfy Prisma's generated `AIConversationWhereInput` type when building
`where` clauses with `{ in: [...] }`. The `core/interfaces/storage.ts` defines its own `ChatType`
string literal union which is structurally identical but not the same TypeScript type. The adapter
bridges the two via `as PrismaChatType[]` casts.

**`getPreferences` type cast:** The `type` field is cast with `p.type as never` when building the
Prisma where clause. This is necessary because the core's `PreferenceType` is a string literal
union while Prisma's enum is a different TypeScript type. `as never` suppresses the error without
requiring a mapping function.

**The `data ?? undefined` pattern in `createMessage`:** Prisma's `data` column is typed as
`InputJsonValue | undefined` for JSONB columns — passing `null` explicitly would set the column
to SQL NULL, while `undefined` means "do not set it" (omit from the INSERT). `p.data ?? undefined`
ensures that when `data` is `null` or `undefined` it is treated as "not provided" rather than
written as a null value.

---

### 10.2 `OpenAIEmbeddingAdapter`

```typescript
new OpenAIEmbeddingAdapter(apiKey: string, model?: string, dimensions?: number)
// Defaults: model = 'text-embedding-3-small', dimensions = 1536
```

**Lazy loading:** The `@langchain/openai` package is dynamically imported inside `getClient()`
rather than at module level. This prevents the OpenAI SDK from being loaded at build time or
server startup, which would fail during Next.js static analysis passes when `OPENAI_API_KEY` is
not set. The client is created once and cached on the instance.

**`dimensions` parameter:** Passed to `OpenAIEmbeddings` constructor. OpenAI's
`text-embedding-3-small` supports variable dimensions from 512 to 1536. If you pass
`dimensions: 512` here, you must also update `embeddingDimensions` in config and recreate the
database column as `vector(512)`.

---

## 11. Bootstrap

`src/lib/ai/memory/bootstrap.ts` is the only file that is not portable. It is the integration
point between the portable `core/` and Flemoji's infrastructure.

```typescript
const sys = createMemorySystem({
  storage: new PrismaStorageAdapter(prisma),
  embedder: process.env.OPENAI_API_KEY
    ? new OpenAIEmbeddingAdapter(process.env.OPENAI_API_KEY)
    : null,
  logger,
});
```

**Module-level evaluation:** This file is evaluated once when first imported. `createMemorySystem`
runs synchronously — no async operations happen at this point. The `PrismaStorageAdapter` and
`OpenAIEmbeddingAdapter` constructors are also synchronous (the OpenAI client is lazy-loaded).
There is no risk of import-time database connections.

**Named exports:** The bootstrap re-exports named singletons so that consuming files use a simple
single import:

```typescript
import {
  conversationStore,
  semanticMemoryManager,
  memoryOrchestrator,
  contextBuilder,
} from '@/lib/ai/memory/bootstrap';
```

**Files that import from bootstrap:**

- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/chat/stream/route.ts`
- `src/app/api/ai/conversations/route.ts`
- `src/app/api/ai/conversations/[id]/route.ts`
- `src/lib/ai/agents/clarification-agent.ts`

No other file should reach into `core/` or `presets/` directly.

---

## 12. Data Flow — Per Request

### 12.1 SSE Route (`POST /api/ai/chat/stream`)

This is the primary route used by the chat UI.

```
1. Client sends POST with: { message, context: { userId }, conversationId?, chatType }

2. [conversationStore.getConversation]
   → SELECT last 6 messages WHERE conversation.userId = userId AND conversation.id = conversationId
   → Returns: StoredMessage[]  (used as working memory)

3. [memoryOrchestrator.buildEnhancedContext]   ← 4 parallel DB queries
   a. episodic.retrieveRelevantMemories()
      → embedder.embed(currentMessage)         ← 1 OpenAI API call
      → storage.searchEmbeddings()             ← 1 pgvector cosine search
      → returns: EpisodicMemory[]
   b. semantic.getTopPreferences({ type: 'GENRE' })
      → storage.getPreferences({ userId, type: 'GENRE' })
      → applies decay in-memory
      → returns: string[]
   c. semantic.getTopPreferences({ type: 'ARTIST' })  [same]
   d. semantic.getTopPreferences({ type: 'MOOD' })    [same]
   → Returns: EnhancedContext

4. [contextBuilder.buildContext]   ← 2 parallel DB queries
   a. conversationStore.getConversation() [fetches same 6 messages again — redundant]
   b. semantic.getTopPreferences({ type: 'GENRE', limit: 1 })
   → Returns: BuiltContext { filters: { genre: 'amapiano' }, summary: '...' }

5. Build agentContext with:
   - conversationHistory: working memory (from step 2)
   - filters.genre: top genre from enhanced context OR fallback from ContextBuilder
   - metadata.preferences: full genre/artist/mood preferences
   - metadata.relevantMemories: episodic memories
   - emitEvent: SSE event emitter function

6. [conversationStore.storeMessage] — stores USER message
   → INSERT into ai_conversation_messages

7. [semanticMemoryManager.extractPreferencesFromText] — non-blocking (.catch(() => {}))
   → For each genre match: storage.upsertPreference()
   → For each mood match: storage.upsertPreference()
   → For each artist match: storage.upsertPreference()

8. [routerAgent.route(message, agentContext)]
   → RouterAgent → DiscoveryAgent / RecommendationAgent / ...
   → Agents read metadata.preferences and metadata.relevantMemories from context
   → Returns: AgentResponse { message, data }

9. [conversationStore.storeMessage] — stores ASSISTANT message
   → INSERT into ai_conversation_messages with data=agentResponse.data

10. [semanticMemoryManager.updateFromResults] — non-blocking
    → For each track in response: upserts GENRE and ARTIST preferences

11. [memoryOrchestrator.storeConversation] — non-blocking (.catch())
    → episodic.storeMemory()
       ├── summarizeMessages()
       ├── embedder.embed(summary)             ← 1 OpenAI API call
       └── storage.storeEmbedding()            ← 1 pgvector INSERT
    → semantic.extractPreferencesFromText(userMessage)  [same as step 7 — duplicate]

12. SSE complete event sent; stream closed.
```

**Important note on step 4 (redundant fetch):** `contextBuilder.buildContext` fetches the same 6
messages that were already fetched in step 2. This is a redundant DB query. It exists for
historical reasons (the two systems were developed separately). In a future optimisation pass, the
result from step 2 could be passed to `contextBuilder` instead of re-fetching.

**Important note on step 11 (duplicate preference extraction):** `storeConversation` calls
`extractPreferencesFromText(userMessage)`, which is the same extraction already done in step 7.
This means every user message triggers two rounds of preference upserts. Because `upsertPreference`
increments counters rather than replacing them, this doubles the implicit score increment per
message. This is another known redundancy.

---

### 12.2 Non-SSE Route (`POST /api/ai/chat`)

Functionally identical to the SSE route except:

- It does not emit intermediate SSE events
- It does not call `memoryOrchestrator.storeConversation` post-response (episodic memory is not
  updated via this route)
- The `buildEnhancedContext` call is wrapped in `.catch()` that returns an empty context
  (defensive; the SSE route does not have this catch)

---

## 13. Scoring and Decay Algorithms

### Exponential Temporal Decay

Used in `SemanticMemoryManager.getPreferences()`:

```
baseScore    = explicitScore + (implicitScore × 0.5)
daysSince    = (Date.now() - lastSeenAt) / (1000 × 60 × 60 × 24)
decayFactor  = e^(−ln(2) × daysSince / halfLifeDays)
decayedScore = baseScore × decayFactor
```

**decayFactor at key time points** (with default `halfLifeDays = 30`):

| Days since last seen | Decay factor | Example: baseScore=2.0 → decayedScore |
| -------------------- | ------------ | ------------------------------------- |
| 0                    | 1.000        | 2.000                                 |
| 7                    | 0.857        | 1.714                                 |
| 15                   | 0.707        | 1.414                                 |
| 30                   | 0.500        | 1.000                                 |
| 60                   | 0.250        | 0.500                                 |
| 90                   | 0.125        | 0.250                                 |
| 120                  | 0.063        | 0.126                                 |
| 150                  | 0.031        | 0.062                                 |
| 180                  | 0.016        | 0.032                                 |

With `minPreferenceScore = 0.1`, a `baseScore=2.0` preference falls below threshold after ~130
days of inactivity. A `baseScore=1.0` preference (one explicit interaction, nothing implicit)
falls below threshold after ~100 days.

**Re-engagement resets the clock:** Every call to `upsertPreference` sets `lastSeenAt = new Date()`
and increments `occurrenceCount`. This resets `daysSince` to 0, returning the decay factor to 1.0
on the next read.

**Why exponential decay and not linear?** Linear decay is simpler but treats a 10-day-old
preference the same distance from zero as a 50-day-old one. Exponential decay front-loads the
drop (the preference halves in value in the first `halfLifeDays` days) then tails off more slowly,
matching the intuition that a recently active preference is far more relevant than one from six
months ago, even if the activity was the same.

---

## 14. Importance Scoring Algorithm

Used in `EpisodicMemoryManager.calculateImportance()`. Scores a conversation segment 0.0–1.0:

```
baseScore = 0.5

+0.2  if any message contains capitalised words (entity heuristic)
+0.1  if any USER message contains '?'
+0.1  if there are 4 or more messages in the segment
+0.2  if any message matches /\b(love|like|prefer|favorite|enjoy|hate|dislike)\b/i

Maximum = min(1.0, sum)
```

**Why these signals:**

- **Entities (+0.2):** Conversations about specific artists or tracks are more memorable and
  more likely to be relevant in a future similar query than generic ones.
- **Question (+0.1):** A user asking a question creates a conversational event worth remembering.
- **Length (+0.1):** A longer exchange implies more engagement and context.
- **Preference indicator (+0.2):** Explicit sentiment words are the highest-value signal — they
  indicate a declarative user preference, which is exactly what the memory system wants to capture.

**Gotcha — importance is computed at store-time, not read-time.** If you add a new importance
signal in the future, old embeddings in the database will have scores computed under the old
formula. There is no retroactive recalculation.

---

## 15. Preference Extraction Algorithms

### 15.1 Genre Extraction (async, database-driven)

```typescript
const genres = await this.storage.getActiveGenres();
// For each genre: match name, slug, or any alias against lowercased text
```

- **Why database-driven:** Hardcoding genres would require code changes whenever a genre is added
  to the platform. Database-driven extraction means adding "Gqom" to the genres table immediately
  enables "gqom" detection in user messages.
- **Order of matching:** `name` first, then `slug`, then each `alias`. The first match wins
  (via `break` in the inner loop). This means if "hip-hop" is an alias for the genre with `slug:
"hip-hop"` and `name: "Hip Hop"`, a user saying "hip-hop" correctly resolves to "Hip Hop".
- **Case insensitive:** Both the genre data and user text are lowercased before comparison.
- **Deduplication:** `[...new Set(found)]` prevents a genre from being stored twice if both its
  name and an alias appear in the text.

### 15.2 Mood Extraction (synchronous, keyword map)

```typescript
for (const [mood, keywords] of Object.entries(this.config.moodKeywords)) {
  if (keywords.some(keyword => lowerText.includes(keyword))) {
    found.push(mood);
  }
}
```

- **Substring match:** `lowerText.includes(keyword)` matches "relaxing" even if the keyword
  is "relax". This is intentionally broad — the app wants liberal mood detection to build up
  preferences from natural conversational language.
- **No deduplication needed:** Each mood appears at most once (one entry per map key).

### 15.3 Artist Extraction (synchronous, capitalized-word heuristic)

```typescript
const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
```

- **What this matches:** Any capitalised proper noun or title-cased sequence — e.g. "Kabza De
  Small", "Black Coffee", "The Weeknd".
- **What this also matches (false positives):** "South Africa", "Cape Town", sentence-starting
  words ("Please find"), names in quotes. Every false positive gets stored as an ARTIST preference.
- **Why it is kept despite the false positives:** It is better to over-capture with noisy data
  than to miss artists entirely. The decay mechanism cleans up stale, unreinforced false positives
  over time.
- **Proper fix:** Replace with Named Entity Recognition (NER) — either a lightweight model like
  `compromise.js` or a database lookup against `artistProfile.artistName`. This is the highest-
  priority quality improvement in the preference extraction pipeline.

---

## 16. Token Budget Management

The orchestrator splits `maxContextTokens` (default 2000) across three sections:

```
recent messages:  maxTokens × 0.4  = 800 tokens
episodic memory:  maxTokens × 0.3  = 600 tokens
preferences:      maxTokens × 0.3  = 600 tokens
```

**Recent messages truncation:** If the formatted message history exceeds the sub-budget, it is
sliced from the _end_ (keeping the most recent content):

```typescript
const ratio = maxTokens / estimatedTokens;
const charsToKeep = Math.floor(formatted.length * ratio);
return formatted.slice(-charsToKeep); // trailing slice
```

**Episodic memory truncation:** If the formatted memory text exceeds `maxTokens * 4` characters
(a rough chars-to-tokens conversion), it is sliced from the _start_ (keeping the first/most-
similar memories):

```typescript
return formatted.length > maxChars
  ? `${formatted.slice(0, maxChars)}...`
  : formatted;
```

**Preferences truncation:** The preferences section is not truncated — it is already bounded by
`genrePrefsLimit + artistPrefsLimit + moodPrefsLimit` (5 + 5 + 3 = 13 items maximum), which
produces at most ~150 characters.

**The `tokenCount` field in `EnhancedContext`:** This is the _estimated_ token count of the three
formatted text sections, not the actual billable token count for the request. It is logged for
monitoring purposes and available in `agentContext.metadata.memoryTokenCount` for agents that want
to make decisions based on available context space.

---

## 17. Gotchas and Known Failure Modes

### G1 — pgvector extension missing

**Symptom:** `ERROR: type "vector" does not exist` on every `storeEmbedding` / `searchEmbeddings`
call.

**Cause:** The `vector` extension is not installed in the PostgreSQL database.

**Fix:**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
-- Then re-run migrations to create the conversation_embeddings table
```

**Detection:** `EpisodicMemoryManager` catches this and logs it. Episodic memory will silently
return `[]`. Semantic memory and working memory continue to function.

---

### G2 — Dimension mismatch between adapter config and database column

**Symptom:** `ERROR: expected 1536 dimensions, not 512` (or vice versa).

**Cause:** `OpenAIEmbeddingAdapter` was constructed with `dimensions: 512` but the column is
`vector(1536)`, or `embeddingDimensions: 512` was set in config but the column is `vector(1536)`.

**Fix:** Ensure all three values match: `OpenAIEmbeddingAdapter` constructor, `embeddingDimensions`
in config, and the `vector(N)` declaration in the migration SQL. If you need to change the
dimension, drop and recreate the table:

```sql
DROP TABLE conversation_embeddings;
CREATE TABLE conversation_embeddings (
  embedding VECTOR(512),  -- or whatever dimension you chose
  ...
);
```

---

### G3 — Synthetic message IDs violate the FK constraint

**Symptom:** `ERROR: insert or update on table "conversation_embeddings" violates foreign key
constraint "conversation_embeddings_message_id_fkey"`.

**Cause:** The SSE route synthesises message IDs as `msg_${conversationId}_user_${Date.now()}`
and passes them to `memoryOrchestrator.storeConversation`. These IDs do not exist in
`ai_conversation_messages`. The FK constraint requires that `message_id` references a real row.

**Fix:** This is a known design limitation. One mitigation is to relax the FK on
`conversation_embeddings.message_id`:

```sql
ALTER TABLE conversation_embeddings DROP CONSTRAINT conversation_embeddings_message_id_fkey;
```

Or pass actual message IDs from the database by returning them from `createMessage` and threading
them through to `storeConversation`. The `createMessage` method already returns `{ id: string }`;
the routes just do not currently use that return value.

**Current behaviour:** If this FK violation occurs, `storeEmbedding` throws. `EpisodicMemoryManager`
catches it, logs it, and silently skips storing. The app does not crash.

---

### G4 — `conversationId` not reused between requests

**Symptom:** Working memory always returns `[]`; the model has no memory of prior turns.

**Cause:** The client is generating a new `conversationId` for every request instead of sending
back the ID it received in the previous response.

**Fix:** The client must persist `conversationId` from the `ChatResponse` and send it in the next
request's body. In `bootstrap.ts`, `conversationId` defaults to a randomly generated value if the
client does not provide one — this is the escape hatch for new conversations, not a pattern to
repeat on every turn.

---

### G5 — `chatType` overwritten to `'OTHER'` on repeated stores

**Symptom:** Conversations created via the timeline (`chatType: 'TIMELINE'`) disappear from the
timeline chat history after the next message if that message was sent via a route that passes no
`chatType`.

**Cause:** `PrismaStorageAdapter.upsertConversation` always includes `chatType` in the `update`
clause. If `ConversationStore.storeMessage` is called without a `chatType` argument, it defaults
to `'OTHER'`, and the upsert overwrites the conversation's actual chat type.

**Fix:** Always pass `chatType` explicitly in every `storeMessage` call. The API routes that
correctly handle this use `body.chatType` from the request body.

---

### G6 — Duplicate preference extraction per message (SSE route)

**Symptom:** `occurrence_count` and `implicit_score` grow at twice the expected rate; preferences
accumulate faster than the decay formula predicts.

**Cause:** The SSE route calls `semanticMemoryManager.extractPreferencesFromText` directly
(step 7), and then `memoryOrchestrator.storeConversation` also calls
`semantic.extractPreferencesFromText` internally (step 11). This means every user message runs
two rounds of preference extraction.

**Current status:** Known redundancy. The duplication is effectively a `×2` multiplier on implicit
score accumulation, which the decay formula counteracts over time. For most practical purposes
the difference is not user-visible. A future cleanup should remove one of the two calls.

---

### G7 — `getConversation` returns oldest 6, not newest 6

**Symptom:** In a long conversation (20+ messages), the working memory injected into the agent
contains the first 6 messages, not the last 6.

**Cause:** `PrismaStorageAdapter.getConversationMessages` uses `orderBy: { createdAt: 'asc' },
take: limit`. This returns the first `limit` rows in chronological order — i.e. the oldest
messages.

**Impact:** The agent reads the oldest context rather than the most recent context. In short
conversations (< 6 messages) this is irrelevant. In longer conversations it means the agent
loses track of what was most recently discussed.

**Fix (if needed):** Change the adapter to fetch newest-first and reverse:

```typescript
const messages = await this.prisma.aIConversationMessage.findMany({
  orderBy: { createdAt: 'desc' },
  take: limit,
});
return messages.reverse(); // restore chronological order for the model
```

---

### G8 — Genre table empty returns no genre preferences

**Symptom:** `extractPreferencesFromText` never stores any GENRE preferences despite the user
mentioning genres.

**Cause:** `storage.getActiveGenres()` returns `[]` because the `genres` table has no rows with
`isActive: true`.

**Fix:** Seed the genres table:

```sql
INSERT INTO genres (id, name, slug, aliases, is_active) VALUES
  (gen_random_uuid(), 'Amapiano', 'amapiano', '["piano", "log drum"]', true),
  (gen_random_uuid(), 'Afrobeats', 'afrobeats', '["afrobeat", "afro"]', true),
  ...
```

Or run the genre seed script: `yarn db:studio` to verify, then `yarn prisma:seed` if a seed file
is configured.

---

### G9 — `OPENAI_API_KEY` set but embeddings fail with 401

**Symptom:** `[EpisodicMemory] Failed to store memory: Error: 401 Incorrect API key provided`.
Episodic memory silently disabled despite key being present.

**Cause:** The key value in `.env` is stale, truncated, or prefixed with a space.

**Fix:**

```bash
# Verify the key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -1
# Should return {"object":"list",...} not {"error":...}
```

---

### G10 — Bootstrap evaluated at build time (Next.js)

**Symptom:** Build error like `Error: PrismaClient cannot run in browser context` or
`Missing environment variable: DATABASE_URL` during `next build`.

**Cause:** `bootstrap.ts` creates `new PrismaStorageAdapter(prisma)` at module evaluation time.
If Next.js static analysis runs this module in a browser or edge environment, `prisma` will not
be available.

**Mitigation:** `bootstrap.ts` is imported only from route handlers (`/api/...`) which Next.js
always renders server-side (Node.js). The `export const runtime = 'nodejs'` directive in any
route that imports memory prevents this from being scheduled for edge runtime. If you see this
error, check that none of the routes importing from `bootstrap.ts` has `export const runtime =
'edge'`.

---

### G11 — `getUserConversations` cap of 20

**Symptom:** A user with 30+ conversations does not see all of them in the sidebar.

**Cause:** `PrismaStorageAdapter.getUserConversations` has a hardcoded `take: 20`.

**Fix:** Pass a configurable limit. Currently no config field exists for this. Add
`maxConversationHistory: number` to `MemoryConfig` and thread it through as needed.

---

## 18. Verification Queries

**Check working memory is populating:**

```sql
SELECT id, role, LEFT(content, 80) as content_preview, created_at
FROM ai_conversation_messages
WHERE conversation_id = '<conversationId>'
ORDER BY created_at ASC;
```

**Check semantic memory is accumulating:**

```sql
SELECT
  type,
  entity_name,
  explicit_score,
  implicit_score,
  explicit_score + implicit_score * 0.5 AS base_score,
  occurrence_count,
  last_seen_at,
  half_life_days,
  EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / 86400 AS days_since,
  EXP(-LN(2) * EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / 86400 / half_life_days) AS decay_factor,
  (explicit_score + implicit_score * 0.5)
    * EXP(-LN(2) * EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / 86400 / half_life_days)
    AS decayed_score
FROM user_preferences
WHERE user_id = '<userId>'
ORDER BY decayed_score DESC;
```

**Check episodic memory is storing:**

```sql
SELECT id, LEFT(summary, 100), importance, created_at
FROM conversation_embeddings
WHERE user_id = '<userId>'
ORDER BY created_at DESC
LIMIT 10;
```

**Verify old AIPreferences table is no longer receiving writes:**

```sql
SELECT COUNT(*), MAX(updated_at)
FROM "AIPreferences";
-- updated_at should be older than your deployment date
```

**Test a cosine similarity search manually:**

```sql
-- Requires that you already have embeddings stored
SELECT
  id,
  LEFT(summary, 100),
  importance,
  1 - (embedding <=> (
    SELECT embedding FROM conversation_embeddings
    WHERE user_id = '<userId>'
    ORDER BY created_at DESC LIMIT 1
  )) AS similarity
FROM conversation_embeddings
WHERE user_id = '<userId>'
ORDER BY similarity DESC
LIMIT 5;
```

---

## 19. Cost Estimates

| Component                    | Model/Service                 | Per-call cost        | Daily at 500 active users, 3 messages/user |
| ---------------------------- | ----------------------------- | -------------------- | ------------------------------------------ |
| Episodic store embedding     | OpenAI text-embedding-3-small | ~$0.000002/1K tokens | ~$0.0009/day                               |
| Episodic retrieval embedding | Same                          | ~$0.000002/1K tokens | ~$0.0009/day                               |
| Semantic preference upsert   | PostgreSQL                    | Negligible           | —                                          |
| Working memory fetch         | PostgreSQL                    | Negligible           | —                                          |

Total embedding cost at 500 DAU × 3 messages: **< $0.01 / day < $0.30 / month**.

Vector storage (pgvector):

- Each embedding: 1536 floats × 4 bytes = 6 144 bytes ≈ 6 KB
- At 500 daily conversations: 3 MB/day
- At 500 DAU for one year: ~1 GB

PostgreSQL comfortably handles 1 GB of vector data. For very large deployments (> 10 000 DAU),
consider adding an IVFFlat or HNSW index on the embedding column:

```sql
CREATE INDEX ON conversation_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

This trades index build time and slight accuracy loss for much faster approximate nearest-
neighbour queries.

---

## 20. Retirement: PreferenceTracker

`PreferenceTracker` (previously at `preference-tracker.ts`) was the original preference system.

|                      | Old PreferenceTracker        | New SemanticMemoryManager                           |
| -------------------- | ---------------------------- | --------------------------------------------------- |
| Storage table        | `AIPreferences` (JSONB blob) | `user_preferences` (one row per preference)         |
| Genre list           | 9 hardcoded genres           | All active genres from the database + aliases       |
| Temporal decay       | None                         | Exponential, configurable half-life                 |
| Confidence           | Not tracked                  | 0.0–1.0, stored per row                             |
| Explicit vs implicit | No distinction               | Separate score columns, different weights           |
| Mood detection       | None                         | 6-mood keyword map (extensible)                     |
| Artist detection     | Count-based in JSON          | Capitalised-word heuristic → `user_preferences` row |
| Batch updates        | Sequential                   | `Promise.allSettled` (failures isolated)            |

The `preference-tracker.ts` file has been deleted. The `AIPreferences` table still exists in the
database schema and contains historical data. It is no longer written to. It may be dropped once
confirmed that no reporting queries reference it.

---

## 21. Planned Enhancements

| Enhancement                        | Description                                                                                        | Effort |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| Entity memory wiring               | Write to `conversation_entities` table on each message                                             | Low    |
| Artist NER                         | Replace capitalised-word heuristic with database lookup against `artist_profiles.artistName`       | Medium |
| IVFFlat index on embeddings        | For deployments with > 50K stored embeddings; dramatically speeds up cosine search                 | Low    |
| Preference deletion UI             | Let users clear individual preferences or wipe all memory                                          | Medium |
| Procedural memory                  | Track query style patterns (e.g. "user always uses mood-based queries")                            | High   |
| Memory pruning job                 | Cron to delete `importance < 0.3` embeddings older than 90 days                                    | Low    |
| True message IDs in episodic store | Return real `ai_conversation_message.id` from `createMessage` and thread it to `storeConversation` | Low    |
| Deduplicate preference extraction  | Remove the duplicate `extractPreferencesFromText` call in the SSE route                            | Low    |
| Newest-6 working memory            | Fix the adapter to return the most recent messages, not the oldest                                 | Low    |
| Non-SSE episodic storage           | Call `storeConversation` in the non-SSE route too                                                  | Low    |
