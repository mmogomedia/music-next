'use client';

import React, { useState } from 'react';
import { Input, Button, Link as HeroUILink } from '@heroui/react';
import Link from 'next/link';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import AuthPageHeader from '@/components/auth/AuthPageHeader';

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
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-white'>
      <div className='relative z-10 w-full max-w-lg mx-auto px-4 sm:px-8'>
        <div className='bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8'>
          <AuthPageHeader />
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold mb-2 text-gray-900'>
              Forgot Password
            </h1>
            <p className='text-gray-600 text-sm'>
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl'>
              <p className='text-red-700 text-sm text-center'>{error}</p>
            </div>
          )}

          {success && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl'>
              <p className='text-green-700 text-sm text-center'>
                If an account with that email exists, a password reset link has
                been sent. Please check your email.
              </p>
            </div>
          )}

          {!success && (
            <form onSubmit={onSubmit} className='space-y-4'>
              <Input
                label='Email'
                type='email'
                value={email}
                onValueChange={setEmail}
                variant='bordered'
                size='md'
                isRequired
                classNames={{
                  inputWrapper:
                    'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                  input: 'text-gray-900',
                  label: 'text-gray-700',
                }}
              />
              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                isLoading={loading}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className='mt-4 text-center'>
            <HeroUILink
              as={Link}
              href='/login'
              className='text-sm text-blue-600 hover:text-blue-700'
            >
              Back to Login
            </HeroUILink>
          </div>
        </div>
      </div>
    </main>
  );
}
