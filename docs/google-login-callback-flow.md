# Google Login Callback Flow

## Overview

This document traces the complete flow of what happens when a user logs in with Google OAuth.

## Flow Diagram

```
User clicks "Continue with Google"
    ↓
SignInForm.tsx: signIn('google', { callbackUrl, redirect: !onSuccess })
    ↓
NextAuth redirects to Google OAuth consent screen
    ↓
User authorizes on Google
    ↓
Google redirects to: /api/auth/callback/google
    ↓
NextAuth processes callback through authOptions callbacks
    ↓
Redirect to callbackUrl (or default)
```

## Step-by-Step Breakdown

### 1. **User Initiates Google Login**

**Location**: `src/components/auth/SignInForm.tsx:133`

```typescript
onPress={() => signIn('google', { callbackUrl, redirect: !onSuccess })}
```

**What happens**:

- `callbackUrl` comes from login page: defaults to `/dashboard` (from `src/app/(auth)/login/page.tsx:10`)
- `redirect: !onSuccess` means:
  - If `onSuccess` callback exists → `redirect: false` (client-side redirect)
  - If no `onSuccess` → `redirect: true` (server-side redirect by NextAuth)

### 2. **NextAuth Handles OAuth Flow**

**Location**: `src/app/api/auth/[...nextauth]/route.ts`

NextAuth automatically:

1. Redirects user to Google OAuth consent screen
2. User authorizes on Google
3. Google redirects back to: `/api/auth/callback/google?code=...&state=...`

### 3. **NextAuth Processes Callback**

**Location**: `src/lib/auth.ts`

NextAuth processes the callback through these callbacks in order:

#### 3.1. **signIn Callback** (Lines 60-74)

```typescript
async signIn({ user, account }) {
  // For OAuth providers, check if user is active
  if (account?.provider === 'google') {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    // If user exists but is inactive, deny sign in
    if (dbUser && !dbUser.isActive) {
      return false; // ❌ Sign in denied
    }
  }

  return true; // ✅ Sign in allowed
}
```

**What happens**:

- Checks if user exists in database by email
- If user exists but `isActive === false`, sign in is denied
- Otherwise, sign in is allowed
- **Note**: If user doesn't exist, PrismaAdapter will create them automatically

#### 3.2. **PrismaAdapter User Creation/Update**

**Location**: NextAuth's PrismaAdapter (automatic)

**If user doesn't exist**:

- Creates new user in database with these defaults (from Prisma schema):
  - `role`: `USER` (default from schema)
  - `isPremium`: `false` (default)
  - `isActive`: `true` (default)
  - `email`: From Google OAuth
  - `name`: From Google OAuth (if available)
  - `image`: From Google OAuth profile picture (if available)
- Links Google account via `Account` model
- Creates `VerificationToken` if email verification is enabled

**If user exists**:

- Updates account linking if needed (creates/updates `Account` record)
- Keeps existing user data (role, isPremium, etc.)
- Updates `emailVerified` timestamp if email matches

#### 3.3. **jwt Callback** (Lines 75-85)

```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    token.isPremium = user.isPremium;
    token.isActive = user.isActive;
  }
  return token;
}
```

**What happens**:

- When user object is present (first time after sign in):
  - Adds `role` to JWT token
  - Adds `isPremium` to JWT token
  - Adds `isActive` to JWT token
- Returns token with user data

