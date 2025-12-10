# Ambiguous Queries Improvement Plan

## Problem Statement

**Core Issue:** Queries where user intent is not explicitly stated or is ambiguous.

**Examples:**

- "I feel lonely today" (emotional state, no clear music intent)
- "What's good?" (vague, could be discovery or recommendation)
- "Help me" (no context, completely ambiguous)
- "I need something" (vague request)
- "Show me stuff" (ambiguous discovery)
- "What should I do?" (could be recommendation or general question)

**Current Behavior:**

- Defaults to `DiscoveryAgent` with confidence `0.1` when no keywords match
- Triggers LLM fallback (IntentClassifierAgent) when confidence < threshold
- LLM still routes to one of existing agents (discovery/playback/recommendation)
- **Problem:** Even with LLM, ambiguous queries may be misrouted or handled poorly

---

## Current System Analysis

### How Ambiguous Queries Are Currently Handled

**Example: "I feel lonely today"**

1. **Keyword Analysis:**
   - No playback keywords match
   - No recommendation keywords match
   - No discovery keywords match
   - No theme keywords match
   - **Result:** `maxScore = 0`

2. **Default Routing:**

   ```typescript
   // router-intent-detector.ts:298-303
   if (maxScore === 0) {
     return {
       intent: 'discovery',
       confidence: 0.1, // Very low confidence
       agent: 'DiscoveryAgent',
     };
   }
   ```

3. **LLM Fallback (if confidence < threshold):**
   - IntentClassifierAgent analyzes query
   - Still routes to one of: discovery/playback/recommendation/industry/abuse
   - **Issue:** May not be the best fit for ambiguous queries

4. **Agent Processing:**
   - DiscoveryAgent receives ambiguous query
   - LLM must interpret intent AND execute search
   - **Issue:** Two-step interpretation (routing + execution) may lose context

### Current Gaps

1. **No Ambiguity Detection**
   - System doesn't recognize when a query is ambiguous
   - Always routes to an agent, even when intent is unclear

2. **No Clarification Mechanism**
   - Can't ask user for clarification
   - Must guess intent and proceed

3. **Limited Context Usage**
   - Conversation history used for follow-ups ("play that")
   - Not used to disambiguate vague queries

4. **Single Intent Assumption**
   - Assumes one clear intent per query
   - Can't handle multi-intent or truly ambiguous queries

5. **Default to Discovery**
   - All ambiguous queries default to discovery
   - May not be appropriate (e.g., "help me" might want recommendations)

---

## Proposed Solutions

### Option 1: Enhanced Context-Aware Routing ⭐ RECOMMENDED

**Approach:** Improve routing intelligence using conversation history, user preferences, and better ambiguity detection.

**Key Changes:**

1. **Ambiguity Detection**

   ```typescript
   // Detect truly ambiguous queries
   function isAmbiguousQuery(message: string, scores: IntentScores): boolean {
     // Ambiguous if:
     // - All scores are 0 (no keywords match)
     // - Multiple scores are very close (tie situation)
     // - Query is very short/vague (< 3 words, no clear verbs)
     return (
       maxScore === 0 || (maxScore - secondMaxScore < 0.2 && maxScore < 0.5)
     );
   }
   ```

2. **Context-Enhanced Routing**

   ```typescript
   // Use conversation history to disambiguate
   function enrichWithContext(message: string, context: AgentContext) {
     // If previous intent was recommendation, ambiguous query likely wants recommendation
     // If previous intent was discovery, ambiguous query likely wants discovery
     // If user has active filters (genre, province), ambiguous query likely wants discovery
     // If user has listening history, ambiguous query might want recommendation
   }
   ```

3. **Smart Defaults Based on Context**
   ```typescript
   // Instead of always defaulting to discovery:
   if (isAmbiguousQuery(message, scores)) {
     // Use context to choose better default
     if (context.previousIntent === 'recommendation') {
       return { intent: 'recommendation', confidence: 0.6 };
     }
     if (context.filters?.genre) {
       return { intent: 'discovery', confidence: 0.6 };
     }
     if (context.userId && hasListeningHistory(context.userId)) {
       return { intent: 'recommendation', confidence: 0.6 };
     }
     // Fallback to discovery
     return { intent: 'discovery', confidence: 0.5 };
   }
   ```

**Pros:**

- Leverages existing context
- No new agents needed
- Improves routing accuracy
- Fast to implement

**Cons:**

- Still requires guessing intent
- No clarification mechanism

---

### Option 2: Clarification Agent (Moderate Change)

**Approach:** Add ability to ask clarifying questions when intent is truly ambiguous.

**Key Changes:**

