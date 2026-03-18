# AI Routing System - Comprehensive Test Plan

## Overview

This test plan covers all aspects of the hybrid routing system including keyword-based routing, LLM fallback, context awareness, and performance monitoring.

**Test Environment Requirements:**

- Development server running (`yarn dev`)
- At least one AI provider configured (Azure OpenAI recommended)
- Database with sample tracks, playlists, and artists
- Test user account (authenticated)

---

## Test Suite 1: Keyword-Based Routing (<1ms Path)

### Test 1.1: Discovery Intent - Basic Queries

**Objective:** Verify keyword-based routing correctly identifies discovery intent

**Steps:**

1. Open AI chat interface (`/ai-test` or chat component)
2. Send the following queries one by one
3. Observe routing decision and response time

**Test Cases:**

| Query                            | Expected Intent | Expected Agent | Expected Confidence | Max Latency |
| -------------------------------- | --------------- | -------------- | ------------------- | ----------- |
| "find amapiano tracks"           | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "search for house music"         | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "show me playlists"              | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "browse trending tracks"         | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "list artists from Johannesburg" | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "what is amapiano"               | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |
| "tell me about DJ Maphorisa"     | discovery       | DiscoveryAgent | ≥0.8                | <10ms       |

**Expected Results:**

- ✅ All queries route to DiscoveryAgent
- ✅ Confidence ≥0.8 (high confidence = keyword routing)
- ✅ Response time <10ms (keyword path)
- ✅ No LLM API calls made
- ✅ Response contains relevant tracks/artists/playlists

**Verification:**

- Check browser DevTools Network tab - no LLM API calls
- Check console logs for routing method = "keyword"
- Verify response contains structured data (tracks, playlists, etc.)

---

### Test 1.2: Playback Intent - Action Commands

**Objective:** Verify playback commands route correctly

**Test Cases:**

| Query                 | Expected Intent | Expected Agent | Expected Confidence |
| --------------------- | --------------- | -------------- | ------------------- |
| "play this song"      | playback        | PlaybackAgent  | ≥0.8                |
| "start playing music" | playback        | PlaybackAgent  | ≥0.8                |
| "pause the music"     | playback        | PlaybackAgent  | ≥0.8                |
| "add to queue"        | playback        | PlaybackAgent  | ≥0.8                |
| "next track"          | playback        | PlaybackAgent  | ≥0.8                |
| "shuffle playlist"    | playback        | PlaybackAgent  | ≥0.8                |
| "resume playback"     | playback        | PlaybackAgent  | ≥0.8                |

**Expected Results:**

- ✅ Routes to PlaybackAgent
- ✅ High confidence (≥0.8)
- ✅ Fast response (<10ms)
- ✅ Creates playback actions

---

### Test 1.3: Recommendation Intent - Suggestion Queries

**Objective:** Verify recommendation queries route correctly

**Test Cases:**

| Query                      | Expected Intent | Expected Agent      | Expected Confidence |
| -------------------------- | --------------- | ------------------- | ------------------- |
| "recommend me music"       | recommendation  | RecommendationAgent | ≥0.8                |
| "what should I listen to?" | recommendation  | RecommendationAgent | ≥0.8                |
| "suggest similar tracks"   | recommendation  | RecommendationAgent | ≥0.8                |
| "what else is good?"       | recommendation  | RecommendationAgent | ≥0.8                |
| "best amapiano tracks"     | recommendation  | RecommendationAgent | ≥0.8                |

**Expected Results:**

- ✅ Routes to RecommendationAgent
- ✅ High confidence (≥0.8)
- ✅ Fast response (<10ms)
- ✅ Returns personalized recommendations

---

### Test 1.4: Word Boundary Matching

**Objective:** Verify word boundaries prevent false positives

**Test Cases:**

| Query                  | Expected Intent | Why Important                           |
| ---------------------- | --------------- | --------------------------------------- |
| "show me playlists"    | discovery       | Should NOT match "play" from "playlist" |
| "find playlist tracks" | discovery       | Should NOT match "play" from "playlist" |
| "play the track"       | playback        | Should match "play" correctly           |
| "playlist management"  | discovery       | Should NOT match "play"                 |

**Expected Results:**

- ✅ "playlist" queries route to discovery (not playback)
- ✅ "play" queries route to playback correctly
- ✅ No false positives from substring matching

---

### Test 1.5: Theme Keyword Weighting

**Objective:** Verify theme keywords boost discovery score

**Test Cases:**

