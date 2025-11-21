# New User Journey - Requirements (Organized)

## Flow Overview

```
Registration → Email Verification (Required) → Login → Profile Selection → Artist Profile Wizard → Dashboard
```

---

## Phase 1: Registration & Email Verification (Before Login)

### Requirements:

1. **User Registration**
   - User creates account via registration form
   - Account is created but **NOT activated** until email is verified

2. **Email Verification (MANDATORY)**
   - User **CANNOT sign in** until email is confirmed
   - Must set up Resend email service (credentials provided)
   - Need email verification template
   - Check best practices for verification emails
   - After email confirmation → User can log in

3. **Email Service Setup**
   - Configure Resend with provided credentials
   - Create verification email template (or use system template)
   - Follow email best practices

---

## Phase 2: Profile Type Selection (After Login)

### Requirements:

1. **After Successful Login**
   - User is redirected to profile type selection page
   - **Only show Artist Profile option** (no placeholders)
   - Code must be **extensible** for future profile types
   - No "Coming Soon" placeholders

2. **Extensibility**
   - Code structure should allow easy addition of new profile types
   - Don't hardcode single option
   - Use configuration/array approach

---

## Phase 3: Artist Profile Creation Wizard

### Requirements:

1. **Wizard Structure**
   - Step-by-step process
   - **Maximum 4 steps** to create artist profile
   - Should look nice and professional
   - Clear navigation (Next/Back buttons)
   - Progress indicator

2. **Steps Breakdown (Max 4 Steps)**
   - Need to determine what information is needed:
     - Step 1: Basic Info (Artist Name, Genre?)
     - Step 2: Bio & Details (Bio, Location, Website?)
     - Step 3: Profile Image?
     - Step 4: Review & Complete?
   - **Need confirmation on what fields are required**

3. **After Completion**
   - Artist profile created successfully
   - Redirect to dashboard

---

## Technical Requirements

### Email Verification Block

- Modify login logic to check `emailVerified` field
- Block login if `emailVerified` is null
- Show appropriate error message
- Redirect to email verification page if needed

### Resend Integration

- Set up Resend API client
- Create verification email template
- Send verification email on registration
- Handle email sending errors gracefully

### Profile Selection Page

- Show only available profile types (Artist for now)
- Extensible structure (array-based, not hardcoded)
- Clean, simple UI
- No placeholders or "Coming Soon" badges

### Artist Profile Wizard

- Multi-step form component
- Progress indicator
- Form validation per step
- Save progress (optional, but good UX)
- Final submission creates artist profile

---

## Current State Analysis

### ✅ What's Already Working:

1. **Resend Integration**: Already configured in `src/lib/email-service.ts`
   - Uses `RESEND_API_KEY` environment variable
   - Email templates exist (verification and welcome emails)
   - Email sending functions are implemented

2. **Email Verification Flow**:
   - Verification endpoint exists (`/api/auth/verify-email`)
   - Verification tokens are stored in database
   - Email verification page exists (`/verify-email`)

3. **Registration Flow**:
   - Registration creates user with `emailVerified: null`
   - Verification email is sent on registration

### ❌ What Needs to be Fixed:

1. **Login Blocking**:
   - **CURRENT**: Login allows unverified users
   - **NEEDED**: Block login if `emailVerified` is null
   - **FILE**: `src/lib/auth.ts` - `authorize` function (line 32-107)
   - **ACTION**: Add email verification check before allowing login

2. **Profile Selection Page**:
   - **CURRENT**: Shows all 5 profile types with "Coming Soon" placeholders
   - **NEEDED**: Only show Artist Profile (extensible structure)
   - **FILE**: `src/components/profile/ProfileTypeSelection.tsx`
   - **ACTION**: Filter to only show available profiles, remove placeholders

3. **Artist Profile Wizard**:
   - **CURRENT**: Single form page (`/profile/create/artist`)
   - **NEEDED**: Multi-step wizard (max 4 steps)
   - **FILE**: `src/app/profile/create/artist/page.tsx`
   - **ACTION**: Create wizard component with step navigation

---

## Important Finding: Genre Field

**Current Issue:**

- Artist profile creation currently uses hardcoded `GENRES` from `@/lib/genres`
- **MUST be changed** to fetch from database via `/api/genres` endpoint
- Genre model exists in database with proper structure

**Genre Model Structure:**

- `id` (String, cuid)
- `name` (String, unique) - Display name
- `slug` (String, unique) - URL-friendly identifier
- `description` (String?) - Optional description
- `isActive` (Boolean) - Filter active genres
- `order` (Int) - Display order
- `colorHex` (String?) - Optional color
- `icon` (String?) - Optional icon

**API Endpoint:**

- `GET /api/genres` returns `{ genres: [{ id, name, slug, description, colorHex }] }`
- Filters by `isActive: true`
- Ordered by `order` then `name`

**Storage:**

- `ArtistProfile.genre` is `String?` field
- Need to confirm: store `id`, `slug`, or `name`?
- Check existing tracks/artists to see what format is used

---

## Questions to Clarify

1. **Artist Profile Wizard Steps:**
   - What are the exact 4 steps?
   - What fields are required vs optional?
   - Suggested breakdown:
     - Step 1: Artist Name + Primary Genre (required) - **Use database genres**
     - Step 2: Bio + Location + Website (optional)
     - Step 3: Profile Image (optional)
     - Step 4: Review & Complete
   - **Confirm this breakdown or provide your preferred structure**

2. **Genre Storage Format:**
   - Should `ArtistProfile.genre` store the genre `id`, `slug`, or `name`?
   - Check existing data to maintain consistency

3. **Email Verification Error Message:**
   - When login is blocked, what message should we show?
   - Should we redirect to a "Verify Email" page or show error on login page?
   - Should we provide a "Resend verification email" link?

4. **Resend API Key:**
   - Is `RESEND_API_KEY` already set in your `.env` file?
   - Do you want me to check/verify the configuration?

---

## Implementation Order

1. **First:** Set up Resend and email verification blocking
2. **Second:** Update profile selection page (remove placeholders, make extensible)
3. **Third:** Create Artist Profile Wizard (4 steps max)
4. **Fourth:** Test full flow end-to-end

---

## Current State Analysis Needed

- Check existing email service setup
- Check login logic for email verification check
- Check profile selection page structure
- Check artist profile creation form
