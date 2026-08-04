import { FInput } from 'flemoji-next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * FInput hard-codes `variant="bordered" radius="lg"`; every other HeroUI Input
 * prop passes through. These cards therefore document the pass-through surface.
 */
export function Default() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FInput label='Artist Name' placeholder='Enter name' />
      <FInput
        label='Track Title'
        placeholder='e.g. Amapiano Nights'
        defaultValue='Amapiano Nights'
      />
    </div>
  );
}

export function WithDescription() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FInput
        label='Profile URL'
        placeholder='your-name'
        description='This becomes flemoji.com/artist/your-name'
      />
      <FInput
        label='Search'
        placeholder='Search tracks…'
        startContent={<MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />}
      />
    </div>
  );
}

/** Validation state — `isInvalid` + `errorMessage` is the repo's idiom. */
export function Invalid() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FInput
        label='Artist Name'
        defaultValue=''
        isInvalid
        errorMessage='Artist name is required'
      />
      <FInput
        label='Email'
        defaultValue='not-an-email'
        isInvalid
        errorMessage='Enter a valid email address'
      />
    </div>
  );
}

export function States() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FInput label='Read only' defaultValue='Kabza De Small' isReadOnly />
      <FInput label='Disabled' placeholder='Unavailable' isDisabled />
      <FInput label='Required' placeholder='Track title' isRequired />
    </div>
  );
}

export function Sizes() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FInput label='Small' placeholder='sm' size='sm' />
      <FInput label='Medium' placeholder='md' size='md' />
      <FInput label='Large' placeholder='lg' size='lg' />
    </div>
  );
}
