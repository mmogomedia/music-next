'use client';

import { Button } from '@heroui/react';
import {
  PlusIcon,
  MusicalNoteIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  onUpload: () => void;
  onLibrary: () => void;
  onAnalytics: () => void;
}

export default function QuickActions({
  onUpload,
  onLibrary,
  onAnalytics,
}: QuickActionsProps) {
  return (
    <div className='bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700'>
      <div className='flex items-center gap-2 mb-3'>
        <div className='w-5 h-5 bg-slate-600 dark:bg-slate-500 rounded-md flex items-center justify-center'>
          <MusicalNoteIcon className='w-3 h-3 text-white' />
        </div>
        <h4 className='font-medium text-slate-900 dark:text-white text-sm'>
          Quick Actions
        </h4>
      </div>
      <div className='space-y-1'>
        <Button
          size='md'
          variant='flat'
          color='primary'
          fullWidth
          startContent={<MusicalNoteIcon className='w-4 h-4' />}
          onPress={onLibrary}
        >
          My Music
        </Button>
        <Button
          size='md'
          variant='flat'
          color='primary'
          fullWidth
          startContent={<ChartBarIcon className='w-4 h-4' />}
          onPress={onAnalytics}
        >
          Analytics
        </Button>

        {/* Subtle border separator */}
        <div className='border-t border-slate-200 dark:border-slate-600 my-2'></div>

        <Button
          size='md'
          variant='flat'
          color='secondary'
          fullWidth
          startContent={<PlusIcon className='w-4 h-4' />}
          onPress={onUpload}
        >
          Upload Music
        </Button>
      </div>
    </div>
  );
}
