'use client';

import React, { useState, useRef } from 'react';
import { Progress } from '@heroui/react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  MusicalNoteIcon,
  PlusIcon,
  PencilIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { FButton, FCard, FChip } from '@/components/ui';

interface FileUploadProps {
  onUploadComplete?: (_jobId: string) => void;
  onViewLibrary?: () => void;
  onUploadAnother?: () => void;
}

// Supported formats shown as chips
const FORMATS = ['MP3', 'WAV', 'FLAC', 'M4A', 'AAC'];

// Format file size
function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  onUploadComplete,
  onViewLibrary,
  onUploadAnother,
}: FileUploadProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedTrackId, setUploadedTrackId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileToR2 = (url: string, file: File) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const percent = event.total > 0 ? event.loaded / event.total : 0;
          const progressValue = 20 + Math.round(percent * 60);
          setUploadProgress(progressValue);
          setUploadStatus(
            `Uploading to cloud storage... ${Math.round(percent * 100)}%`
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          const responseText =
            xhr.responseText || `Upload failed with status ${xhr.status}`;
          reject(new Error(responseText));
        }
      };

      xhr.send(file);
    });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('Initializing upload...');
    setUploadProgress(5);
    setUploadError(null);

    try {
      // Step 1: Initialize upload job (original flow)
      const initResponse = await fetch('/api/uploads/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }

      const { jobId: newJobId, uploadUrl, key } = await initResponse.json();
      setUploadStatus('Preparing upload...');
      setUploadProgress(20);

      // Step 3: Upload directly to R2 using the presigned URL
      await uploadFileToR2(uploadUrl, selectedFile);

      setUploadStatus('Upload complete, processing...');
      setUploadProgress(90);

      // Step 4: Mark as complete (original flow)
      const completeResponse = await fetch('/api/uploads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: newJobId,
          key: key,
          size: selectedFile.size,
          mime: selectedFile.type,
        }),
      });

      if (completeResponse.ok) {
        const completeData = await completeResponse.json();
        setUploadProgress(100);
        setUploadStatus('Upload successful!');
        setUploadSuccess(true);
        setUploadedFileName(selectedFile.name);
        setUploadedTrackId(completeData.trackId || '');
        onUploadComplete?.(newJobId);
      } else {
        throw new Error('Failed to complete upload');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadSuccess(false);
    setUploadedFileName('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAnother = () => {
    setUploadSuccess(false);
    setUploadedFileName('');
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadedTrackId('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadAnother?.();
  };

  const handleViewLibrary = () => {
    onViewLibrary?.();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className='space-y-4'>
      {uploadSuccess ? (
        <FCard accent='success' padding='lg'>
          <div className='text-center space-y-4 py-4'>
            <div className='w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto'>
              <CheckCircleIcon className='w-7 h-7 text-white' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                Track uploaded!
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto'>
                <span className='font-medium text-gray-700 dark:text-gray-200'>
                  {uploadedFileName}
                </span>{' '}
                is now in your music library.
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-2 justify-center pt-2'>
              {uploadedTrackId && (
                <FButton
                  variant='primary'
                  startContent={<PencilIcon className='w-4 h-4' />}
                  onPress={() =>
                    router.push(`/dashboard/tracks/${uploadedTrackId}/edit`)
                  }
                >
                  Edit Track Details
                </FButton>
              )}
              <FButton
                variant='secondary'
                startContent={<MusicalNoteIcon className='w-4 h-4' />}
                onPress={handleViewLibrary}
              >
                View Library
              </FButton>
              <FButton
                variant='outline'
                startContent={<PlusIcon className='w-4 h-4' />}
                onPress={handleUploadAnother}
              >
                Upload Another
              </FButton>
            </div>
          </div>
        </FCard>
      ) : (
        <div
          className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${
            isDragOver
              ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-950/30 scale-[1.01]'
              : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 hover:border-primary-300 dark:hover:border-primary-700'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
        >
          {selectedFile ? (
            <div className='p-6 space-y-4'>
              <div className='flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'>
                <div className='w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0'>
                  <DocumentArrowUpIcon className='w-5 h-5 text-primary-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-800 dark:text-gray-100 truncate'>
                    {selectedFile.name}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {formatSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <FButton
                    variant='danger-ghost'
                    size='sm'
                    isIconOnly
                    onPress={handleRemoveFile}
                    aria-label='Remove file'
                  >
                    <XMarkIcon className='w-4 h-4' />
                  </FButton>
                )}
              </div>

              {isUploading && (
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress
                    value={uploadProgress}
                    color='primary'
                    size='sm'
                    className='w-full'
                  />
                </div>
              )}

              {uploadError && (
                <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-400'>
                  <XMarkIcon className='w-4 h-4 flex-shrink-0' />
                  {uploadError}
                </div>
              )}

              <FButton
                variant='primary'
                className='w-full'
                onPress={handleUpload}
                isDisabled={isUploading}
                isLoading={isUploading}
              >
                {isUploading ? 'Uploading…' : 'Upload Track'}
              </FButton>
            </div>
          ) : (
            <div className='p-10 text-center space-y-4'>
              <div className='w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto'>
                <CloudArrowUpIcon className='w-8 h-8 text-primary-500' />
              </div>
              <div>
                <p className='text-base font-semibold text-gray-800 dark:text-gray-100'>
                  {isDragOver
                    ? 'Drop your file here'
                    : 'Drag & drop your music'}
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                  or click below to browse your files
                </p>
              </div>
              <FButton
                variant='primary'
                onPress={() => fileInputRef.current?.click()}
              >
                Choose File
              </FButton>
              <input
                ref={fileInputRef}
                type='file'
                accept='audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac'
                onChange={handleFileSelect}
                className='hidden'
              />
              <div className='flex items-center justify-center gap-1.5 flex-wrap pt-1'>
                {FORMATS.map(fmt => (
                  <FChip key={fmt} size='xs' variant='flat' color='default'>
                    {fmt}
                  </FChip>
                ))}
                <FChip size='xs' variant='flat' color='default'>
                  Max 100 MB
                </FChip>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
