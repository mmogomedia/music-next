# design-sync notes — Flemoji

Repo-specific gotchas for `/design-sync`. Read this before re-syncing.

## Commands for a re-sync

From the repo root, in this order (the CSS step is NOT automatic):

```sh
# 0. if ~/.pnp.cjs exists, move it aside first — see below
mv ~/.pnp.cjs ~/.pnp.cjs.bak

# 1. re-stage the converter (stale .ds-sync/ runs an old converter)
SB="<design-sync skill dir>"
cp -r "$SB"/package-*.mjs "$SB"/resync.mjs "$SB"/lib "$SB"/storybook .ds-sync/

# 2. recompile the stylesheet (required if component classes or the theme moved)
sh .design-sync/assets/build-css.sh

# 3. fetch the anchor, then run the driver
#    (write the project's _ds_sync.json to .design-sync/.cache/remote-sync.json first)
node .ds-sync/resync.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./.design-sync/assets/ds-entry.ts \
  --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json

mv ~/.pnp.cjs.bak ~/.pnp.cjs   # restore
```

Converter deps live in `.ds-sync/` (`npm i esbuild ts-morph @types/react
playwright` + `npx playwright install chromium`) — gitignored, so a fresh clone
must reinstall them.

## Shape: `package` (no Storybook)

There is no Storybook and no `*.stories.*` anywhere, and this repo is a Next.js
**app**, not a published component library — there is no `dist/`. The converter
therefore runs in synth-entry mode against TypeScript sources.

## Entry is a purpose-built file, not the barrel

`--entry ./.design-sync/assets/ds-entry.ts` (NOT `src/components/ui/index.ts`).

The real barrel also exports `FSideNav`, `BProgressProvider`, `Toast`,
`ImageUpload`, `ImageCropper` and `GhostLoader`. Those drag `next/navigation`,
`next/link` and `react-image-crop` into the bundle, and `FSideNav` calls
`usePathname()`, which throws outside a Next app-router context. Scoping the
entry to the visual primitives dropped the bundle from 1564 KB → 1143 KB.

**When a primitive is added to `src/components/ui/`, add it to BOTH
`ds-entry.ts` and `componentSrcMap`** — discovery cannot find it otherwise
(see next bullet).

## Component discovery needs explicit `componentSrcMap` pins

The converter discovers components from PascalCase value exports **in the
`.d.ts` tree**. This repo ships no `.d.ts`, so the first build reported
`[ZERO_MATCH] no component exports — treating as tokens-only DS` and
`components: 0` even though the bundle itself was fine. Every component is
pinned explicitly in `componentSrcMap`; that is what makes discovery work here.
`FCardSkeleton`, `StatCardSkeleton` and the four `Modal*` re-exports are pinned
`null` — they stay importable from the bundle but get no card of their own.

## Stray `~/.pnp.cjs` breaks the esbuild step

`/Users/tatenda/.pnp.cjs` (dated March 2025) is **orphaned** — there is no
`package.json`, `yarn.lock` or `.yarnrc.yml` beside it. It declares the entire
home directory as a Yarn PnP workspace named `root-workspace-0b6124` with no
dependencies, so esbuild — which walks up looking for a PnP manifest — refuses
to resolve `react`/`react-dom` for anything under `~`:

```
✘ The Yarn Plug'n'Play manifest forbids importing "react" here
```

This repo explicitly sets `nodeLinker: node-modules` in `.yarnrc.yml`, so the
manifest is spurious. Fix: move it aside for the duration of the build
(`mv ~/.pnp.cjs ~/.pnp.cjs.bak`). The 2026-08-04 sync moved it temporarily and
restored it afterwards. **If a future build fails to resolve `react`, check for
this file first.**

## Styling: Tailwind is compiled here, not shipped by the package

Components style via Tailwind utilities + the HeroUI theme, so there is no
prebuilt stylesheet to point `cssEntry` at. `.design-sync/assets/build-css.sh`
compiles one:

- `assets/ds.css` — `@tailwind` directives + `:root` tokens
- `assets/tailwind.ds.js` — the repo's real `tailwind.config.js`, with `content`
  widened to include `.design-sync/previews/**`
- output → `assets/ds.compiled.css` (~381 KB), which `cfg.cssEntry` points at

Content globs deliberately stay the app's own (`src/**` + HeroUI dist) so the
emitted utility vocabulary is the vocabulary Flemoji actually uses — a design
agent writing Flemoji screens needs those classes to resolve.

**Re-run `sh .design-sync/assets/build-css.sh` before `package-build.mjs`
whenever component classes or the Tailwind theme change.** It is not automatic.

Also note `node_modules/tailwindcss/lib/cli.js` ships **without the exec bit**,
so `./node_modules/.bin/tailwindcss` fails with "Permission denied" — the script
invokes it via `node` for that reason.

## Fonts: harvested from next/font output

`next/font/google` self-hosts Inter, Poppins and JetBrains Mono, and injects
`--font-inter` / `--font-poppins` / `--font-jetbrains-mono` onto `<html>` at
runtime. Nothing does that in a static bundle, so `fontFamily.sans`
(`['var(--font-inter)', …]`) would collapse to `system-ui` and every design would
render in the wrong typeface.

Two things fix it, and both must stay in place:

1. `assets/fonts.css` — 36 `@font-face` rules + 22 `.woff2` files (448 KB)
   extracted from `.next/static/css/app/layout.css`, wired via `cfg.extraFonts`.
2. `assets/ds.css` `:root` **defines the three font custom properties**.

