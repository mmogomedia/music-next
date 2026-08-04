import { FPageHeader, FButton, FBadge } from 'flemoji-next';
import { PlusIcon } from '@heroicons/react/24/outline';

/**
 * Title uses `font-poppins font-bold` — this card doubles as the typography
 * canary for the bundle's brand fonts. If the heading renders in a system
 * grotesque rather than Poppins, the font wiring has regressed.
 */
export function Default() {
  return (
    <FPageHeader
      title='Artist Profile'
      subtitle='Manage your artist identity and social media presence'
    />
  );
}

export function WithActions() {
  return (
    <FPageHeader
      title='Overview'
      subtitle='Your music performance at a glance'
      actions={
        <>
          <FButton variant='ghost' size='sm'>
            Last 30 days
          </FButton>
          <FButton
            variant='primary'
            size='sm'
            startContent={<PlusIcon className='w-4 h-4' />}
          >
            Upload
          </FButton>
        </>
      }
    />
  );
}

export function WithBreadcrumb() {
  return (
    <FPageHeader
      breadcrumb={['Dashboard', 'Tracks']}
      title='Amapiano Nights'
      subtitle='Uploaded 12 March 2026 · 12,480 plays'
      actions={
        <FBadge variant='status' color='success'>
          Live
        </FBadge>
      }
    />
  );
}

/** Long titles truncate rather than wrapping — verifies the min-w-0 guard. */
export function TitleOnly() {
  return <FPageHeader title='Playlist Submissions' />;
}
