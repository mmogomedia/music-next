import { useState } from 'react';
import {
  FModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FButton,
  FInput,
  FTextarea,
} from 'flemoji-next';

/**
 * FModal wraps HeroUI's Modal (adding body-scroll lock) and re-exports its
 * sub-components. Two things make it previewable:
 *
 * 1. `isOpen` is forced — a closed modal renders nothing at all.
 * 2. `portalContainer` is pinned to a node inside the card. HeroUI portals to
 *    document.body by default, which is OUTSIDE the preview root, so the card
 *    would screenshot as empty even though the modal rendered fine.
 *
 * `disableAnimation` keeps the screenshot deterministic rather than catching a
 * half-played entrance transition.
 */
function Host({
  children,
}: {
  children: (el: HTMLElement) => React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <div ref={setEl} className='relative min-h-[380px]'>
      {el ? children(el) : null}
    </div>
  );
}

/** The canonical submission dialog: header, form body, footer actions. */
export function Default() {
  return (
    <Host>
      {el => (
        <FModal
          isOpen
          portalContainer={el}
          disableAnimation
          size='md'
          onClose={() => {}}
        >
          <ModalContent>
            <ModalHeader className='flex flex-col gap-1'>
              Submit to Playlist
              <span className='text-sm font-normal text-gray-500'>
                Amapiano Nights · Kabza De Small
              </span>
            </ModalHeader>
            <ModalBody>
              <FInput label='Playlist' defaultValue='Amapiano Heat 2026' />
              <FTextarea
                label='Note to curator'
                minRows={3}
                placeholder='Why does this track fit?'
              />
            </ModalBody>
            <ModalFooter>
              <FButton variant='ghost'>Cancel</FButton>
              <FButton variant='primary'>Submit</FButton>
            </ModalFooter>
          </ModalContent>
        </FModal>
      )}
    </Host>
  );
}

/** A compact destructive confirmation. */
export function Confirmation() {
  return (
    <Host>
      {el => (
        <FModal
          isOpen
          portalContainer={el}
          disableAnimation
          size='sm'
          onClose={() => {}}
        >
          <ModalContent>
            <ModalHeader>Delete track?</ModalHeader>
            <ModalBody>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                “Amapiano Nights” and its 12,480 plays will be permanently
                removed. This cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <FButton variant='ghost'>Cancel</FButton>
              <FButton variant='danger'>Delete</FButton>
            </ModalFooter>
          </ModalContent>
        </FModal>
      )}
    </Host>
  );
}
