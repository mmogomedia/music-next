'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import TrackEditForm from './TrackEditForm';

interface TrackData {
  id?: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  composer?: string;
  year?: number;
  releaseDate?: string;
  bpm?: number;
  isrc?: string;
  description?: string;
  lyrics?: string;
  isPublic: boolean;
  isDownloadable: boolean;
  isExplicit: boolean;
  copyrightInfo?: string;
  licenseType?: string;
  distributionRights?: string;
  albumArtwork?: string;
}

interface TrackEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: TrackData;
  onSave: (_trackData: TrackData) => Promise<boolean>;
  mode?: 'create' | 'edit';
}

export default function TrackEditModal({
  isOpen,
  onClose,
  track,
  onSave,
  mode = 'edit',
}: TrackEditModalProps) {
  const handleSave = async (trackData: TrackData): Promise<boolean> => {
    const success = await onSave(trackData);
    if (success) {
      onClose();
    }
    return success;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='5xl'
      scrollBehavior='inside'
      classNames={{
        base: 'max-h-[90vh]',
        body: 'p-0',
      }}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          {mode === 'create' ? 'Add Track Details' : 'Edit Track Details'}
        </ModalHeader>
        <ModalBody>
          <TrackEditForm
            track={track}
            onSave={handleSave}
            onCancel={onClose}
            mode={mode}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
