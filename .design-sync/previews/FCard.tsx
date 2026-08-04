import { FCard, FButton, FBadge, FChip, FStat } from 'flemoji-next';
import {
  MusicalNoteIcon,
  ChartBarIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

/** The plain container — body only, no header chrome. */
export function Default() {
  return (
    <FCard>
      <p className='text-sm text-gray-600 dark:text-gray-300'>
        Your track <span className='font-medium'>Amapiano Nights</span> was
        approved and is now live on three curated playlists.
      </p>
    </FCard>
  );
}

/** Header slots: titleIcon + title + subtitle on the left, action on the right. */
export function WithHeader() {
  return (
    <FCard
      title='Recent Uploads'
      subtitle='Last 30 days'
      titleIcon={<MusicalNoteIcon className='w-4 h-4' />}
      action={
        <FButton variant='ghost' size='sm'>
          View All
        </FButton>
      }
    >
      <div className='space-y-2 text-sm text-gray-600 dark:text-gray-300'>
        <p>Amapiano Nights — 12,480 plays</p>
        <p>Midnight in Soweto — 8,214 plays</p>
        <p>Golden Hour — 5,902 plays</p>
      </div>
    </FCard>
  );
}

/** `divided` adds separators between direct children — the list-card idiom. */
export function DividedList() {
  return (
    <FCard
      title='Top Performing Tracks'
      titleIcon={<ChartBarIcon className='w-4 h-4' />}
      divided
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-700 dark:text-gray-200'>
          Amapiano Nights
        </span>
        <FBadge variant='count' color='primary'>
          12,480
        </FBadge>
      </div>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-700 dark:text-gray-200'>
          Midnight in Soweto
        </span>
        <FBadge variant='count' color='primary'>
          8,214
        </FBadge>
      </div>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-700 dark:text-gray-200'>
          Golden Hour
        </span>
        <FBadge variant='count' color='primary'>
          5,902
        </FBadge>
      </div>
    </FCard>
  );
}

/** The full anatomy: header, body and a footer strip of chips + actions. */
export function WithFooter() {
  return (
    <FCard
      title='Amapiano Nights'
      subtitle='Kabza De Small · 3:42'
      titleIcon={<QueueListIcon className='w-4 h-4' />}
      footer={
        <>
          <FChip color='primary'>Amapiano</FChip>
          <FChip color='default'>House</FChip>
          <span className='flex-1' />
          <FButton variant='ghost' size='sm'>
            Edit
          </FButton>
          <FButton variant='primary' size='sm'>
            Submit
          </FButton>
        </>
      }
    >
      <div className='grid grid-cols-3 gap-4'>
        <FStat label='Plays' value='12,480' layout='stacked' size='sm' />
        <FStat label='Likes' value='1,204' layout='stacked' size='sm' />
        <FStat label='Saves' value='389' layout='stacked' size='sm' />
      </div>
    </FCard>
  );
}

/** The five accent strips, plus the flat variant. */
export function VariantsAndAccents() {
  return (
    <div className='space-y-3'>
      <FCard accent='primary' padding='sm'>
        <p className='text-sm text-gray-700 dark:text-gray-200'>
          accent=&quot;primary&quot; — brand emphasis
        </p>
      </FCard>
      <FCard accent='success' padding='sm'>
        <p className='text-sm text-gray-700 dark:text-gray-200'>
          accent=&quot;success&quot; — track approved
        </p>
      </FCard>
      <FCard accent='warning' padding='sm'>
        <p className='text-sm text-gray-700 dark:text-gray-200'>
          accent=&quot;warning&quot; — metadata incomplete
        </p>
      </FCard>
      <FCard accent='danger' padding='sm'>
        <p className='text-sm text-gray-700 dark:text-gray-200'>
          accent=&quot;danger&quot; — upload failed
        </p>
      </FCard>
      <FCard variant='flat' padding='sm'>
        <p className='text-sm text-gray-700 dark:text-gray-200'>
          variant=&quot;flat&quot; — recessed surface, no border
        </p>
      </FCard>
    </div>
  );
}

/** `loading` swaps the body for FCardSkeleton without collapsing the card. */
export function Loading() {
  return (
    <FCard title='Recent Uploads' subtitle='Fetching…' loading>
      <p>never rendered while loading</p>
    </FCard>
  );
}
