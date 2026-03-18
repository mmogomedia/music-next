# Flemoji Tools System

Interactive utility tools for music industry education. Tools are self-contained React components registered in a central registry. They can be attached to articles and discovered on the `/tools` page.

---

## Concept

Each tool serves a practical music industry need — split sheet calculation, revenue prediction, etc. Tools are designed to be:

- **Contextual** — attached to related articles (e.g. a split sheet tool lives on a royalties article)
- **Discoverable** — all tools are listed at `/tools`
- **Embeddable** — rendered inline inside articles as rich summary cards, not plain links

---

## Dual Representation

Every tool has exactly two React components:

### 1. Summary Card

Rendered **inside articles** and on the `/tools` index page. A visually designed card that communicates what the tool does and invites the reader to use it. Contains:

- Tool icon + gradient background (themed per tool)
- Name and description
- Feature highlights (2–3 bullet points)
- "Use this tool →" CTA — navigates to `/tools/[slug]`

The summary card is defined once and reused in both contexts (article embed + tools grid).

### 2. Full Tool

The interactive component. Lives at `/tools/[slug]`. Can be any UI — a multi-step form, a calculator with live output, a table generator, etc.

---

## Registry

**`src/lib/tools/registry.ts`** — single source of truth for all tools.

```ts
export interface ToolDefinition {
  slug: string;
  name: string;
  description: string; // one-sentence summary
  category: ToolCategory; // 'royalties' | 'distribution' | 'promotion' | 'finance'
  icon: React.ComponentType<{ className?: string }>;
  gradient: string; // tailwind gradient classes, e.g. 'from-purple-500 to-indigo-600'
  features: string[]; // 2–3 bullet points shown on summary card
  SummaryCard: React.ComponentType<SummaryCardProps>;
  Tool: React.ComponentType;
}
```

Adding a new tool requires **one registry entry** and **two components**. No migrations, no new API routes.

### Registered Tools (initial)

| Slug                | Name                   | Category  |
| ------------------- | ---------------------- | --------- |
| `split-sheet`       | Split Sheet Calculator | royalties |
| `revenue-predictor` | Revenue Predictor      | finance   |

---

## File Structure

```
src/
├── lib/tools/
│   └── registry.ts                        # Central tool registry
├── components/tools/
│   ├── ToolSummaryCard.tsx                # Shared summary card shell (layout + CTA)
│   ├── split-sheet/
│   │   ├── SplitSheetSummaryCard.tsx      # Summary card for split sheet
│   │   └── SplitSheetTool.tsx             # Full interactive tool
│   └── revenue-predictor/
│       ├── RevenuePredictorSummaryCard.tsx
│       └── RevenuePredictorTool.tsx
└── app/
    ├── tools/
    │   ├── page.tsx                       # /tools — grid of all tools
    │   └── [slug]/
    │       └── page.tsx                   # /tools/[slug] — full tool page
    └── learn/
        └── [slug]/
            └── page.tsx                   # Modified: renders attached tools below article body
```

---

## Database

One field added to the `Article` model:

```prisma
model Article {
  // ... existing fields
  toolSlugs  String[]  @default([])
}
```

Tools themselves are **not stored in the database** — the registry is code-only. The DB only stores which slugs are attached to each article. This means:

- Renaming a tool slug requires updating `toolSlugs` on affected articles (admin action)
- Removing a tool from the registry means its slug is silently ignored at render time (graceful degradation)

---

## Article Integration

In `/learn/[slug]`, after the article body, if `article.toolSlugs.length > 0`:

```
┌─────────────────────────────────────────┐
│  Article body (markdown)                │
│                                         │
│  ...                                    │
└─────────────────────────────────────────┘

  ── Interactive Tools ──────────────────

┌──────────────────┐  ┌──────────────────┐
│  [Tool Icon]     │  │  [Tool Icon]     │
│  Split Sheet     │  │  Revenue         │
│  Calculator      │  │  Predictor       │
│                  │  │                  │
│  Divide royalties│  │  Estimate your   │
│  fairly between  │  │  streaming       │
│  collaborators.  │  │  earnings.       │
│                  │  │                  │
│  • Add members   │  │  • Per-platform  │
│  • Set splits    │  │  • Trend lines   │
│  • Export PDF    │  │  • ZAR + USD     │
│                  │  │                  │
│  Use this tool → │  │  Use this tool → │
└──────────────────┘  └──────────────────┘
```

Tools are resolved from the registry at render time. Unknown slugs (registry misses) are skipped silently.

---

## `/tools` Page

A grid of all registered tools using each tool's `SummaryCard`. Grouped by `category`. No DB query needed — rendered entirely from the registry.

```
/tools

  Royalties
  ┌──────────────────┐
  │ Split Sheet ...  │
  └──────────────────┘

  Finance
  ┌──────────────────┐
  │ Revenue ...      │
  └──────────────────┘
```

---

## `/tools/[slug]` Page

Full-page tool view. Layout:

- Breadcrumb: Home → Tools → [Tool Name]
- Tool header (name, description, category badge)
- The `Tool` component (full interactive UI)
- "Related articles" — articles that have this slug in their `toolSlugs` (queried from DB)

---

## Admin: Attaching Tools to Articles

In the Article Editor (`ArticleEditor.tsx`), a multi-select input shows all registered tool slugs. Selected slugs are saved to `article.toolSlugs`. The admin sees tool names (not raw slugs).

---

## Adding a New Tool (Pattern)

1. Create `src/components/tools/my-tool/MyToolSummaryCard.tsx`
2. Create `src/components/tools/my-tool/MyTool.tsx`
3. Add one entry to `src/lib/tools/registry.ts`
4. In admin, attach the tool slug to any relevant articles

No migrations. No new pages. No new API routes.

---

## Graceful Degradation

- If a slug in `article.toolSlugs` has no registry entry → silently skipped, no error
- If the registry is empty → "Interactive Tools" section is hidden entirely
- Tools are lazy-loaded on `/tools/[slug]` to keep the article page bundle small