1. **New Clarification Response Type**

   ```typescript
   interface ClarificationResponse extends AgentResponse {
     type: 'clarification';
     question: string;
     options?: string[]; // e.g., ["Find music", "Get recommendations", "Play something"]
   }
   ```

2. **Clarification Detection**

   ```typescript
   // In router, detect when clarification is needed
   if (isAmbiguousQuery(message) && !hasEnoughContext(context)) {
     return {
       intent: 'clarification',
       agent: 'ClarificationAgent',
       question: 'What would you like to do?',
       options: ['Find music', 'Get recommendations', 'Play something'],
     };
   }
   ```

3. **ClarificationAgent**
   ```typescript
   class ClarificationAgent extends BaseAgent {
     // Asks clarifying questions
     // Routes to appropriate agent based on user response
   }
   ```

**Pros:**

- Handles truly ambiguous queries
- Better user experience
- Reduces misrouting

**Cons:**

- Adds extra interaction step
- More complex flow
- May slow down user experience

---

### Option 3: Multi-Intent Handling (Advanced)

**Approach:** Allow agents to handle queries that might have multiple intents.

**Key Changes:**

1. **Multi-Intent Detection**

   ```typescript
   interface MultiIntentDecision {
     primaryIntent: AgentIntent;
     secondaryIntents: AgentIntent[];
     confidence: number;
   }
   ```

2. **Hybrid Agent Responses**
   - DiscoveryAgent can also provide recommendations
   - RecommendationAgent can also discover new music
   - Agents become more flexible

**Pros:**

- Handles complex queries
- More natural interactions

**Cons:**

- Significant refactoring
- More complex agent logic
- May reduce specialization

---

### Option 4: Enhanced LLM Classification (Balanced)

**Approach:** Improve IntentClassifierAgent to better handle ambiguous queries with more context.

**Key Changes:**

1. **Better Prompt for Ambiguous Queries**

   ```typescript
   // Enhanced INTENT_CLASSIFICATION_PROMPT
   `
   For ambiguous queries (e.g., "I feel lonely", "What's good?", "Help me"):
   - Use conversation history to infer intent
   - Consider user's previous actions (discovery vs recommendation)
   - If user has active genre/province filters, prefer discovery
   - If user has listening history, consider recommendation
   - When truly ambiguous, prefer discovery (most common intent)
   `;
   ```

2. **More Context in Classification**

   ```typescript
   // Pass more context to LLM
   const classificationContext = {
     message,
     conversationHistory: context.conversationHistory,
     previousIntent: context.metadata?.previousIntent,
     activeFilters: context.filters,
     userPreferences: getUserPreferences(context.userId),
   };
   ```

3. **Confidence Thresholds**
   ```typescript
   // Different thresholds for different scenarios
   if (keywordConfidence < 0.3 && hasContext(context)) {
     // Use LLM with context
   } else if (keywordConfidence < 0.1) {
     // Use LLM without context (truly ambiguous)
   }
   ```

**Pros:**

- Leverages existing LLM infrastructure
- Better context usage
- Moderate changes

**Cons:**

- Still requires LLM call
- May be slower than keyword routing

---

## Recommended Approach: Hybrid (Option 1 + Option 4)

### Implementation Plan

#### Phase 1: Ambiguity Detection & Context Enhancement (2-3 hours)

1. **Add Ambiguity Detection Function**

   ```typescript
   // src/lib/ai/agents/router-intent-detector.ts
   function isAmbiguousQuery(
     message: string,
     scores: IntentScores,
     context?: RouterContext
   ): boolean {
     // Check if query is truly ambiguous
     const maxScore = Math.max(...Object.values(scores));
     const scoreSpread = calculateScoreSpread(scores);

     return (
       maxScore === 0 || // No keywords matched
       (maxScore < 0.3 && scoreSpread < 0.2) || // Low scores, close together
       isVagueQuery(message) // Very short/vague
     );
   }
   ```

2. **Enhance Context Usage**

   ```typescript
   // Use context to disambiguate
   function getContextualDefault(context?: RouterContext): RoutingDecision {
     // Previous intent
     if (context?.previousIntent) {
       return {
         intent: context.previousIntent as AgentIntent,
         confidence: 0.7, // Higher confidence with context
         agent: getAgentForIntent(context.previousIntent),
       };
     }

     // Active filters suggest discovery
     if (context?.filters?.genre || context?.filters?.province) {
       return {
         intent: 'discovery',
         confidence: 0.6,
         agent: 'DiscoveryAgent',
       };
     }

     // Default to discovery
     return {
       intent: 'discovery',
       confidence: 0.5, // Higher than current 0.1
       agent: 'DiscoveryAgent',
     };
   }
   ```

