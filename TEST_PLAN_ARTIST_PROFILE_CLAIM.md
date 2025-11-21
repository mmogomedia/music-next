# Artist Profile Claim & Creation - Comprehensive Test Plan

## Overview

This document outlines comprehensive test cases for the artist profile claim and creation flow. Each test case includes pre-requisites, test data, steps, and expected results.

## Test Users

### User 1: New User (No Profile)

- **Email**: `test-new-user@flemoji.com`
- **Password**: `Test123!@#`
- **Status**: New account, no artist profile
- **Use Case**: Testing new profile creation flow

### User 2: User with Claimed Profile

- **Email**: `test-claimed-user@flemoji.com`
- **Password**: `Test123!@#`
- **Status**: Has claimed an artist profile
- **Use Case**: Testing that users cannot claim multiple profiles

### User 3: User Ready to Claim

- **Email**: `test-ready-to-claim@flemoji.com`
- **Password**: `Test123!@#`
- **Status**: New account, ready to claim an existing unclaimed profile
- **Use Case**: Testing profile claiming flow

## Demo Artist Profiles

### Demo Artist 1: "Amapiano King"

- **Name**: "Amapiano King"
- **Slug**: "amapiano-king-demo"
- **Bio**: "South African Amapiano artist with chart-topping hits"
- **Status**: Unclaimed
- **Tracks**: 5 tracks
  - "Midnight Groove" (2,500 plays, 120 likes)
  - "Soweto Nights" (1,800 plays, 95 likes)
  - "Township Vibes" (1,200 plays, 78 likes)
  - "Weekend Party" (950 plays, 65 likes)
  - "Sunset Drive" (750 plays, 52 likes)
- **Genre**: Amapiano
- **Location**: Johannesburg, Gauteng, South Africa

### Demo Artist 2: "Afrobeat Master"

- **Name**: "Afrobeat Master"
- **Slug**: "afrobeat-master-demo"
- **Bio**: "Nigerian Afrobeat producer and artist"
- **Status**: Unclaimed
- **Tracks**: 3 tracks
  - "Lagos Nights" (3,200 plays, 150 likes)
  - "African Rhythm" (2,100 plays, 110 likes)
  - "Dance Floor" (1,500 plays, 88 likes)
- **Genre**: Afrobeat
- **Location**: Lagos, Lagos State, Nigeria

### Demo Artist 3: "Hip Hop Legend"

- **Name**: "Hip Hop Legend"
- **Slug**: "hip-hop-legend-demo"
- **Bio**: "Underground hip hop artist from Cape Town"
- **Status**: Unclaimed
- **Tracks**: 4 tracks
  - "City Streets" (1,900 plays, 85 likes)
  - "Underground Flow" (1,400 plays, 72 likes)
  - "Real Talk" (1,100 plays, 68 likes)
  - "Cape Town Sound" (900 plays, 55 likes)
- **Genre**: Hip Hop
- **Location**: Cape Town, Western Cape, South Africa

### Demo Artist 4: "R&B Soul"

- **Name**: "R&B Soul"
- **Slug**: "rnb-soul-demo"
- **Bio**: "Soulful R&B singer"
- **Status**: Unclaimed
- **Tracks**: 2 tracks
  - "Love Song" (2,800 plays, 135 likes)
  - "Heartbreak" (2,000 plays, 98 likes)
- **Genre**: R&B
- **Location**: Durban, KwaZulu-Natal, South Africa

## Test Cases

### TC-001: New User Creates Profile (Happy Path)

**Objective**: Verify a new user can successfully create a new artist profile through the wizard.

**Pre-requisites**:

- User account exists: `test-new-user@flemoji.com`
- User has verified email
- User has no existing artist profile

**Test Data**:

- Artist Name: "New Artist Test"
- Genre: Amapiano
- Bio: "I'm a new artist testing the profile creation"
- Country: South Africa
- Province: Gauteng
- City: Johannesburg
- Website: "https://newartist.com"
- Skills: Producer, Vocalist

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Verify Claim Profile step is shown (Step 1)
3. Click "Continue" without searching (skip claim)
4. Verify Basic Info step is shown (Step 2)
5. Enter artist name: "New Artist Test"
6. Select genre: Amapiano
7. Click "Continue"
8. Verify Details step is shown (Step 3)
9. Enter bio, location, website, and select skills
10. Click "Continue"
11. Verify Review step is shown (Step 4)
12. Upload profile image (optional)
13. Upload cover image (optional)
14. Click "Complete Profile"
15. Verify redirect to dashboard
16. Verify profile exists in database

**Expected Results**:

- All steps complete successfully
- Profile created with all entered data
- User redirected to dashboard
- Profile visible in dashboard

---

### TC-002: User Claims Existing Profile (Happy Path)

**Objective**: Verify a user can successfully claim an existing unclaimed profile.

**Pre-requisites**:

- User account exists: `test-ready-to-claim@flemoji.com`
- User has verified email
- User has no existing artist profile
- Demo Artist "Amapiano King" exists and is unclaimed

**Test Data**:

