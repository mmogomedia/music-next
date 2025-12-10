# Tool Debugging Guide

## Overview

This guide explains how to debug discovery tools and see which tools are called, for which messages, and with what parameters.

## Enhanced Logging

The tool executor now includes comprehensive debugging information that shows:

1. **Original User Message**: The exact message that triggered the tool calls
2. **Tool Name**: Which tool was called
3. **Parameters**: The exact parameters passed to each tool
4. **Execution Results**: Success/failure status and latency

## Where to Find Debug Information

### 1. Server Console Logs

All tool calls are logged to the server console with clear markers:

```
[ToolExecutor] ===== TOOL EXECUTION START =====
Original Message: find amapiano tracks
Tools Available: [search_tracks, get_tracks_by_genre, ...]

[ToolExecutor] ===== TOOL CALL =====
Original Message: find amapiano tracks
Tool Name: get_tracks_by_genre
Parameters: { genre: "Amapiano", limit: 20 }

[ToolExecutor] ===== TOOL INVOCATION =====
Original Message: find amapiano tracks
Tool: get_tracks_by_genre
Parameters: {
  "genre": "Amapiano",
  "limit": 20
}

[ToolExecutor] ===== TOOL SUCCESS =====
Original Message: find amapiano tracks
Tool: get_tracks_by_genre
Parameters: { ... }
Latency: 245ms
Result Type: string

[ToolExecutor] ===== TOOL EXECUTION COMPLETE =====
Original Message: find amapiano tracks
Total Iterations: 1
Tools Called: [get_tracks_by_genre]
Total Tool Calls: 1
```

### 2. Application Logs (Structured)

The logger also outputs structured JSON logs that can be filtered:

```json
{
  "level": "info",
  "message": "[ToolExecutor] Processing tool call:",
  "originalMessage": "find amapiano tracks",
  "toolName": "get_tracks_by_genre",
  "parameters": { "genre": "Amapiano", "limit": 20 },
  "toolCallId": "call_abc123"
}
```

### 3. SSE Events (Browser)

SSE events now include the original message in the `calling_tool` event:

```json
{
  "type": "calling_tool",
  "tool": "get_tracks_by_genre",
  "message": "Finding tracks by genre...",
  "parameters": { "genre": "Amapiano", "limit": 20 },
  "originalMessage": "find amapiano tracks",
  "stage": "tool_execution",
  "timestamp": "2025-11-23T10:00:00.000Z"
}
```

## Filtering Logs

### By Message

Search for a specific user message:

```bash
# In server logs
grep "find amapiano tracks" logs/server.log

# Or filter by originalMessage in structured logs
jq 'select(.originalMessage == "find amapiano tracks")' logs/server.log
```

### By Tool

Find all calls to a specific tool:

```bash
grep "get_tracks_by_genre" logs/server.log
```

### By Parameters

Find tool calls with specific parameters:

```bash
grep '"genre": "Amapiano"' logs/server.log
```

## Example Debug Session

### 1. Send a message in the browser:

```
"find amapiano tracks"
```

### 2. Check server console for:

```
[ToolExecutor] ===== TOOL EXECUTION START =====
Original Message: find amapiano tracks
Tools Available: [search_tracks, get_tracks_by_genre, get_playlists_by_genre, ...]

[ToolExecutor] ===== TOOL CALL =====
Original Message: find amapiano tracks
Tool Name: get_tracks_by_genre
Parameters: { genre: "Amapiano", limit: 20 }
```

### 3. Check browser console (SSE events):

```javascript
// In browser DevTools Network tab, filter by EventStream
// Look for calling_tool events with originalMessage field
```

## Debugging Tips

1. **Watch for Tool Selection**: The LLM decides which tools to call based on the message. Check the logs to see if the right tool was selected.

2. **Parameter Validation**: Verify that parameters match what you expect. Common issues:
   - Genre names not matching database values
   - Limit values exceeding expected ranges
   - Missing required parameters

3. **Tool Execution Order**: Tools are called in the order the LLM decides. Check the iteration number to see the sequence.

4. **Error Handling**: If a tool fails, check the error logs for:
   - Parameter validation errors
   - Database query failures
   - Service errors

## Common Debugging Scenarios

### Scenario 1: Wrong Tool Called

**Problem**: User says "find amapiano" but `search_tracks` is called instead of `get_tracks_by_genre`

**Debug Steps**:

1. Check the original message in logs
2. Verify the LLM's tool selection reasoning
3. Check if the system prompt needs adjustment

### Scenario 2: Wrong Parameters

**Problem**: Tool is called with incorrect genre name

**Debug Steps**:

1. Check the `parameters` field in logs
2. Verify genre extraction logic
3. Check if genre aliases are working

### Scenario 3: No Results

**Problem**: Tool executes successfully but returns no results

**Debug Steps**:

1. Check the `resultCount` in logs
2. Verify the parameters match database values
3. Check if filters are too restrictive

## Log Levels

- **INFO**: Tool calls, parameters, execution start/end
- **DEBUG**: Detailed parameter parsing, intermediate steps
- **ERROR**: Tool execution failures, parameter validation errors

## Next Steps

To enable more detailed debugging:

1. Set log level to DEBUG in your environment
2. Use structured logging to filter by message or tool
3. Monitor SSE events in browser DevTools
4. Check server console for real-time debugging
