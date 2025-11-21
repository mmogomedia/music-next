# New User Journey Analysis & Wizard Proposal

## Current User Journey Steps

### Step 1: Registration (`/register`)

**What happens:**

- User fills out registration form (email, password, confirm password, optional name)
- Form validates password strength (8+ chars, uppercase, lowercase, number, special char)
- Account created in database
- Verification email sent (background process)
- User redirected to `/login?registered=true` after 2 seconds
- Success message shown: "Account created! Please check your email to verify your account."

**Current Issues:**

- No guidance on what to do next
- User must manually navigate to login
- No explanation of email verification importance
- No onboarding flow

---

### Step 2: Login (`/login`)

**What happens:**

- User sees success message from registration
- User enters credentials
- NextAuth session created
- User redirected to `/dashboard`

**Current Issues:**

- No guidance on next steps
- User might not understand they need to verify email
- No explanation of what dashboard offers

---

### Step 3: Dashboard - Empty State (`/dashboard`)

**What happens:**

- If no artist profile exists, shows empty state:
  - Large musical note icon
  - "Welcome to Your Dashboard" heading
  - Description: "Create a profile to start uploading music..."
  - Single CTA: "Create Artist Profile" button
- Clicking button redirects to `/profile/select`

**Current Issues:**

- No step-by-step guidance
- User might not understand why they need a profile
- No explanation of different profile types
- No progress indicator

---

### Step 4: Profile Type Selection (`/profile/select`)

**What happens:**

- Shows 5 profile type options:
  - Artist Profile (Available) - "Upload music, manage tracks, build fanbase"
  - Producer Profile (Coming Soon)
  - Podcaster Profile (Coming Soon)
  - Content Creator (Coming Soon)
  - Designer Profile (Coming Soon)
- "Why do I need a profile?" section with benefits
- Clicking "Create Profile" on Artist redirects to `/profile/create/artist`

**Current Issues:**

- No wizard flow
- No back button to return to previous step
- No progress indicator
- No explanation of what happens after profile creation

---

### Step 5: Artist Profile Creation (`/profile/create/artist`)

**What happens:**

- Form with fields:
  - Artist Name\* (required)
  - Primary Genre\* (required dropdown)
  - Bio (optional)
  - Location (optional)
  - Website (optional)
  - Profile Image (optional, min 500x500px)
- Back button to `/profile/select`
- "Create Profile" button submits form
- On success, redirects to `/dashboard`

**Current Issues:**

- No step-by-step guidance
- No explanation of why each field matters
- No preview of what profile will look like
- No progress indicator
- No explanation of what happens next

---

### Step 6: Dashboard - Full Access (`/dashboard`)

**What happens:**

- Full dashboard with navigation sidebar
- Overview tab shows stats (0 tracks, 0 plays initially)
- All tabs accessible: Overview, Library, Upload, Submissions, Quick Links, Analytics, Profile

**Current Issues:**

- No onboarding tour
- No guidance on what to do first
- User might feel overwhelmed by options
- No explanation of features

---

## Proposed Wizard-Based Onboarding Flow

### Wizard Structure

```
┌─────────────────────────────────────────────────┐
│  Step 1: Welcome & Account Setup                │
│  Step 2: Email Verification                     │
│  Step 3: Profile Type Selection                  │
│  Step 4: Profile Creation (Multi-step)          │
│  Step 5: Dashboard Tour                          │
│  Step 6: First Upload Guide                      │
└─────────────────────────────────────────────────┘
```

### Wizard Features

1. **Progress Indicator**
   - Shows current step (e.g., "Step 2 of 6")
   - Visual progress bar
   - Can skip non-critical steps

2. **Navigation**
   - "Next" button (primary action)
   - "Back" button (secondary action)
   - "Skip" button (for optional steps)
   - Progress dots showing all steps

3. **Contextual Help**
   - Tooltips explaining each field
   - "Why is this needed?" explanations
   - Examples and best practices

4. **Visual Feedback**
   - Success animations
   - Loading states
   - Error handling with helpful messages

5. **Persistence**
   - Save progress (can resume later)
   - Skip completed steps
   - Show completion status

---

## Detailed Wizard Steps

### Step 1: Welcome & Account Setup

**Location:** `/onboarding/welcome`

**Content:**

- Welcome message: "Welcome to Flemoji! Let's get you started"
- Brief explanation: "We'll guide you through setting up your account in just a few steps"
- Show what they'll accomplish:
  - ✓ Create your account
  - ✓ Verify your email
  - ✓ Set up your artist profile
  - ✓ Upload your first track
- Estimated time: "This will take about 5 minutes"

**Actions:**

- "Get Started" button → Step 2 (if not registered) or Step 3 (if already registered)

---

### Step 2: Registration (if not done)

**Location:** `/onboarding/register`

**Content:**

- Same registration form as current
- Enhanced with:
  - Progress indicator: "Step 1 of 6"
  - Explanation: "Create your account to get started"
  - Password strength indicator (already exists)
  - Tooltips explaining each field

**Actions:**

- "Next" button → Step 3 (Email Verification)
- Form validation before proceeding

---

### Step 3: Email Verification

**Location:** `/onboarding/verify-email`

**Content:**

