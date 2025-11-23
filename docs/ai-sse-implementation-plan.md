# AI Chat SSE (Server-Sent Events) Implementation Plan

## Overview

Implement Server-Sent Events (SSE) to provide real-time status updates during AI processing, giving users visibility into what the system is doing at each stage.

## Goals

1. **User Experience**: Show users what's happening during AI processing
2. **Transparency**: Display routing decisions, tool calls, and processing stages
3. **Feedback**: Provide status updates for long-running operations (LLM calls, tool execution)
4. **Debugging**: Help developers understand system behavior

## Current State

**Existing SSE Implementation:**

- ✅ SSE already used for dashboard activity streams (`/api/dashboard/activity/stream`)
- ✅ Pattern established: `ReadableStream` with `text/event-stream` content type
- ✅ Client-side: `EventSource` API for receiving events
- ✅ Heartbeat mechanism for connection keep-alive

**Current AI Chat Flow:**

- User sends message → POST `/api/ai/chat`
- Server processes synchronously
- Returns complete response when done
- User sees loading state but no progress updates

## Proposed SSE Flow

```
User sends message
    ↓
[SSE Connection Established]
    ↓
[Status: "analyzing_intent"] ← Keyword analysis
    ↓
[Status: "routing"] ← Routing decision made
    ↓
[Status: "llm_classifying"] ← If LLM fallback (optional)
    ↓
[Status: "agent_processing"] ← Agent working
    ↓
[Status: "calling_tool"] ← Tool execution (if needed)
    ↓
[Status: "processing_results"] ← Processing tool results
    ↓
[Status: "finalizing"] ← Building response
    ↓
[Status: "complete"] + Final Response
```

## Status Event Types

### 1. Connection & Lifecycle

```typescript
{
  type: 'connected',
  timestamp: string
}

{
  type: 'error',
  message: string,
  code?: string
}

{
  type: 'complete',
  data: ChatResponse
}
```

### 2. Routing Status

```typescript
{
  type: 'analyzing_intent',
  message: 'Analyzing your request...',
  stage: 'intent_analysis'
}

{
  type: 'routing_decision',
  intent: 'discovery' | 'playback' | 'recommendation' | 'industry' | 'abuse',
  confidence: number,
  method: 'keyword' | 'llm' | 'hybrid',
  agent: string,
  latency?: {
    keyword?: number,
    llm?: number,
    total: number
  }
}

{
  type: 'llm_classifying',
  message: 'Understanding your request...',
  stage: 'llm_classification'
}
```

### 3. Agent Processing

```typescript
{
  type: 'agent_processing',
  agent: 'DiscoveryAgent' | 'PlaybackAgent' | 'RecommendationAgent' | ...,
  message: 'Searching for tracks...',
  stage: 'agent_execution'
}
```

### 4. Tool Execution

```typescript
{
  type: 'calling_tool',
  tool: 'search_tracks' | 'get_tracks_by_genre' | 'get_playlists_by_genre' | ...,
  message: 'Searching tracks matching your query...',
  parameters?: Record<string, any>,
  stage: 'tool_execution'
}

{
  type: 'tool_result',
  tool: string,
  resultCount?: number,
  message?: string,
  stage: 'tool_complete'
}
```

### 5. Result Processing

```typescript
{
  type: 'processing_results',
  message: 'Processing search results...',
  stage: 'result_processing'
}

{
  type: 'finalizing',
  message: 'Preparing your response...',
  stage: 'finalization'
}
```

## Implementation Architecture

### Backend: SSE Endpoint

**New Route:** `/api/ai/chat/stream`

**Flow:**

1. Accept POST request with message
2. Create SSE stream
3. Emit status events at each stage
4. Stream final response when complete
5. Close stream

**Key Stages to Emit:**

```typescript
// Stage 1: Intent Analysis
emit({ type: 'analyzing_intent', ... });
const keywordDecision = analyzeIntent(message, context);
emit({ type: 'routing_decision', ... });

// Stage 2: LLM Fallback (if needed)
if (confidence < threshold) {
  emit({ type: 'llm_classifying', ... });
  const llmDecision = await classifyIntent(...);
  emit({ type: 'routing_decision', ... });
}

// Stage 3: Agent Processing
emit({ type: 'agent_processing', agent: decision.agent, ... });

// Stage 4: Tool Calls (if agent uses tools)
for (const toolCall of toolCalls) {
  emit({ type: 'calling_tool', tool: toolCall.name, ... });
  const result = await executeTool(toolCall);
  emit({ type: 'tool_result', tool: toolCall.name, ... });
}

// Stage 5: Finalization
emit({ type: 'processing_results', ... });
emit({ type: 'finalizing', ... });
emit({ type: 'complete', data: finalResponse });
```

