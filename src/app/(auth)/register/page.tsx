'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardBody,
  Input,
  Checkbox,
  Link as HeroUILink,
} from '@heroui/react';
import Link from 'next/link';
import { registerSchema } from '@/lib/validations/auth';
import PasswordStrength from '@/components/auth/PasswordStrength';
import type { ZodIssue } from 'zod';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
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
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative w-full max-w-md mx-auto px-4 sm:px-6'>
        <Card className='glass shadow-2xl border-0'>
          <CardBody className='p-8'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold mb-2'>Join Flemoji</h1>
              <p className='text-foreground/70'>
                Create your account and start your musical journey
              </p>
            </div>

            {error && (
              <div className='mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg'>
                <p className='text-danger-600 dark:text-danger-400 text-sm text-center'>
                  {error}
                </p>
              </div>
            )}

            {ok && (
              <div className='mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg'>
                <p className='text-success-600 dark:text-success-400 text-sm text-center'>
                  Account created! Please check your email to verify your
                  account. Redirecting...
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className='space-y-6'>
              <Input
                label='Name (Optional)'
                value={name}
                onValueChange={setName}
                variant='bordered'
                size='lg'
                classNames={{
                  inputWrapper:
                    'border-divider hover:border-primary/50 focus-within:border-primary',
                  input: 'text-foreground',
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
                size='lg'
                isRequired
                classNames={{
                  inputWrapper:
                    'border-divider hover:border-primary/50 focus-within:border-primary',
                  input: 'text-foreground',
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
                  size='lg'
                  isRequired
                  classNames={{
                    inputWrapper:
                      'border-divider hover:border-primary/50 focus-within:border-primary',
                    input: 'text-foreground',
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
                size='lg'
                isRequired
                classNames={{
                  inputWrapper:
                    'border-divider hover:border-primary/50 focus-within:border-primary',
                  input: 'text-foreground',
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

              <div className='space-y-3'>
                <div className='flex items-start gap-2'>
                  <Checkbox
                    isSelected={termsAccepted}
                    onValueChange={setTermsAccepted}
                    isRequired
                    classNames={{
                      base: 'mt-0.5',
                    }}
                    isInvalid={!!fieldErrors.termsAccepted}
                  />
                  <div
                    className='text-sm cursor-pointer flex-1'
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTermsAccepted(!termsAccepted);
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label='I agree to the Terms & Conditions'
                  >
                    I agree to the{' '}
                    <Link
                      href='/terms'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:underline'
                      onClick={e => e.stopPropagation()}
                    >
                      Terms & Conditions
                    </Link>
                  </div>
                </div>
                {fieldErrors.termsAccepted && (
                  <p className='text-xs text-danger ml-6'>
                    {fieldErrors.termsAccepted}
                  </p>
                )}

                <div className='flex items-start gap-2'>
                  <Checkbox
                    isSelected={privacyAccepted}
                    onValueChange={setPrivacyAccepted}
                    isRequired
                    classNames={{
                      base: 'mt-0.5',
                    }}
                    isInvalid={!!fieldErrors.privacyAccepted}
                  />
                  <div
                    className='text-sm cursor-pointer flex-1'
                    onClick={() => setPrivacyAccepted(!privacyAccepted)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPrivacyAccepted(!privacyAccepted);
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label='I agree to the Privacy Policy'
                  >
                    I agree to the{' '}
                    <Link
                      href='/privacy'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:underline'
                      onClick={e => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                </div>
                {fieldErrors.privacyAccepted && (
                  <p className='text-xs text-danger ml-6'>
                    {fieldErrors.privacyAccepted}
                  </p>
                )}

                <Checkbox
                  isSelected={marketingConsent}
                  onValueChange={setMarketingConsent}
                  classNames={{
                    label: 'text-sm',
                  }}
                >
                  I consent to receive marketing emails and updates
                </Checkbox>
              </div>

              <Button
                type='submit'
                color='primary'
                size='lg'
                className='w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                isLoading={loading}
                isDisabled={!termsAccepted || !privacyAccepted}
              >
                Create Account
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-foreground/70'>
                Already have an account?{' '}
                <HeroUILink as={Link} href='/login' className='text-sm'>
                  Sign in
                </HeroUILink>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
