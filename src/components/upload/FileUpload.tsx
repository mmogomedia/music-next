'use client';

import React, { useState, useRef } from 'react';
import { Button, Progress } from '@heroui/react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Ably from 'ably';

interface FileUploadProps {
  onUploadComplete?: (_jobId: string) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ablyChannelRef = useRef<Ably.RealtimeChannel | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('Initializing upload...');
    setUploadProgress(5);

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
      setUploadStatus('Connecting to real-time updates...');
      setUploadProgress(10);

      // Step 2: Connect to Ably for realtime updates (original flow)
      const ablyAuthResponse = await fetch(`/api/ably/auth?jobId=${newJobId}`);
      if (!ablyAuthResponse.ok) {
        throw new Error('Failed to authenticate with realtime service');
      }

      const ably = new Ably.Realtime({
        authUrl: '/api/ably/auth',
        authParams: { jobId: newJobId },
      });

      ablyChannelRef.current = ably.channels.get(`upload:${newJobId}`, {
        params: { rewind: '1' },
      });

      ablyChannelRef.current.subscribe(message => {
        if (message.name === 'progress') {
          setUploadProgress(message.data.progress);
        } else if (message.name === 'status') {
          setUploadStatus(message.data.status);
        }
      });

      setUploadStatus('Uploading to cloud storage...');
      setUploadProgress(20);

      // Step 3: Upload via server (to avoid CORS)
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('jobId', newJobId);
      formData.append('uploadUrl', uploadUrl);
      formData.append('key', key);

      const uploadResponse = await fetch('/api/uploads/server-upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

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
        setUploadProgress(100);
        setUploadStatus('Upload successful!');
        onUploadComplete?.(newJobId);
      } else {
        throw new Error('Failed to complete upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className='space-y-6'>
      {/* File Selection Area */}
      <div
        className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-300'
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CloudArrowUpIcon className='w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4' />

        {selectedFile ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-center gap-3'>
              <div className='text-left'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {selectedFile.name}
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                  {selectedFile.type}
                </p>
              </div>
              <Button
                isIconOnly
                variant='light'
                size='sm'
                onClick={handleRemoveFile}
                className='text-gray-400 hover:text-red-500'
              >
                <XMarkIcon className='w-5 h-5' />
              </Button>
            </div>

            {uploadStatus && (
              <div className='space-y-2'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {uploadStatus}
                </p>
                <Progress
                  value={uploadProgress}
                  className='max-w-md mx-auto'
                  color='primary'
                />
              </div>
            )}

            <Button
              color='primary'
              size='lg'
              onClick={handleUpload}
              disabled={isUploading}
              className='font-semibold'
            >
              {isUploading ? 'Uploading...' : 'Upload Music'}
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              Upload your music
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
              Drag and drop files here, or click to select
            </p>
            <Button
              color='primary'
              size='lg'
              onClick={() => fileInputRef.current?.click()}
              className='font-semibold'
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              accept='audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac'
              onChange={handleFileSelect}
              className='hidden'
            />
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
        <h4 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>
          Secure Upload
        </h4>
        <p className='text-sm text-blue-800 dark:text-blue-200'>
          Files are uploaded through our secure server with real-time progress
          tracking and cloud storage.
        </p>
        <p className='text-sm text-blue-800 dark:text-blue-200 mt-1'>
          Supported: MP3, WAV, FLAC, M4A, AAC • Maximum: 100MB
        </p>
      </div>
    </div>
  );
}
