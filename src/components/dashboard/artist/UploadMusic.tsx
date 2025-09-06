"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  MusicalNoteIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export default function UploadMusic() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      simulateUpload(uploadedFile.id)
    })
  }, [])

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 30, 100)
          
          if (newProgress >= 100) {
            clearInterval(interval)
            return { ...file, progress: 100, status: 'completed' }
          }
          
          return { ...file, progress: newProgress }
        }
        return file
      }))
    }, 500)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Floating Upload Button - Always Accessible */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
            <CloudArrowUpIcon className="w-5 h-5" />
          </div>
          <span className="hidden sm:block">Upload Complete</span>
        </button>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Upload New Music</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Drag and drop your music files here or click to browse. Supports MP3, WAV, FLAC, M4A, and AAC files up to 100MB.
          </p>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 cursor-pointer ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                Drop your music files here...
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload your music
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supports MP3, WAV, FLAC, M4A, AAC files up to 100MB
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                  Choose Files
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Progress</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {uploadedFiles.filter(f => f.status === 'completed').length} of {uploadedFiles.length} files uploaded
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <MusicalNoteIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {uploadedFile.file.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadedFile.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            uploadedFile.status === 'completed'
                              ? 'bg-green-500'
                              : uploadedFile.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === 'completed' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Upload Guidelines
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• Supported formats: MP3, WAV, FLAC, M4A, AAC</p>
          <p>• Maximum file size: 100MB per file</p>
          <p>• Recommended bitrate: 320kbps for MP3, 16-bit/44.1kHz for WAV</p>
          <p>• Include album artwork (optional but recommended)</p>
          <p>• Ensure you have rights to upload the content</p>
        </div>
      </div>

      {/* Metadata Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Track Information</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add metadata for your uploaded tracks
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Track Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="Enter track title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="Enter artist name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Album
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="Enter album name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genre
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white">
                <option value="">Select genre</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="electronic">Electronic</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
                <option value="country">Country</option>
                <option value="r&b">R&B</option>
                <option value="reggae">Reggae</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Describe your track..."
            />
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200">
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
              Save Track
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

