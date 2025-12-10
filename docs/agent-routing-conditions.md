# Agent Routing Conditions

This document outlines the conditions for routing user queries to different agents in the Flemoji AI system.

## Routing Flow Overview

The routing system uses a **priority-based approach** with multiple checks:

1. **Early Ambiguity Check** (before keyword analysis)
2. **Abuse Detection** (highest priority)
3. **Keyword-Based Routing** (fast path)
4. **Clarification Check** (for ambiguous queries)
5. **LLM Fallback** (when keyword confidence is low)
6. **Post-LLM Clarification Check** (final safety net)

## Configuration Thresholds

```typescript
MIN_KEYWORD_CONFIDENCE_THRESHOLD = 0.8; // Below this, use LLM fallback
MAX_CLARIFICATION_CONFIDENCE_THRESHOLD = 0.3; // Below this, use clarification
```

## Agent Routing Conditions

### 1. ClarificationAgent

**Priority: HIGHEST (checked first)**

**Conditions:**

- Message is ambiguous (checked WITHOUT conversation history)
- AND one of:
  - `isTrulyAmbiguous(message, originalDecision)` = true
  - OR `isEmotionalQuery(message)` = true AND confidence <= 0.3
- AND `originalDecision.intent !== 'abuse'`
- AND `!hasStrongContext(context)` (no active filters or previous intent)

**When checked:**

1. **Early check** (line 138): Before keyword analysis with history
2. **After keyword** (line 239): If keyword confidence <= 0.3
3. **After LLM** (line 388): If LLM result still ambiguous (confidence <= 0.3)

**Examples:**

- "I am lonely" → ClarificationAgent
- "I feel sad" → ClarificationAgent
- "help me" → ClarificationAgent

---

### 2. AbuseGuardAgent

**Priority: HIGH (checked immediately after early ambiguity check)**

**Conditions:**

- Keyword detection finds abuse with confidence >= 0.8
- OR LLM classifies as abuse with confidence >= 0.8
  - BUT: If it's an ambiguous emotional query, route to ClarificationAgent instead

**When checked:**

1. **After keyword** (line 218): If `keywordDecision.intent === 'abuse'` AND `confidence >= 0.8`
2. **After LLM** (line 284): If `llmDecision.intent === 'abuse'` AND `confidence >= 0.8`
   - Exception: If ambiguous emotional query → ClarificationAgent

**Examples:**

- "tell me about weather" → AbuseGuardAgent
- "how to hack" → AbuseGuardAgent
- "I am lonely" → NOT abuse (goes to ClarificationAgent)

---

### 3. IndustryInfoAgent

**Priority: MEDIUM (checked in keyword analysis)**

**Conditions:**

- Keyword detection finds industry knowledge keywords
- Examples: "royalties", "publishing", "SAMRO", "music industry"

**When checked:**

- During keyword analysis (router-intent-detector.ts)

**Examples:**

- "how do royalties work?" → IndustryInfoAgent
- "tell me about SAMRO" → IndustryInfoAgent

---

### 4. PlaybackAgent

**Priority: MEDIUM-HIGH (checked in keyword analysis)**

**Conditions:**

- Keyword detection finds playback keywords
- Examples: "play", "pause", "queue", "skip", "next", "previous"
- OR action verbs in message

**When checked:**

- During keyword analysis (router-intent-detector.ts)
- Priority order: playback > recommendation > discovery

**Examples:**

- "play this song" → PlaybackAgent
- "add to queue" → PlaybackAgent
- "pause music" → PlaybackAgent

---

### 5. RecommendationAgent

**Priority: MEDIUM (checked in keyword analysis)**

**Conditions:**

- Keyword detection finds recommendation keywords
- Examples: "recommend", "suggest", "what should I", "what else is good"
- OR question words asking for suggestions

**When checked:**

- During keyword analysis (router-intent-detector.ts)
- After playback intent (lower priority)

**Examples:**

- "recommend me music" → RecommendationAgent
- "what should I listen to?" → RecommendationAgent
- "suggest similar tracks" → RecommendationAgent

---

### 6. DiscoveryAgent

**Priority: LOWEST (default fallback)**

**Conditions:**

- No other intent matches
- OR keyword detection finds discovery keywords
- Examples: "find", "search", "show", "who is", "tell me about"
- OR default when no keywords match (confidence = 0.1)

**When checked:**

- Default fallback in keyword analysis
- Used when confidence is low and no clarification is needed

**Examples:**

- "find amapiano tracks" → DiscoveryAgent
- "show me playlists" → DiscoveryAgent
- "who is DJ Maphorisa" → DiscoveryAgent

---

## Helper Functions

### `isTrulyAmbiguous(message, decision)`

Returns `true` if:

- `decision.confidence <= 0.2`
- AND (no music keywords OR no explicit actions)
- AND (message is short < 5 words OR intent is discovery/abuse)

### `isEmotionalQuery(message)`

Returns `true` if message matches emotional patterns:

- "I feel lonely", "I am sad", "I'm happy"
- "feeling anxious", "feeling stressed"
- "celebrating", "mourning", "healing", etc.

### `hasStrongContext(context)`

Returns `true` if:

- Active genre filter exists
- OR active province filter exists
- OR previous intent exists

**Note:** Conversation history alone is NOT strong context.

---

## Routing Decision Flow

```
1. Early Ambiguity Check
   ├─ Ambiguous + No Strong Context → ClarificationAgent
   └─ Continue to keyword analysis

2. Keyword Analysis (with conversation history)
   ├─ Abuse (confidence >= 0.8) → AbuseGuardAgent
   ├─ Industry → IndustryInfoAgent
   ├─ Playback → PlaybackAgent
   ├─ Recommendation → RecommendationAgent
   └─ Discovery (default)

3. Clarification Check (after keyword)
   ├─ Confidence <= 0.3 + Ambiguous → ClarificationAgent
   └─ Continue

4. LLM Fallback (if keyword confidence < 0.8)
   ├─ Abuse (confidence >= 0.8) → AbuseGuardAgent
   │   └─ BUT: If ambiguous emotional → ClarificationAgent
   ├─ Still ambiguous (confidence <= 0.3) → ClarificationAgent
   └─ Use LLM decision

5. Final Routing
   └─ Route to agent based on final decision
```

---

## Key Points

1. **Abuse detection is prioritized** - checked immediately and never uses clarification
2. **Ambiguous queries ignore conversation history** - checked first without history enrichment
3. **Emotional queries are ambiguous** - "I am lonely" should always use clarification
4. **Strong context overrides clarification** - active filters or previous intent skip clarification
5. **Multiple clarification checks** - early, after keyword, and after LLM
