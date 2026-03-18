/**
 * Flemoji Tool Registry
 *
 * Single source of truth for all interactive tools.
 * Tools are defined here as pure metadata — components are co-located in
 * src/components/tools/[slug]/ and rendered separately.
 *
 * To add a new tool:
 * 1. Create src/components/tools/my-tool/MyTool.tsx
 * 2. Register a ToolDefinition below (pick an icon from the iconography guide)
 * 3. Add the slug to ToolRenderer's dynamic import map
 *
 * ─────────────────────────────────────────────────────────
 *  ICONOGRAPHY GUIDE  (all icons from @heroicons/react/24/outline)
 * ─────────────────────────────────────────────────────────
 *
 *  Category → icon choices (white on gradient background)
 *
 *  royalties     ScaleIcon          — balance scales signal fairness in splits
 *  finance       BanknotesIcon      — banknotes represent earnings and revenue
 *  distribution  ArrowUpTrayIcon    — upward arrow = pushing music out to platforms
 *  promotion     MegaphoneIcon      — megaphone = amplifying an artist's reach
 *
 *  Individual tool overrides (preferred over category defaults):
 *
 *  split-sheet       ScaleIcon        royalty fairness
 *  revenue-predictor BanknotesIcon    streaming earnings
 *
 *  When adding a new tool choose the icon that best represents the *action*
 *  the tool performs, not just its category. Document your choice here.
 * ─────────────────────────────────────────────────────────
 */

export type ToolCategory =
  | 'royalties'
  | 'distribution'
  | 'promotion'
  | 'finance';

/**
 * Icon keys — resolved to actual Heroicon components inside ToolSummaryCard
 * (a Client Component). Storing a string here keeps the registry plain-object
 * serialisable so it can safely pass from Server → Client Components.
 *
 * Supported values:  scale | banknotes | arrow-up-tray | megaphone
 */
export type ToolIconKey = 'scale' | 'banknotes' | 'arrow-up-tray' | 'megaphone';

export interface ToolDefinition {
  slug: string;
  name: string;
  /** One short sentence — shown in the pill under the icon */
  tagline: string;
  /** 2–3 sentence description used in the summary card and /tools page */
  description: string;
  category: ToolCategory;
  /** Tailwind gradient classes for the card accent — e.g. 'from-purple-500 to-indigo-600' */
  gradient: string;
  /**
   * Icon key resolved to a white Heroicon inside ToolSummaryCard.
   * See the iconography guide at the top of this file.
   * Must be a plain string — React components cannot cross the server/client boundary.
   */
  iconKey: ToolIconKey;
  /** 2–3 bullet points shown on the summary card */
  features: string[];
  /** When true the /tools/[slug] page renders full-width with no container or padding */
  fullscreen?: boolean;
}

/** Default icon key per category — used as fallback for future tools */
export const CATEGORY_ICON_KEYS: Record<ToolCategory, ToolIconKey> = {
  royalties: 'scale',
  finance: 'banknotes',
  distribution: 'arrow-up-tray',
  promotion: 'megaphone',
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'split-sheet',
    name: 'Split Sheet Calculator',
    tagline: 'Divide royalties fairly between collaborators',
    description:
      'Create a professional royalty split agreement for any collaboration. Add contributors, assign percentage ownership, define roles, and export a clean text record to share with co-writers, producers, and labels.',
    category: 'royalties',
    gradient: 'from-purple-500 to-indigo-600',
    iconKey: 'scale', // balance scales = fair royalty splits
    features: [
      'Add unlimited collaborators with custom roles',
      'Live percentage validation (must total 100%)',
      'Export a shareable split record',
    ],
    fullscreen: true,
  },
  {
    slug: 'revenue-predictor',
    name: 'Revenue Predictor',
    tagline: 'Estimate your streaming earnings across platforms',
    description:
      'Enter your monthly stream counts across Spotify, Apple Music, YouTube Music, TIDAL, and more — and see your estimated revenue in both USD and ZAR. Understand how different platforms pay and where to focus your promotion.',
    category: 'finance',
    gradient: 'from-emerald-500 to-teal-600',
    iconKey: 'banknotes', // banknotes = streaming earnings
    features: [
      'Covers 5 major streaming platforms',
      'Real-time ZAR + USD estimates',
      'Platform-by-platform breakdown',
    ],
    fullscreen: true,
  },
];

export function getAllTools(): ToolDefinition[] {
  return TOOLS;
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find(t => t.slug === slug);
}

export function getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
  const grouped: Record<ToolCategory, ToolDefinition[]> = {
    royalties: [],
    distribution: [],
    promotion: [],
    finance: [],
  };
  for (const tool of TOOLS) {
    grouped[tool.category].push(tool);
  }
  return grouped;
}
