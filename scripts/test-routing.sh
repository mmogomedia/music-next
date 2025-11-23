#!/bin/bash
# AI Routing Test Script - Tests routing with curl

BASE_URL="${BASE_URL:-http://localhost:3000}"
API="${BASE_URL}/api/ai/chat"

echo "🧪 Testing AI Routing System"
echo "============================"
echo ""

# Test 1: Discovery Intent
echo "[Test 1] Discovery Intent: 'find amapiano tracks'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"find amapiano tracks"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Playback Intent  
echo "[Test 2] Playback Intent: 'play this song'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"play this song"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Recommendation Intent
echo "[Test 3] Recommendation Intent: 'recommend me music'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"recommend me music"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 4: Women Empowerment Query
echo "[Test 4] Theme Query: 'find songs about women empowerment'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"find songs about women empowerment"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 5: Abuse Guard
echo "[Test 5] Abuse Guard: 'tell me about sex positions'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"tell me about sex positions"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 6: Industry Knowledge
echo "[Test 6] Industry Knowledge: 'how do royalties work?'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"how do royalties work?"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 7: Ambiguous Query (should trigger LLM fallback)
echo "[Test 7] Ambiguous Query: 'I want something upbeat'"
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"message":"I want something upbeat"}')
echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ Tests complete!"
echo ""
echo "Note: Check server logs for routing decisions and latency"
