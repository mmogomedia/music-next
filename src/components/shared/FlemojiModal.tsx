'use client';

import React, { useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  type ModalProps,
  type ModalContentProps,
  type ModalHeaderProps,
  type ModalBodyProps,
  type ModalFooterProps,
} from '@heroui/react';

interface FlemojiModalProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode;
}

/**
 * Shared modal component with body scroll lock
 * Prevents page scrolling when modal is open
 */
export default function FlemojiModal({
  isOpen,
  children,
  ...modalProps
}: FlemojiModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} {...modalProps}>
      {children}
    </Modal>
  );
}

// Re-export modal sub-components for convenience
export { ModalContent, ModalHeader, ModalBody, ModalFooter };
export type {
  ModalContentProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
};
