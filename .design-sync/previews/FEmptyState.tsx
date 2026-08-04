import { FEmptyState, FCard } from 'flemoji-next';
import {
  MusicalNoteIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/** The canonical empty state: icon, title, description, one primary action. */
export function Default() {
  return (
    <FEmptyState
      icon={MusicalNoteIcon}
      title='No tracks yet'
      description='Upload your first track to get started'
      action={{ label: 'Upload Music', onPress: () => {}, variant: 'primary' }}
    />
  );
}

/** Three sizes: sm inside cards, md for tab content, lg for full pages. */
export function Sizes() {
  return (
    <div className='space-y-6'>
      <FEmptyState
        icon={InboxIcon}
        title='No submissions'
        description='size="sm" — inline, inside a card'
        size='sm'
      />
      <FEmptyState
        icon={InboxIcon}
        title='No submissions'
        description='size="md" — tab content'
        size='md'
      />
      <FEmptyState
        icon={InboxIcon}
        title='No submissions'
        description='size="lg" — full page'
        size='lg'
      />
    </div>
  );
}

/** Without an action it degrades to a plain informational state. */
export function WithoutAction() {
  return (
    <FEmptyState
      icon={MagnifyingGlassIcon}
      title='No results for “kwaito 2026”'
      description='Try a different genre or artist name'
    />
  );
}

/** The outline action variant, for non-primary recovery paths. */
export function OutlineAction() {
  return (
    <FEmptyState
      icon={ExclamationTriangleIcon}
      title='Could not load your tracks'
      description='Something went wrong fetching your library'
      action={{ label: 'Try again', onPress: () => {}, variant: 'outline' }}
    />
  );
}

/** How it actually appears in product — nested inside a card body. */
export function InCard() {
  return (
    <FCard title='Playlist Submissions' subtitle='Awaiting review'>
      <FEmptyState
        icon={InboxIcon}
        title='Nothing pending'
        description='Submissions you send to curators will appear here'
        size='sm'
        action={{
          label: 'Browse playlists',
          onPress: () => {},
          variant: 'outline',
        }}
      />
    </FCard>
  );
}