### Frontend: EventSource Integration

**Update AIChat Component:**

```typescript
// Replace current fetch with EventSource
const eventSource = new EventSource(
  `/api/ai/chat/stream?message=${encodeURIComponent(message)}`
);

eventSource.onmessage = event => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'analyzing_intent':
      setStatus('Analyzing your request...');
      break;
    case 'routing_decision':
      setStatus(`Routing to ${data.agent}...`);
      break;
    case 'calling_tool':
      setStatus(`Searching ${data.tool}...`);
      break;
    case 'complete':
      setResponse(data.data);
      eventSource.close();
      break;
  }
};
```

## Detailed Status Messages

### User-Friendly Messages

| Stage                                 | Message                                     |
| ------------------------------------- | ------------------------------------------- |
| analyzing_intent                      | "Understanding what you're looking for..."  |
| routing_decision (keyword)            | "Found what you need! Routing instantly..." |
| routing_decision (llm)                | "Analyzing your request more carefully..."  |
| agent_processing (discovery)          | "Searching our music library..."            |
| agent_processing (playback)           | "Preparing playback..."                     |
| agent_processing (recommendation)     | "Finding personalized recommendations..."   |
| calling_tool (search_tracks)          | "Searching tracks..."                       |
| calling_tool (get_tracks_by_genre)    | "Finding tracks by genre..."                |
| calling_tool (get_playlists_by_genre) | "Discovering playlists..."                  |
| processing_results                    | "Processing results..."                     |
| finalizing                            | "Almost done..."                            |

## Implementation Phases

### Phase 1: Basic SSE Endpoint

**Goal:** Create SSE endpoint with basic status updates

**Tasks:**

1. Create `/api/ai/chat/stream` route
2. Implement ReadableStream with SSE format
3. Emit status events at key stages:
   - Intent analysis start
   - Routing decision
   - Agent processing start
   - Completion
4. Return final response as "complete" event

**Files:**

- `src/app/api/ai/chat/stream/route.ts` (new)
- Update `src/components/ai/AIChat.tsx` to use SSE

---

### Phase 2: Detailed Tool Status

**Goal:** Show individual tool calls and results

**Tasks:**

1. Emit events when tools are called
2. Show tool name and parameters
3. Emit tool completion with result count
4. Handle multiple tool calls in sequence

**Files:**

- Update agent processing to emit tool events
- Update frontend to display tool status

---

### Phase 3: LLM Status Updates

**Goal:** Show LLM processing status

**Tasks:**

1. Emit event when LLM fallback activates
2. Show LLM classification progress
3. Display confidence comparison
4. Show why LLM was used

**Files:**

- Update RouterAgent to emit LLM events
- Update IntentClassifierAgent to emit progress

---

### Phase 4: Error Handling & Recovery

**Goal:** Handle errors gracefully with SSE

**Tasks:**

1. Emit error events with details
2. Show recovery attempts
3. Provide fallback messages
4. Close stream on error

**Files:**

- Error handling in SSE stream
- Frontend error display

---

### Phase 5: Performance Metrics

**Goal:** Show performance data in real-time

**Tasks:**

1. Emit latency metrics
2. Show routing method breakdown
3. Display cost estimates (if applicable)
4. Performance insights

**Files:**

- Include metrics in status events
- Frontend metrics display

## Technical Considerations

### 1. Request Method

**Option A: POST with SSE Response**

- Accept POST request body
- Return SSE stream
- More complex but supports request body

**Option B: GET with Query Parameters**

- Simple SSE connection
- Limited by URL length
- Less secure for sensitive data

**Recommendation:** Option A (POST with SSE)

### 2. Stream Management

**Connection Lifecycle:**

- Open stream on request
- Emit events as processing happens
- Close stream on completion or error
- Handle client disconnection gracefully

**Error Handling:**

- Catch errors at each stage
- Emit error events
- Close stream cleanly
- Don't expose sensitive error details

### 3. Frontend Integration

**EventSource API:**

```typescript
const eventSource = new EventSource('/api/ai/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ message, context }),
  headers: { 'Content-Type': 'application/json' },
});
```

**Note:** Standard EventSource doesn't support POST. Options:

1. Use fetch with ReadableStream
2. Use library like `eventsource` that supports POST
3. Use WebSocket instead (more complex)

**Recommendation:** Use fetch with ReadableStream for POST support

### 4. Status UI Components

**Status Indicator:**

