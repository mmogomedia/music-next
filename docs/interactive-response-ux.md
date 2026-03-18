# Interactive-First AI Response UX

Every AI response ends with at least one tappable chip. This document covers the architecture,
data flow, and per-renderer context rules.

---

## Architecture

### SuggestedActions component

`src/components/ai/response-renderers/suggested-actions.tsx`

A horizontal strip of pill chips. Each chip fires one action upward via `onAction`:

```ts
onAction({ type: 'send_message', data: { message: string } });
```

Props:

| Prop          | Type                               | Description           |
| ------------- | ---------------------------------- | --------------------- |
| `suggestions` | `Array<{ label, message, icon? }>` | Chips to render       |
| `onAction`    | `(action) => void`                 | Fires on click        |
| `className`   | `string?`                          | Extra wrapper classes |

### Action dispatch chain

```
Chip click
  → SuggestedActions.onAction({ type: 'send_message', data: { message } })
  → Renderer.onAction (prop passed in)
  → AIChat.handleAction switch
  → case 'send_message': performSubmit(action.data.message)
  → SSE stream → RouterAgent → specialized agent → new response
```

The `send_message` case lives in `AIChat.tsx` alongside `search_genre`, `play_track`, etc.

---

## Context data flow

Suggestions are derived from the structured data the agent returned — not hardcoded strings.
The chain is:

```
Agent tool call
  → aggregated result (tracks / playlists / artists)
  → response object with metadata
  → AIChat extracts: { type, message, data, actions }
  → ResponseRenderer passes response to renderer component
  → renderer derives suggestions from response.data.metadata + response.data items
```

---

## Per-renderer context rules

### `text-renderer`

Source: `response.actions` (array of `Action` with `type: 'send_message'`)

- If the agent supplied `actions`, those chips are shown directly.
- If not, three default chips are shown: Search for music / Show me trending tracks / Browse genres.

Agents that supply actions: `HelpAgent` (5 chips), `FallbackAgent` (3 chips).

---

### `track-list-renderer`

Source: `response.data.metadata` + `response.data.tracks[0]`

| Field               | Set by agents?                | Used for                                               |
| ------------------- | ----------------------------- | ------------------------------------------------------ |
| `metadata.genre`    | ✅ Discovery + Recommendation | Primary chip: `"Find me more {genre} tracks"`          |
| `metadata.province` | ✅ Discovery + Recommendation | Secondary chip: `"Show me more music from {province}"` |
| `metadata.query`    | ❌ Not set on track_list      | — (dead field, not used)                               |
| `tracks[0].artist`  | ✅ Always present             | Fallback primary: `"Show me more tracks by {artist}"`  |

Decision logic (`buildTrackSuggestions`):

```
Primary chip:
  genre present  → "Find me more {genre} tracks"
  no genre       → "Show me more tracks by {firstArtist}"
  no artist      → "Find me more tracks like these"

Secondary chip:
  province present       → "Show me more music from {province}"
  genre + artist present → "Show me more tracks by {firstArtist}"
  genre only             → "Show me {genre} artists"
  none                   → "Show me all genres"

Always:
  "I'm in a different mood, suggest something else"
```

---

### `search-results-renderer`

Source: `response.data.metadata.query`

| Field            | Set by agents?     | Used for                                 |
| ---------------- | ------------------ | ---------------------------------------- |
| `metadata.query` | ✅ Discovery agent | `"Find more music matching \"{query}\""` |

Fallback (no query): `"Show me more results like these"`

---

### `genre-list-renderer`

Source: `pulsingGenre` local state (tracks the last-clicked genre id)

- Before any click: generic chips — "Recommend for me" / "Search instead"
- After a click: first chip becomes `"Show me more {clickedGenre} tracks"`

The chip updates as soon as a genre is clicked (800 ms ring animation, state persists until next click).

---

### `artist-renderer`

Source: `artist.artistName`, `artist.genre`, `artist.location` (all real profile fields)

| Field               | Used for                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `artist.artistName` | `"Show me tracks by {name}"` + `"Find artists similar to {name}"` |
| `artist.genre`      | `"Show me {genre} artists"` (only shown if genre is set)          |

The "View Full Profile" button also falls back to a `send_message` action
(`"Show me tracks by {name}"`) when `onViewArtist` is not wired.

---

### `playlist-renderer`

Source: `playlistName` local state, `selectedGenreOption` local state

| Field                      | Used for                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `playlistName`             | `"Find playlists similar to \"{name}\""`                       |
| `selectedGenreOption.name` | `"Show me more {genre} playlists"` (only if genre is selected) |

Fallback (no genre): `"Show me all genres"`

---

### `playlist-grid-renderer`

Source: `response.data.metadata.genre`

| Field            | Set by agents?                | Used for                           |
| ---------------- | ----------------------------- | ---------------------------------- |
| `metadata.genre` | ✅ Discovery + Recommendation | `"Show me more {genre} playlists"` |

Fallback: `"Find playlists similar to these"`

---

### `timeline-post-list-renderer`

Source: `response.data.metadata.query`

| Field            | Set by agents?    | Used for                                 |
| ---------------- | ----------------- | ---------------------------------------- |
| `metadata.query` | ✅ Timeline agent | `"Show me more posts about \"{query}\""` |

Fallback: `"Show me more timeline posts"`

---

### `preferences-renderer`

Source: `response.data.genres[0]`, `response.data.artists[0]` (from memory system)

| Field             | Used for                          |
| ----------------- | --------------------------------- |
| `genres[0].name`  | `"Show me {topGenre} tracks"`     |
| `artists[0].name` | `"Show me tracks by {topArtist}"` |

Both fall back to generic chips if the arrays are empty (new user, no history).

---

## Agent actions (text responses)

### HelpAgent

Always attaches 5 `send_message` actions regardless of which help question was asked:

| Label               | Message sent                   |
| ------------------- | ------------------------------ |
| Find music          | `"I'm looking for music"`      |
| Get recommendations | `"Recommend something for me"` |
| Browse genres       | `"Show me all genres"`         |
| My taste profile    | `"What music do I like?"`      |
| Trending now        | `"What's trending?"`           |

### FallbackAgent

Always attaches 3 `send_message` actions:

| Label                | Message sent                   |
| -------------------- | ------------------------------ |
| Search for something | `"Search for music"`           |
| Show trending        | `"Show me what's trending"`    |
| Get help             | `"What can you help me with?"` |

---

## Metadata fields populated by agents

| Response type        | `metadata.genre` | `metadata.province` | `metadata.query` | `metadata.total` |
| -------------------- | ---------------- | ------------------- | ---------------- | ---------------- |
| `track_list`         | ✅               | ✅                  | ❌               | ✅               |
| `playlist_grid`      | ✅               | ✅                  | ❌               | ✅               |
| `search_results`     | ❌               | ❌                  | ✅               | ✅               |
| `timeline_post_list` | ❌               | ❌                  | ✅               | ✅               |
| `genre_list`         | ❌               | ❌                  | ❌               | ✅               |
| `artist`             | ❌               | ❌                  | ❌               | —                |
| `playlist`           | ❌               | ❌                  | ❌               | —                |

---

## Adding chips to a new renderer

1. Import `SuggestedActions` from `./suggested-actions`
2. Derive context from `response.data` or local state
3. Build a `suggestions` array with `{ label, message }` items
4. Render `<SuggestedActions suggestions={...} onAction={onAction} />` at the bottom
5. No wiring needed beyond passing `onAction` — `AIChat.tsx` already handles `send_message`
