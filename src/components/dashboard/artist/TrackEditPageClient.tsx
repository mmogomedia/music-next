'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip } from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

  const handleBack = () => {
    router.push('/dashboard?tab=library');
  };

  const handleQuickSave = () => {
    if (editorRef.current) {
      editorRef.current.requestSubmit();
    }
  };

  const handleSubmit = async (values: TrackEditorValues): Promise<boolean> => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tracks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId,
          ...values,
        }),
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
    <header className='bg-gradient-to-b from-white via-white to-white/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/60 border-b border-transparent'>
      <div className='py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4'>
          <Button
            variant='light'
            startContent={<ArrowLeftIcon className='w-4 h-4' />}
            onPress={handleBack}
          >
            Back
          </Button>
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              Editing track
            </p>
            <h1 className='text-2xl font-semibold text-gray-900 dark:text-white truncate max-w-[60vw]'>
              {trackTitle}
            </h1>
          </div>
        </div>
        <Chip
          color={readyToSave ? 'success' : 'warning'}
          variant='flat'
          className='text-sm'
        >
          {readyToSave ? 'Ready to save' : 'Complete required details'}
        </Chip>
      </div>
    </header>
  );

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={
          <ArtistNavigation activeTab='library' getTabHref={getTabHref} />
        }
        contentClassName='w-full bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen'
        header={header}
      >
        <div className='w-full py-6 lg:py-10 pb-28 md:pb-10'>
          <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5'>
            <section className='rounded-3xl border border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 px-5 py-4 flex flex-col gap-4 shadow-sm'>
              <div className='flex flex-wrap items-center gap-4 justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                    Track editor
                  </p>
                  <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
                    Edit “{trackTitle}”
                  </h2>
                </div>
                <div className='hidden md:flex flex-wrap gap-3'>
                  <Button variant='light' onPress={handleBack}>
                    Back to library
                  </Button>
                  <Button
                    color='primary'
                    variant='solid'
                    onPress={handleQuickSave}
                    isDisabled={!editorState.canSubmit || isSaving}
                    isLoading={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600 dark:text-gray-300'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Status:
                  </span>
                  <span>
                    {editorState.canSubmit
                      ? 'All required fields captured'
                      : 'Complete required fields to enable saving'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Artwork:
                  </span>
                  <span>
                    {editorState.isUploadingArtwork ? 'Uploading…' : 'Idle'}
                  </span>
                </div>
              </div>
            </section>

            {errorMessage && (
              <div className='rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200'>
                {errorMessage}
              </div>
            )}

            <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start'>
              <section className='rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm'>
                <TrackEditor
                  ref={editorRef}
                  initialValues={initialValues}
                  mode='edit'
                  isSaving={isSaving}
                  wrapInCard={false}
                  showFooterActions={false}
                  className='p-6 sm:p-8'
                  onCancel={handleBack}
                  onSubmit={handleSubmit}
                  onStateChange={setEditorState}
                />
              </section>

              <aside className='space-y-4 lg:sticky lg:top-6'>
                <div className='rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4 shadow-sm'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>
                      Quick actions
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      Designed for mobile, always available on desktop.
                    </p>
                  </div>
                  <Button
                    color='primary'
                    variant='solid'
                    className='w-full'
                    onPress={handleQuickSave}
                    isDisabled={!editorState.canSubmit || isSaving}
                    isLoading={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    variant='bordered'
                    className='w-full'
                    onPress={handleBack}
                    disabled={isSaving}
                  >
                    Back to library
                  </Button>
                </div>

                <div className='rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-5 space-y-3 shadow-sm'>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    Workflow tips
                  </p>
                  <ul className='text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside'>
                    <li>Use the Story & AI tab for lyrics-driven metadata.</li>
                    <li>
                      Attributes & mood drive discovery — keep them intentional.
                    </li>
                    <li>Save once the status chip shows ready.</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className='fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur md:hidden'>
          <div className='max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2'>
            <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400'>
              <span>
                {editorState.canSubmit
                  ? 'All checks passed'
                  : 'Fill required fields to save'}
              </span>
              <span>
                Artwork {editorState.isUploadingArtwork ? 'uploading…' : 'idle'}
              </span>
            </div>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button variant='flat' onPress={handleBack} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                color='primary'
                variant='solid'
                onPress={handleQuickSave}
                isDisabled={!editorState.canSubmit || isSaving}
                isLoading={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    </RoleBasedRedirect>
  );
}
