# Conversation List Flow - Complete Trace

This document traces the entire flow from when the page loads to when conversations are displayed.

## 📋 Flow Diagram

```
1. Page Load
   ↓
2. ChatLayout Component Mounts
   ↓
3. ChatNavigation Component Mounts
   ↓
4. ConversationList Component Mounts
   ↓
5. useSession() Hook Executes
   ↓
6. Session Status Changes (loading → authenticated/unauthenticated)
   ↓
7. useEffect in ConversationList Triggers
   ↓
8. fetchConversations() Called (if authenticated)
   ↓
9. GET /api/ai/conversations Request Sent
   ↓
10. API Route Handler Executes
    ↓
11. getServerSession() Called
    ↓
12. conversationStore.getUserConversations() Called
    ↓
13. Prisma Query Executes
    ↓
14. Database Query Returns Results
    ↓
15. API Response Sent Back
    ↓
16. Frontend Updates State
    ↓
17. UI Renders Conversations
```

## 🔍 Step-by-Step Breakdown

### Step 1-3: Component Mounting

**Files:**
- `src/app/(chat)/page.tsx` - Landing page
- `src/components/layout/ChatLayout.tsx` - Main layout wrapper
- `src/components/layout/ChatNavigation.tsx` - Left sidebar
- `src/components/ai/ConversationList.tsx` - Conversation list component

**What happens:**
1. Next.js renders the page
2. `ChatLayout` mounts and renders `ChatNavigation`
3. `ChatNavigation` renders `ConversationList`

**Checkpoints:**
- Console: `[ConversationList] useEffect triggered` should appear

### Step 4-6: Session Loading

**File:** `src/components/ai/ConversationList.tsx`

**Code:**
```typescript
const { data: session, status } = useSession();
```

**What happens:**
1. `useSession()` hook from `next-auth/react` starts
2. Initially `status === 'loading'` and `session === undefined`
3. NextAuth fetches session from server
4. Status changes to `'authenticated'` or `'unauthenticated'`

**Checkpoints:**
- Console: `[ConversationList] useEffect triggered` should log:
  - First with `status: 'loading'`
  - Then with `status: 'authenticated'` (if logged in)

### Step 7-8: Effect Trigger and Fetch Call

**File:** `src/components/ai/ConversationList.tsx`

**Code:**
```typescript
useEffect(() => {
  if (status === 'authenticated' && session?.user?.id) {
    fetchConversations();
  }
}, [status, session?.user?.id, fetchConversations]);
```

**What happens:**
1. Effect runs when `status` or `session?.user?.id` changes
2. If authenticated AND userId exists, calls `fetchConversations()`

**Checkpoints:**
- Console: `[ConversationList] Calling fetchConversations`
- Console: `[ConversationList] fetchConversations: Making API call`

### Step 9: API Request

**File:** `src/components/ai/ConversationList.tsx`

**Code:**
```typescript
const response = await fetch('/api/ai/conversations');
```

**What happens:**
1. Browser sends GET request to `/api/ai/conversations`
2. Request includes cookies (for session authentication)

**Checkpoints:**
- **Network Tab:** Should see `GET /api/ai/conversations` request
- Console: `[API] GET /api/ai/conversations - Request received`

### Step 10-11: API Route Handler

**File:** `src/app/api/ai/conversations/route.ts`

**Code:**
```typescript
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  // ...
}
```

**What happens:**
1. Next.js API route handler receives request
2. Calls `getServerSession(authOptions)` to get server-side session
3. Verifies session exists and has `userId`

**Checkpoints:**
- Console: `[API] Getting server session...`
- Console: `[API] Session check:` with session details
- If unauthorized: `[API] ❌ Unauthorized - No session or userId`

### Step 12-13: Database Query

**Files:**
- `src/app/api/ai/conversations/route.ts`
- `src/lib/ai/memory/conversation-store.ts`

**Code:**
```typescript
const conversations = await conversationStore.getUserConversations(session.user.id);
```

**What happens:**
1. Calls `conversationStore.getUserConversations(userId)`
2. Executes Prisma query:
   ```typescript
   prisma.aIConversation.findMany({
     where: { userId },
     orderBy: { updatedAt: 'desc' },
     take: 20,
     select: { id: true, title: true, updatedAt: true },
   })
   ```

