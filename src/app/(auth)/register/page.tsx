'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Checkbox, Link as HeroUILink } from '@heroui/react';
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
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8'>
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
        <div className='bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto'>
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold mb-2 text-white'>Join Flemoji</h1>
            <p className='text-white/70 text-sm'>
              Create your account and start your musical journey
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-red-300 text-sm text-center'>{error}</p>
            </div>
          )}

          {ok && (
            <div className='mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
              <p className='text-green-300 text-sm text-center'>
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
                  'bg-white/5 border-white/20 hover:border-blue-400/50 focus-within:border-blue-400',
                input: 'text-white placeholder:text-white/50',
                label: 'text-white/80',
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
                  'bg-white/5 border-white/20 hover:border-blue-400/50 focus-within:border-blue-400',
                input: 'text-white placeholder:text-white/50',
                label: 'text-white/80',
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
                    'bg-white/5 border-white/20 hover:border-blue-400/50 focus-within:border-blue-400',
                  input: 'text-white placeholder:text-white/50',
                  label: 'text-white/80',
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
                  'bg-white/5 border-white/20 hover:border-blue-400/50 focus-within:border-blue-400',
                input: 'text-white placeholder:text-white/50',
                label: 'text-white/80',
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

            <div className='space-y-2'>
              <div className='flex items-start gap-2'>
                <Checkbox
                  isSelected={termsAccepted}
                  onValueChange={setTermsAccepted}
                  isRequired
                  classNames={{
                    base: 'mt-0.5',
                    label: 'text-white/80 text-xs',
                  }}
                  isInvalid={!!fieldErrors.termsAccepted}
                >
                  <div
                    className='text-xs cursor-pointer'
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
                      className='text-blue-400 hover:underline'
                      onClick={e => e.stopPropagation()}
                    >
                      Terms & Conditions
                    </Link>
                  </div>
                </Checkbox>
              </div>
              {fieldErrors.termsAccepted && (
                <p className='text-xs text-red-300 ml-6'>
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
                    label: 'text-white/80 text-xs',
                  }}
                  isInvalid={!!fieldErrors.privacyAccepted}
                >
                  <div
                    className='text-xs cursor-pointer'
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
                      className='text-blue-400 hover:underline'
                      onClick={e => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                </Checkbox>
              </div>
              {fieldErrors.privacyAccepted && (
                <p className='text-xs text-red-300 ml-6'>
                  {fieldErrors.privacyAccepted}
                </p>
              )}

              <Checkbox
                isSelected={marketingConsent}
                onValueChange={setMarketingConsent}
                classNames={{
                  label: 'text-white/80 text-xs',
                }}
              >
                I consent to receive marketing emails and updates
              </Checkbox>
            </div>

            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
              isLoading={loading}
              isDisabled={!termsAccepted || !privacyAccepted}
            >
              Create Account
            </Button>
          </form>

          <div className='mt-4 text-center'>
            <p className='text-sm text-white/70'>
              Already have an account?{' '}
              <HeroUILink
                as={Link}
                href='/login'
                className='text-sm text-blue-400 hover:text-blue-300'
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
