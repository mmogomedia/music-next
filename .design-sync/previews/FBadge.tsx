import { FBadge } from 'flemoji-next';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

/** The four variants, each in the role it exists for. */
export function Variants() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FBadge variant='status' color='success'>
        Live
      </FBadge>
      <FBadge variant='category' color='primary'>
        Amapiano
      </FBadge>
      <FBadge variant='count' color='primary'>
        42
      </FBadge>
      <FBadge variant='label'>Verified</FBadge>
    </div>
  );
}

/** Status dots carry the submission lifecycle. */
export function StatusRow() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FBadge variant='status' color='success'>
        Approved
      </FBadge>
      <FBadge variant='status' color='warning'>
        Pending review
      </FBadge>
      <FBadge variant='status' color='danger'>
        Rejected
      </FBadge>
      <FBadge variant='status' color='default'>
        Draft
      </FBadge>
    </div>
  );
}

/** Genre tags — the `category` variant's main job. */
export function Categories() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <FBadge variant='category' color='primary'>
        Amapiano
      </FBadge>
      <FBadge variant='category' color='primary'>
        Afro House
      </FBadge>
      <FBadge variant='category' color='primary'>
        Gqom
      </FBadge>
      <FBadge variant='category' color='default'>
        Kwaito
      </FBadge>
    </div>
  );
}

/** Solid number pills for play counts and unread tallies. */
export function Counts() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FBadge variant='count' color='primary'>
        12,480
      </FBadge>
      <FBadge variant='count' color='success'>
        8
      </FBadge>
      <FBadge variant='count' color='danger'>
        3
      </FBadge>
    </div>
  );
}

export function Sizes() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FBadge variant='category' color='primary' size='sm'>
        Small
      </FBadge>
      <FBadge variant='category' color='primary' size='md'>
        Medium
      </FBadge>
      <FBadge
        variant='label'
        size='md'
        startContent={<CheckBadgeIcon className='w-3 h-3' />}
      >
        Verified Artist
      </FBadge>
    </div>
  );
}
