'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Link as HeroUILink,
} from '@heroui/react';
import SignInForm from './SignInForm';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

export default function SignInModal({
  isOpen,
  onClose,
  callbackUrl,
}: SignInModalProps) {
  const router = useRouter();

  const handleSuccess = () => {
    onClose();
    // Refresh the router to update the session state
    router.refresh();
  };

  const handleSignUpClick = () => {
    onClose();
    router.push('/register');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement='center'
      size='md'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-white dark:bg-slate-900',
        header: 'border-b border-gray-200 dark:border-slate-700',
        body: 'py-6',
      }}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold'>Sign In</h2>
        </ModalHeader>
        <ModalBody>
          <SignInForm
            onSuccess={handleSuccess}
            callbackUrl={callbackUrl || '/'}
            showTitle={false}
          />
        </ModalBody>
        <ModalFooter className='justify-center pt-0'>
          <p className='text-sm text-foreground/70'>
            Don&apos;t have an account?{' '}
            <HeroUILink
              as='button'
              className='text-sm cursor-pointer'
              onPress={handleSignUpClick}
            >
              Sign up
            </HeroUILink>
          </p>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
