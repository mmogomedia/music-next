'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import Link from 'next/link';
import AuthPageHeader from '@/components/auth/AuthPageHeader';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'idle'
  >('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-white'>
      <div className='relative w-full max-w-lg mx-auto px-4 sm:px-8'>
        <div className='bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8'>
          <AuthPageHeader />
          <div className='text-center'>
            {status === 'loading' && (
              <>
                <Spinner size='lg' className='mb-4' />
                <h1 className='text-2xl font-bold mb-2 text-gray-900'>
                  Verifying Email
                </h1>
                <p className='text-gray-600'>
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold mb-2 text-green-600'>
                  Email Verified!
                </h1>
                <p className='text-gray-600 mb-6'>{message}</p>
                <p className='text-sm text-gray-500 mb-4'>
                  Redirecting to login...
                </p>
                <Button
                  as={Link}
                  href='/login?verified=true'
                  className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                >
                  Go to Login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-red-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold mb-2 text-red-600'>
                  Verification Failed
                </h1>
                <p className='text-gray-600 mb-6'>{message}</p>
                <div className='space-y-3'>
                  <Button
                    as={Link}
                    href='/login'
                    className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    Go to Login
                  </Button>
                  <Button
                    as={Link}
                    href='/register'
                    variant='bordered'
                    className='w-full border-gray-300 text-gray-700 hover:bg-gray-50'
                  >
                    Create New Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <Spinner size='lg' className='mb-4' />
            <p className='text-foreground/70'>Loading...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
