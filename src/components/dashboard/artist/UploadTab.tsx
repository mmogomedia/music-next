'use client';

import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
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
    title: 'Choose your file',
    desc: 'Drag & drop or browse for your audio file. MP3, WAV, FLAC and more.',
  },
  {
    Icon: CloudArrowUpIcon,
    title: 'Upload to the cloud',
    desc: 'Your track is securely uploaded and stored.',
  },
  {
    Icon: SparklesIcon,
    title: 'Add metadata',
    desc: 'Fill in the title, artwork, genre, lyrics, and AI-generated attributes.',
  },
  {
    Icon: MusicalNoteIcon,
    title: 'Submit to playlists',
    desc: 'Pitch your track to curators for discovery and placement.',
  },
];

const REQUIREMENTS = [
  { label: 'Formats', value: 'MP3, WAV, FLAC, M4A, AAC' },
  { label: 'Max file size', value: '100 MB' },
  { label: 'Recommended quality', value: '320 kbps / 24-bit WAV' },
  { label: 'Sample rate', value: '44.1 kHz or higher' },
];

export default function UploadTab({
  onUploadComplete,
  onViewLibrary,
  onUploadAnother,
}: UploadTabProps) {
  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
          Upload Music
        </h2>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
          Add new tracks to your library — metadata is extracted automatically.
        </p>
      </div>

      {/* Two-column layout */}
      <div className='grid gap-6 lg:grid-cols-[1fr_288px] items-start'>
        {/* ── Main: upload zone ─────────────────────────────── */}
        <FileUpload
          onUploadComplete={onUploadComplete}
          onViewLibrary={onViewLibrary}
          onUploadAnother={onUploadAnother}
        />

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className='space-y-4 lg:sticky lg:top-6'>
          {/* How it works */}
          <FCard padding='md' title='How it works'>
            <ol className='space-y-4 pt-1'>
              {STEPS.map((step, i) => (
                <li key={step.title} className='flex gap-3'>
                  <div className='w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5'>
                    {i + 1}
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                      {step.title}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed'>
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </FCard>

          {/* File requirements */}
          <FCard padding='md' title='File requirements'>
            <dl className='space-y-2.5 pt-1'>
              {REQUIREMENTS.map(r => (
                <div
                  key={r.label}
                  className='flex items-start justify-between gap-4 text-sm'
                >
                  <dt className='text-gray-500 dark:text-gray-400 flex-shrink-0'>
                    {r.label}
                  </dt>
                  <dd className='text-gray-800 dark:text-gray-200 font-medium text-right'>
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </FCard>

          {/* Tip */}
          <div className='flex gap-2.5 rounded-xl border border-primary-100 dark:border-primary-900/40 bg-primary-50/50 dark:bg-primary-950/20 px-3.5 py-3'>
            <InformationCircleIcon className='w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5' />
            <p className='text-xs text-primary-700 dark:text-primary-300 leading-relaxed'>
              Title, genre, BPM, and release date are extracted automatically
              from your file — you can refine them in the track editor.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
