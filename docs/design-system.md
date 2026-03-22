# Flemoji Design System & UI/UX Library

> **⚠️ Required reading for all developers and AI agents working on this codebase.**
> All UI work on Dashboard, Artist Profile, and any new pages must use this system.
> **Update this file whenever any UI/UX decision changes.**

---

## 1. Core Philosophy

Flemoji uses a **purple + blue harmony** design system built on top of HeroUI and TailwindCSS.

- **One source of truth**: All UI primitives live in `src/components/ui/` and are exported from `src/components/ui/index.ts`. Always import from `@/components/ui`, never directly from `@heroui/react` for wrapped components.
- **Wrap, don't replace**: HeroUI components are wrapped (not replaced) to enforce consistent props. All HeroUI props still pass through.
- **Purple is the brand — use it sparingly**: Purple (#9333ea) is the primary brand color but should only appear on the **1 most important CTA per section** and key brand moments. When purple is everywhere, it loses all weight.
- **Blue is the partner**: Blue/secondary provides visual balance alongside purple. The two together create harmony — neither should dominate alone.
- **Neutral by default**: Ghost and outline buttons are **neutral gray**, not purple. Brand color buttons (primary, secondary) stand out precisely because everything else recedes.
- **Tinted icons, not solid**: Icon containers use `bg-purple-100` tints, not solid `bg-purple-600`. Tints say "brand" quietly; solids scream. Reserve solid brand-colored blocks for truly prominent UI moments.
- **Visual hierarchy via color weight**: Solid > Bordered > Tinted > Ghost. The rarest color usage = highest visual weight.

---

## 2. Design Tokens

### Primary Color

| Token       | Value                  | Usage                                              |
| ----------- | ---------------------- | -------------------------------------------------- |
| `primary`   | `#9333ea` (purple-600) | All interactive elements, HeroUI `color="primary"` |
| `secondary` | `#2563eb` (blue-600)   | Secondary actions, HeroUI `color="secondary"`      |

### Tailwind Config (`tailwind.config.js`)

```js
primary: {
  50: '#faf5ff',  100: '#f3e8ff',  200: '#e9d5ff',
  300: '#d8b4fe', 400: '#c084fc',  500: '#a855f7',
  600: '#9333ea', 700: '#7e22ce',  800: '#6b21a8',
  900: '#581c87', DEFAULT: '#9333ea', foreground: '#ffffff'
}
secondary: {
  DEFAULT: '#2563eb', foreground: '#ffffff'
}
boxShadow: {
  glow: '0 0 20px rgba(147, 51, 234, 0.3)'  // purple glow
}
```

### CSS Variables (`src/app/globals.css`)

```css
:root {
  --color-primary: #9333ea;
  --shadow-glow: 0 0 20px rgba(147, 51, 234, 0.3);
}
```

BProgress bar: `background: #9333ea !important`

### JS Tokens (`src/lib/design-system.ts`)

```ts
brand.primary = '#9333ea';
brand.secondary = '#2563eb';
```

---

## 3. Color Palette

### Permitted Accent Colors

All colors chosen for **color harmony** with purple (#9333ea at ~270° on the wheel):

| Color          | Tailwind      | Relation to Purple        | Permitted Uses                                                     |
| -------------- | ------------- | ------------------------- | ------------------------------------------------------------------ |
| **Purple**     | `purple-600`  | Primary brand             | All interactive elements, icon BGs, primary stats                  |
| **Indigo**     | `indigo-600`  | Analogous (blue-adjacent) | Tracks stat, content counts                                        |
| **Violet**     | `violet-600`  | Analogous (red-adjacent)  | Downloads stat, download activity icon                             |
| **Emerald**    | `emerald-600` | Semantic success/growth   | Plays stat, play activity icon, positive trends, online status dot |
| **Rose**       | `rose-600`    | Semantic negative/hearts  | Likes stat, like activity icon, negative trends, error states      |
| **Amber**      | `amber-500`   | Semantic gold/rank        | Rank #1 badge **only**                                             |
| **Slate/Gray** | `slate-400`   | Neutral                   | Rank #2+, chrome, disabled states                                  |

### Forbidden Colors

These were previously used arbitrarily and must **not** be introduced:

- ❌ `blue-*` as a standalone accent (use `indigo-*` instead)
- ❌ `orange-*` (use `violet-*` for neutral, `amber-*` for warm/gold)
- ❌ `teal-*` (use `purple-*` or `violet-*`)
- ❌ `yellow-*` (use `amber-*`)

### Color Usage Rules

- **Errors / danger**: `rose` (not red)
- **Success / positive growth**: `emerald` (not green)
- **Heart / likes**: `rose` (consistent with danger — hearts are emotional, not just positive)
- **Online status dots**: `emerald-500` (universally understood)
- **Count badges on header**: `primary` (purple) — not semantic colors

---

## 4. Component Library (`src/components/ui/`)

### Import Convention

```ts
// ✅ Always import from the barrel
import { FButton, FCard, FBadge, FStat } from '@/components/ui';

// ❌ Never import HeroUI wrapped components directly
import { Button } from '@heroui/react'; // only if NOT using FButton
```

---

### `FButton`

Wraps HeroUI `Button`. Enforces variant → color+variant combos.

```tsx
<FButton variant='primary'>Upload Music</FButton>      {/* Purple solid — main CTA */}
<FButton variant='secondary'>Save Draft</FButton>      {/* Blue solid — secondary CTA */}
<FButton variant='outline'>Cancel</FButton>            {/* Gray bordered — utility */}
<FButton variant='ghost'>View All</FButton>            {/* Gray light — subtle utility */}
<FButton variant='primary-outline'>Edit Profile</FButton> {/* Purple bordered — brand outline */}
<FButton variant='primary-ghost'>Active Tab</FButton>  {/* Purple light — active/selected state */}
<FButton variant='danger'>Delete</FButton>             {/* Rose solid — destructive */}
<FButton variant='danger-ghost'>Remove</FButton>       {/* Rose light — inline destructive */}
```

| `variant`         | HeroUI color | HeroUI variant | Use for                                                                           |
| ----------------- | ------------ | -------------- | --------------------------------------------------------------------------------- |
| `primary`         | `primary`    | `solid`        | **Max 1 per section.** The main CTA.                                              |
| `secondary`       | `secondary`  | `solid`        | Secondary brand CTA. Balances purple with blue.                                   |
| `primary-outline` | `primary`    | `bordered`     | When purple outline is explicitly needed                                          |
| `primary-ghost`   | `primary`    | `light`        | Active/selected nav states                                                        |
| `outline`         | `default`    | `bordered`     | **Default for management/form buttons.** Neutral gray.                            |
| `ghost`           | `default`    | `light`        | **Default for utility actions.** Neutral gray. Cancel, View All, Back, nav links. |
| `danger`          | `danger`     | `solid`        | Destructive CTAs (Delete, Remove account)                                         |
| `danger-ghost`    | `danger`     | `light`        | Inline destructive (remove row, remove link)                                      |

**Design rule**: If you find yourself using `primary` or `secondary` for more than 1-2 buttons on screen, downgrade the extras to `outline` or `ghost`.

**Never use `disabled` — always use `isDisabled` (HeroUI prop).**

---

### `FCard`

Wraps HeroUI `Card` + `CardBody`. Sets `shadow='none'` to enforce explicit shadow system.

```tsx
<FCard variant='default' padding='md'>content</FCard>
<FCard variant='elevated' padding='lg'>content</FCard>
<FCard variant='flat' padding='sm'>content</FCard>
```

| `variant`  | Style                    |
| ---------- | ------------------------ |
| `default`  | Border, no shadow        |
| `elevated` | Border + hover shadow-md |
| `flat`     | Gray-50 bg, no border    |

| `padding` | Value |
| --------- | ----- |
| `none`    | p-0   |
| `sm`      | p-4   |
| `md`      | p-6   |
| `lg`      | p-8   |

---

### `FBadge`

Wraps HeroUI `Chip`.

```tsx
<FBadge variant='category' color='primary'>Hip Hop</FBadge>
<FBadge variant='count' color='primary'>42</FBadge>
<FBadge variant='status'>Active</FBadge>
<FBadge variant='label'>Verified</FBadge>
```

| `variant`  | Use for                            |
| ---------- | ---------------------------------- |
| `status`   | Status dots with label             |
| `category` | Tag/category labels                |
| `count`    | Number pills (track count, plays)  |
| `label`    | Simple flat label (Verified, etc.) |

---

### `FStat`

Dashboard stat display. Typography-first — the number is the hero, color is a 2px accent bar only.

```tsx
// Dashboard grid (icon-left = accent bar + number + icon-label row)
<FStat
  label='Tracks'
  value='142'
  icon={MusicalNoteIcon}
  color='indigo'
  trend={{ value: 12.5, label: 'this week' }}
  layout='icon-left'
  size='sm'
/>

// Artist quick stats (stacked, no icon, no accent bar)
<FStat label='Total Plays' value='24,500' layout='stacked' size='sm' color='purple' />
```

**`icon-left` layout**: renders a thin 2px left accent bar in the stat color + large bold number + small icon+label row. **No colored background box.**

**`stacked` layout**: renders value + label only. No icon, no bar.

**Permitted `color` values**: `purple` | `indigo` | `violet` | `emerald` | `rose` | `amber` | `default`

**Legacy aliases** (still work): `blue`→`indigo`, `green`→`emerald`, `red`→`rose`, `orange`→`violet`, `teal`→`purple`

**Trend indicator**: positive = emerald, negative = rose (auto, no config needed)

---

### `FEmptyState`

Replaces all inline empty-state JSX blocks.

```tsx
<FEmptyState
  icon={MusicalNoteIcon}
  title='No tracks yet'
  description='Upload your first track to get started'
  action={{ label: 'Upload Music', onPress: handleUpload, variant: 'primary' }}
  size='md'
/>
```

| `size` | Use for                          |
| ------ | -------------------------------- |
| `sm`   | Inline empty states inside cards |
| `md`   | Tab content empty states         |
| `lg`   | Full-page empty states           |

---

### `FPageHeader`

Standardizes page/section headers.

```tsx
<FPageHeader
  title='Overview'
  subtitle='Your music performance at a glance'
  actions={<Dropdown>...</Dropdown>}
/>
```

- Title uses `font-poppins font-bold`
- Actions slot is right-aligned

---

### `FSection`

Consistent max-width container.

```tsx
<FSection maxWidth='wide' padding='md'>
  {/* page content */}
</FSection>
```

| `maxWidth` | Value     | Use for            |
| ---------- | --------- | ------------------ |
| `narrow`   | max-w-3xl | Prose, tool detail |
| `default`  | max-w-5xl | Most pages         |
| `wide`     | max-w-7xl | Dashboards         |
| `full`     | 100%      | Full-width layouts |

---

### `FInput` / `FTextarea` / `FSelect`

Always render with `variant='bordered' radius='lg'`. All HeroUI props pass through.

```tsx
<FInput label='Artist Name' placeholder='Enter name' isInvalid={!!error} errorMessage={error} />
<FTextarea label='Bio' minRows={3} maxRows={6} />
<FSelect label='Genre'>{options}</FSelect>
```

---

### `FAvatar`

Extends HeroUI `Avatar` with `xs` (w-6) and `xl` (w-20) sizes.

```tsx
<FAvatar src={imageUrl} name='Artist Name' size='xl' />
```

---

### `FSpinner`

Default `color='primary'`. Use `fullScreen` for loading pages.

```tsx
<FSpinner />                    // inline
<FSpinner size='lg' fullScreen /> // full page loading
```

---

### `FDivider`

```tsx
<FDivider spacing='sm' />  // my-3
<FDivider spacing='md' />  // my-4
<FDivider spacing='lg' />  // my-6
```

---

### `FModal`

Re-export of `src/components/shared/FlemojiModal`. Import from `@/components/ui`:

```tsx
import { FModal } from '@/components/ui';
```

---

## 5. Icon Usage

All icons are from `@heroicons/react/24/outline` (default) or `@heroicons/react/24/solid` (for filled state indicators).

**No icon containers — icons stand alone:**

```tsx
{
  /* ✅ Correct — plain icon, color carries meaning, no box */
}
<MusicalNoteIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />;

{
  /* ✅ Correct — semantic icon with its own color, no background */
}
<PlayIcon className='w-4 h-4 text-emerald-500' />;

{
  /* ❌ Wrong — tinted container on every card header = purple everywhere */
}
<div className='w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center'>
  <MusicalNoteIcon className='w-6 h-6 text-purple-600 dark:text-purple-400' />
</div>;

{
  /* ❌ Wrong — solid colored blocks scream for attention */
}
<div className='w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center'>
  <MusicalNoteIcon className='w-6 h-6 text-white' />
</div>;
```

**Rules**:

- **Decorative/navigation icons** (card headers, nav items, section labels): `text-gray-400 dark:text-gray-500`
- **Semantic icons** (activity type, status): use the semantic color directly on the icon — no background
- **FStat icons**: rendered inline with the label, small (w-3 h-3 / w-3.5 h-3.5), in the stat's color token
- **No icon container boxes in card headers** — ever. The heading text creates hierarchy; a colored box does not.
- `bg-purple-600` containers are **never** acceptable for decorative icons. Reserve solid brand color for the primary CTA button only.

---

## 6. Dashboard Color Map (current)

| Stat / Element           | Color Token        | Tailwind Class            |
| ------------------------ | ------------------ | ------------------------- |
| Tracks stat              | `indigo`           | `indigo-600`              |
| Plays stat               | `emerald`          | `emerald-600`             |
| Likes stat               | `rose`             | `rose-600`                |
| Downloads stat           | `violet`           | `violet-600`              |
| Listeners stat           | `purple`           | `purple-600`              |
| Play activity icon       | emerald            | `emerald-600`             |
| Like activity icon       | rose               | `rose-600`                |
| Download activity icon   | violet             | `violet-600`              |
| Page visit activity icon | purple             | `purple-600`              |
| Rank #1 badge            | amber              | `amber-500`               |
| Rank #2 badge            | slate              | `slate-400`               |
| Rank #3 badge            | slate              | `slate-400`               |
| Online status dot        | `bg-emerald-500`   | (universal UX convention) |
| Positive trend           | `text-emerald-600` |                           |
| Negative trend           | `text-rose-500`    |                           |
| Error states             | `rose`             | `rose-600`, `bg-rose-50`  |

---

## 7. Revamp Scope

### ✅ Completed

- `tailwind.config.js` — purple primary tokens
- `src/lib/design-system.ts` — JS tokens synced
- `src/app/globals.css` — CSS vars + BProgress bar
- `src/components/ui/` — all 14 library components
- `src/components/dashboard/StatsGrid.tsx`
- `src/components/dashboard/RecentTracks.tsx`
- `src/components/dashboard/TopPerformingTracks.tsx`
- `src/components/dashboard/RecentActivity.tsx`
- `src/components/dashboard/QuickActions.tsx`
- `src/components/dashboard/ProfileSection.tsx`
- `src/components/dashboard/ProfileURL.tsx`
- `src/components/dashboard/ProfileImageUpdate.tsx`
- `src/app/dashboard/DashboardContent.tsx`
- `src/app/artist-profile/page.tsx`
- `src/components/artist/ArtistProfileForm.tsx`
- `src/components/artist/SocialLinksEditor.tsx`
- `src/components/artist/StreamingLinksEditor.tsx`
- `src/components/artist/ArtistProfileCard.tsx`
- `src/components/layout/LearnHeader.tsx` — Tools added to nav
- `src/components/layout/PublicFooter.tsx` — Shared Learn/Tools footer
- Learn/Tools pages — unified header + footer
- `src/components/dashboard/artist/ArtistNavigation.tsx` — purple active states
- `src/components/dashboard/artist/PlaylistSubmissionsTab.tsx` — FCard/FButton/FBadge/FEmptyState, purple tabs
- `src/components/dashboard/artist/TrackEditPageClient.tsx` — FButton/FBadge, rose error state
- `src/components/dashboard/artist/QuickSubmitModal.tsx` — FCard/FButton/FTextarea, purple icon tints/selection rings

### 🚫 Out of Scope (do not touch)

- Timeline components (`src/components/timeline/`)
- Chat components (`src/components/ai/`)
- Auth forms (`src/components/auth/`)
- Public pages (`src/app/learn/`, `src/app/tools/`, landing)
- `src/components/shared/FlemojiModal.tsx` — only re-export, never modify
- Admin dashboard components (`src/components/dashboard/admin/`)

---

## 8. Rules for New UI Work

1. **Always use `FButton` instead of HeroUI `Button` directly** in Dashboard/Artist pages.
2. **Always use `FCard` instead of HeroUI `Card`/`CardBody`** in Dashboard/Artist pages.
3. **Never introduce `bg-blue-*`, `bg-orange-*`, or `bg-teal-*`** as accent colors. Use the permitted palette above.
4. **Empty states** must use `<FEmptyState>` — never write inline empty-state JSX blocks.
5. **Page headers** must use `<FPageHeader>` in dashboard/artist pages.
6. **Icon containers** must use `bg-purple-100 dark:bg-purple-900/30` with `text-purple-600` — **never solid `bg-purple-600`** for decorative icons.
7. **`ghost` and `outline` buttons are neutral gray by default.** Only use `primary-ghost` / `primary-outline` when you explicitly need a purple ghost/outline (e.g. active tab indicator).
8. **`primary` button = max 1 per section/card.** If you need a second prominent button, use `secondary` (blue). Everything else is `outline` or `ghost`.
9. **`disabled` prop** → always use `isDisabled` on HeroUI/F-wrapper components.
10. **Update this file** whenever a color, component API, or scope decision changes.
