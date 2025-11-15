'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Input,
  Button,
  Link as HeroUILink,
} from '@heroui/react';
import Link from 'next/link';
import { resetPasswordSchema } from '@/lib/validations/auth';
import PasswordStrength from '@/components/auth/PasswordStrength';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate input
    const validationResult = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || 'Validation failed');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Password reset failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=true');
      }, 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
        <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
          <Card className='glass shadow-2xl border-0'>
            <CardBody className='p-8'>
              <div className='text-center'>
                <h1 className='text-2xl font-bold mb-4 text-danger'>
                  Invalid Reset Link
                </h1>
                <p className='text-foreground/70 mb-6'>
                  {error || 'Please request a new password reset link.'}
                </p>
                <Button as={Link} href='/forgot-password' color='primary'>
                  Request New Reset Link
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
        <Card className='glass shadow-2xl border-0'>
          <CardBody className='p-8'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold mb-2'>Reset Password</h1>
              <p className='text-foreground/70'>
                Enter your new password below
              </p>
            </div>

            {error && (
              <div className='mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg'>
                <p className='text-danger-600 dark:text-danger-400 text-sm text-center'>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className='mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg'>
                <p className='text-success-600 dark:text-success-400 text-sm text-center'>
                  Password reset successfully! Redirecting to login...
                </p>
              </div>
            )}

            {!success && (
              <form onSubmit={onSubmit} className='space-y-6'>
                <div>
                  <Input
                    label='New Password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onValueChange={setPassword}
                    variant='bordered'
                    size='lg'
                    isRequired
                    classNames={{
                      inputWrapper:
                        'border-divider hover:border-primary/50 focus-within:border-primary',
                      input: 'text-foreground',
                    }}
                    endContent={
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='focus:outline-none'
                      >
                        {showPassword ? (
                          <svg
                            className='w-5 h-5 text-default-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                            />
                          </svg>
                        ) : (
                          <svg
                            className='w-5 h-5 text-default-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                            />
                          </svg>
                        )}
                      </button>
                    }
                  />
                  {password && (
                    <PasswordStrength password={password} className='mt-2' />
                  )}
                </div>

                <Input
                  label='Confirm Password'
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  variant='bordered'
                  size='lg'
                  isRequired
                  classNames={{
                    inputWrapper:
                      'border-divider hover:border-primary/50 focus-within:border-primary',
                    input: 'text-foreground',
                  }}
                  errorMessage={
                    confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                  isInvalid={
                    confirmPassword !== '' && password !== confirmPassword
                  }
                />

                <Button
                  type='submit'
                  color='primary'
                  size='lg'
                  className='w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                  isLoading={loading}
                >
                  Reset Password
                </Button>
              </form>
            )}

            <div className='mt-6 text-center'>
              <HeroUILink as={Link} href='/login' className='text-sm'>
                Back to Login
              </HeroUILink>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
