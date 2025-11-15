'use client';

import React, { useState, useRef } from 'react';
import { Button, Progress, Card, CardBody } from '@heroui/react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  MusicalNoteIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import TrackEditModal from '@/components/track/TrackEditModal';

interface FileUploadProps {
  onUploadComplete?: (_jobId: string) => void;
  onViewLibrary?: () => void;
  onUploadAnother?: () => void;
  onTrackCreated?: (_track: any) => void;
  onTrackUpdated?: (_track: any) => void;
}

export default function FileUpload({
  onUploadComplete,
  onViewLibrary,
  onUploadAnother,
  onTrackUpdated,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [showTrackEdit, setShowTrackEdit] = useState(false);
  const [, setUploadedFilePath] = useState<string>('');
  const [uploadedTrackId, setUploadedTrackId] = useState<string>('');
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
        setUploadedFilePath(completeData.filePath || '');
        setUploadedTrackId(completeData.trackId || '');
        onUploadComplete?.(newJobId);

        // Show track edit form after successful upload
        setTimeout(() => {
          setShowTrackEdit(true);
        }, 1000);
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
    setUploadSuccess(false);
    setUploadedFileName('');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadAnother?.();
  };

  const handleViewLibrary = () => {
    onViewLibrary?.();
  };

  const handleTrackSave = async (trackData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/tracks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: uploadedTrackId,
          ...trackData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Call onTrackUpdated for updates instead of onTrackCreated
        onTrackUpdated?.(data.track);
        setShowTrackEdit(false);
        return true;
      } else {
        console.error('Failed to update track');
        return false;
      }
    } catch (error) {
      console.error('Error updating track:', error);
      return false;
    }
  };

  const handleTrackEditClose = () => {
    setShowTrackEdit(false);
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
      {/* Success State */}
      {uploadSuccess ? (
        <Card className='border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'>
          <CardBody className='p-8 text-center'>
            <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CheckCircleIcon className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-xl font-bold text-green-900 dark:text-green-100 mb-2'>
              Upload Successful!
            </h3>
            <p className='text-green-700 dark:text-green-300 mb-6'>
              &quot;{uploadedFileName}&quot; has been uploaded and is now
              available in your music library.
            </p>

            {/* Post-Upload Options */}
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                color='primary'
                size='lg'
                startContent={<MusicalNoteIcon className='w-5 h-5' />}
                onPress={handleViewLibrary}
                className='font-semibold'
              >
                View Music Library
              </Button>
              <Button
                variant='bordered'
                size='lg'
                startContent={<PlusIcon className='w-5 h-5' />}
                onPress={handleUploadAnother}
                className='font-semibold'
              >
                Upload Another Track
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* File Selection Area */
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
      )}

      {/* Upload Instructions - Only show when not in success state */}
      {!uploadSuccess && (
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
      )}

      {/* Track Edit Modal */}
      <TrackEditModal
        isOpen={showTrackEdit}
        onClose={handleTrackEditClose}
        onSave={handleTrackSave}
        mode='edit'
        track={{
          id: uploadedTrackId,
          title: uploadedFileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          isPublic: true,
          isDownloadable: false,
          isExplicit: false,
          licenseType: 'All Rights Reserved',
        }}
      />
    </div>
  );
}
