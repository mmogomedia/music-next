import { FSection, FCard, FPageHeader } from 'flemoji-next';

/**
 * FSection is an invisible layout primitive — a centred max-width container
 * with responsive padding. Nothing about it is visible on its own, so these
 * cards fill each section with a tinted bar; the bar's width and inset ARE the
 * component's behaviour. The bar is preview scaffolding, not part of the API.
 */
function Fill({ label }: { label: string }) {
  return (
    <div className='bg-primary-50 dark:bg-slate-700 border border-primary-200 dark:border-slate-600 rounded-md px-3 py-2'>
      <span className='text-xs font-medium text-primary-700 dark:text-primary-300'>
        {label}
      </span>
    </div>
  );
}

/**
 * The four max-width tokens. Each bar is centred (`mx-auto`), so a narrower
 * token shows as a shorter, inset bar.
 */
export function MaxWidths() {
  return (
    <div className='space-y-3'>
      <FSection maxWidth='narrow' padding='none'>
        <Fill label='narrow — max-w-3xl · prose, tool detail' />
      </FSection>
      <FSection maxWidth='default' padding='none'>
        <Fill label='default — max-w-5xl · most pages' />
      </FSection>
      <FSection maxWidth='wide' padding='none'>
        <Fill label='wide — max-w-7xl · dashboards' />
      </FSection>
      <FSection maxWidth='full' padding='none'>
        <Fill label='full — 100% · full-width layouts' />
      </FSection>
    </div>
  );
}

/** Padding scale — the inset between the section edge and its content. */
export function Padding() {
  return (
    <div className='space-y-3'>
      <FSection maxWidth='full' padding='none'>
        <Fill label='padding="none"' />
      </FSection>
      <FSection maxWidth='full' padding='sm'>
        <Fill label='padding="sm" — px-4 py-4' />
      </FSection>
      <FSection maxWidth='full' padding='md'>
        <Fill label='padding="md" — px-4 sm:px-5 lg:px-6 py-4' />
      </FSection>
      <FSection maxWidth='full' padding='lg'>
        <Fill label='padding="lg" — px-4 sm:px-6 lg:px-8 py-8' />
      </FSection>
    </div>
  );
}

/** A realistic page shell: section wrapping a header and a content grid. */
export function PageShell() {
  return (
    <FSection maxWidth='wide' padding='md'>
      <FPageHeader
        title='Overview'
        subtitle='Your music performance at a glance'
      />
      <div className='mt-5 grid grid-cols-2 gap-4'>
        <FCard padding='sm'>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Recent uploads
          </p>
        </FCard>
        <FCard padding='sm'>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Top performing tracks
          </p>
        </FCard>
      </div>
    </FSection>
  );
}
