# Intent Detection: Current vs Pure LLM Approach

## Current System: Hybrid Keyword + LLM Fallback

### Architecture Overview

```
User Message
    ↓
[1] Keyword-Based Detection (router-intent-detector.ts)
    ├─ Check for abuse/malicious keywords FIRST
    ├─ Check for industry knowledge keywords
    ├─ Calculate keyword scores for:
    │  ├─ Playback keywords (play, pause, skip, etc.)
    │  ├─ Recommendation keywords (recommend, suggest, etc.)
    │  ├─ Discovery keywords (find, search, show, etc.)
    │  └─ Theme keywords (mood, emotion, etc.)
    ├─ Calculate confidence based on keyword count
    └─ Return RoutingDecision with intent + confidence
    ↓
[2] Confidence Check
    ├─ If confidence >= MIN_KEYWORD_CONFIDENCE_THRESHOLD (0.7)
    │  └─ Route directly to agent (FAST PATH - <1ms)
    │
    └─ If confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD
       ↓
       [3] LLM Fallback (IntentClassifierAgent)
           ├─ Build prompt with message + context
           ├─ Call LLM with INTENT_CLASSIFICATION_PROMPT
           ├─ Parse JSON response: { intent, confidence, reasoning }
           └─ Return RoutingDecision (SLOW PATH - 200-500ms)
    ↓
[4] Special Cases (checked at various stages)
    ├─ Ambiguous queries → ClarificationAgent
    ├─ Emotional queries with low confidence → ClarificationAgent
    ├─ Meta-questions → FallbackAgent
    └─ Abuse detection → AbuseGuardAgent (priority)
```

### Current Flow Details

#### Step 1: Keyword Detection (`analyzeIntent()`)

**Location**: `src/lib/ai/agents/router-intent-detector.ts`

**Process**:

1. **Priority Checks** (checked first):
   - Abuse/malicious keywords → `intent: 'abuse'`, `confidence: 1.0`
   - Industry knowledge keywords → `intent: 'industry'`, `confidence: 1.0`
   - Non-music keywords → `intent: 'abuse'`, `confidence: 1.0`

2. **Keyword Scoring**:
   - Count matches for each intent category using word boundaries
   - Scores: `playbackScore`, `recommendationScore`, `discoveryScore`, `themeScore`
   - Theme keywords boost discovery score (weighted)

3. **Confidence Calculation**:
   - 1 keyword = 0.8 confidence
   - 2 keywords = 0.95 confidence
   - 3+ keywords = 1.0 confidence
   - Boost if clear winner (score difference > 1)

4. **Tie Breaking**:
   - If playback === recommendation, use pattern matching
   - Action verbs → playback
   - Question words → recommendation

5. **Default**:
   - No keywords matched → `intent: 'discovery'`, `confidence: 0.1`

**Limitations**:

- ❌ Can't understand context/nuance
- ❌ Misses synonyms and variations
- ❌ False positives from substring matching (mitigated with word boundaries)
- ❌ Requires manual keyword list maintenance
- ❌ Doesn't understand user intent from conversation flow

#### Step 2: LLM Fallback (`IntentClassifierAgent`)

**Location**: `src/lib/ai/agents/intent-classifier-agent.ts`

**Trigger**: When `keywordDecision.confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD (0.7)`

**Process**:

1. Build prompt with:
   - System prompt (`INTENT_CLASSIFICATION_PROMPT`)
   - Conversation history (last 3 messages)
   - User filters (genre, province)
   - Previous intent
   - Current message

2. Call LLM with structured prompt

3. Parse JSON response:

   ```json
   {
     "intent": "discovery|playback|recommendation|industry|abuse",
     "confidence": 0.0-1.0,
     "reasoning": "explanation"
   }
   ```

4. Normalize and validate response

**Current Prompt** (`INTENT_CLASSIFICATION_PROMPT`):

- Defines 5 intent categories
- Provides examples for each
- Instructions for handling edge cases (emotional queries, ambiguous queries)
- Returns JSON format

**Limitations**:

- ⚠️ Only used when keyword confidence is low
- ⚠️ Adds 200-500ms latency when triggered
- ⚠️ May be inconsistent if keyword detection incorrectly routes first