#### 3.4. **session Callback** (Lines 86-95)

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub as string;
    session.user.role = token.role as string | undefined;
    session.user.isPremium = token.isPremium as boolean | undefined;
    session.user.isActive = token.isActive as boolean | undefined;
  }
  return session;
}
```

**What happens**:

- Adds user ID, role, isPremium, isActive to session object
- This session data is available in client components via `useSession()`

### 4. **Redirect After Authentication**

**Current Behavior**: No explicit `redirect` callback is defined in `authOptions`

**NextAuth Default Behavior**:

- If `redirect: true` was passed to `signIn()`:
  - NextAuth redirects to `callbackUrl` query parameter
  - Or defaults to `/` (root)
- If `redirect: false` was passed:
  - NextAuth returns to the page that called `signIn()`
  - Client-side code handles redirect (via `useEffect` in SignInForm)

**In Your Case**:

- `redirect: !onSuccess` means:
  - **With onSuccess**: `redirect: false` → Client handles redirect via `useEffect` (line 29-35)
  - **Without onSuccess**: `redirect: true` → NextAuth redirects to `callbackUrl`

### 5. **Client-Side Redirect (if redirect: false)**

**Location**: `src/components/auth/SignInForm.tsx:29-35`

```typescript
useEffect(() => {
  if (status === 'authenticated' && onSuccess) {
    onSuccess();
  } else if (status === 'authenticated' && !onSuccess) {
    router.replace(callbackUrl); // Redirects to /dashboard
  }
}, [status, router, callbackUrl, onSuccess]);
```

**What happens**:

- When session status becomes `'authenticated'`:
  - If `onSuccess` callback exists → calls it
  - Otherwise → redirects to `callbackUrl` (default: `/dashboard`)

### 6. **Middleware Check**

**Location**: `middleware.ts`

After redirect to `/dashboard`:

1. Middleware checks if route is public → `/dashboard` is NOT public
2. Middleware checks for token → ✅ User is authenticated
3. Middleware checks role restrictions:
   - `/dashboard` doesn't start with `/admin` or `/artist`
   - ✅ No role restrictions, allows access
4. User sees dashboard

## Potential Issues

### Issue 1: Missing Redirect Callback

**Problem**: No explicit `redirect` callback means NextAuth uses default behavior, which might not handle role-based redirects properly.

**Current State**:

- Admins and regular users both get redirected to `/dashboard` (or callbackUrl)
- No automatic redirect to `/admin/dashboard` for admins

### Issue 2: User Role Not Set on First Login

**Problem**: When PrismaAdapter creates a new user, what role is assigned?

**Check**: Need to verify Prisma schema default for `role` field.

### Issue 3: Session Timing

**Problem**: If `redirect: false`, the `useEffect` in SignInForm might run before the session is fully established.

**Current State**: Uses `status === 'authenticated'` which should wait for session to be ready.

## Recommendations

### Add Redirect Callback for Role-Based Redirects

```typescript
callbacks: {
  // ... existing callbacks ...
  async redirect({ url, baseUrl }) {
    // If url is a relative path, make it absolute
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    // If url is on the same origin, allow it
    if (new URL(url).origin === baseUrl) {
      return url;
    }
    // Default to baseUrl
    return baseUrl;
  },
}
```

**Note**: The `redirect` callback doesn't have access to user role at that point. Role-based redirects should be handled client-side or in middleware.

### Better Approach: Client-Side Role Check

The current `useEffect` in SignInForm could be enhanced to check role:

```typescript
useEffect(() => {
  if (status === 'authenticated' && session?.user) {
    if (session.user.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace(callbackUrl);
    }
  }
}, [status, session, router, callbackUrl]);
```

## Current Flow Summary

1. ✅ User clicks "Continue with Google"
2. ✅ Redirected to Google OAuth
3. ✅ Google redirects to `/api/auth/callback/google`
4. ✅ `signIn` callback checks if user is active
5. ✅ PrismaAdapter creates/updates user
6. ✅ `jwt` callback adds role/premium/active to token
7. ✅ `session` callback adds user data to session
8. ✅ NextAuth redirects to `callbackUrl` (or client handles redirect)
9. ✅ Middleware allows access to `/dashboard`
10. ✅ User sees dashboard

## Key Files

- **OAuth Initiation**: `src/components/auth/SignInForm.tsx:133`
- **NextAuth Route**: `src/app/api/auth/[...nextauth]/route.ts`
- **Auth Configuration**: `src/lib/auth.ts`
- **Callback Processing**: `src/lib/auth.ts:59-96`
- **Client Redirect**: `src/components/auth/SignInForm.tsx:29-35`
- **Route Protection**: `middleware.ts`
