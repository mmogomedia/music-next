'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Input } from '@heroui/react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Registration failed');
      return;
    }
    setOk(true);
    setTimeout(() => router.push('/login'), 1000);
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
                  Account created. Redirecting…
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className='space-y-6'>
              <Input
                label='Name'
                value={name}
                onChange={e => setName(e.target.value)}
                variant='bordered'
                size='lg'
                classNames={{
                  inputWrapper:
                    'border-divider hover:border-primary/50 focus-within:border-primary',
                  input: 'text-foreground',
                }}
              />
              <Input
                label='Email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                variant='bordered'
                size='lg'
                classNames={{
                  inputWrapper:
                    'border-divider hover:border-primary/50 focus-within:border-primary',
                  input: 'text-foreground',
                }}
                isRequired
                minLength={6}
              />
              <Button
                type='submit'
                color='primary'
                size='lg'
                className='w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
