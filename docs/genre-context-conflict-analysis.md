# Genre Context Conflict Analysis

## Problem Statement

When a user searches for a different genre after a previous genre search, the context filters from the previous search can conflict with the new explicit genre mention.

**Example Scenario:**

1. User searches: "Show me Afropop tracks"
   - Context filter set: `filters.genre = "Afropop"`
2. User searches: "Show me 3-step songs"
   - Context still has: `filters.genre = "Afropop"`
   - **Conflict**: LLM sees both "3-step" (explicit) and "Afropop" (context)

---

## Where Conflicts Occur

### 1. Router Intent Detection (`enrichMessageWithContext`)

**Location**: `src/lib/ai/agents/router-intent-detector.ts:168-197`

**What happens:**

```typescript
// User message: "show me 3-step songs"
// Context: { filters: { genre: "Afropop" } }

enrichedMessage = 'show me 3-step songs afropop';
```

**Impact**:

- Adds "afropop" to keyword matching
- Could affect discovery score calculation
- Less critical (only affects routing, not tool selection)

---

### 2. DiscoveryAgent Context (`formatContext`)

**Location**: `src/lib/ai/agents/base-agent.ts:87-101`

**What happens:**

```typescript
// User message: "Show me 3-step songs"
// Context: { filters: { genre: "Afropop" } }

fullMessage = 'Show me 3-step songs\n\nContext: Genre: Afropop';
```

**Impact**:

- **CRITICAL**: LLM sees both genres
- LLM might:
  - Use wrong genre in tool call
  - Mix genres in results
  - Get confused about which genre to prioritize

---

### 3. Genre Cluster Filtering

**Location**: `src/lib/ai/agents/discovery-agent.ts:296-311`

**What happens:**

```typescript
// If LLM calls get_tracks_by_genre("Afropop") instead of "3-step"
// due to context confusion:

resolvedGenreCluster = ["afropop", "afro pop", ...] // Wrong genre!
// Filters out all 3-step tracks
```

**Impact**:

- Wrong genre cluster resolved
- Correct tracks filtered out
- User gets wrong results

---

## Current Behavior

### Scenario: "Show me 3-step songs" (after Afropop search)

**Step 1: Router Intent Detection**

```
enrichedMessage = "show me 3-step songs afropop"
discoveryScore = 2 ("show", "songs")
→ Routes to DiscoveryAgent ✓
```

**Step 2: DiscoveryAgent Processing**

```
fullMessage = "Show me 3-step songs\n\nContext: Genre: Afropop"
```

**LLM Decision (Unpredictable):**

- Option A: Uses "3-step" (correct) → `get_tracks_by_genre("3-step")` ✓
- Option B: Uses "Afropop" (wrong) → `get_tracks_by_genre("Afropop")` ✗
- Option C: Confused, uses both → Mixed results ✗

**Step 3: Genre Cluster Filtering**

```
// If Option B or C:
aggregated.meta.genre = "Afropop" (from tool result)
resolvedGenreCluster = ["afropop", ...]
→ Filters out all 3-step tracks ✗
```

---

## Proposed Solutions

### Solution 1: Detect Explicit Genre Override (Recommended)

**Detect when user explicitly mentions a genre and override context filters.**

**Implementation:**

1. Extract genre from user message (explicit mention)
2. If explicit genre differs from context filter, clear/override context filter
3. Update prompt to prioritize explicit mentions

**Code Changes:**

```typescript
// In DiscoveryAgent.process()
protected extractExplicitGenre(message: string): string | null {
  // Extract genre from message using genre list
  // Return genre if found, null otherwise
}

async process(message: string, context?: AgentContext): Promise<AgentResponse> {
  const explicitGenre = this.extractExplicitGenre(message);

  // Override context filter if explicit genre differs
  const effectiveContext = explicitGenre && context?.filters?.genre !== explicitGenre
    ? {
        ...context,
        filters: {
          ...context.filters,
          genre: explicitGenre, // Override with explicit
        }
      }
    : context;

  const contextMessage = this.formatContext(effectiveContext);
  // ... rest of processing
}
```

**Pros:**

- Explicit user intent always wins
- Clear priority: explicit > context
- Minimal changes

**Cons:**

- Requires genre extraction logic
- Need to handle genre aliases/variations