The woff2s are committed so re-sync doesn't depend on a `.next/` build being
present. To regenerate after a font change, run a `next build` and re-extract
from `.next/static/css/app/layout.css`.

## Findings for the Flemoji team (NOT sync bugs)

Commit `efc251c feat: switch primary color from purple to blue` deliberately
swapped the brand tokens. The swap left inconsistencies that the sync **ships
faithfully** (the user's explicit 2026-08-04 decision — the uploaded DS mirrors
production rather than a corrected ideal):

1. **`docs/design-system.md` is stale.** It still documents the purple-primary
   era (`primary = #9333ea`, `secondary = #2563eb`); `tailwind.config.js` has
   these the other way round. Because the doc would actively mislead the design
   agent, `guidelinesGlob` is `[]` and the doc is **not** uploaded. The accurate
   conventions live in `.design-sync/conventions.md` instead.
2. **Two different blues.** `heroui()` is called with no options, so HeroUI's
   `color="primary"` resolves to HeroUI's own default blue
   (`hsl(212 100% 46.67%)`), while the Tailwind `primary-*` scale is `#2563eb`.
   `FButton variant="primary"` and `FChip color="primary"` therefore do not
   match. Fixing this means passing the brand palette to `heroui()`.
3. **`FStat color="purple"` renders blue.** Its colour map points `purple` at
   `bg-primary-600`, which was purple before `efc251c` and is now blue. Same for
   the `teal` legacy alias. `globals.css` `--color-primary: #9333ea` and the
   BProgress bar are likewise still purple.

## Tailwind is PURGED — the safelist is load-bearing

Tailwind only emits classes it can see. Compiling against the app's own sources
produced a stylesheet missing `bg-primary-700`, `bg-secondary-600`,
`bg-slate-400` and `shadow-glow` — simply because the app never uses them. A
design agent writing those from the documented palette would get **silently
unstyled output**.

`assets/tailwind.ds.js` therefore carries a `safelist` pinning the full brand
and accent scales (`bg|text|border|ring|divide|from|to` × `primary|secondary` ×
50–950, plus the accent families) with `hover:`/`dark:` variants. That took the
stylesheet from 390 KB → 577 KB, which is the right trade.

**The safelist and `conventions.md` are a matched pair** — the header promises
exactly those families. Change one, change the other, and re-run the validation
(654 classes were machine-checked against `_ds_bundle.css` on 2026-08-04).

## Preview gotchas discovered while authoring

- **`FSelect` needs `SelectItem`.** It isn't in `src/components/ui/index.ts`, so
  `ds-entry.ts` re-exports it from `@heroui/react`. Importing `SelectItem`
  directly inside a design would bundle a second HeroUI copy whose React context
  doesn't match FSelect's, and selections would silently not register.
- **`FImage` needs `loading="eager"` in previews.** It defaults to `lazy`, and a
  lazy image never resolves inside the headless capture — the card screenshots
  as FImage's grey loading skeleton instead of artwork.
- **Inline SVG data URIs must not be URL-encoded before base64.** An early
  version had `fill="url(%23g)"` inside the SVG; it base64-decoded to an
  unresolvable gradient reference, so every image rendered fully transparent and
  the cards looked empty. Use a literal `#`.
- **`FModal` needs `portalContainer`.** HeroUI portals to `document.body`, which
  is outside the preview root, so the card would capture as empty. The preview
  pins the portal to a node inside the card and sets `disableAnimation` for a
  deterministic screenshot.
- **`FSection` needs a wide viewport** (`cfg.overrides.FSection.viewport`) — at
  the default card width every max-width token above `narrow` renders identically
  because the viewport is narrower than the constraint.
- **Compile the CSS AFTER authoring previews.** Preview-only utility classes are
  in `tailwind.ds.js`'s content globs, so a stylesheet built before the previews
  exist omits them.
- **A new `cfg.overrides` entry forces a full build.** `preview-rebuild.mjs`
  refuses with `[CONFIG_STALE]`; run `package-build.mjs` first to re-stamp grade
  keys.

## Known render warns

None. The final validate run was fully clean — 17/17 previews render, 0 bad,
0 thin, 0 variants-identical, 0 floor cards. Any warn on a future re-sync is new
and should be investigated rather than assumed pre-existing.

## Re-sync risks

- **`.next/` dependency for fonts.** The committed woff2s make normal re-syncs
  self-contained, but regenerating them needs a `next build` first.
- **`ds-entry.ts` and `componentSrcMap` drift.** Both are hand-maintained lists.
  A primitive added to `src/components/ui/` will be silently missing from the DS
  until it is added to both. Check `components: N` in the build log against the
  barrel's export count.
- **The compiled CSS is a separate build step** that no driver run triggers. A
  Tailwind theme change that isn't followed by `build-css.sh` produces a bundle
  whose styles silently lag the repo.
- **`~/.pnp.cjs` may return** if the user reinstalls whatever created it.
- **Colour findings above are deliberately unfixed.** If the team fixes any of
  them, the previews' appearance changes and cards should be re-graded.
- **`conventions.md` asserts `primary` is blue.** If the team swaps the tokens
  back to purple, that header becomes actively wrong — it is the first thing to
  re-validate after any change to `tailwind.config.js`.
- **The safelist can drift from the header.** Adding a colour family to
  `conventions.md` without adding it to `tailwind.ds.js` ships a promise the
  stylesheet doesn't keep, and nothing downstream will catch it.
- **`SelectItem` is re-exported from `@heroui/react`, not from the repo.** A
  HeroUI major upgrade could move or rename it; `ds-entry.ts` would fail to
  build, which is at least loud.
