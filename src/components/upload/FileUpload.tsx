'use client'

import { useState, useRef } from 'react'
import { Button, Progress } from '@heroui/react'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Ably from 'ably'

interface FileUploadProps {
  onUploadComplete?: (jobId: string) => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [jobId, setJobId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ablyChannelRef = useRef<Ably.RealtimeChannel | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadProgress(0)
      setUploadStatus('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus('Initializing upload...')

    try {
      // Step 1: Initialize upload job
      const initResponse = await fetch('/api/uploads/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      })

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload')
      }

      const { jobId: newJobId, uploadUrl } = await initResponse.json()
      setJobId(newJobId)
      setUploadStatus('Uploading to cloud storage...')

      // Step 2: Connect to Ably for realtime updates
      const ablyAuthResponse = await fetch(`/api/ably/auth?jobId=${newJobId}`)
      if (!ablyAuthResponse.ok) {
        throw new Error('Failed to authenticate with realtime service')
      }

      const tokenRequest = await ablyAuthResponse.json()
      const ably = new Ably.Realtime({ authUrl: '/api/ably/auth', authParams: { jobId: newJobId } })
      
      ablyChannelRef.current = ably.channels.get(`upload:${newJobId}`, {
        params: { rewind: '1' }
      })

      ablyChannelRef.current.subscribe((message) => {
        if (message.name === 'progress') {
          setUploadProgress(message.data.progress)
        } else if (message.name === 'status') {
          setUploadStatus(message.data.status)
        }
      })

      // Step 3: Upload file to R2 with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          setUploadStatus('Upload complete, processing...')
          
          // Step 4: Notify backend that upload is complete
          const completeResponse = await fetch('/api/uploads/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: newJobId,
              key: selectedFile.name,
              size: selectedFile.size,
              mime: selectedFile.type,
            }),
          })

          if (completeResponse.ok) {
            setUploadStatus('Upload successful!')
            onUploadComplete?.(newJobId)
          } else {
            throw new Error('Failed to complete upload')
          }
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed')
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', selectedFile.type)
      xhr.send(selectedFile)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStatus('')
    setJobId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadProgress(0)
      setUploadStatus('')
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-6">
      {/* File Selection Area */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-300"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CloudArrowUpIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                </p>
              </div>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>
            
            {uploadStatus && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">{uploadStatus}</p>
                <Progress
                  value={uploadProgress}
                  className="max-w-md mx-auto"
                  color="primary"
                />
              </div>
            )}
            
            <Button
              color="primary"
              size="lg"
              onClick={handleUpload}
              disabled={isUploading}
              className="font-semibold"
            >
              {isUploading ? 'Uploading...' : 'Upload Music'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Upload your music
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop files here, or click to select
            </p>
            <Button
              color="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Supported Formats
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          MP3, WAV, FLAC, M4A, AAC • Maximum file size: 100MB
        </p>
      </div>
    </div>
  )
}