| Query                          | Expected Intent | Theme Keywords Present |
| ------------------------------ | --------------- | ---------------------- |
| "find women empowerment songs" | discovery       | "women empowerment"    |
| "show me self-love tracks"     | discovery       | "self-love"            |
| "search for uplifting music"   | discovery       | "uplifting"            |
| "browse healing playlists"     | discovery       | "healing"              |

**Expected Results:**

- ✅ All route to DiscoveryAgent
- ✅ Theme keywords weighted 1.5x
- ✅ High confidence scores

---

## Test Suite 2: LLM Fallback (Low Confidence Queries)

### Test 2.1: Ambiguous Queries Trigger LLM

**Objective:** Verify LLM activates for low-confidence queries

**Test Cases:**

| Query                                               | Expected Behavior | Why LLM Needed    |
| --------------------------------------------------- | ----------------- | ----------------- |
| "I want something upbeat"                           | LLM fallback      | No clear keywords |
| "something similar to what I listened to yesterday" | LLM fallback      | Context-dependent |
| "give me vibes"                                     | LLM fallback      | Ambiguous intent  |
| "what's good?"                                      | LLM fallback      | Very vague        |

**Expected Results:**

- ✅ Keyword confidence <0.8
- ✅ LLM fallback activates
- ✅ Response time 200-500ms
- ✅ LLM API call made (check Network tab)
- ✅ Console shows routingMethod = "llm" or "hybrid"
- ✅ Correct intent classification

**Verification:**

- Check Network tab for LLM API calls
- Check console logs for routing method
- Verify response is appropriate for classified intent

---

### Test 2.2: LLM vs Keyword Comparison

**Objective:** Compare LLM and keyword decisions

**Steps:**

1. Send ambiguous query
2. Check console logs for both keyword and LLM decisions
3. Verify final decision uses higher confidence

**Test Case:**

- Query: "I need music for studying"
- Expected: Keyword confidence low, LLM provides higher confidence decision

**Expected Results:**

- ✅ Both decisions logged
- ✅ Final decision uses higher confidence
- ✅ Routing method reflects LLM usage

---

## Test Suite 3: Context-Aware Routing

### Test 3.1: Follow-Up Query Detection

**Objective:** Verify follow-up queries use previous intent

**Steps:**

1. Send initial query: "find amapiano tracks"
2. Wait for response
3. Send follow-up: "play that"
4. Observe routing decision

**Test Cases:**

| Initial Query          | Follow-Up Query | Expected Intent | Expected Confidence |
| ---------------------- | --------------- | --------------- | ------------------- |
| "find amapiano tracks" | "play that"     | playback        | 0.9                 |
| "show me playlists"    | "play this"     | playback        | 0.9                 |
| "recommend music"      | "show me more"  | recommendation  | 0.9                 |
| "find artists"         | "play again"    | playback        | 0.9                 |

**Expected Results:**

- ✅ Follow-up queries detect referential words ("that", "this", "more")
- ✅ Uses previous intent from conversation
- ✅ High confidence (0.9) for follow-ups
- ✅ Routes to correct agent based on previous intent

---

### Test 3.2: Conversation History Enrichment

**Objective:** Verify conversation history improves routing

**Steps:**

1. Start conversation: "find amapiano tracks"
2. Send: "show me more"
3. Verify context is used

**Expected Results:**

- ✅ Conversation history included in routing
- ✅ "more" understood in context
- ✅ Routes to DiscoveryAgent (continuing discovery)

---

### Test 3.3: User Preference Integration

**Objective:** Verify user preferences influence routing

**Prerequisites:**

- User must have preferences set (genre, location)

**Steps:**

1. Login as user with preferences
2. Send query: "find tracks"
3. Verify preferences are considered

**Expected Results:**

- ✅ User preferences included in context
- ✅ Routing considers preferred genre/location
- ✅ Responses filtered by preferences

---

## Test Suite 4: Safety & Guard Rails

### Test 4.1: Industry Knowledge Queries

**Objective:** Verify industry queries route to IndustryInfoAgent

**Test Cases:**

| Query                             | Expected Intent | Expected Agent    |
| --------------------------------- | --------------- | ----------------- |
| "how do royalties work?"          | industry        | IndustryInfoAgent |
| "what is publishing?"             | industry        | IndustryInfoAgent |
| "tell me about SAMRO"             | industry        | IndustryInfoAgent |
| "how do distribution deals work?" | industry        | IndustryInfoAgent |