- Show current stage
- Display progress (if applicable)
- Show tool being called
- Display estimated time remaining

**Example UI:**

```
[Analyzing intent...] → [Routing to DiscoveryAgent...] → [Searching tracks...] → [Processing results...] → [Complete]
```

## Status Event Schema

```typescript
interface StatusEvent {
  type:
    | 'connected'
    | 'analyzing_intent'
    | 'routing_decision'
    | 'llm_classifying'
    | 'agent_processing'
    | 'calling_tool'
    | 'tool_result'
    | 'processing_results'
    | 'finalizing'
    | 'complete'
    | 'error';

  message?: string;
  stage?: string;
  timestamp: string;

  // Routing-specific
  intent?: string;
  confidence?: number;
  method?: 'keyword' | 'llm' | 'hybrid';
  agent?: string;
  latency?: {
    keyword?: number;
    llm?: number;
    total: number;
  };

  // Tool-specific
  tool?: string;
  parameters?: Record<string, any>;
  resultCount?: number;

  // Completion
  data?: ChatResponse;

  // Error
  error?: {
    message: string;
    code?: string;
  };
}
```

## Example Flow

### User Query: "find amapiano tracks"

**SSE Events Emitted:**

```json
{"type":"connected","timestamp":"2025-01-22T10:00:00Z"}

{"type":"analyzing_intent","message":"Understanding what you're looking for...","stage":"intent_analysis","timestamp":"2025-01-22T10:00:00.100Z"}

{"type":"routing_decision","intent":"discovery","confidence":0.95,"method":"keyword","agent":"DiscoveryAgent","latency":{"keyword":0.8,"total":0.8},"timestamp":"2025-01-22T10:00:00.101Z"}

{"type":"agent_processing","agent":"DiscoveryAgent","message":"Searching our music library...","stage":"agent_execution","timestamp":"2025-01-22T10:00:00.102Z"}

{"type":"calling_tool","tool":"get_tracks_by_genre","message":"Finding Amapiano tracks...","parameters":{"genre":"Amapiano","limit":10},"stage":"tool_execution","timestamp":"2025-01-22T10:00:00.150Z"}

{"type":"tool_result","tool":"get_tracks_by_genre","resultCount":10,"message":"Found 10 tracks","stage":"tool_complete","timestamp":"2025-01-22T10:00:00.500Z"}

{"type":"processing_results","message":"Processing search results...","stage":"result_processing","timestamp":"2025-01-22T10:00:00.501Z"}

{"type":"finalizing","message":"Preparing your response...","stage":"finalization","timestamp":"2025-01-22T10:00:00.600Z"}

{"type":"complete","data":{"message":"Here are some Amapiano tracks...","data":{"type":"track_list","data":{"tracks":[...]}}},"timestamp":"2025-01-22T10:00:00.650Z"}
```

## Benefits

1. **User Experience**: Users see progress instead of just loading spinner
2. **Transparency**: Users understand what's happening
3. **Debugging**: Developers can see system behavior in real-time
4. **Trust**: Users know the system is working, not frozen
5. **Education**: Users learn what the AI can do

## Challenges & Solutions

### Challenge 1: POST with SSE

**Problem:** Standard EventSource doesn't support POST
**Solution:** Use fetch with ReadableStream, or use library like `eventsource` with POST support

### Challenge 2: Stream Lifecycle

**Problem:** Need to manage stream lifecycle properly
**Solution:** Emit events at each stage, close stream on completion/error

### Challenge 3: Error Handling

**Problem:** Errors need to be communicated via SSE
**Solution:** Emit error events with details, close stream gracefully

### Challenge 4: Performance

**Problem:** SSE adds overhead
**Solution:** Only emit meaningful events, batch if needed

## Testing Plan

### Test Suite 1: SSE Connection & Lifecycle

**Objective:** Verify SSE connection works correctly

**Test Cases:**

| Test Case                    | Steps             | Expected Result                      |
| ---------------------------- | ----------------- | ------------------------------------ |
| Connection establishment     | Open SSE stream   | Receives `connected` event           |
| Stream closure on completion | Complete query    | Stream closes after `complete` event |
| Stream closure on error      | Trigger error     | Stream closes after `error` event    |
| Client disconnect handling   | Close browser tab | Server cleans up gracefully          |
| Heartbeat mechanism          | Wait 30+ seconds  | Receives `heartbeat` events          |

**Verification:**

- Check Network tab for SSE connection
- Verify events received in order
- Check server logs for cleanup

---

### Test Suite 2: Status Event Emission

**Objective:** Verify status events are emitted at correct stages

**Test Cases:**