### Current Special Cases

1. **Ambiguous Queries**:
   - Detected by `isTrulyAmbiguous()`: low confidence + no music keywords + short message
   - Routed to `ClarificationAgent` (interactive questions)

2. **Emotional Queries**:
   - Detected by `isEmotionalQuery()`: patterns like "I feel lonely", "I'm sad"
   - Routed to `ClarificationAgent` if low confidence

3. **Meta-Questions**:
   - Detected by `isMetaQuestion()`: "How can I search...", "What can you do..."
   - Routed to `FallbackAgent`

4. **Abuse Detection**:
   - Checked FIRST in keyword detection
   - High priority - never uses clarification

### Current Performance

- **Fast Path** (keyword match, confidence >= 0.7): **<1ms**
- **Slow Path** (LLM fallback): **200-500ms**
- **Accuracy**: ~80%+ handled by keywords, ~20% need LLM

---

## Proposed: Pure LLM-Based Intent Detection

### Architecture Overview

```
User Message
    ↓
[1] LLM Intent Classification (ALWAYS)
    ├─ Build prompt with message + full context
    ├─ Call LLM with enhanced INTENT_CLASSIFICATION_PROMPT
    ├─ Parse structured response
    └─ Return RoutingDecision with intent + confidence
    ↓
[2] Confidence-Based Routing
    ├─ If confidence >= HIGH_CONFIDENCE_THRESHOLD (0.8)
    │  └─ Route directly to agent
    │
    ├─ If confidence < HIGH_CONFIDENCE_THRESHOLD but >= MEDIUM_CONFIDENCE_THRESHOLD (0.5)
    │  └─ Route to agent with lower confidence
    │
    └─ If confidence < MEDIUM_CONFIDENCE_THRESHOLD
       ↓
       [3] Ambiguity Check
           ├─ Check if truly ambiguous
           └─ Route to ClarificationAgent
    ↓
[4] Special Cases (post-LLM)
    ├─ Abuse detection (high confidence) → AbuseGuardAgent
    ├─ Meta-questions → FallbackAgent
    └─ Industry knowledge → IndustryInfoAgent
```

### Pure LLM Flow Details

#### Step 1: LLM Classification (Always First)

**New Location**: `src/lib/ai/agents/router-agent.ts` (modified)

**Process**:

1. **Always call LLM first** (no keyword pre-check)
2. Build enhanced prompt with:
   - System prompt (enhanced `INTENT_CLASSIFICATION_PROMPT`)
   - Full conversation history
   - User preferences (genre, province, listening history)
   - Previous intent
   - Current message
   - Context about available agents

3. Call LLM with structured prompt

4. Parse structured response:

   ```json
   {
     "intent": "discovery|playback|recommendation|industry|abuse|unknown",
     "confidence": 0.0-1.0,
     "reasoning": "detailed explanation",
     "needsClarification": false,
     "isMetaQuestion": false
   }
   ```

5. Validate and normalize response

**Enhanced Prompt** (would include):

- Clear definitions of all intents
- Examples for each intent category
- Instructions for handling:
  - Ambiguous queries
  - Emotional queries
  - Meta-questions
  - Abuse detection
  - Context-aware routing
- Structured JSON output format
- Confidence scoring guidelines

#### Step 2: Confidence-Based Routing

**Thresholds**:

- `HIGH_CONFIDENCE_THRESHOLD = 0.8`: Route directly, no second check
- `MEDIUM_CONFIDENCE_THRESHOLD = 0.5`: Route to agent, but log for review
- `LOW_CONFIDENCE_THRESHOLD = 0.3`: Route to clarification

**Routing Logic**:

```typescript
if (llmDecision.confidence >= 0.8) {
  // High confidence - route directly
  return routeToAgent(llmDecision, message, context);
} else if (llmDecision.confidence >= 0.5) {
  // Medium confidence - route but log
  logMediumConfidence(llmDecision);
  return routeToAgent(llmDecision, message, context);
} else if (llmDecision.confidence >= 0.3) {
  // Low confidence - check if ambiguous
  if (llmDecision.needsClarification) {
    return clarificationAgent.process(message, context);
  }
  return routeToAgent(llmDecision, message, context);
} else {
  // Very low confidence - always clarify
  return clarificationAgent.process(message, context);
}
```

