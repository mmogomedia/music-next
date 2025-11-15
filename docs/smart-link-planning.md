# Quick Link Feature Planning

## Objective

Create shareable quick links for tracks, artist profiles, and albums with dedicated SEO-friendly landing pages and optional chat continuation.

---

## Success Criteria

- [ ] Users can generate quick links only for eligible (public & released) content.
- [ ] `/quick/:slug` renders the appropriate view (track, album, artist) with complete metadata.
- [ ] Each landing page offers a "View in Chat" button that passes context into the chat experience.
- [ ] Analytics track total visits plus downstream actions (play, download, share, like).
- [ ] Dashboard provides CRUD + disable controls and shows analytics snapshots.
- [ ] Slugs are human readable, editable, and unique.
- [ ] Feature respects existing privacy policies and release states.

---

## Work Breakdown & Checklists

### 1. Data Model / Backend

- [ ] Define `QuickLink` Prisma model with fields:
  - Type (`track | album | profile`), `targetId`, `slug`, `title`, optional `description`/CTA
  - Booleans: `isActive`, `isPrerelease`
  - Owner: `createdByUserId`
  - Analytics counters: `totalVisits`, `playCount`, `downloadCount`, `likeCount`, `shareCount`
  - Timestamps: `firstVisitedAt`, `lastVisitedAt`
- [ ] Migration for new table and indexes (slug unique).
- [ ] Add optional relational convenience (e.g., `trackId`, `albumId`, `profileUserId`).
- [ ] API routes:
  - [ ] `POST /api/dashboard/quick-links` (create with validation)
  - [ ] `PATCH /api/dashboard/quick-links/:id` (update title/slug/status)
  - [ ] `DELETE /api/dashboard/quick-links/:id`
  - [ ] `GET /api/dashboard/quick-links` (list with filters)
  - [ ] `POST /api/quick-links/:id/analytics` (increment counters based on event)
- [ ] Slug generation helper (from name + random suffix, ensure uniqueness).
- [ ] Privacy enforcement: block creation if track not public or flagged prerelease.

### 2. Dashboard UI (Admin/Artist)

- [ ] Entry point in dashboard (tab or section) listing existing quick links.
- [ ] Table columns: Link title, type, target, status, total visits, created date, actions.
- [ ] Action buttons: copy link, preview (opens `/quick/:slug` in new tab), disable/enable toggle, delete.
- [ ] Create Quick Link flow:
  - [ ] Modal/wizard: choose type → pick target → show autogen slug/title + editing → optional description.
  - [ ] Validate slug uniqueness live.
  - [ ] Warn/disable if target not eligible.
- [ ] Detail drawer/panel for analytics (charts optional later).
- [ ] Audit note (maybe track who created/updated).

### 3. Landing Pages (`/quick/:slug`)

- [ ] Next.js dynamic route with server-side lookup (slug → quick link).
- [ ] If not found or disabled, show friendly error + CTA (maybe go home).
- [ ] Render specific view based on `type`:
  - **Track View** (new):
    - [ ] Hero with artwork, title, artist, release info.
    - [ ] Primary actions: play (opens player component but no autoplay), download (respect permissions), share.
    - [ ] Streaming platform links (from track metadata).
    - [ ] Track details: genre, duration, BPM, description, credits, copyright, release date.
    - [ ] Related tracks or recommendations (optional later).
  - **Album View** (new):
    - [ ] Artwork, album title, artist, release year, description.
    - [ ] Tracklist (with play buttons) + durations.
    - [ ] Streaming links.
  - **Artist View** (redesign existing renderer):
    - [ ] Artist photo, stage name, bio.
    - [ ] Social links (website, Instagram, Twitter, etc.).
    - [ ] Top 5 songs (playable) + “View full profile” CTA.
    - [ ] Stats if available (followers, total plays).
- [ ] Add SEO metadata per type (meta tags, OpenGraph, structured data snippet).
- [ ] Analytics: increment `totalVisits` on load.
- [ ] Prominent "View in Chat" button linking to `/` with `quickLinkId` query params so the landing/chat experience hydrates correctly.
- [ ] Update landing page entry logic to detect `quickLinkId` query params (e.g., `/?quickLinkId=...`).

### 4. Chat Integration

- [ ] Update chat entrypoint to detect `quickLinkId` query param.
- [ ] Preload the same data used on landing page.
- [ ] Render appropriate view in chat (track, album, artist) using our response renderer system:
  - For track & album, create new renderers (e.g., `quick-track`, `quick-album`).
  - For artist, adapt existing renderer to accept quick-link context and extended info.
- [ ] Ensure actions (play, download, like, share) trigger analytics via API.
- [ ] Provide contextual chat suggestions (“Find similar songs”, “More from this album”, etc.).

### 5. Analytics & Telemetry

- [ ] Hook: `useEffect` on landing page increments `totalVisits` via API.
- [ ] Buttons trigger analytics events (play, download, share, like) with quick link ID.
- [ ] Optionally record last N events for deeper reporting (out-of-scope for first pass but plan for expansion).
- [ ] Dashboard analytics view summarizing metrics.

### 6. QA / Acceptance Tests

- [ ] Unit tests for slug generation & validation.
- [ ] API integration tests for creation, update, eligibility checks.
- [ ] Cypress/e2e tests for landing page rendering and analytics triggers.
- [ ] Accessibility audit on landing pages (keyboard nav, screen readers).
- [ ] SEO check (meta tags, social preview).

### 7. Deployment Considerations

- [ ] Feature flag or environment toggle during rollout.
- [ ] Data migration script to create table.
- [ ] Backfill sample quick links if needed for testing.
- [ ] Monitor analytics endpoints for performance.

---

## View Renderer Alignment (Chat)

- Quick link context will use the response renderer registry.
- New renderers required:
  - `QuickTrackRenderer`
  - `QuickAlbumRenderer`
- Existing `ArtistRenderer` will be refreshed to handle “Quick Link” data (social links, top 5 songs, etc.).
- Each renderer should expose CTA(s) consistent with landing-page layout for continuity.

---

## Open Questions / Follow-ups

- ❌ Role-specific link quotas/restrictions (artist vs admin) — not needed per synced decision.
- ✅ Capture referrer / campaign parameters in analytics.
- ❌ Non-English slug support — not required for now.
- ❌ Moderation queue for quick links — not needed.

---

## Next Up

- Confirm schema & API shape.
- Sketch landing page & chat renderer designs (track/album/artist).
- Document analytics event payloads.
- Begin implementing data model + dashboard UI.
