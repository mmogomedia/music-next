import { FSelect, SelectItem } from 'flemoji-next';

/**
 * FSelect locks `variant="bordered" radius="lg"`. Its children must be
 * `SelectItem`s — re-exported from the bundle so they share HeroUI's React
 * context with the Select itself.
 */
const GENRES = [
  { key: 'amapiano', label: 'Amapiano' },
  { key: 'afro-house', label: 'Afro House' },
  { key: 'gqom', label: 'Gqom' },
  { key: 'kwaito', label: 'Kwaito' },
  { key: 'afrobeats', label: 'Afrobeats' },
];

export function Default() {
  return (
    <div className='max-w-sm'>
      <FSelect label='Genre' placeholder='Select a genre'>
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
    </div>
  );
}

export function WithSelection() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FSelect
        label='Primary genre'
        defaultSelectedKeys={['amapiano']}
        description='Shown on your artist profile'
      >
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
      <FSelect
        label='Secondary genres'
        selectionMode='multiple'
        defaultSelectedKeys={['afro-house', 'gqom']}
      >
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
    </div>
  );
}

export function Invalid() {
  return (
    <div className='max-w-sm'>
      <FSelect
        label='Genre'
        placeholder='Select a genre'
        isInvalid
        errorMessage='Pick at least one genre'
      >
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
    </div>
  );
}

export function States() {
  return (
    <div className='space-y-4 max-w-sm'>
      <FSelect label='Disabled' placeholder='Unavailable' isDisabled>
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
      <FSelect label='Required' placeholder='Select a genre' isRequired>
        {GENRES.map(g => (
          <SelectItem key={g.key}>{g.label}</SelectItem>
        ))}
      </FSelect>
    </div>
  );
}
