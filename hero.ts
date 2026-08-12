/**
 * HeroUI Tailwind plugin entry point.
 *
 * Tailwind v4 has no `tailwind.config.js`, so the HeroUI plugin is loaded from
 * CSS with `@plugin './hero.ts'` (see src/app/globals.css). This file exists
 * only to give that directive a default export to call.
 *
 * Called with no arguments, exactly as it was in the v3 `tailwind.config.js`
 * (`plugins: [heroui(), ...]`), so the HeroUI theme is unchanged.
 */
import { heroui } from '@heroui/react';

export default heroui();
