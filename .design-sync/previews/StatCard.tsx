import { StatCard, StatCardSkeleton, FCard } from 'flemoji-next';

/**
 * The exact composition StatsGrid.tsx ships: a padding-less FCard wrapping a
 * divided 4-up grid. This is the canonical way to use StatCard.
 */
export function StatsGrid() {
  return (
    <FCard padding='none'>
      <div className='grid grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700 px-6 py-5'>
        <StatCard label='Plays' value={24500} growth={12.5} />
        <StatCard label='Likes' value={3208} growth={-4.2} />
        <StatCard label='Listeners' value={1840} />
        <StatCard label='Downloads' value={892} />
      </div>
    </FCard>
  );
}

/** Numbers are localised automatically; growth colours itself by sign. */
export function GrowthStates() {
  return (
    <div className='grid grid-cols-3 gap-6'>
      <StatCard label='Positive' value={24500} growth={12.5} />
      <StatCard label='Negative' value={3208} growth={-4.2} />
      <StatCard label='No growth' value={1840} />
    </div>
  );
}

/** `suffix` trails the value at a smaller weight — scores, ratios, units. */
export function WithSuffix() {
  return (
    <div className='grid grid-cols-3 gap-6'>
      <StatCard label='Readiness' value={78} suffix='/ 100' />
      <StatCard label='Monthly' value='12.4k' suffix='plays' />
      <StatCard label='Completion' value={94} suffix='%' growth={2.1} />
    </div>
  );
}

/** Same grid footprint as StatCard, so rows don't jump while loading. */
export function Skeleton() {
  return (
    <FCard padding='none'>
      <div className='grid grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700 px-6 py-5'>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </FCard>
  );
}
