import { FTextarea } from 'flemoji-next';

/** Locked to `variant="bordered" radius="lg"`; HeroUI Textarea props pass through. */
export function Default() {
  return (
    <div className='max-w-sm'>
      <FTextarea label='Bio' placeholder='Tell listeners about yourself' />
    </div>
  );
}

/** `minRows`/`maxRows` bound the auto-grow range. */
export function WithRows() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FTextarea
        label='Bio'
        minRows={3}
        maxRows={6}
        defaultValue='Amapiano producer from Soweto. Three years deep in the log-drum sound, building sets that move rooms.'
      />
      <FTextarea
        label='Submission note'
        minRows={2}
        placeholder='Why does this track fit the playlist?'
        description='Curators see this alongside your track'
      />
    </div>
  );
}

export function Invalid() {
  return (
    <div className='max-w-sm'>
      <FTextarea
        label='Bio'
        defaultValue=''
        isInvalid
        errorMessage='Bio must be at least 40 characters'
        minRows={3}
      />
    </div>
  );
}

export function States() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FTextarea
        label='Read only'
        defaultValue='Approved by curator on 12 March 2026.'
        isReadOnly
        minRows={2}
      />
      <FTextarea
        label='Disabled'
        placeholder='Unavailable'
        isDisabled
        minRows={2}
      />
    </div>
  );
}
