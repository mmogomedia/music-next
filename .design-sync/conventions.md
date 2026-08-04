# Flemoji design system — how to build with it

React + Tailwind + HeroUI. Every component below is a real export of this
bundle; import them by name. Nothing needs a provider or theme wrapper — the
bundle is self-contained.

**Dark mode** is class-based: put `class="dark"` on an ancestor (usually the
root element) and the `dark:` variants below activate. Without it you get light
mode. Do not ship a colour-scheme toggle unless asked.

## Colour: read this before styling anything

`primary` is **blue** (`#2563eb`) and `secondary` is **purple** (`#9333ea`).
That is the current, deliberate state of the repo (commit "switch primary color
from purple to blue"). If you have seen an older Flemoji doc calling primary
purple, it is stale — trust this file.

Two consequences worth knowing, both intentional in what ships here:

- `FButton variant="primary"` renders in **HeroUI's own default blue**, which is
  a slightly different blue from the `primary-*` utility scale. Don't try to
  match them with custom classes; use the variants.
- `FStat color="purple"` currently renders a **blue** accent bar (its map points
  at `bg-primary-600`). Use `indigo`/`violet` if you want a non-blue accent.

## Class vocabulary

Standard Tailwind, plus these families which are guaranteed present in the
shipped stylesheet:

| Family                                                                              | Names                                                         | Use for                          |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------- |
| `primary-{50…950}`                                                                  | `bg-`, `text-`, `border-`, `ring-`, `divide-`, `from-`, `to-` | brand blue                       |
| `secondary-{50…950}`                                                                | same prefixes                                                 | brand purple                     |
| `purple` `indigo` `violet` `emerald` `rose` `amber` `sky` `slate` `gray` `{50…950}` | `bg-`, `text-`, `border-`, `ring-`, `divide-`                 | accents                          |
| `font-sans` `font-poppins` `font-mono`                                              | —                                                             | Inter / Poppins / JetBrains Mono |
| `shadow-glow` `shadow-glow-secondary`                                               | —                                                             | brand glow                       |

All of the above also work with `hover:` and `dark:`. Semantic conventions:
**emerald** = success/growth, **rose** = errors/likes/destructive, **amber** =
gold/rank, **indigo**/**violet** = neutral accents. Headings use
`font-poppins font-bold`; body text is `font-sans` (Inter) by default.

## Components

**Layout** — `FSection` (`maxWidth`: narrow|default|wide|full, `padding`:
none|sm|md|lg), `FPageHeader` (`title`, `subtitle`, `actions`, `breadcrumb`),
`FDivider` (`spacing`: sm|md|lg, `orientation`).

**Surfaces** — `FCard` (`title`, `titleIcon`, `subtitle`, `action`, `footer`,
`padding`, `divided`, `loading`, `onClick`, `variant`: default|flat, `accent`:
primary|success|warning|danger|info) and `FCardSkeleton`.

**Actions** — `FButton`. Its `variant` is a Flemoji prop, not HeroUI's:
`primary` | `secondary` | `primary-outline` | `primary-ghost` | `outline` |
`ghost` | `danger` | `danger-ghost`. **Max one `primary` per section** —
everything else should be `outline` or `ghost`, which are neutral grey.

**Forms** — `FInput`, `FTextarea`, `FSelect` (all locked to bordered/lg; other
HeroUI props pass through: `label`, `placeholder`, `description`, `isInvalid`,
`errorMessage`, `isDisabled`, `isRequired`, `size`). `FSelect` needs
`SelectItem` children — import it from this bundle, never from `@heroui/react`,
or the React context won't match.

**Data** — `FStat` (`label`, `value`, `icon`, `trend`, `color`, `layout`:
icon-left|stacked, `size`), `StatCard` (`label`, `value`, `growth`, `suffix`)
with `StatCardSkeleton`, `FBadge` (`variant`: status|category|count|label), and
`FChip` (`variant`: flat|outline|solid|dot, six colours, `onClose`).

**Media & state** — `FAvatar` (`size`: xs…xl, `name` for initials), `FImage`
(`size` xs…2xl, `aspect`, `rounded`, `fallback`, `overlay`, `ring`; pass
`loading="eager"` for above-the-fold art), `FEmptyState` (`icon`, `title`,
`description`, `action`), `FSpinner`.

**Overlay** — `FModal` + `ModalContent`/`ModalHeader`/`ModalBody`/`ModalFooter`.

**Always `isDisabled`, never `disabled`.**

## Where the truth is

Read `styles.css` and its imports for the real token values, and each
component's `<Name>.prompt.md` and `<Name>.d.ts` for its exact props. Those
files are authoritative; this page is the orientation.

## Idiomatic example

```jsx
<FSection maxWidth='wide' padding='md'>
  <FPageHeader
    title='Overview'
    subtitle='Your music performance at a glance'
    actions={
      <FButton variant='primary' size='sm'>
        Upload
      </FButton>
    }
  />
  <div className='mt-5 grid grid-cols-1 md:grid-cols-3 gap-4'>
    <FCard title='Top Tracks' divided>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-700 dark:text-gray-200'>
          Amapiano Nights
        </span>
        <FBadge variant='count' color='primary'>
          12,480
        </FBadge>
      </div>
    </FCard>
  </div>
</FSection>
```

Layout glue is plain Tailwind; every control is a library component.