3. **Update Router Logic**
   ```typescript
   // In analyzeIntent()
   if (maxScore === 0) {
     // Check if we have context to disambiguate
     if (isAmbiguousQuery(message, scores, context)) {
       return getContextualDefault(context);
     }
     // Otherwise, use LLM fallback
   }
   ```

#### Phase 2: Enhanced LLM Classification (2-3 hours)

1. **Improve IntentClassifierAgent Prompt**

   ```typescript
   // src/lib/ai/agents/agent-prompts.ts
   // Add section for ambiguous queries:
   `
   **Handling Ambiguous Queries:**
   When the user's intent is unclear (e.g., "I feel lonely", "What's good?", "Help me"):
   - Use conversation history: If previous intent was X, likely wants X again
   - Consider active filters: Genre/province filters suggest discovery intent
   - Consider user behavior: Recent listening suggests recommendation intent
   - When truly ambiguous: Default to discovery (most common intent)
   - Provide higher confidence (0.6-0.7) when context supports the decision
   `;
   ```

2. **Pass More Context to LLM**
   ```typescript
   // In IntentClassifierAgent.buildClassificationPrompt()
   const contextInfo = `
   Previous Intent: ${context.metadata?.previousIntent || 'none'}
   Active Filters: ${JSON.stringify(context.filters || {})}
   Conversation Length: ${context.conversationHistory?.length || 0}
   `;
   ```

#### Phase 3: Better Defaults (1-2 hours)

1. **Increase Default Confidence**

   ```typescript
   // Instead of 0.1, use 0.5 when we have some context
   // Use 0.3 when we have no context (still better than 0.1)
   ```

2. **Context-Based Confidence**
   ```typescript
   // Confidence based on available context
   const confidence = hasPreviousIntent
     ? 0.7
     : hasActiveFilters
       ? 0.6
       : hasConversationHistory
         ? 0.5
         : 0.3; // Still better than 0.1
   ```

#### Phase 4: Testing & Refinement (2-3 hours)

1. **Test Ambiguous Queries**
   - "I feel lonely today"
   - "What's good?"
   - "Help me"
   - "I need something"
   - "Show me stuff"
   - "What should I do?"

2. **Measure Improvements**
   - Confidence scores (should be > 0.3 for ambiguous queries)
   - Routing accuracy
   - User satisfaction

---

## Success Metrics

1. **Confidence Scores**
   - Ambiguous queries should have confidence > 0.3 (vs current 0.1)
   - Context-aware queries should have confidence > 0.5

2. **Routing Accuracy**
   - Correct agent selection for ambiguous queries
   - Better use of conversation history

3. **User Experience**
   - Fewer misrouted queries
   - More relevant responses
   - Smoother conversation flow

---

## Example Scenarios

### Scenario 1: "I feel lonely today" (No Context)

**Current:**

- Confidence: 0.1
- Intent: discovery
- Agent: DiscoveryAgent

**Improved:**

- Detected as ambiguous
- No context available
- Confidence: 0.3 (better than 0.1)
- Intent: discovery (reasonable default)
- Agent: DiscoveryAgent

### Scenario 2: "What's good?" (With Previous Recommendation)

**Current:**

- Confidence: 0.1
- Intent: discovery
- Agent: DiscoveryAgent

**Improved:**

- Detected as ambiguous
- Previous intent: recommendation
- Confidence: 0.7 (high, based on context)
- Intent: recommendation
- Agent: RecommendationAgent

### Scenario 3: "Help me" (With Active Genre Filter)

**Current:**

- Confidence: 0.1
- Intent: discovery
- Agent: DiscoveryAgent

**Improved:**

- Detected as ambiguous
- Active filter: genre = "Amapiano"
- Confidence: 0.6 (moderate, based on filter)
- Intent: discovery
- Agent: DiscoveryAgent

---

## Next Steps

1. **Review & Approve Plan**
   - Discuss approach
   - Choose implementation option
   - Set priorities

2. **Implement Phase 1**
   - Add ambiguity detection
   - Enhance context usage
   - Update router logic

3. **Test & Iterate**
   - Test with ambiguous queries
   - Measure improvements
   - Refine based on results

4. **Monitor & Optimize**
   - Track ambiguous query performance
   - Adjust confidence thresholds
   - Improve context usage

---

## Questions for Discussion

1. **Should we ask for clarification or always guess?**
   - Recommendation: Guess with context, only ask if truly impossible

2. **What confidence threshold should trigger LLM fallback?**
   - Current: MIN_KEYWORD_CONFIDENCE_THRESHOLD
   - Should we lower it for ambiguous queries with context?

3. **How much context should we use?**
   - Just previous intent?
   - Active filters?
   - User preferences?
   - Listening history?

4. **Should we log ambiguous queries separately?**
   - Track which ambiguous queries are most common
   - Identify patterns for improvement