#### 2.1: Intent Analysis Events

| Query                  | Expected Events                         |
| ---------------------- | --------------------------------------- |
| "find amapiano tracks" | `analyzing_intent` → `routing_decision` |
| "play this song"       | `analyzing_intent` → `routing_decision` |

**Expected Results:**

- ✅ `analyzing_intent` emitted before routing
- ✅ `routing_decision` includes intent, confidence, method, agent
- ✅ Events received in correct order

#### 2.2: LLM Fallback Events

| Query                     | Expected Events                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| "I want something upbeat" | `analyzing_intent` → `routing_decision` (low conf) → `llm_classifying` → `routing_decision` (updated) |

**Expected Results:**

- ✅ `llm_classifying` emitted when LLM activates
- ✅ Second `routing_decision` shows LLM method
- ✅ Latency includes LLM timing

#### 2.3: Agent Processing Events

| Query                  | Expected Events                     |
| ---------------------- | ----------------------------------- |
| "find amapiano tracks" | `agent_processing` (DiscoveryAgent) |
| "play this song"       | `agent_processing` (PlaybackAgent)  |

**Expected Results:**

- ✅ `agent_processing` emitted with correct agent name
- ✅ Message describes what agent is doing

#### 2.4: Tool Execution Events

| Query                  | Expected Events                                         |
| ---------------------- | ------------------------------------------------------- |
| "find amapiano tracks" | `calling_tool` (get_tracks_by_genre) → `tool_result`    |
| "show me playlists"    | `calling_tool` (get_playlists_by_genre) → `tool_result` |

**Expected Results:**

- ✅ `calling_tool` emitted before tool execution
- ✅ Tool name and parameters included
- ✅ `tool_result` emitted after completion
- ✅ Result count included

---

### Test Suite 3: Event Order & Timing

**Objective:** Verify events are emitted in correct order

**Test Case: Complete Flow**

**Query:** "find amapiano tracks"

**Expected Event Sequence:**

1. `connected`
2. `analyzing_intent`
3. `routing_decision` (intent: discovery, method: keyword)
4. `agent_processing` (agent: DiscoveryAgent)
5. `calling_tool` (tool: get_tracks_by_genre)
6. `tool_result` (tool: get_tracks_by_genre, resultCount: 10)
7. `processing_results`
8. `finalizing`
9. `complete` (with full response)

**Verification:**

- Events received in order
- No missing events
- No duplicate events
- Timing between events reasonable

---

### Test Suite 4: Error Handling

**Objective:** Verify errors are handled gracefully via SSE

**Test Cases:**

| Scenario               | Expected Behavior                                |
| ---------------------- | ------------------------------------------------ |
| LLM API failure        | Emit `error` event, fallback to keyword decision |
| Tool execution failure | Emit `error` event, show error message           |
| Invalid query          | Emit `error` event, close stream                 |
| Network timeout        | Emit `error` event, close stream                 |

**Expected Results:**

- ✅ Error events emitted with details
- ✅ Stream closes gracefully
- ✅ User sees error message
- ✅ No crashes or unhandled errors

---

### Test Suite 5: Performance & Latency

**Objective:** Measure SSE overhead and performance

**Test Cases:**

| Metric                 | Measurement                 | Expected         |
| ---------------------- | --------------------------- | ---------------- |
| Event emission latency | Time between stages         | <10ms per event  |
| Total SSE overhead     | Compare with/without SSE    | <50ms additional |
| Stream establishment   | Time to first event         | <100ms           |
| Event processing       | Client-side processing time | <5ms per event   |

**Verification:**

- Measure timestamps in events
- Compare total time with/without SSE
- Check browser performance

---

### Test Suite 6: Frontend Integration

**Objective:** Verify frontend correctly handles SSE events

**Test Cases:**

| Test Case           | Steps                  | Expected Result            |
| ------------------- | ---------------------- | -------------------------- |
| Status display      | Send query             | Status updates shown in UI |
| Progress indicator  | Send query             | Progress updates correctly |
| Error display       | Trigger error          | Error shown to user        |
| Multiple queries    | Send 3 queries rapidly | Each has own status        |
| Connection recovery | Disconnect/reconnect   | Reconnects gracefully      |

**Expected Results:**

- ✅ Status updates visible in UI
- ✅ Progress indicator works
- ✅ Errors displayed correctly
- ✅ Multiple queries handled independently
- ✅ Connection recovery works

---

### Test Suite 7: Edge Cases

**Objective:** Test edge cases and unusual scenarios

**Test Cases:**

