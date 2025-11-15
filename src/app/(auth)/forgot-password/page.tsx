'use client';

import React, { useState } from 'react';
import { Input, Button, Link as HeroUILink } from '@heroui/react';
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
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold mb-2 text-white'>
              Forgot Password
            </h1>
            <p className='text-white/70 text-sm'>
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-red-300 text-sm text-center'>{error}</p>
            </div>
          )}

          {success && (
            <div className='mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-green-300 text-sm text-center'>
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
                    'bg-white/5 border-white/20 hover:border-blue-400/50 focus-within:border-blue-400',
                  input: 'text-white placeholder:text-white/50',
                  label: 'text-white/80',
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
              className='text-sm text-blue-400 hover:text-blue-300'
            >
              Back to Login
            </HeroUILink>
          </div>
        </div>
      </div>
    </main>
  );
}