**Checkpoints:**
- Console: `[ConversationStore] getUserConversations called with userId:`
- Console: `[ConversationStore] Querying database for conversations...`
- Console: `[ConversationStore] ✅ Database query successful:` with results

### Step 14-15: Response

**File:** `src/app/api/ai/conversations/route.ts`

**Code:**
```typescript
return NextResponse.json({ conversations });
```

**What happens:**
1. API returns JSON response with conversations array
2. Response format: `{ conversations: [{ id, title, updatedAt }, ...] }`

**Checkpoints:**
- Console: `[API] ✅ Conversations fetched:` with count and data
- **Network Tab:** Response should show 200 status and JSON data

### Step 16-17: Frontend Update and Render

**File:** `src/components/ai/ConversationList.tsx`

**Code:**
```typescript
const data = await response.json();
setConversations(data.conversations || []);
```

**What happens:**
1. Frontend receives response
2. Parses JSON and updates state with `setConversations()`
3. Component re-renders with new conversations
4. UI displays conversation list or "No conversations yet" placeholder

**Checkpoints:**
- Console: `[ConversationList] fetchConversations: Response status 200`
- Console: `[ConversationList] fetchConversations: Received data`
- UI should update to show conversations

## 🐛 Common Issues & Debugging

### Issue 1: API Call Never Happens

**Symptoms:**
- No network request in Network tab
- No `[API]` logs in console

**Possible Causes:**
1. Session never becomes `'authenticated'`
2. `session?.user?.id` is undefined
3. Component not mounting
4. useEffect not triggering

**Debug:**
- Check console for `[ConversationList] useEffect triggered` logs
- Verify session status and userId in logs
- Check if user is actually logged in

### Issue 2: 401 Unauthorized

**Symptoms:**
- Network request shows 401 status
- `[API] ❌ Unauthorized` in console

**Possible Causes:**
1. Session expired
2. Cookies not being sent
3. Server-side session not matching client-side session

**Debug:**
- Check cookies in Application tab
- Verify session in browser
- Check server logs for session details

### Issue 3: Empty Array Returned

**Symptoms:**
- API returns 200 with `{ conversations: [] }`
- UI shows "No conversations yet"

**Possible Causes:**
1. User has no conversations in database
2. Wrong userId being queried
3. Database query returning empty results

**Debug:**
- Run diagnostic script: `yarn tsx scripts/check-conversations.ts [userId]`
- Check `[ConversationStore]` logs for query results
- Verify userId matches in database

### Issue 4: Database Query Fails

**Symptoms:**
- `[ConversationStore] ❌ Database query failed` in console
- API returns 500 error

**Possible Causes:**
1. Database connection issue
2. Prisma schema mismatch
3. Table doesn't exist

**Debug:**
- Check database connection
- Run Prisma migrations: `npx prisma migrate deploy`
- Check Prisma schema matches database

## 🧪 Testing Checklist

- [ ] Page loads without errors
- [ ] ConversationList component mounts (check console)
- [ ] Session loads correctly (check status in logs)
- [ ] useEffect triggers when status changes
- [ ] fetchConversations is called (check console)
- [ ] Network request appears in Network tab
- [ ] API route receives request (check server logs)
- [ ] Session is valid on server (check API logs)
- [ ] Database query executes (check ConversationStore logs)
- [ ] Conversations are returned (check API response)
- [ ] UI updates with conversations

## 📝 Diagnostic Script

Run the diagnostic script to check the database directly:

```bash
# Check all users and their conversations
yarn tsx scripts/check-conversations.ts

# Check specific user
yarn tsx scripts/check-conversations.ts <userId>
```

This will:
1. Test database connection
2. List all users
3. Count conversations per user
4. Show conversation details
5. Test the exact query used by the API

## 🔧 Next Steps if Issues Persist

1. **Run diagnostic script** to verify database state
2. **Check console logs** at each step of the flow
3. **Verify session** is valid and userId exists
4. **Check Network tab** for API requests/responses
5. **Verify database** has conversations for the user
6. **Check Prisma migrations** are up to date