- Large email icon
- Heading: "Verify Your Email Address"
- Explanation:
  - "We've sent a verification link to [email]"
  - "Click the link in your email to verify your account"
  - "This helps us keep your account secure"
- Resend email button
- "I've verified my email" checkbox/button

**Actions:**

- "I've verified my email" → Step 4
- "Resend Email" button
- "Skip for now" → Step 4 (with warning)

---

### Step 4: Profile Type Selection

**Location:** `/onboarding/select-profile`

**Content:**

- Progress indicator: "Step 3 of 6"
- Heading: "What type of creator are you?"
- Explanation: "Choose the profile type that best fits your creative journey"
- Enhanced profile cards with:
  - Visual icon
  - Title
  - Description
  - "Recommended" badge (for Artist)
  - "Coming Soon" badge (for others)
- "Why do I need a profile?" expandable section

**Actions:**

- Select profile type → Step 5
- "Back" → Step 3
- "Skip for now" → Step 6 (with explanation of limitations)

---

### Step 5: Profile Creation (Multi-step Wizard)

**Location:** `/onboarding/create-profile`

**Sub-steps:**

#### 5a: Basic Information

- Artist Name\* (required)
- Primary Genre\* (required)
- Explanation: "This is how fans will discover your music"
- "Next" → 5b

#### 5b: Tell Your Story

- Bio (optional)
- Location (optional)
- Website (optional)
- Explanation: "Help fans learn more about you"
- "Back" → 5a
- "Next" → 5c
- "Skip" → 5c

#### 5c: Profile Image

- Upload profile image (optional)
- Explanation: "A great profile image helps you stand out"
- Image preview
- Crop tool
- "Back" → 5b
- "Skip" → Step 6
- "Finish" → Step 6

**Actions:**

- Progress indicator: "Step 4 of 6 - Profile Setup"
- Sub-step indicator: "Step 1 of 3 - Basic Information"
- "Next" / "Back" navigation
- "Skip" for optional sections

---

### Step 6: Dashboard Tour

**Location:** `/onboarding/dashboard-tour`

**Content:**

- Interactive tour of dashboard
- Highlight key features:
  - Overview tab: "See your stats here"
  - Upload tab: "Upload your music here"
  - Library tab: "Manage your tracks here"
  - Profile tab: "Edit your profile here"
- "Got it!" button → Step 7
- "Skip tour" → Step 7

---

### Step 7: First Upload Guide

**Location:** `/onboarding/first-upload`

**Content:**

- Heading: "Ready to upload your first track?"
- Explanation: "Upload your music to start sharing with the world"
- Step-by-step guide:
  1. Click "Upload" in the sidebar
  2. Select your audio file
  3. Fill in track details
  4. Add artwork
  5. Publish!
- "Upload Now" button → `/dashboard?tab=upload`
- "I'll do this later" → Complete onboarding

**Actions:**

- "Upload Now" → Dashboard with upload tab active
- "I'll do this later" → Complete onboarding, show dashboard

---

## Implementation Plan

### Phase 1: Create Wizard Infrastructure

1. Create `/onboarding` route group
2. Create `OnboardingWizard` component with:
   - Progress indicator
   - Navigation (Next/Back/Skip)
   - Step management
   - Progress persistence
3. Create `OnboardingLayout` component
4. Add onboarding state to user model (optional)

### Phase 2: Implement Individual Steps

1. Step 1: Welcome page
2. Step 2: Registration (enhance existing)
3. Step 3: Email verification guide
4. Step 4: Profile selection (enhance existing)
5. Step 5: Multi-step profile creation
6. Step 6: Dashboard tour (using library like `react-joyride`)
7. Step 7: First upload guide

### Phase 3: Integration

1. Redirect new users to `/onboarding/welcome`
2. Check onboarding completion status
3. Allow skipping/resuming
4. Show completion badge/celebration

### Phase 4: Enhancements

1. Add tooltips and help text
2. Add animations and transitions
3. Add progress persistence
4. Add analytics tracking

---

## Technical Considerations

### State Management

- Use React Context for wizard state
- Persist progress in localStorage
- Sync with backend (optional)

### Routing

- Use Next.js App Router
- Dynamic routes: `/onboarding/[step]`
- Query params for sub-steps: `/onboarding/create-profile?substep=basic`

### Components Needed

- `OnboardingWizard` - Main wrapper
- `WizardProgress` - Progress indicator
- `WizardNavigation` - Next/Back/Skip buttons
- `WizardStep` - Individual step wrapper
- `OnboardingLayout` - Layout wrapper

### User Experience

- Smooth transitions between steps
- Loading states
- Error handling
- Mobile responsive
- Accessibility (keyboard navigation, screen readers)

---

## Benefits of Wizard Approach

1. **Clear Guidance**: Users know exactly what to do next
2. **Reduced Friction**: Step-by-step reduces overwhelm
3. **Better Completion**: More users complete setup
4. **Education**: Users learn platform features
5. **Professional Feel**: Modern, polished experience
6. **Flexibility**: Can skip optional steps
7. **Progress Tracking**: Users see their progress

---

## Next Steps

1. Review and approve wizard structure
2. Create technical specification
3. Implement Phase 1 (Infrastructure)
4. Implement Phase 2 (Individual Steps)
5. Test with real users
6. Iterate based on feedback
