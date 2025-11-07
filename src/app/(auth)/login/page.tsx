'use client';

import React, { Suspense } from 'react';
import { Card, CardBody } from '@heroui/react';
import SignInForm from '@/components/auth/SignInForm';
import { useSearchParams } from 'next/navigation';

function LoginFormContent() {
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/dashboard';
  const authError = params?.get('error');

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
        <Card className='glass shadow-2xl border-0'>
          <CardBody className='p-8'>
            {authError && (
              <div className='mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg'>
                <p className='text-danger-600 dark:text-danger-400 text-sm text-center'>
                  Authentication failed
                </p>
              </div>
            )}
            <SignInForm showTitle={true} callbackUrl={callbackUrl} />
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

function LoginForm() {
  return (
    <Suspense
      fallback={
        <main className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-foreground/70'>Loading...</p>
          </div>
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-foreground/70'>Loading...</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
