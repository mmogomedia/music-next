'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Input, Link as HeroUILink, Divider } from '@heroui/react';
import Link from 'next/link';
import { registerSchema } from '@/lib/validations/auth';
import PasswordStrength from '@/components/auth/PasswordStrength';
import AuthPageHeader from '@/components/auth/AuthPageHeader';
import type { ZodIssue } from 'zod';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setOk(false);

    // Automatically set consent to true (implied by clicking the button)
    const termsAccepted = true;
    const privacyAccepted = true;
    const marketingConsent = false;

    // Validate with Zod
    const validationResult = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
      name: name || undefined,
      termsAccepted,
      privacyAccepted,
      marketingConsent,
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          name: name || undefined,
          termsAccepted,
          privacyAccepted,
          marketingConsent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          // Field-level errors
          const errors: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        } else {
          setError(data.error || 'Registration failed');
        }
        setLoading(false);
        return;
      }

      setOk(true);
      setTimeout(() => router.push('/login?registered=true'), 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-white py-8'>
      <div className='relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-8'>
        <div className='bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto'>
          <AuthPageHeader />
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold mb-2 text-gray-900'>
              Join Flemoji
            </h1>
            <p className='text-gray-600 text-sm'>
              Create your account and start your musical journey
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl'>
              <p className='text-red-700 text-sm text-center'>{error}</p>
            </div>
          )}

          {ok && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-xl'>
              <p className='text-green-700 text-sm text-center'>
                Account created! Please check your email to verify your account.
                Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className='space-y-4'>
            <Input
              label='Name (Optional)'
              value={name}
              onValueChange={setName}
              variant='bordered'
              size='md'
              classNames={{
                inputWrapper:
                  'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                input: 'text-gray-900',
                label: 'text-gray-700',
              }}
              errorMessage={fieldErrors.name}
              isInvalid={!!fieldErrors.name}
            />

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
              errorMessage={fieldErrors.email}
              isInvalid={!!fieldErrors.email}
            />

            <div>
              <Input
                label='Password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onValueChange={setPassword}
                variant='bordered'
                size='md'
                isRequired
                classNames={{
                  inputWrapper:
                    'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                  input: 'text-gray-900',
                  label: 'text-gray-700',
                }}
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
              size='md'
              isRequired
              classNames={{
                inputWrapper:
                  'border-gray-300 hover:border-blue-400 focus-within:border-blue-500',
                input: 'text-gray-900',
                label: 'text-gray-700',
              }}
              errorMessage={
                fieldErrors.confirmPassword ||
                (confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined)
              }
              isInvalid={
                !!fieldErrors.confirmPassword ||
                (confirmPassword !== '' && password !== confirmPassword)
              }
            />

            {/* Consent Statement */}
            <div className='pt-2 pb-2'>
              <p className='text-xs text-gray-600 text-center leading-relaxed'>
                By clicking on any of the &quot;Continue&quot; buttons below,
                you agree to Flemoji&apos;s{' '}
                <Link
                  href='/terms'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-700 hover:underline'
                >
                  Terms of Use
                </Link>{' '}
                and acknowledge our{' '}
                <Link
                  href='/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-700 hover:underline'
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
              isLoading={loading}
              isDisabled={
                loading ||
                !email?.trim() ||
                !password ||
                !confirmPassword ||
                password !== confirmPassword
              }
            >
              Create Account
            </Button>
          </form>

          <Divider className='my-6 bg-gray-200' />

          <Button
            variant='bordered'
            size='md'
            className='w-full border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 hover:scale-105 font-semibold text-gray-700'
            onPress={() => signIn('google', { callbackUrl: '/' })}
          >
            Continue with Google
          </Button>

          <div className='mt-4 text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <HeroUILink
                as={Link}
                href='/login'
                className='text-sm text-blue-600 hover:text-blue-700'
              >
                Sign in
              </HeroUILink>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
