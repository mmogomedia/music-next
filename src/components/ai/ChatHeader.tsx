'use client';

import React from 'react';
import { Chip, Button } from '@heroui/react';
import Link from 'next/link';

export default function ChatHeader() {
  return (
    <div className='flex items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-700 pb-3'>
      <div className='flex items-center gap-3'>
        <h1 className='text-xl font-semibold'>AI Chat</h1>
        <Chip color='success' variant='flat' size='sm'>
          Streaming
        </Chip>
      </div>
      <div className='flex items-center gap-2'>
        <Link
          href='/chat/history'
          className='text-sm text-gray-700 dark:text-gray-300 hover:underline'
        >
          History
        </Link>
        <Link
          href='/chat/settings'
          className='text-sm text-gray-700 dark:text-gray-300 hover:underline'
        >
          Settings
        </Link>
        <Button size='sm' color='success' variant='flat'>
          New Chat
        </Button>
      </div>
    </div>
  );
}
