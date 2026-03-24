'use client';

import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { FCard } from '@/components/ui';
import FileUpload from '@/components/upload/FileUpload';

interface UploadTabProps {
  onUploadComplete: (_jobId: string) => void;
  onViewLibrary: () => void;
  onUploadAnother?: () => void;
}

const STEPS = [
  {
    Icon: DocumentArrowUpIcon,
    title: 'Choose file',
    desc: 'MP3, WAV, FLAC, M4A or AAC — up to 100 MB',
  },
  {
    Icon: CloudArrowUpIcon,
    title: 'Upload',
    desc: 'Securely stored in the cloud',
  },
  {
    Icon: SparklesIcon,
    title: 'Add metadata',
    desc: 'Title, artwork, lyrics & AI attributes',
  },
  {
    Icon: MusicalNoteIcon,
    title: 'Submit to playlists',
    desc: 'Pitch to curators and reach listeners',
  },
];

export default function UploadTab({
  onUploadComplete,
  onViewLibrary,
  onUploadAnother,
}: UploadTabProps) {
  return (
    <div className='space-y-4'>
      {/* Steps row — mirrors the stats grid in LibraryTab */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {STEPS.map((step, i) => (
          <FCard key={step.title} padding='sm'>
            <div className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5'>
                {i + 1}
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                  {step.title}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed'>
                  {step.desc}
                </p>
              </div>
            </div>
          </FCard>
        ))}
      </div>

      {/* Upload card — mirrors the tracks FCard in LibraryTab */}
      <FCard
        padding='none'
        title='Upload a Track'
        titleIcon={<CloudArrowUpIcon className='w-4 h-4' />}
      >
        <div className='p-5 sm:p-6'>
          <FileUpload
            onUploadComplete={onUploadComplete}
            onViewLibrary={onViewLibrary}
            onUploadAnother={onUploadAnother}
          />
        </div>
      </FCard>
    </div>
  );
}
