import { FSpinner, FCard } from 'flemoji-next';

/**
 * The ring is `border-t-primary-500` over a neutral track. Note the spinner is
 * mid-animation in a screenshot, so the coloured arc's position varies between
 * captures — that is expected, not a rendering fault.
 */
export function Sizes() {
  return (
    <div className='flex items-center gap-8'>
      <FSpinner size='sm' />
      <FSpinner size='md' />
      <FSpinner size='lg' />
    </div>
  );
}

/** A label sits beneath the ring, centred. */
export function WithLabel() {
  return (
    <div className='flex items-start gap-10'>
      <FSpinner size='md' label='Loading tracks…' />
      <FSpinner size='lg' label='Uploading' />
    </div>
  );
}

/** Inline inside a card body — the common in-product placement. */
export function InCard() {
  return (
    <FCard title='Recent Uploads' subtitle='Fetching…'>
      <div className='py-6'>
        <FSpinner size='md' label='Loading your library' />
      </div>
    </FCard>
  );
}
