import Link from 'next/link';
import { Button } from '@heroui/react';

export default function NotFound() {
  return (
    <main className='min-h-screen flex items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      <div className='absolute inset-0 bg-grid opacity-20 pointer-events-none' />

      <div className='relative text-center'>
        <h1 className='text-9xl font-bold text-primary/20 mb-4'>404</h1>
        <h2 className='text-3xl font-bold mb-4'>Page Not Found</h2>
        <p className='text-foreground/70 mb-8 max-w-md'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button
          as={Link}
          href='/'
          color='primary'
          size='lg'
          className='font-semibold'
        >
          Go Home
        </Button>
      </div>
    </main>
  );
}
