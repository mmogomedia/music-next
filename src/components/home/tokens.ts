/**
 * Landing-page design tokens.
 *
 * The marketing landing page (`/`) runs its own palette, separate from the
 * dashboard design system in `docs/design-system.md` — see the "Landing page"
 * note there. Values come from the Claude Design source
 * ("Flemoji Landing Page.dc.html", project "Landing page redesign: three
 * directions") and are kept here so the sections stay consistent with each
 * other and a colour change is a one-line edit.
 */

import type { CSSProperties } from 'react';

/** Brand gradient shared by the hero and the streaming section. */
export const BRAND_GRADIENT =
  'linear-gradient(104deg,#3B4FE4 0%,#6C3AF0 48%,#A21CEA 100%)';

/** Faint 56px graph-paper grid laid over the gradient sections. */
export const GRID_OVERLAY: CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)',
  backgroundSize: '56px 56px',
};

/** Placeholder artwork gradients, cycled so adjacent cards never match. */
export const ARTWORK_GRADIENTS = [
  'linear-gradient(140deg,#A9B8F0,#C9AEEC)',
  'linear-gradient(140deg,#B6C2F3,#D9B4EC)',
  'linear-gradient(140deg,#C0B7F1,#C4AEEE)',
  'linear-gradient(140deg,#A9B8F0,#D9B4EC)',
  'linear-gradient(140deg,#B6C2F3,#C9AEEC)',
] as const;

export function artworkGradient(index: number): string {
  return ARTWORK_GRADIENTS[index % ARTWORK_GRADIENTS.length];
}

/** Section padding used by every band on the page. */
export const SECTION_PADDING = 'px-5 py-14 sm:px-8 md:py-20 lg:px-12 lg:py-24';

/** Shared max width — the design is a 1320px container. */
export const CONTAINER = 'mx-auto max-w-[1320px]';