#### Step 3: Special Cases (Post-LLM)

1. **Abuse Detection**:
   - LLM detects abuse with confidence >= 0.8 → `AbuseGuardAgent`
   - LLM detects abuse with confidence < 0.8 → Log and route to `AbuseGuardAgent` (still block)

2. **Meta-Questions**:
   - LLM detects `isMetaQuestion: true` → `FallbackAgent`
   - Or detect in post-processing if LLM returns `intent: 'unknown'` with meta patterns

3. **Industry Knowledge**:
   - LLM detects `intent: 'industry'` → `IndustryInfoAgent`

### Advantages of Pure LLM Approach

✅ **Better Accuracy**:

- Understands context and nuance
- Handles synonyms and variations automatically
- Understands conversation flow
- Better at detecting ambiguous queries

✅ **Simpler Code**:

- Remove keyword lists and matching logic
- Remove complex tie-breaking logic
- Single source of truth (LLM)
- Easier to maintain and update

✅ **More Flexible**:

- Can add new intents without code changes (just prompt updates)
- Can handle edge cases better
- Can learn from conversation context

✅ **Better User Experience**:

- More accurate routing
- Fewer false positives
- Better handling of ambiguous queries

### Disadvantages of Pure LLM Approach

❌ **Latency**:

- Every request requires LLM call (200-500ms)
- No fast path for obvious queries
- Higher API costs

❌ **Cost**:

- Every request uses LLM tokens
- More expensive than keyword matching
- Need to monitor usage

❌ **Reliability**:

- Depends on LLM availability
- May have inconsistent responses
- Need robust error handling

❌ **Complexity**:

- Need to handle LLM failures gracefully
- Need to validate LLM responses
- May need retry logic

### Performance Comparison

| Metric                | Current (Hybrid)        | Pure LLM                  |
| --------------------- | ----------------------- | ------------------------- |
| **Fast Path Latency** | <1ms (80%+ queries)     | N/A (always LLM)          |
| **Slow Path Latency** | 200-500ms (20% queries) | 200-500ms (100% queries)  |
| **Average Latency**   | ~100ms                  | 200-500ms                 |
| **Accuracy**          | ~85-90%                 | ~95%+ (estimated)         |
| **Cost per Request**  | Low (most free)         | Medium-High (always paid) |
| **Maintenance**       | High (keyword lists)    | Low (prompt only)         |

### Implementation Plan

#### Phase 1: Enhance LLM Prompt

1. Update `INTENT_CLASSIFICATION_PROMPT` with:
   - Better examples
   - Clearer intent definitions
   - Instructions for edge cases
   - Structured output format

#### Phase 2: Modify Router Logic

1. Remove keyword detection as primary method
2. Always call LLM first
3. Update confidence thresholds
4. Simplify routing logic

#### Phase 3: Add Fallbacks

1. Add LLM retry logic
2. Add fallback to keyword detection if LLM fails
3. Add caching for common queries (optional)

#### Phase 4: Monitoring & Optimization

1. Add metrics for LLM accuracy
2. Monitor latency and costs
3. Fine-tune prompts based on real data
4. Consider caching for performance

### Code Changes Required

1. **Remove/Simplify**:
   - `router-intent-detector.ts` - Remove or keep as fallback only
   - Keyword lists in `router-keywords.ts` - Keep for fallback
   - Complex routing logic in `router-agent.ts`

2. **Enhance**:
   - `IntentClassifierAgent` - Make it the primary method
   - `INTENT_CLASSIFICATION_PROMPT` - Enhance with better examples
   - `router-agent.ts` - Simplify routing logic

3. **Add**:
   - LLM retry logic
   - Response validation
   - Fallback to keywords if LLM fails
   - Metrics and monitoring

### Recommendation

**Start with Enhanced LLM-First Approach**:

- Use LLM as primary method
- Keep keyword detection as fast fallback for:
  - Obvious abuse (fast blocking)
  - LLM failures
  - Rate limiting scenarios

This gives you:

- ✅ Better accuracy (LLM-first)
- ✅ Reliability (keyword fallback)
- ✅ Performance optimization (caching, fast path for obvious cases)
