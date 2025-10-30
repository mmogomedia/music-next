'use client';

import React from 'react';
import Link from 'next/link';

export default function ChatSidebar() {
  return (
    <aside className='fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4 hidden lg:flex flex-col gap-4'>
      <div>
        <h2 className='text-lg font-semibold'>AI Chat</h2>
        <p className='text-xs text-gray-500 dark:text-gray-400'>Streaming Platform</p>
      </div>

      <nav className='flex flex-col gap-2'>
        <Link className='text-sm text-gray-800 dark:text-gray-100 hover:underline' href='/'>New Chat</Link>
        <Link className='text-sm text-gray-800 dark:text-gray-100 hover:underline' href='/chat/history'>History</Link>
        <Link className='text-sm text-gray-800 dark:text-gray-100 hover:underline' href='/chat/trending'>Trending</Link>
        <Link className='text-sm text-gray-800 dark:text-gray-100 hover:underline' href='/chat/settings'>Settings</Link>
      </nav>

      <div className='mt-auto pt-4 border-t border-gray-200 dark:border-slate-700'>
        <Link className='text-sm text-gray-700 dark:text-gray-300 hover:underline' href='/classic'>Classic view</Link>
      </div>
    </aside>
  );
}


