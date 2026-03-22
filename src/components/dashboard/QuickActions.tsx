'use client';

import {
  PlusIcon,
  MusicalNoteIcon,
  ChartBarIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import FCard from '@/components/ui/FCard';
import FButton from '@/components/ui/FButton';
import FDivider from '@/components/ui/FDivider';

interface QuickActionsProps {
  onUpload: () => void;
  onLibrary: () => void;
  onAnalytics: () => void;
  onSubmissions: () => void;
}

export default function QuickActions({
  onUpload,
  onLibrary,
  onAnalytics,
  onSubmissions,
}: QuickActionsProps) {
  return (
    <FCard variant='default' padding='sm'>
      <div className='flex items-center gap-2 mb-3'>
        <MusicalNoteIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
        <h4 className='font-medium text-slate-900 dark:text-white text-sm'>
          Quick Actions
        </h4>
      </div>
      <div className='space-y-1'>
        <FButton
          size='md'
          variant='ghost'
          fullWidth
          startContent={<MusicalNoteIcon className='w-4 h-4' />}
          onPress={onLibrary}
        >
          My Music
        </FButton>
        <FButton
          size='md'
          variant='ghost'
          fullWidth
          startContent={<QueueListIcon className='w-4 h-4' />}
          onPress={onSubmissions}
        >
          Submissions
        </FButton>
        <FButton
          size='md'
          variant='ghost'
          fullWidth
          startContent={<ChartBarIcon className='w-4 h-4' />}
          onPress={onAnalytics}
        >
          Analytics
        </FButton>

        <FDivider spacing='sm' />

        <FButton
          size='md'
          variant='secondary'
          fullWidth
          startContent={<PlusIcon className='w-4 h-4' />}
          onPress={onUpload}
        >
          Upload Music
        </FButton>
      </div>
    </FCard>
  );
}
