'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FButton, FCard, FChip } from '@/components/ui';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ArtistNavigation from '@/components/dashboard/artist/ArtistNavigation';
import TrackEditor, { TrackEditorValues } from '@/components/track/TrackEditor';

interface TrackEditPageClientProps {
  trackId: string;
  initialValues: TrackEditorValues;
  trackTitle: string;
}

const getTabHref = (tabId: string) =>
  tabId === 'overview' ? '/dashboard' : `/dashboard?tab=${tabId}`;

export default function TrackEditPageClient({
  trackId,
  initialValues,
  trackTitle,
}: TrackEditPageClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editorRef = useRef<HTMLFormElement | null>(null);
  const [editorState, setEditorState] = useState({
    isUploadingArtwork: false,
    canSubmit: false,
  });

  const handleBack = () => router.push('/dashboard?tab=library');

  const handleQuickSave = () => {
    if (editorRef.current) editorRef.current.requestSubmit();
  };

  const handleSubmit = async (values: TrackEditorValues): Promise<boolean> => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/tracks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, ...values }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update track');
      }
      router.push('/dashboard?tab=library');
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update track'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const readyToSave = editorState.canSubmit && !editorState.isUploadingArtwork;

  const header = (
    <header className='border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950'>
      <div className='py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <FButton
            variant='ghost'
            size='sm'
            isIconOnly
            onPress={handleBack}
            aria-label='Back to library'
          >
            <ArrowLeftIcon className='w-4 h-4' />
          </FButton>
          <div className='min-w-0'>
            <p className='text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium'>
              Editing track
            </p>
            <h1 className='text-base font-semibold text-gray-900 dark:text-white truncate max-w-[50vw]'>
              {trackTitle}
            </h1>
          </div>
        </div>
        <div className='flex items-center gap-3 flex-shrink-0'>
          <FChip
            color={readyToSave ? 'success' : 'warning'}
            variant='flat'
            size='sm'
            startContent={
              readyToSave ? (
                <CheckCircleIcon className='w-3 h-3' />
              ) : (
                <ExclamationCircleIcon className='w-3 h-3' />
              )
            }
          >
            {readyToSave ? 'Ready to save' : 'Incomplete'}
          </FChip>
          <div className='hidden md:flex gap-2'>
            <FButton variant='ghost' size='sm' onPress={handleBack}>
              Cancel
            </FButton>
            <FButton
              variant='primary'
              size='sm'
              onPress={handleQuickSave}
              isDisabled={!readyToSave || isSaving}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </FButton>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={
          <ArtistNavigation activeTab='library' getTabHref={getTabHref} />
        }
        contentClassName='w-full bg-gray-50 dark:bg-slate-950 min-h-screen'
        header={header}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-10'>
          {errorMessage && (
            <div className='mb-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2'>
              <ExclamationCircleIcon className='w-4 h-4 flex-shrink-0' />
              {errorMessage}
            </div>
          )}

          <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] items-start'>
            {/* Editor */}
            <FCard padding='none'>
              <TrackEditor
                ref={editorRef}
                initialValues={initialValues}
                mode='edit'
                isSaving={isSaving}
                wrapInCard={false}
                showFooterActions={false}
                className='p-5 sm:p-7'
                onCancel={handleBack}
                onSubmit={handleSubmit}
                onStateChange={setEditorState}
              />
            </FCard>

            {/* Sidebar */}
            <aside className='space-y-4 lg:sticky lg:top-6'>
              <FCard padding='md' title='Tips'>
                <ul className='space-y-2 text-sm text-gray-600 dark:text-gray-400 pt-1'>
                  <li className='flex gap-2'>
                    <span className='text-primary-400 flex-shrink-0'>→</span>
                    Use the Story & AI tab to generate metadata from lyrics.
                  </li>
                  <li className='flex gap-2'>
                    <span className='text-primary-400 flex-shrink-0'>→</span>
                    Attributes & mood improve AI discovery — be specific.
                  </li>
                  <li className='flex gap-2'>
                    <span className='text-primary-400 flex-shrink-0'>→</span>
                    Save once the status chip shows{' '}
                    <FChip size='xs' color='success' className='inline-flex'>
                      Ready
                    </FChip>
                    .
                  </li>
                </ul>
              </FCard>
            </aside>
          </div>
        </div>

        {/* Mobile save bar */}
        <div className='fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur md:hidden'>
          <div className='max-w-6xl mx-auto px-4 py-3 flex gap-2'>
            <FButton
              variant='ghost'
              className='flex-1'
              onPress={handleBack}
              isDisabled={isSaving}
            >
              Cancel
            </FButton>
            <FButton
              variant='primary'
              className='flex-1'
              onPress={handleQuickSave}
              isDisabled={!readyToSave || isSaving}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </FButton>
          </div>
        </div>
      </UnifiedLayout>
    </RoleBasedRedirect>
  );
}
