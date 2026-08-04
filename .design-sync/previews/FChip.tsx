import { FChip } from 'flemoji-next';

/**
 * FChip is the low-level pill FBadge is built on. Four visual variants
 * across the six semantic colours.
 */
export function Variants() {
  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <FChip variant='flat' color='primary'>
          flat
        </FChip>
        <FChip variant='outline' color='primary'>
          outline
        </FChip>
        <FChip variant='solid' color='primary'>
          solid
        </FChip>
        <FChip variant='dot' color='primary'>
          dot
        </FChip>
      </div>
    </div>
  );
}

/** The full colour axis in the default `flat` variant. */
export function Colors() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <FChip color='default'>Default</FChip>
      <FChip color='primary'>Primary</FChip>
      <FChip color='success'>Success</FChip>
      <FChip color='warning'>Warning</FChip>
      <FChip color='danger'>Danger</FChip>
      <FChip color='info'>Info</FChip>
    </div>
  );
}

export function SolidAndOutline() {
  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <FChip variant='solid' color='primary'>
          Primary
        </FChip>
        <FChip variant='solid' color='success'>
          Success
        </FChip>
        <FChip variant='solid' color='warning'>
          Warning
        </FChip>
        <FChip variant='solid' color='danger'>
          Danger
        </FChip>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <FChip variant='outline' color='primary'>
          Primary
        </FChip>
        <FChip variant='outline' color='success'>
          Success
        </FChip>
        <FChip variant='outline' color='danger'>
          Danger
        </FChip>
      </div>
    </div>
  );
}

/** Dot variant reads as a status light with a label. */
export function StatusDots() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FChip variant='dot' color='success'>
        Online
      </FChip>
      <FChip variant='dot' color='warning'>
        Processing
      </FChip>
      <FChip variant='dot' color='danger'>
        Offline
      </FChip>
    </div>
  );
}

export function Sizes() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <FChip size='xs' color='primary'>
        xs
      </FChip>
      <FChip size='sm' color='primary'>
        sm
      </FChip>
      <FChip size='md' color='primary'>
        md
      </FChip>
    </div>
  );
}

/** `onClose` adds a dismiss affordance — filter and tag-editor chips. */
export function Removable() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <FChip color='primary' size='md' onClose={() => {}}>
        Amapiano
      </FChip>
      <FChip color='primary' size='md' onClose={() => {}}>
        Afro House
      </FChip>
      <FChip color='default' size='md' onClose={() => {}}>
        Gqom
      </FChip>
    </div>
  );
}
