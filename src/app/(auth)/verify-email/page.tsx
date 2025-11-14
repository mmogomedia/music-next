'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import Link from 'next/link';

export default function VerifyEmailPage() {
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
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
        <Card className='glass shadow-2xl border-0'>
          <CardBody className='p-8'>
            <div className='text-center'>
              {status === 'loading' && (
                <>
                  <Spinner size='lg' className='mb-4' />
                  <h1 className='text-2xl font-bold mb-2'>Verifying Email</h1>
                  <p className='text-foreground/70'>
                    Please wait while we verify your email address...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className='w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                      className='w-8 h-8 text-success'
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
                  <h1 className='text-2xl font-bold mb-2 text-success'>
                    Email Verified!
                  </h1>
                  <p className='text-foreground/70 mb-6'>{message}</p>
                  <p className='text-sm text-foreground/60 mb-4'>
                    Redirecting to login...
                  </p>
                  <Button
                    as={Link}
                    href='/login?verified=true'
                    color='primary'
                    className='w-full'
                  >
                    Go to Login
                  </Button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className='w-16 h-16 bg-danger-100 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                      className='w-8 h-8 text-danger'
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
                  <h1 className='text-2xl font-bold mb-2 text-danger'>
                    Verification Failed
                  </h1>
                  <p className='text-foreground/70 mb-6'>{message}</p>
                  <div className='space-y-3'>
                    <Button
                      as={Link}
                      href='/login'
                      color='primary'
                      className='w-full'
                    >
                      Go to Login
                    </Button>
                    <Button
                      as={Link}
                      href='/register'
                      variant='bordered'
                      className='w-full'
                    >
                      Create New Account
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
