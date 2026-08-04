import { FAvatar, FBadge } from 'flemoji-next';

/**
 * FAvatar extends HeroUI's Avatar with `xs` (w-6) and `xl` (w-20) beyond its
 * native sm/md/lg. Initials are used rather than remote images so the cards
 * stay self-contained and never depend on network access.
 */
export function Sizes() {
  return (
    <div className='flex items-end gap-4'>
      <FAvatar name='Kabza De Small' size='xs' />
      <FAvatar name='Kabza De Small' size='sm' />
      <FAvatar name='Kabza De Small' size='md' />
      <FAvatar name='Kabza De Small' size='lg' />
      <FAvatar name='Kabza De Small' size='xl' />
    </div>
  );
}

/** Falls back to initials derived from `name` when no src is given. */
export function Initials() {
  return (
    <div className='flex items-center gap-4'>
      <FAvatar name='Kabza De Small' size='lg' />
      <FAvatar name='DJ Maphorisa' size='lg' />
      <FAvatar name='Focalistic' size='lg' />
      <FAvatar name='Uncle Waffles' size='lg' />
    </div>
  );
}

/** Bordered + colour, for verified or role-tinted avatars. */
export function Bordered() {
  return (
    <div className='flex items-center gap-4'>
      <FAvatar name='Kabza De Small' size='lg' isBordered color='primary' />
      <FAvatar name='DJ Maphorisa' size='lg' isBordered color='secondary' />
      <FAvatar name='Focalistic' size='lg' isBordered color='success' />
      <FAvatar name='Uncle Waffles' size='lg' isBordered color='danger' />
    </div>
  );
}

/** Square avatars via HeroUI's radius pass-through. */
export function Radius() {
  return (
    <div className='flex items-center gap-4'>
      <FAvatar name='AM' size='lg' radius='full' />
      <FAvatar name='AM' size='lg' radius='lg' />
      <FAvatar name='AM' size='lg' radius='sm' />
    </div>
  );
}

/** The common product row: avatar, name, supporting line, status. */
export function InArtistRow() {
  return (
    <div className='space-y-3'>
      {[
        ['Kabza De Small', '142 tracks · 1.2M plays'],
        ['Uncle Waffles', '38 tracks · 480k plays'],
      ].map(([name, meta]) => (
        <div key={name} className='flex items-center gap-3'>
          <FAvatar name={name} size='md' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {name}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{meta}</p>
          </div>
          <FBadge variant='status' color='success'>
            Verified
          </FBadge>
        </div>
      ))}
    </div>
  );
}
