'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  Button,
  Input,
  Divider,
  Link as HeroUILink,
  Checkbox,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSchema } from '@/lib/validations/auth';
import type { ZodIssue } from 'zod';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    setFieldErrors({});

    // Validate with Zod
    const validationResult = loginSchema.safeParse({
      identifier,
      password,
      rememberMe,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: ZodIssue) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        // Handle specific error messages
        if (res.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else if (res.error.includes('locked')) {
          setError('Account is temporarily locked. Please try again later.');
        } else if (res.error.includes('inactive')) {
          setError(
            'Your account has been deactivated. Please contact support.'
          );
        } else {
          setError('Invalid email or password');
        }
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
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold mb-2 text-gray-900'>
            Welcome back
          </h1>
          <p className='text-gray-600 text-sm'>
            Sign in to your account to continue
          </p>
        </div>
      )}

      {error && (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl'>
          <p className='text-red-700 text-sm text-center'>{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className='space-y-4'>
        <Input
          label='Email or Username'
          value={identifier}
          onValueChange={setIdentifier}
          variant='bordered'
          size='md'
          classNames={{
            inputWrapper:
              'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
            input: 'text-gray-900',
            label: 'text-gray-700',
          }}
          isRequired
          errorMessage={fieldErrors.identifier}
          isInvalid={!!fieldErrors.identifier}
        />
        <div>
          <Input
            label='Password'
            type={showPassword ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
            variant='bordered'
            size='md'
            classNames={{
              inputWrapper:
                'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
              input: 'text-gray-900',
              label: 'text-gray-700',
            }}
            isRequired
            errorMessage={fieldErrors.password}
            isInvalid={!!fieldErrors.password}
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
          <div className='flex items-center justify-between mt-2'>
            <Checkbox
              isSelected={rememberMe}
              onValueChange={setRememberMe}
              size='sm'
              classNames={{
                label: 'text-gray-700 text-xs',
              }}
            >
              Remember me
            </Checkbox>
            <HeroUILink
              as={Link}
              href='/forgot-password'
              className='text-xs text-blue-600 hover:text-blue-700'
            >
              Forgot password?
            </HeroUILink>
          </div>
        </div>
        <Button
          type='submit'
          className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>

      <Divider className='my-6 bg-gray-200' />

      <Button
        variant='bordered'
        size='md'
        className='w-full border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 hover:scale-105 font-semibold text-gray-700'
        onPress={() => signIn('google', { callbackUrl, redirect: !onSuccess })}
      >
        Continue with Google
      </Button>

      {showTitle && (
        <div className='mt-4 text-center'>
          <p className='text-sm text-gray-600'>
            Don&apos;t have an account?{' '}
            <HeroUILink
              as={Link}
              href='/register'
              className='text-sm text-blue-600 hover:text-blue-700'
            >
              Sign up
            </HeroUILink>
          </p>
        </div>
      )}
    </div>
  );
}
