# Artist Profile Wizard - Implementation Plan

## Requirements Summary

### 1. Genre Storage

- **Change**: Store `genreId` (String) instead of genre name
- **Current**: `ArtistProfile.genre` is `String?` storing name
- **New**: Store genre ID from Genre model
- **Migration**: Need to update schema and migrate existing data

### 2. Location Fields

- **Current**: Single `location` field (String?)
- **Needed**: Separate fields for:
  - `country` (String?)
  - `city` (String?)
  - `province` (String?)
- **Migration**: Need to add new fields, optionally migrate existing data

### 3. Profile Claiming Step (NEW - Step 0)

- **Purpose**: Allow users to claim existing unclaimed profiles
- **Logic**:
  - Check for unclaimed profiles matching user's name/email
  - Show list of unclaimed profiles they can claim
  - User can claim or skip to create new profile
- **API**: `/api/artists/claim` already exists

### 4. Skills System (NEW)

- **Skills Table**: Create new `ArtistSkill` model
- **Skills**: Producer, Vocalist, Songwriter, Arranger, Recording Artist
- **UI**: Toggleable pills/chips
- **Storage**: Many-to-many relationship (ArtistProfile <-> Skill)
- **Management**: Admin dashboard to manage skills

---

## Database Schema Changes

### 1. Update ArtistProfile Model

```prisma
model ArtistProfile {
  // ... existing fields ...

  // Change genre from String to reference Genre ID
  genreId        String?  // Changed from genre String?
  genre          Genre?   @relation(fields: [genreId], references: [id], onDelete: SetNull)

  // Add location fields
  country        String?
  city           String?
  province       String?
  location       String?  // Keep for backward compatibility, can be deprecated later

  // Add skills relation
  skills         ArtistProfileSkill[]

  // ... rest of fields ...
}
```

### 2. Create Skills Models

```prisma
model Skill {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  artistProfiles ArtistProfileSkill[]

  @@index([isActive, order])
  @@map("skills")
}

model ArtistProfileSkill {
  id              String   @id @default(cuid())
  artistProfileId String
  skillId         String
  createdAt       DateTime @default(now())

  artistProfile ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)
  skill         Skill         @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([artistProfileId, skillId])
  @@index([artistProfileId])
  @@index([skillId])
  @@map("artist_profile_skills")
}
```

---

## Wizard Steps Structure

### Step 0: Claim Existing Profile (NEW)

**Purpose**: Check if user can claim an unclaimed profile

**Content:**

- Search for unclaimed profiles (by name, email, or manual search)
- Display matching unclaimed profiles
- Show profile details (name, tracks, stats)
- "Claim This Profile" button
- "Create New Profile" button (skip to Step 1)

**API Calls:**

- `GET /api/artists/unclaimed?search={query}` - Search unclaimed profiles
- `POST /api/artists/claim` - Claim a profile

---

### Step 1: Basic Information

**Fields:**

- Artist Name\* (required)
- Primary Genre\* (required) - **Fetch from `/api/genres`, store genreId**

**Changes:**

- Fetch genres from database API
- Store genre ID (not name)
- Display genre names in dropdown

---

### Step 2: Location & Details

**Fields:**

- Country\* (required dropdown)
- Province (optional dropdown - depends on country)
- City\* (required text input)
- Bio (optional textarea)
- Website (optional URL input)

**Changes:**

- Split location into country, province, city
- Add country/province dropdowns
- Keep bio and website

---

### Step 3: Skills Selection

**Fields:**

- Skills\* (required - at least one)
  - Producer
  - Vocalist
  - Songwriter
  - Arranger
  - Recording Artist

**UI:**

- Toggleable pills/chips
- Can select multiple
- Visual feedback when selected
- At least one required

---

### Step 4: Profile Image & Review

**Fields:**

- Profile Image (optional)
- Review all entered information
- "Create Profile" button

**Content:**

- Show summary of all steps
- Allow editing from review page
- Final submission

---

## Implementation Tasks

### Phase 1: Database Schema Updates

1. **Create Migration for Genre ID**
   - Add `genreId` field to ArtistProfile
   - Add foreign key relation to Genre
   - Migrate existing genre names to IDs (if possible)
   - Keep `genre` field temporarily for backward compatibility