- Search Query: "Amapiano"
- Artist to Claim: "Amapiano King"

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Verify Claim Profile step is shown (Step 1)
3. Type "Amapiano" in search box
4. Wait for debounced search (500ms)
5. Verify "Amapiano King" appears in results
6. Verify tracks are displayed (5 tracks shown)
7. Click "Claim" button on "Amapiano King"
8. Verify auto-advance to Step 2 (Basic Info)
9. Verify artist name is pre-filled: "Amapiano King"
10. Verify genre is pre-filled (if available)
11. Verify bio is pre-filled: "South African Amapiano artist..."
12. Verify location fields are pre-filled
13. Select genre if not pre-filled
14. Click "Continue"
15. Verify Details step shows pre-filled data
16. Update/add additional details (optional)
17. Click "Continue"
18. Verify Review step shows all data
19. Optionally upload images
20. Click "Complete Profile"
21. Verify redirect to dashboard
22. Verify profile is claimed (isUnclaimed = false)
23. Verify userId is set in profile

**Expected Results**:

- Search finds the artist
- Tracks are displayed correctly
- Claim succeeds
- Wizard continues with pre-filled data
- Profile is claimed and linked to user
- User can complete wizard and update profile

---

### TC-003: User Cannot Claim Multiple Profiles

**Objective**: Verify a user who already has a profile cannot claim another profile.

**Pre-requisites**:

- User account exists: `test-claimed-user@flemoji.com`
- User has verified email
- User already has a claimed artist profile
- Demo Artist "Afrobeat Master" exists and is unclaimed

**Test Steps**:

1. Log in as `test-claimed-user@flemoji.com`
2. Navigate to `/profile/onboarding/artist`
3. Verify redirect to dashboard (user already has profile)
4. OR if wizard is accessible:
   - Type "Afrobeat" in search box
   - Wait for search results
   - Verify error message: "You already have an artist profile"
   - Verify no claim button is available
   - Verify cannot proceed

**Expected Results**:

- User is redirected away from wizard OR
- API returns 409 error: "You already have an artist profile"
- User cannot claim another profile

---

### TC-004: Search Functionality - Exact Match

**Objective**: Verify search finds profiles with exact name matches.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`
- Demo Artist "Hip Hop Legend" exists

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Type "Hip Hop Legend" in search box
3. Wait for debounced search
4. Verify "Hip Hop Legend" appears in results
5. Verify all 4 tracks are displayed

**Expected Results**:

- Exact match found
- All tracks displayed
- Profile details visible

---

### TC-005: Search Functionality - Partial Match

**Objective**: Verify search finds profiles with partial name matches.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`
- Demo Artists exist

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Type "Hip" in search box
3. Wait for debounced search
4. Verify "Hip Hop Legend" appears in results
5. Clear search
6. Type "Amapiano" in search box
7. Verify "Amapiano King" appears

**Expected Results**:

- Partial matches found
- Case-insensitive search works
- Results update with debounce

---

### TC-006: Search Functionality - No Results

**Objective**: Verify search handles no results gracefully.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Type "NonExistentArtist123" in search box
3. Wait for debounced search
4. Verify "No unclaimed profiles found" message
5. Verify "Continue" button is still available

**Expected Results**:

- No results message displayed
- User can still continue to create new profile
- No errors thrown

---

### TC-007: Claim Profile - Track Display

**Objective**: Verify tracks are displayed correctly in search results.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`
- Demo Artist "Amapiano King" with 5 tracks exists

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Type "Amapiano" in search box
3. Wait for search results
4. Verify "Amapiano King" card shows:
   - Profile image (or placeholder)
   - Artist name
   - Track count: "5 tracks"
   - Play count
   - Like count
   - "Popular Tracks" section
   - Top 3 tracks displayed with:
     - Track cover image (or placeholder)
     - Track title
     - Play count
     - Like count

**Expected Results**:

- All track information displayed correctly
- Track images show or placeholders used
- Play and like counts formatted correctly
- Maximum 3 tracks shown

---

### TC-008: Wizard Navigation - Back Button

**Objective**: Verify back button works correctly through wizard steps.

**Pre-requisites**:

- User account: `test-new-user@flemoji.com`

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Click "Continue" to Step 2
3. Enter artist name
4. Click "Continue" to Step 3
5. Click "Back" button
6. Verify returns to Step 2
7. Verify data is preserved
8. Click "Back" again
9. Verify returns to Step 1
10. Verify search state is preserved

**Expected Results**:

- Back button navigates correctly
- Form data is preserved when going back
- Step indicators update correctly

---

### TC-009: Wizard Navigation - Skip Claim Step

**Objective**: Verify user can skip claim step and create new profile.

**Pre-requisites**:

- User account: `test-new-user@flemoji.com`

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Verify Step 1 (Claim Profile) is shown
3. Do not search or claim anything
4. Click "Continue" button
5. Verify advances to Step 2 (Basic Info)
6. Complete wizard with new profile data
7. Verify new profile is created (not claimed)

**Expected Results**:

- Can skip claim step
- Wizard continues normally
- New profile created successfully

---

### TC-010: Data Pre-fill After Claim

**Objective**: Verify claimed profile data pre-fills wizard forms correctly.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`
- Demo Artist "R&B Soul" exists with complete data

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Search and claim "R&B Soul"
3. Verify Step 2 shows:
   - Artist name: "R&B Soul" (pre-filled)
   - Genre: R&B (pre-filled if available)
