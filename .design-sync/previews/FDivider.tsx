import { FDivider, FCard, FStat } from 'flemoji-next';

/** Spacing scale — the only axis a horizontal divider has. */
export function Spacing() {
  return (
    <div>
      <p className='text-sm text-gray-700 dark:text-gray-200'>
        spacing=&quot;sm&quot; (my-3)
      </p>
      <FDivider spacing='sm' />
      <p className='text-sm text-gray-700 dark:text-gray-200'>
        spacing=&quot;md&quot; (my-4)
      </p>
      <FDivider spacing='md' />
      <p className='text-sm text-gray-700 dark:text-gray-200'>
        spacing=&quot;lg&quot; (my-6)
      </p>
      <FDivider spacing='lg' />
      <p className='text-sm text-gray-700 dark:text-gray-200'>end</p>
    </div>
  );
}

/** Vertical orientation self-stretches — use inside a flex row. */
export function Vertical() {
  return (
    <div className='flex items-center gap-4 h-16'>
      <FStat label='Plays' value='24,500' layout='stacked' size='sm' />
      <FDivider orientation='vertical' />
      <FStat label='Likes' value='3,208' layout='stacked' size='sm' />
      <FDivider orientation='vertical' />
      <FStat label='Saves' value='389' layout='stacked' size='sm' />
    </div>
  );
}

/** Separating groups of content inside a card. */
export function InCard() {
  return (
    <FCard title='Track Settings'>
      <p className='text-sm font-medium text-gray-900 dark:text-white'>
        Visibility
      </p>
      <p className='text-sm text-gray-500 dark:text-gray-400'>
        Public — anyone can find this track
      </p>
      <FDivider spacing='md' />
      <p className='text-sm font-medium text-gray-900 dark:text-white'>
        Downloads
      </p>
      <p className='text-sm text-gray-500 dark:text-gray-400'>
        Allowed for verified listeners
      </p>
    </FCard>
  );
}