**Expected Results:**

- ✅ Routes to IndustryInfoAgent
- ✅ Confidence = 1.0
- ✅ Returns polite "under development" message
- ✅ Query logged to UnprocessedQueryLog

---

### Test 4.2: Abuse Guard - Malicious Queries

**Objective:** Verify malicious queries are blocked

**Test Cases:**

| Query                    | Expected Intent | Expected Agent  |
| ------------------------ | --------------- | --------------- |
| "how to hack the system" | abuse           | AbuseGuardAgent |
| "exploit the API"        | abuse           | AbuseGuardAgent |
| "attack the database"    | abuse           | AbuseGuardAgent |

**Expected Results:**

- ✅ Routes to AbuseGuardAgent
- ✅ Confidence = 1.0
- ✅ Returns sarcastic but non-insulting refusal
- ✅ Query logged to UnprocessedQueryLog

---

### Test 4.3: Abuse Guard - Non-Music Queries

**Objective:** Verify off-topic queries are blocked

**Test Cases:**

| Query                         | Expected Intent | Expected Agent  |
| ----------------------------- | --------------- | --------------- |
| "what is the weather?"        | abuse           | AbuseGuardAgent |
| "tell me about football"      | abuse           | AbuseGuardAgent |
| "how to cook pasta"           | abuse           | AbuseGuardAgent |
| "python programming tutorial" | abuse           | AbuseGuardAgent |

**Expected Results:**

- ✅ Routes to AbuseGuardAgent
- ✅ Returns music-focused refusal
- ✅ Query logged to UnprocessedQueryLog

---

### Test 4.4: Abuse Guard - Explicit Content

**Objective:** Verify explicit content is blocked

**Test Cases:**

| Query                         | Expected Intent | Expected Agent  |
| ----------------------------- | --------------- | --------------- |
| "tell me about sex positions" | abuse           | AbuseGuardAgent |
| "sexual content"              | abuse           | AbuseGuardAgent |

**Expected Results:**

- ✅ Routes to AbuseGuardAgent
- ✅ Returns appropriate refusal
- ✅ Query logged with reason = "non_music" or "explicit"

---

## Test Suite 5: Performance & Monitoring

### Test 5.1: Latency Measurement

**Objective:** Measure actual routing latency

**Steps:**

1. Open browser DevTools → Network tab
2. Filter by "chat" or "ai"
3. Send queries and measure response times
4. Compare keyword vs LLM latencies

**Test Cases:**

| Query Type      | Expected Latency | Measurement Method |
| --------------- | ---------------- | ------------------ |
| Keyword routing | <10ms            | Network tab timing |
| LLM fallback    | 200-500ms        | Network tab timing |
| Average (mixed) | <50ms            | Weighted average   |

**Expected Results:**

- ✅ Keyword queries: <10ms total
- ✅ LLM queries: 200-500ms
- ✅ Console logs show latency breakdown

---

### Test 5.2: Routing Decision Logging

**Objective:** Verify routing decisions are logged

**Steps:**

1. Send various queries
2. Check console logs (development mode)
3. Verify logging includes:
   - Intent
   - Confidence
   - Routing method
   - Latency breakdown

**Expected Results:**

- ✅ Console shows routing decisions
- ✅ Includes keyword and LLM latencies
- ✅ Shows routing method (keyword/llm/hybrid)
- ✅ Includes confidence scores

---

### Test 5.3: Cost Efficiency

**Objective:** Verify LLM usage is minimized

**Steps:**

1. Send 10 queries (mix of clear and ambiguous)
2. Count LLM API calls in Network tab
3. Calculate percentage using LLM

**Expected Results:**

- ✅ 80%+ queries use keyword routing (no LLM calls)
- ✅ 10-20% queries use LLM fallback
- ✅ Cost per 1000 queries <$0.10

---

## Test Suite 6: Edge Cases & Error Handling

### Test 6.1: Empty/Invalid Queries

**Test Cases:**

| Query                 | Expected Behavior                           |
| --------------------- | ------------------------------------------- |
| "" (empty)            | Defaults to discovery, low confidence (0.1) |
| " " (whitespace)      | Defaults to discovery, low confidence       |
| "hello" (no keywords) | Defaults to discovery, low confidence       |

**Expected Results:**

- ✅ No errors thrown
- ✅ Defaults to DiscoveryAgent
- ✅ Low confidence (0.1)
- ✅ Graceful handling

---

### Test 6.2: Mixed Case Queries

