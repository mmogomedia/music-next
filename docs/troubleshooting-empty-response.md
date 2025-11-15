# Troubleshooting: Empty AI Response

## Issue

When querying "find me Amapiano tracks", the API returns an empty message:

```json
{
  "message": "",
  "conversationId": "conv_...",
  "timestamp": "..."
}
```

## Possible Causes

### 1. Agent Returning Empty Content

The LangChain agent is returning `content: ""` without a text response.

### 2. Tool Calls Only

The agent is making tool calls but not providing a text response alongside them.

### 3. API Key Issues

The OpenAI API key might not be working correctly.

## Debugging Steps

### Check Server Logs

Look for these log messages:

- `Routing to DiscoveryAgent with intent: discovery (confidence: 0.95)`
- `Discovery Agent Response: { content: ..., toolCalls: X }`
- `Router Agent Response: { hasMessage: ..., messageLength: ... }`
- `Agent execution error: ...`

### Test Locally

```bash
# In one terminal, start dev server
yarn dev

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "find me Amapiano tracks"}'
```

### Check API Key

```bash
# Make sure your API key is set
cat .env.local | grep AZURE_OPENAI_API_KEY
# or, if using OpenAI directly
cat .env.local | grep OPENAI_API_KEY

# Should show:
# AZURE_OPENAI_API_KEY=...
# OPENAI_API_KEY=sk-...
```

## Current Status

✅ Error handling added  
✅ Logging added  
✅ Fallback messages implemented

Now when you retry:

- You should see detailed logs in the console
- You'll get a fallback message if agent fails
- Better error messages if API key is wrong

## Next Steps

1. **Try the query again** - You should see logs or a fallback message
2. **Share the logs** - If it still fails, share the server console output
3. **Check the fallback message** - You should at least see: "I'm here to help you discover great South African music!"

---

**The integration is complete but the agent execution needs debugging. The added logging will help identify the issue.**
