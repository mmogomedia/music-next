/*
 * Scoped design-system entry for the claude.ai/design bundle.
 *
 * Deliberately NOT src/components/ui/index.ts: that barrel also exports
 * app-coupled members (FSideNav, BProgressProvider, Toast, ImageUpload,
 * ImageCropper, GhostLoader) which drag next/navigation, next/link and
 * react-image-crop into the bundle and can throw outside a Next app-router
 * context. This entry exposes only the visual primitives, so the bundle stays
 * portable and every export is safe to render standalone.
 *
 * Keep this list in sync with componentSrcMap in .design-sync/config.json.
 */

// ── HeroUI wrappers ─────────────────────────────────────────────────────────
export { default as FButton } from '../../src/components/ui/FButton';
export { default as FInput } from '../../src/components/ui/FInput';
export { default as FTextarea } from '../../src/components/ui/FTextarea';
export { default as FSelect } from '../../src/components/ui/FSelect';
// FSelect is unusable without its option child, and importing SelectItem from
// '@heroui/react' inside a design would bundle a SECOND HeroUI copy whose React
// context doesn't match the one FSelect renders in. Re-exporting it here keeps
// both on the same instance.
export { SelectItem } from '@heroui/react';
export { default as FAvatar } from '../../src/components/ui/FAvatar';

// ── Modal (re-export of shared/FlemojiModal) + its HeroUI sub-components ─────
export { default as FModal } from '../../src/components/ui/FModal';
export {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../src/components/ui/FModal';

// ── Native primitives (no HeroUI dependency) ────────────────────────────────
export { default as FCard, FCardSkeleton } from '../../src/components/ui/FCard';
export type { FCardProps } from '../../src/components/ui/FCard';
export { default as FBadge } from '../../src/components/ui/FBadge';
export { default as FChip } from '../../src/components/ui/FChip';
export { default as FStat } from '../../src/components/ui/FStat';
export {
  default as StatCard,
  StatCardSkeleton,
} from '../../src/components/ui/StatCard';
export type { StatCardProps } from '../../src/components/ui/StatCard';
export { default as FEmptyState } from '../../src/components/ui/FEmptyState';
export { default as FPageHeader } from '../../src/components/ui/FPageHeader';
export { default as FSection } from '../../src/components/ui/FSection';
export { default as FDivider } from '../../src/components/ui/FDivider';
export { default as FSpinner } from '../../src/components/ui/FSpinner';
export { FImage } from '../../src/components/ui/FImage';
export type { FImageProps } from '../../src/components/ui/FImage';
