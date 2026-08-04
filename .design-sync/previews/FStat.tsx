import { FStat, FCard } from 'flemoji-next';
import {
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * The dashboard colour map from docs/design-system.md §6, in the icon-left
 * layout: a 2px accent bar is the only coloured surface, the number is the hero.
 *
 * NOTE: `color="purple"` maps internally to `bg-primary-600`, which the repo's
 * Tailwind theme currently defines as blue (#2563eb). The bar therefore renders
 * blue, not purple — a known leftover from the purple→blue token swap, shipped
 * as-is. See .design-sync/NOTES.md.
 */
export function DashboardColorMap() {
  return (
    <div className='grid grid-cols-2 gap-6'>
      <FStat
        label='Tracks'
        value='142'
        icon={MusicalNoteIcon}
        color='indigo'
        size='sm'
      />
      <FStat
        label='Plays'
        value='24,500'
        icon={PlayIcon}
        color='emerald'
        size='sm'
      />
      <FStat
        label='Likes'
        value='3,208'
        icon={HeartIcon}
        color='rose'
        size='sm'
      />
      <FStat
        label='Downloads'
        value='892'
        icon={ArrowDownTrayIcon}
        color='violet'
        size='sm'
      />
    </div>
  );
}

/** Trends colour themselves: positive emerald, negative rose. No config. */
export function WithTrend() {
  return (
    <div className='grid grid-cols-2 gap-6'>
      <FStat
        label='Plays'
        value='24,500'
        icon={PlayIcon}
        color='emerald'
        trend={{ value: 12.5, label: 'this week' }}
      />
      <FStat
        label='Listeners'
        value='1,840'
        icon={UsersIcon}
        color='purple'
        trend={{ value: -4.2, label: 'this week' }}
      />
    </div>
  );
}

/** `stacked` drops the icon and the accent bar — the quick-stats strip idiom. */
export function StackedLayout() {
  return (
    <div className='grid grid-cols-3 gap-6'>
      <FStat label='Total Plays' value='24,500' layout='stacked' size='sm' />
      <FStat label='Followers' value='1,204' layout='stacked' size='sm' />
      <FStat label='Playlists' value='38' layout='stacked' size='sm' />
    </div>
  );
}

export function Sizes() {
  return (
    <div className='flex items-start gap-10'>
      <FStat
        label='Plays (sm)'
        value='24,500'
        icon={PlayIcon}
        color='emerald'
        size='sm'
      />
      <FStat
        label='Plays (md)'
        value='24,500'
        icon={PlayIcon}
        color='emerald'
        size='md'
      />
    </div>
  );
}

/** How the stat row actually appears in the product — inside a card. */
export function InCard() {
  return (
    <FCard title='Overview' subtitle='Last 30 days'>
      <div className='grid grid-cols-4 gap-6'>
        <FStat
          label='Tracks'
          value='142'
          icon={MusicalNoteIcon}
          color='indigo'
          size='sm'
        />
        <FStat
          label='Plays'
          value='24,500'
          icon={PlayIcon}
          color='emerald'
          size='sm'
          trend={{ value: 12.5 }}
        />
        <FStat
          label='Likes'
          value='3,208'
          icon={HeartIcon}
          color='rose'
          size='sm'
        />
        <FStat
          label='Listeners'
          value='1,840'
          icon={UsersIcon}
          color='purple'
          size='sm'
        />
      </div>
    </FCard>
  );
}