| Scenario                     | Expected Behavior                   |
| ---------------------------- | ----------------------------------- |
| Very fast query (<10ms)      | Events still emitted (may be rapid) |
| Very slow query (>5s)        | Status updates throughout           |
| Empty query                  | Error event emitted                 |
| Very long query (500+ chars) | Processes correctly                 |
| Concurrent queries           | Each has independent stream         |
| Rapid query cancellation     | Stream closes, no errors            |

---

### Test Suite 8: Browser Compatibility

**Objective:** Verify SSE works across browsers

**Test Browsers:**

- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

**Test Cases:**

- Connection establishment
- Event reception
- Error handling
- Stream closure

---

## Test Implementation

### Unit Tests

**File:** `src/app/api/ai/chat/stream/__tests__/route.test.ts`

```typescript
describe('AI Chat SSE Endpoint', () => {
  it('emits connected event on stream start', async () => {
    // Test connection establishment
  });

  it('emits analyzing_intent event', async () => {
    // Test intent analysis event
  });

  it('emits routing_decision event', async () => {
    // Test routing decision event
  });

  it('emits tool execution events', async () => {
    // Test tool call events
  });

  it('emits complete event with response', async () => {
    // Test completion event
  });

  it('handles errors gracefully', async () => {
    // Test error events
  });
});
```

### Integration Tests

**File:** `src/lib/ai/agents/__tests__/sse-integration.test.ts`

```typescript
describe('SSE Integration with Agents', () => {
  it('emits events during router processing', async () => {
    // Test router emits events
  });

  it('emits events during agent processing', async () => {
    // Test agent emits events
  });

  it('emits events during tool execution', async () => {
    // Test tool execution emits events
  });
});
```

### E2E Tests

**File:** `e2e/ai-chat-sse.spec.ts`

```typescript
test('complete SSE flow for discovery query', async ({ page }) => {
  // Open chat
  // Send query
  // Verify status events received
  // Verify final response
});

test('SSE error handling', async ({ page }) => {
  // Trigger error
  // Verify error event received
  // Verify UI shows error
});
```

### Manual Testing Checklist

**Setup:**

- [ ] Development server running
- [ ] AI provider configured
- [ ] Browser DevTools open (Network tab)
- [ ] Console open for logs

**Test Flow:**

1. [ ] Open AI chat interface
2. [ ] Open DevTools → Network → Filter "stream"
3. [ ] Send query: "find amapiano tracks"
4. [ ] Verify SSE connection established
5. [ ] Verify events received in order:
   - [ ] `connected`
   - [ ] `analyzing_intent`
   - [ ] `routing_decision`
   - [ ] `agent_processing`
   - [ ] `calling_tool`
   - [ ] `tool_result`
   - [ ] `processing_results`
   - [ ] `finalizing`
   - [ ] `complete`
6. [ ] Verify status updates in UI
7. [ ] Verify final response displayed
8. [ ] Verify stream closes

**Test Different Query Types:**

- [ ] Discovery query (keyword routing)
- [ ] Ambiguous query (LLM fallback)
- [ ] Playback query
- [ ] Recommendation query
- [ ] Error scenario

**Test Edge Cases:**

- [ ] Rapid query cancellation
- [ ] Multiple concurrent queries
- [ ] Network disconnection
- [ ] Very long query
- [ ] Empty query

---

## Test Results Template

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]

Query: [Query]
Expected Events: [List]
Actual Events: [List]
Event Order: [Correct/Incorrect]
Timing: [ms]
Status Display: [Working/Not Working]
Errors: [Any errors]
Status: [Pass/Fail]
Notes: [Observations]
```

---

## Success Criteria

**SSE Connection:**

- ✅ Connection established <100ms
- ✅ Events received reliably
- ✅ Stream closes gracefully
- ✅ No connection leaks

**Event Emission:**

- ✅ All expected events emitted
- ✅ Events in correct order
- ✅ Event data complete and accurate
- ✅ Timing reasonable

**Frontend Integration:**

- ✅ Status updates visible
- ✅ UI responsive
- ✅ Errors handled gracefully
- ✅ Multiple queries work independently

**Performance:**

- ✅ SSE overhead <50ms
- ✅ Event emission <10ms per event
- ✅ No performance degradation
- ✅ Memory usage acceptable

---

## Next Steps

1. Review and approve this plan
2. Implement Phase 1 (Basic SSE Endpoint)
3. **Write unit tests for SSE endpoint**
4. **Write integration tests for agent SSE integration**
5. **Manual testing with test plan**
6. Test with real queries
7. Iterate based on feedback
8. Implement remaining phases
9. **Complete test coverage**
10. Update documentation
