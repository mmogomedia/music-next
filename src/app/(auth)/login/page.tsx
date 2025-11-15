'use client';

import React, { Suspense } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import { useSearchParams } from 'next/navigation';

function LoginFormContent() {
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/dashboard';
  const authError = params?.get('error');
  const verified = params?.get('verified');
  const registered = params?.get('registered');
  const reset = params?.get('reset');

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-white'>
      <div className='relative z-10 w-full max-w-md mx-auto px-4 sm:px-6'>
        <div className='bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8'>
          {verified && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl'>
              <p className='text-green-700 text-sm text-center'>
                Email verified successfully! You can now sign in.
              </p>
            </div>
          )}
          {registered && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl'>
              <p className='text-green-700 text-sm text-center'>
                Account created! Please check your email to verify your account.
              </p>
            </div>
          )}
          {reset && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl'>
              <p className='text-green-700 text-sm text-center'>
                Password reset successfully! You can now sign in with your new
                password.
              </p>
            </div>
          )}
          {authError && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl'>
              <p className='text-red-700 text-sm text-center'>
                Authentication failed
              </p>
            </div>
          )}
          <SignInForm showTitle={true} callbackUrl={callbackUrl} />
        </div>
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
