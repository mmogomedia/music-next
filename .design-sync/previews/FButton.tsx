import { FButton } from 'flemoji-next';
import {
  ArrowUpTrayIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * The eight-variant hierarchy, in the order the design system ranks them:
 * brand solids first, then neutral utility, then destructive.
 * `primary` is capped at one per section — see FButton.prompt.md.
 */
export function Variants() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FButton variant='primary'>Upload Music</FButton>
      <FButton variant='secondary'>Save Draft</FButton>
      <FButton variant='primary-outline'>Edit Profile</FButton>
      <FButton variant='primary-ghost'>Active Tab</FButton>
      <FButton variant='outline'>Cancel</FButton>
      <FButton variant='ghost'>View All</FButton>
      <FButton variant='danger'>Delete Track</FButton>
      <FButton variant='danger-ghost'>Remove</FButton>
    </div>
  );
}

/** A realistic section footer: exactly one primary, everything else receding. */
export function HierarchyInContext() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FButton variant='primary'>Submit to Playlist</FButton>
      <FButton variant='outline'>Save as Draft</FButton>
      <FButton variant='ghost'>Cancel</FButton>
    </div>
  );
}

export function Sizes() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FButton variant='primary' size='sm'>
        Small
      </FButton>
      <FButton variant='primary' size='md'>
        Medium
      </FButton>
      <FButton variant='primary' size='lg'>
        Large
      </FButton>
    </div>
  );
}

export function WithIcons() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FButton
        variant='primary'
        startContent={<ArrowUpTrayIcon className='w-4 h-4' />}
      >
        Upload Track
      </FButton>
      <FButton variant='ghost' startContent={<PlayIcon className='w-4 h-4' />}>
        Preview
      </FButton>
      <FButton
        variant='danger-ghost'
        startContent={<TrashIcon className='w-4 h-4' />}
      >
        Delete
      </FButton>
      <FButton variant='primary' isIconOnly aria-label='Play'>
        <PlayIcon className='w-4 h-4' />
      </FButton>
    </div>
  );
}

/** Static states only — hover/press can't be captured in a screenshot. */
export function States() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FButton variant='primary' isLoading>
        Uploading
      </FButton>
      <FButton variant='primary' isDisabled>
        Unavailable
      </FButton>
      <FButton variant='outline' isDisabled>
        Cancel
      </FButton>
      <FButton variant='primary' fullWidth>
        Full Width
      </FButton>
    </div>
  );
}