---

### Solution 2: Clear Context Filters on Genre Change

**Automatically clear context filters when new genre is detected.**

**Implementation:**

1. Detect genre change in user message
2. Clear `context.filters.genre` if different genre mentioned
3. Let LLM use only explicit genre

**Code Changes:**

```typescript
// In RouterAgent.route() or DiscoveryAgent.process()
function detectGenreChange(
  message: string,
  currentFilter?: string
): { hasNewGenre: boolean; newGenre?: string } {
  // Extract genre from message
  // Compare with currentFilter
  // Return if different
}

// Clear filter if genre changed
if (
  genreChange.hasNewGenre &&
  genreChange.newGenre !== context?.filters?.genre
) {
  context = {
    ...context,
    filters: {
      ...context.filters,
      genre: undefined, // Clear old filter
    },
  };
}
```

**Pros:**

- Prevents conflicts
- Simple logic

**Cons:**

- Loses user preferences
- Might not preserve province filters

---

### Solution 3: Update Prompt to Prioritize Explicit Mentions

**Make LLM aware that explicit genre mentions override context.**

**Implementation:**
Update `DISCOVERY_SYSTEM_PROMPT`:

```typescript
export const DISCOVERY_SYSTEM_PROMPT = `...
- CRITICAL: If the user explicitly mentions a genre in their message (e.g., "3-step", "Amapiano"), use THAT genre, NOT the context filter genre.
- Context filters (Genre, Province) are preferences from previous searches, but explicit mentions in the current query take priority.
- Example: If context says "Genre: Afropop" but user asks "Show me 3-step songs", use "3-step" as the genre.
...`;
```

**Pros:**

- No code changes needed
- LLM handles it intelligently

**Cons:**

- Not guaranteed (LLM might still get confused)
- Relies on LLM following instructions

---

### Solution 4: Make Context Filters "Preferences" Not "Requirements"

**Change context format to indicate preferences vs requirements.**

**Implementation:**

```typescript
// Change formatContext to indicate preference
protected formatContext(context?: AgentContext): string {
  if (!context) return '';

  let contextStr = '';
  if (context.filters) {
    if (context.filters.genre) {
      contextStr += ` User's previous genre preference: ${context.filters.genre} (use only if not explicitly mentioned in current query)`;
    }
    // ...
  }
  return contextStr.trim();
}
```

**Pros:**

- Clear distinction
- LLM understands priority

**Cons:**

- Still relies on LLM
- More verbose context

---

## Recommended Approach: Hybrid Solution

**Combine Solution 1 + Solution 3:**

1. **Detect explicit genre** and override context filter (Solution 1)
2. **Update prompt** to reinforce explicit > context (Solution 3)
3. **Add logging** to track when conflicts occur

**Benefits:**

- Code-level protection (Solution 1)
- LLM-level guidance (Solution 3)
- Monitoring (logging)

---

## Implementation Plan

### Phase 1: Genre Extraction Utility

- Create `extractGenreFromMessage()` function
- Handle genre aliases and variations
- Return normalized genre name

### Phase 2: Context Override Logic

- Add explicit genre detection in `DiscoveryAgent.process()`
- Override context filter when explicit genre differs
- Preserve other context (province, conversation history)

### Phase 3: Prompt Update

- Update `DISCOVERY_SYSTEM_PROMPT` to prioritize explicit mentions
- Add examples of genre override scenarios

### Phase 4: Testing

- Test: "Show me Afropop" → "Show me 3-step songs"
- Test: "Show me Amapiano" → "Show me more" (should keep Amapiano)
- Test: Genre aliases ("3 Step" vs "3-step")

---

## Edge Cases to Consider

1. **Follow-up queries**: "Show me more" should keep previous genre
2. **Genre aliases**: "3 Step" vs "3-step" vs "3step"
3. **Multiple genres**: "Show me Amapiano and Afropop" (rare)
4. **Province filters**: Should province filter also be cleared?
5. **Compile intent**: "Compile a 3-step playlist" (explicit genre)

---

## Questions for Discussion

1. Should we clear context filters entirely or just override genre?
2. How should we handle "Show me more" (follow-up) vs "Show me 3-step" (new genre)?
3. Should province filters also be cleared when genre changes?
4. Do we need to track genre changes in conversation history?
