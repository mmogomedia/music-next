# Claim Flow Issues & Fixes

## Issues Identified

### Issue 1: Error Handling Not Displayed ✅ FIXED

**Problem**: When a user with an existing profile searches for unclaimed artists, the API returns a 409 error, but the UI doesn't show this error - it just shows "No unclaimed profiles found" which is misleading.

**Fix Applied**:

- Added `searchError` state to track API errors
- Display error message in a red alert box when search fails
- Show specific message for 409 errors: "You already have an artist profile"

**Files Changed**:

- `src/components/onboarding/steps/ClaimProfileStep.tsx`

### Issue 2: Track Cover Image URL Construction

**Problem**: The unclaimed API route uses `constructFileUrl` for track cover images, but this might not be imported correctly.

**Status**: Need to verify

### Issue 3: Testing Difficulty

**Problem**: Browser automation is having trouble with login/logout, making it difficult to test with different users.

**Solution**: Created test script to verify data setup

## How to Test the Claim Flow

### Prerequisites

1. Ensure test users exist:

   ```bash
   node scripts/create-test-data.js
   ```

2. Verify unclaimed artists exist:
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); (async () => { const artists = await prisma.artistProfile.findMany({ where: { isUnclaimed: true }, select: { artistName: true, _count: { select: { tracks: true } } } }); console.log('Unclaimed artists:', artists.length); artists.forEach(a => console.log('  -', a.artistName, '|', a._count.tracks, 'tracks')); await prisma.\$disconnect(); })();"
   ```

### Test Steps

1. **Log in as `test-ready-to-claim@flemoji.com`** (user with no profile)
2. **Navigate to** `/profile/onboarding/artist`
3. **Search for** "Afrobeat" or "Amapiano"
4. **Verify**:
   - Search results appear after 500ms debounce
   - Artists show with tracks (up to 3)
   - "Claim" button is visible
5. **Click "Claim"** on an artist
6. **Verify**:
   - Success message appears
   - Wizard auto-advances to Step 2 (Basic Info)
   - Artist name is pre-filled
   - Bio and location are pre-filled (if available)
7. **Complete wizard** and verify profile is claimed

### Expected Behavior

- ✅ Search works with debounce
- ✅ Results show tracks
- ✅ Claim button works
- ✅ Auto-advance to next step
- ✅ Data pre-fills correctly
- ✅ Error messages display when user already has profile

## Next Steps

1. Test the claim flow manually in browser
2. Verify track cover images display correctly
3. Test error scenarios (user with existing profile)
4. Document any remaining issues