2. **Create Migration for Location Fields**
   - Add `country`, `city`, `province` fields
   - Keep `location` field for backward compatibility

3. **Create Skills Tables**
   - Create `Skill` model
   - Create `ArtistProfileSkill` junction table
   - Seed initial skills (Producer, Vocalist, Songwriter, Arranger, Recording Artist)

### Phase 2: API Updates

1. **Update Artist Profile API**
   - Modify POST/PUT to accept `genreId` instead of `genre` name
   - Accept `country`, `city`, `province` fields
   - Accept `skillIds` array
   - Update response to include genre relation and skills

2. **Create Skills API**
   - `GET /api/skills` - Get all active skills
   - `POST /api/admin/skills` - Create skill (admin)
   - `PUT /api/admin/skills/:id` - Update skill (admin)
   - `DELETE /api/admin/skills/:id` - Delete skill (admin)

3. **Create Unclaimed Profiles API**
   - `GET /api/artists/unclaimed` - Search unclaimed profiles
   - Enhance existing `/api/artists/claim` if needed

### Phase 3: Wizard Components

1. **Create Wizard Infrastructure**
   - `OnboardingWizard` component
   - `WizardStep` wrapper
   - `WizardProgress` indicator
   - `WizardNavigation` (Next/Back buttons)

2. **Step 0: Claim Profile**
   - `ClaimProfileStep` component
   - Search functionality
   - Profile cards display
   - Claim action

3. **Step 1: Basic Info**
   - Update to fetch genres from API
   - Store genre ID
   - Artist name input

4. **Step 2: Location & Details**
   - Country dropdown (with country list)
   - Province dropdown (filtered by country)
   - City input
   - Bio textarea
   - Website input

5. **Step 3: Skills**
   - `SkillsSelection` component
   - Fetch skills from API
   - Toggleable pills UI
   - Validation (at least one required)

6. **Step 4: Review & Image**
   - Summary display
   - Image upload (existing component)
   - Final submission

### Phase 4: Dashboard Management

1. **Skills Management in Dashboard**
   - Admin page: `/admin/skills`
   - CRUD operations
   - List, create, edit, delete skills
   - Activate/deactivate skills

---

## File Structure

```
src/
├── app/
│   ├── onboarding/
│   │   └── artist-profile/
│   │       ├── page.tsx (wizard container)
│   │       ├── step-0-claim/page.tsx
│   │       ├── step-1-basic/page.tsx
│   │       ├── step-2-location/page.tsx
│   │       ├── step-3-skills/page.tsx
│   │       └── step-4-review/page.tsx
│   ├── api/
│   │   ├── skills/
│   │   │   └── route.ts
│   │   └── artists/
│   │       └── unclaimed/
│   │           └── route.ts
│   └── admin/
│       └── skills/
│           └── page.tsx
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx
│   │   ├── WizardStep.tsx
│   │   ├── WizardProgress.tsx
│   │   ├── WizardNavigation.tsx
│   │   ├── ClaimProfileStep.tsx
│   │   ├── BasicInfoStep.tsx
│   │   ├── LocationDetailsStep.tsx
│   │   ├── SkillsSelectionStep.tsx
│   │   └── ReviewStep.tsx
│   └── skills/
│       ├── SkillsSelector.tsx (toggleable pills)
│       └── SkillsManager.tsx (admin)
└── lib/
    └── countries.ts (country/province data)
```

---

## Questions to Resolve

1. **Country/Province Data**
   - Do we have a list of countries/provinces?
   - Should we use a library (e.g., `country-list`)?
   - Focus on South Africa provinces or international?

2. **Genre Migration**
   - How to handle existing profiles with genre names?
   - Match by name to find genre ID?
   - Set to null if no match?

3. **Skills Initial Data**
   - Exact skill names: "Producer", "Vocalist", "Songwriter", "Arranger", "Recording Artist"?
   - Any additional skills needed?
   - Icons for each skill?

4. **Unclaimed Profile Search**
   - Search by what criteria? (name, email, partial match?)
   - How many results to show?
   - Should we show all unclaimed or filter somehow?

---

## Next Steps

1. Create database migrations
2. Update API endpoints
3. Build wizard components
4. Integrate with existing flow
5. Add skills management to dashboard
