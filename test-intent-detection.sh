#!/bin/bash

# Test script for pure LLM intent detection
# Tests 10 different prompts to verify routing

echo "=== Test 1: Clear Discovery Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"find amapiano tracks"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 2: Clear Playback Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"play this song"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 3: Clear Recommendation Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"what should I listen to?"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 4: Industry Knowledge Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"how do royalties work?"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 5: Abuse/Non-Music Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"tell me about the weather"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 6: Ambiguous/Emotional Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"I am lonely"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"|"needsClarification"' | head -2
echo ""

echo "=== Test 7: Meta-Question ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I search for a song here"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"|"isMetaQuestion"' | head -2
echo ""

echo "=== Test 8: Vague/Low Confidence Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"music"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 9: Context-Dependent Query ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"show me more"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== Test 10: Edge Case - How to make a song ==="
curl -s -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"How do you make a song"}' \
  --no-buffer 2>&1 | grep -E '"intent"|"confidence"|"method"|"agent"' | head -1
echo ""

echo "=== All tests completed ==="

