'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Input,
  Button,
  Link as HeroUILink,
} from '@heroui/react';
import Link from 'next/link';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate email
    const validationResult = forgotPasswordSchema.safeParse({ email });
    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message || 'Invalid email');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
        <Card className='glass shadow-2xl border-0'>
          <CardBody className='p-8'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold mb-2'>Forgot Password</h1>
              <p className='text-foreground/70'>
                Enter your email address and we&apos;ll send you a link to reset
                your password
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
                  If an account with that email exists, a password reset link
                  has been sent. Please check your email.
                </p>
              </div>
            )}

            {!success && (
              <form onSubmit={onSubmit} className='space-y-6'>
                <Input
                  label='Email'
                  type='email'
                  value={email}
                  onValueChange={setEmail}
                  variant='bordered'
                  size='lg'
                  isRequired
                  classNames={{
                    inputWrapper:
                      'border-divider hover:border-primary/50 focus-within:border-primary',
                    input: 'text-foreground',
                  }}
                />
                <Button
                  type='submit'
                  color='primary'
                  size='lg'
                  className='w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                  isLoading={loading}
                >
                  Send Reset Link
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
