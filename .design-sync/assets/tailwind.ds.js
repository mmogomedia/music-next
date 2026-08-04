/*
 * Design-system Tailwind config for the claude.ai/design bundle.
 *
 * Extends the repo's real tailwind.config.js verbatim (same theme, same HeroUI
 * plugin) and changes two things:
 *
 * 1. `content` is widened to include the authored preview cards.
 * 2. A `safelist` pins the documented brand palette.
 *
 * (2) matters more than it looks. Tailwind only emits classes it can SEE, and
 * the app happens not to use e.g. `bg-primary-700`, `bg-secondary-600`,
 * `bg-slate-400` or `shadow-glow`. Without a safelist those are absent from the
 * shipped stylesheet, so a design agent writing them from the documented
 * palette gets silently unstyled output. The safelist guarantees the whole
 * documented vocabulary resolves — see .design-sync/conventions.md, which
 * promises exactly these families.
 */
const base = require('../../tailwind.config.js');

// Scales the design system documents as usable. Keep in sync with the palette
// table in .design-sync/conventions.md.
const BRAND = 'primary|secondary';
const ACCENTS = 'purple|indigo|violet|emerald|rose|amber|sky|slate|gray';
const SHADES = '50|100|200|300|400|500|600|700|800|900|950';

module.exports = {
  ...base,
  content: [...base.content, './.design-sync/previews/**/*.{ts,tsx}'],
  safelist: [
    {
      pattern: new RegExp(
        `^(bg|text|border|ring|divide|from|to)-(${BRAND})-(${SHADES})$`
      ),
      variants: ['hover', 'dark'],
    },
    {
      pattern: new RegExp(
        `^(bg|text|border|ring|divide)-(${ACCENTS})-(${SHADES})$`
      ),
      variants: ['hover', 'dark'],
    },
    // Brand extras defined in theme.extend that the app doesn't currently use.
    'shadow-glow',
    'shadow-glow-secondary',
    'font-poppins',
    'font-sans',
    'font-mono',
  ],
};