4. Click "Continue"
5. Verify Step 3 shows:
   - Bio: "Soulful R&B singer" (pre-filled)
   - Location fields pre-filled
   - Website pre-filled if exists
6. Verify all pre-filled data is editable

**Expected Results**:

- All available profile data pre-fills
- User can edit pre-filled data
- Data persists through wizard steps

---

### TC-011: Profile Update After Claim

**Objective**: Verify user can update claimed profile through wizard.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`
- Demo Artist "Hip Hop Legend" exists

**Test Steps**:

1. Claim "Hip Hop Legend"
2. Advance through wizard
3. Update bio to "Updated bio text"
4. Add website: "https://hiphoplegend.com"
5. Select additional skills
6. Complete wizard
7. Verify profile is updated (not created new)
8. Verify updated data is saved

**Expected Results**:

- Profile is updated (PUT request)
- New data is saved
- Existing tracks remain
- Profile remains claimed

---

### TC-012: Form Validation - Required Fields

**Objective**: Verify required field validation works correctly.

**Pre-requisites**:

- User account: `test-new-user@flemoji.com`

**Test Steps**:

1. Navigate to wizard Step 2 (Basic Info)
2. Leave artist name empty
3. Leave genre unselected
4. Click "Continue"
5. Verify error messages appear
6. Enter artist name only
7. Click "Continue"
8. Verify genre error still shown
9. Select genre
10. Verify can proceed

**Expected Results**:

- Required field errors displayed
- Cannot proceed without required fields
- Errors clear when fields filled

---

### TC-013: Debounced Search Performance

**Objective**: Verify search debouncing works correctly.

**Pre-requisites**:

- User account: `test-ready-to-claim@flemoji.com`

**Test Steps**:

1. Navigate to `/profile/onboarding/artist`
2. Rapidly type "A" then "m" then "a" then "p" then "i" then "a" then "n" then "o"
3. Verify search only executes after 500ms pause
4. Verify loading indicator shows during search
5. Verify results appear after search completes

**Expected Results**:

- Search debounced to 500ms
- No excessive API calls
- Loading indicator visible
- Results appear correctly

---

### TC-014: Multiple Users Claim Different Profiles

**Objective**: Verify multiple users can claim different profiles simultaneously.

**Pre-requisites**:

- User 1: `test-ready-to-claim@flemoji.com`
- User 2: `test-new-user@flemoji.com` (create new account)
- Multiple demo artists exist

**Test Steps**:

1. User 1 claims "Amapiano King"
2. Verify User 1's profile is "Amapiano King"
3. User 2 claims "Afrobeat Master"
4. Verify User 2's profile is "Afrobeat Master"
5. Verify both profiles are claimed (isUnclaimed = false)
6. Verify each user sees their own profile

**Expected Results**:

- Multiple users can claim different profiles
- No conflicts or errors
- Each user has their own profile

---

### TC-015: Error Handling - Profile Already Claimed

**Objective**: Verify error when trying to claim already-claimed profile.

**Pre-requisites**:

- User 1: `test-ready-to-claim@flemoji.com` claims "R&B Soul"
- User 2: `test-new-user@flemoji.com` tries to claim same profile

**Test Steps**:

1. User 1 claims "R&B Soul"
2. User 2 searches for "R&B Soul"
3. Verify "R&B Soul" does NOT appear in results (already claimed)
4. OR if it appears, User 2 clicks "Claim"
5. Verify error: "This artist profile is already claimed"

**Expected Results**:

- Already-claimed profiles don't appear in search OR
- Error message shown if claim attempted
- User 2 cannot claim User 1's profile

---

## Test Execution Order

1. **Setup Phase**: Create all test users and demo artists
2. **TC-001**: New User Creates Profile
3. **TC-002**: User Claims Existing Profile
4. **TC-003**: User Cannot Claim Multiple Profiles
5. **TC-004**: Search - Exact Match
6. **TC-005**: Search - Partial Match
7. **TC-006**: Search - No Results
8. **TC-007**: Track Display
9. **TC-008**: Wizard Navigation - Back Button
10. **TC-009**: Skip Claim Step
11. **TC-010**: Data Pre-fill After Claim
12. **TC-011**: Profile Update After Claim
13. **TC-012**: Form Validation
14. **TC-013**: Debounced Search
15. **TC-014**: Multiple Users Claim Different Profiles
16. **TC-015**: Error Handling - Already Claimed

## Demo Data Creation Script

See `scripts/create-test-data.js` for automated demo data creation.

## Test Results Log

Results will be documented in `TEST_RESULTS_ARTIST_PROFILE_CLAIM.md` after execution.