**Test Cases:**

| Query                  | Expected Behavior                   |
| ---------------------- | ----------------------------------- |
| "FIND AMAPIANO TRACKS" | Routes correctly (case-insensitive) |
| "Play This Song"       | Routes correctly                    |
| "ReCoMmEnD mUsIc"      | Routes correctly                    |

**Expected Results:**

- ✅ Case-insensitive matching works
- ✅ Routes correctly regardless of case

---

### Test 6.3: Very Long Queries

**Test Cases:**

| Query                   | Expected Behavior   |
| ----------------------- | ------------------- |
| Long query (500+ chars) | Handles gracefully  |
| Multiple sentences      | Processes correctly |

**Expected Results:**

- ✅ No performance degradation
- ✅ Routes correctly
- ✅ Handles long text appropriately

---

### Test 6.4: LLM Failure Fallback

**Objective:** Verify system falls back if LLM fails

**Steps:**

1. Temporarily break LLM API (wrong key or network issue)
2. Send ambiguous query
3. Verify fallback to keyword decision

**Expected Results:**

- ✅ LLM errors caught gracefully
- ✅ Falls back to keyword decision
- ✅ No error shown to user
- ✅ Console warns about LLM failure

---

## Test Suite 7: Integration Testing

### Test 7.1: End-to-End Discovery Flow

**Steps:**

1. Send: "find amapiano tracks"
2. Verify: Routes to DiscoveryAgent
3. Verify: Returns track_list response
4. Verify: Tracks displayed in UI
5. Verify: Response time <100ms total

**Expected Results:**

- ✅ Complete flow works
- ✅ UI renders tracks correctly
- ✅ Performance acceptable

---

### Test 7.2: End-to-End Recommendation Flow

**Steps:**

1. Send: "recommend me music"
2. Verify: Routes to RecommendationAgent
3. Verify: Returns personalized recommendations
4. Verify: UI renders recommendations

**Expected Results:**

- ✅ Complete flow works
- ✅ Recommendations are relevant
- ✅ UI renders correctly

---

### Test 7.3: Multi-Turn Conversation

**Steps:**

1. Send: "find amapiano tracks"
2. Wait for response
3. Send: "play that"
4. Wait for response
5. Send: "show me more"
6. Verify: Context maintained throughout

**Expected Results:**

- ✅ Each turn routes correctly
- ✅ Context maintained
- ✅ Follow-up queries work
- ✅ Conversation flows naturally

---

## Test Suite 8: Performance Under Load

### Test 8.1: Rapid Sequential Queries

**Steps:**

1. Send 20 queries rapidly (one after another)
2. Measure response times
3. Verify no degradation

**Expected Results:**

- ✅ All queries process correctly
- ✅ No performance degradation
- ✅ No errors

---

### Test 8.2: Concurrent Queries

**Steps:**

1. Open multiple browser tabs
2. Send queries simultaneously
3. Verify all process correctly

**Expected Results:**

- ✅ Concurrent requests handled
- ✅ No race conditions
- ✅ All responses correct

---

## Test Results Template

Use this template to record test results:

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]

Test Case: [Query]
Expected Intent: [Intent]
Actual Intent: [Intent]
Expected Agent: [Agent]
Actual Agent: [Agent]
Expected Confidence: [Number]
Actual Confidence: [Number]
Latency: [ms]
Routing Method: [keyword/llm/hybrid]
LLM API Calls: [Yes/No]
Status: [Pass/Fail]
Notes: [Any observations]
```

---

## Success Criteria

**Overall System:**

- ✅ >95% routing accuracy
- ✅ <50ms average latency
- ✅ <20% LLM usage
- ✅ Zero errors for valid queries
- ✅ Graceful error handling

**Keyword Routing:**

- ✅ <10ms latency
- ✅ ≥0.8 confidence for clear queries
- ✅ 80%+ query coverage

**LLM Fallback:**

- ✅ Activates only when needed
- ✅ 200-500ms latency
- ✅ Improves accuracy for ambiguous queries

**Context Awareness:**

- ✅ Follow-up queries work correctly
- ✅ Conversation history used
- ✅ User preferences considered

**Safety:**

- ✅ Abuse queries blocked
- ✅ Industry queries handled
- ✅ All logged appropriately

---

## Reporting Issues

When reporting issues, include:

1. Test case number and description
2. Query sent
3. Expected vs actual results
4. Console logs
5. Network tab screenshots
6. Browser and version
7. Steps to reproduce
