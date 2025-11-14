'use client';

import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import TrackEditor, { TrackEditorValues } from './TrackEditor';

interface TrackEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Partial<TrackEditorValues>;
  onSave: (_trackData: TrackEditorValues) => Promise<boolean>;
  mode?: 'create' | 'edit';
}

export default function TrackEditModal({
  isOpen,
  onClose,
  track,
  onSave,
  mode = 'edit',
}: TrackEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSave = async (trackData: TrackEditorValues): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const success = await onSave(trackData);
      if (success) {
        onClose();
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='5xl'
      scrollBehavior='inside'
      classNames={{
        base: 'max-h-[90vh]',
        body: 'pb-0',
      }}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex items-center gap-3 w-full'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white leading-tight'>
                {mode === 'create' ? 'Create New Track' : 'Edit Track'}
              </h2>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                {mode === 'create'
                  ? 'Add your music details and share it with the world'
                  : 'Update your track information and settings'}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className='p-6 pb-0 overflow-y-auto'>
          <TrackEditor
            ref={formRef}
            initialValues={track}
            onSubmit={handleSave}
            onCancel={onClose}
            mode={mode}
            wrapInCard={false}
            showFooterActions={false}
            onStateChange={state => {
              setIsUploadingArtwork(state.isUploadingArtwork);
              setCanSubmit(state.canSubmit);
            }}
          />
        </ModalBody>
        <ModalFooter className='border-t border-gray-200 dark:border-slate-700 pt-4'>
          <Button
            variant='light'
            onPress={onClose}
            isDisabled={isSubmitting || isUploadingArtwork}
          >
            Cancel
          </Button>
          <Button
            color='primary'
            onPress={handleSubmit}
            isLoading={isSubmitting || isUploadingArtwork}
            isDisabled={!canSubmit || isUploadingArtwork}
          >
            {isUploadingArtwork
              ? 'Uploading Artwork...'
              : mode === 'create'
                ? 'Create Track'
                : 'Save Changes'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
