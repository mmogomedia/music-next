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
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Animated Background */}
      <div className='absolute inset-0'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      {/* Floating Music Notes */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className='absolute text-white/10 text-3xl animate-float'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            ♪
          </div>
        ))}
      </div>

      <div className='relative z-10 w-full max-w-md mx-auto px-4 sm:px-6'>
        <div className='bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8'>
          {verified && (
            <div className='mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-green-300 text-sm text-center'>
                Email verified successfully! You can now sign in.
              </p>
            </div>
          )}
          {registered && (
            <div className='mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-green-300 text-sm text-center'>
                Account created! Please check your email to verify your account.
              </p>
            </div>
          )}
          {reset && (
            <div className='mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-green-300 text-sm text-center'>
                Password reset successfully! You can now sign in with your new
                password.
              </p>
            </div>
          )}
          {authError && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-red-300 text-sm text-center'>
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
