import { FImage, FBadge } from 'flemoji-next';

/**
 * Artwork is inlined as SVG data URIs so every card renders identically with no
 * network access. In product, `src` is normally a storage path — FImage passes
 * http/blob/data URIs straight through and runs everything else through
 * `constructFileUrl`.
 *
 * Every card with a `src` sets `loading='eager'`. FImage defaults to
 * `loading='lazy'`, and a lazy image never resolves inside the headless capture,
 * so the card screenshots as FImage's grey loading skeleton instead of artwork.
 */
const ART_A =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM5MzMzZWEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iNDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii41NSIgc3Ryb2tlLXdpZHRoPSIxMCIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iOSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuODUiLz48L3N2Zz4=';
const ART_B =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMGI5ODEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iNDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii41NSIgc3Ryb2tlLXdpZHRoPSIxMCIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iOSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuODUiLz48L3N2Zz4=';
const ART_C =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNDNmNWUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM5MzMzZWEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iNDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii41NSIgc3Ryb2tlLXdpZHRoPSIxMCIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iOSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuODUiLz48L3N2Zz4=';

/** Size tokens xs → 2xl. */
export function Sizes() {
  return (
    <div className='flex items-end gap-3'>
      <FImage src={ART_A} loading='eager' alt='Artwork' size='xs' />
      <FImage src={ART_A} loading='eager' alt='Artwork' size='sm' />
      <FImage src={ART_A} loading='eager' alt='Artwork' size='md' />
      <FImage src={ART_A} loading='eager' alt='Artwork' size='lg' />
      <FImage src={ART_A} loading='eager' alt='Artwork' size='xl' />
      <FImage src={ART_A} loading='eager' alt='Artwork' size='2xl' />
    </div>
  );
}

/** Border-radius tokens, none → full. */
export function Rounded() {
  return (
    <div className='flex items-center gap-3'>
      <FImage
        src={ART_B}
        loading='eager'
        alt='Artwork'
        size='xl'
        rounded='none'
      />
      <FImage
        src={ART_B}
        loading='eager'
        alt='Artwork'
        size='xl'
        rounded='md'
      />
      <FImage
        src={ART_B}
        loading='eager'
        alt='Artwork'
        size='xl'
        rounded='lg'
      />
      <FImage
        src={ART_B}
        loading='eager'
        alt='Artwork'
        size='xl'
        rounded='xl'
      />
      <FImage
        src={ART_B}
        loading='eager'
        alt='Artwork'
        size='xl'
        rounded='full'
      />
    </div>
  );
}

/** With no `src`, the named fallback icon shows on a neutral surface. */
export function Fallbacks() {
  return (
    <div className='flex items-center gap-3'>
      <FImage size='xl' fallback='music' alt='No artwork' />
      <FImage size='xl' fallback='person' alt='No avatar' />
      <FImage size='xl' fallback='generic' alt='No image' />
    </div>
  );
}

/** Aspect ratios, at a fixed width so the ratio is the visible variable. */
export function Aspects() {
  return (
    <div className='flex items-start gap-3'>
      <div className='w-28'>
        <FImage
          src={ART_C}
          loading='eager'
          alt='Square'
          aspect='square'
          className='w-28'
        />
        <p className='mt-1 text-xs text-gray-500'>square</p>
      </div>
      <div className='w-28'>
        <FImage
          src={ART_C}
          loading='eager'
          alt='Portrait'
          aspect='portrait'
          className='w-28'
        />
        <p className='mt-1 text-xs text-gray-500'>portrait</p>
      </div>
      <div className='w-40'>
        <FImage
          src={ART_C}
          loading='eager'
          alt='Wide'
          aspect='wide'
          className='w-40'
        />
        <p className='mt-1 text-xs text-gray-500'>wide</p>
      </div>
    </div>
  );
}

/** Coloured rings for verified / status treatments. */
export function Rings() {
  return (
    <div className='flex items-center gap-5'>
      <FImage
        src={ART_A}
        loading='eager'
        alt='Artwork'
        size='lg'
        rounded='full'
        ring
      />
      <FImage
        src={ART_A}
        loading='eager'
        alt='Artwork'
        size='lg'
        rounded='full'
        ring='primary'
      />
      <FImage
        src={ART_A}
        loading='eager'
        alt='Artwork'
        size='lg'
        rounded='full'
        ring='success'
      />
      <FImage
        src={ART_A}
        loading='eager'
        alt='Artwork'
        size='lg'
        rounded='full'
        ring='danger'
      />
    </div>
  );
}

/** Overlay + badge slots — the track-tile composition. */
export function OverlayAndBadge() {
  return (
    <div className='flex items-start gap-4'>
      <FImage
        src={ART_A}
        loading='eager'
        alt='Amapiano Nights'
        aspect='square'
        className='w-40'
        overlay='gradient'
        overlayContent={
          <div className='p-2'>
            <p className='text-sm font-semibold text-white'>Amapiano Nights</p>
            <p className='text-xs text-white/80'>Kabza De Small</p>
          </div>
        }
      />
      <FImage
        src={ART_C}
        loading='eager'
        alt='Golden Hour'
        aspect='square'
        className='w-40'
        overlay='dark'
        badge={
          <FBadge variant='count' color='primary'>
            New
          </FBadge>
        }
      />
    </div>
  );
}
