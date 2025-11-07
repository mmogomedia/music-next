'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button, Input, Divider } from '@heroui/react';
import { useRouter } from 'next/navigation';

interface SignInFormProps {
  onSuccess?: () => void;
  callbackUrl?: string;
  showTitle?: boolean;
  className?: string;
}

export default function SignInForm({
  onSuccess,
  callbackUrl: propCallbackUrl = '/',
  showTitle = true,
  className = '',
}: SignInFormProps) {
  const { status } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const callbackUrl = propCallbackUrl;

  useEffect(() => {
    if (status === 'authenticated' && onSuccess) {
      onSuccess();
    } else if (status === 'authenticated' && !onSuccess) {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl, onSuccess]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (res?.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Welcome back</h1>
          <p className='text-foreground/70'>
            Sign in to your account to continue
          </p>
        </div>
      )}

      {error && (
        <div className='mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg'>
          <p className='text-danger-600 dark:text-danger-400 text-sm text-center'>
            {error}
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className='space-y-6'>
        <Input
          label='Email or Username'
          value={identifier}
          onValueChange={setIdentifier}
          variant='bordered'
          size='lg'
          classNames={{
            inputWrapper:
              'border-divider hover:border-primary/50 focus-within:border-primary',
            input: 'text-foreground',
          }}
          isRequired
        />
        <Input
          label='Password'
          type='password'
          value={password}
          onValueChange={setPassword}
          variant='bordered'
          size='lg'
          classNames={{
            inputWrapper:
              'border-divider hover:border-primary/50 focus-within:border-primary',
            input: 'text-foreground',
          }}
          isRequired
        />
        <Button
          type='submit'
          color='primary'
          size='lg'
          className='w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>

      <Divider className='my-8' />

      <Button
        variant='bordered'
        size='lg'
        className='w-full border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 font-semibold'
        onPress={() => signIn('google', { callbackUrl, redirect: !onSuccess })}
      >
        Continue with Google
      </Button>
    </div>
  );
}
