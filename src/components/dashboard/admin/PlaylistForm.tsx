'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import {
  PlaylistType,
  PlaylistStatus,
  SubmissionStatus,
  Playlist,
  PROVINCES,
  MAX_TRACKS_OPTIONS,
  MAX_SUBMISSIONS_OPTIONS,
} from '@/types/playlist';

interface PlaylistFormProps {
  playlist?: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onSave: (_playlist: Partial<Playlist>) => void;
}

export default function PlaylistForm({
  playlist,
  isOpen,
  onClose,
  onSave,
}: PlaylistFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GENRE' as PlaylistType,
    coverImage: '',
    maxTracks: 20,
    maxSubmissionsPerArtist: 2,
    status: 'INACTIVE' as PlaylistStatus,
    submissionStatus: 'CLOSED' as SubmissionStatus,
    province: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name,
        description: playlist.description || '',
        type: playlist.type,
        coverImage: playlist.coverImage,
        maxTracks: playlist.maxTracks,
        maxSubmissionsPerArtist: playlist.maxSubmissionsPerArtist,
        status: playlist.status,
        submissionStatus: playlist.submissionStatus,
        province: playlist.province || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'GENRE',
        coverImage: '',
        maxTracks: 20,
        maxSubmissionsPerArtist: 2,
        status: 'INACTIVE',
        submissionStatus: 'CLOSED',
        province: '',
      });
    }
    setErrors({});
  }, [playlist, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Playlist name is required';
    }

    if (!formData.coverImage.trim()) {
      newErrors.coverImage = 'Cover image is required';
    }

    if (formData.type === 'PROVINCE' && !formData.province) {
      newErrors.province = 'Province is required for province playlists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving playlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Here you would typically upload the image to your storage service
    // For now, we'll just create a placeholder URL
    const placeholderUrl = `/api/placeholder/300/300?t=${Date.now()}`;
    setFormData(prev => ({ ...prev, coverImage: placeholderUrl }));
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div
          className='fixed inset-0 bg-black bg-opacity-50'
          onClick={onClose}
          role='button'
          tabIndex={0}
          onKeyDown={e => e.key === 'Escape' && onClose()}
          aria-label='Close modal'
        ></div>

        <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              {playlist ? 'Edit Playlist' : 'Create Playlist'}
            </h2>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            >
              <XMarkIcon className='w-5 h-5' />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                Basic Information
              </h3>

              <div>
                <label
                  htmlFor='playlist-name'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Playlist Name *
                </label>
                <input
                  id='playlist-name'
                  type='text'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder='Enter playlist name'
                />
                {errors.name && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor='playlist-description'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Description
                </label>
                <textarea
                  id='playlist-description'
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter playlist description'
                />
              </div>

              <div>
                <label
                  htmlFor='playlist-cover'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Cover Image *
                </label>
                <div className='flex items-center space-x-4'>
                  {formData.coverImage ? (
                    <div className='relative'>
                      <img
                        src={formData.coverImage}
                        alt='Cover preview'
                        className='w-20 h-20 object-cover rounded-lg'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setFormData(prev => ({ ...prev, coverImage: '' }))
                        }
                        className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600'
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className='w-20 h-20 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center'>
                      <PhotoIcon className='w-8 h-8 text-gray-400' />
                    </div>
                  )}
                  <div>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                      id='cover-upload'
                    />
                    <label
                      htmlFor='cover-upload'
                      className='cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
                    >
                      Upload Image
                    </label>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      JPG, PNG up to 2MB
                    </p>
                  </div>
                </div>
                {errors.coverImage && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.coverImage}
                  </p>
                )}
              </div>
            </div>

            {/* Playlist Configuration */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                Configuration
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='playlist-type'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Playlist Type
                  </label>
                  <select
                    id='playlist-type'
                    value={formData.type}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        type: e.target.value as PlaylistType,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='GENRE'>Genre</option>
                    <option value='FEATURED'>Featured</option>
                    <option value='TOP_TEN'>Top Ten</option>
                    <option value='PROVINCE'>Province</option>
                  </select>
                </div>

                {formData.type === 'PROVINCE' && (
                  <div>
                    <label
                      htmlFor='playlist-province'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Province *
                    </label>
                    <select
                      id='playlist-province'
                      value={formData.province}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          province: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.province
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      <option value=''>Select Province</option>
                      {PROVINCES.map(province => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {errors.province}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor='playlist-max-tracks'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Max Tracks
                  </label>
                  <select
                    id='playlist-max-tracks'
                    value={formData.maxTracks}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxTracks: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    {MAX_TRACKS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option} tracks
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='playlist-max-submissions'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Max Submissions per Artist
                  </label>
                  <select
                    id='playlist-max-submissions'
                    value={formData.maxSubmissionsPerArtist}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxSubmissionsPerArtist: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    {MAX_SUBMISSIONS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option} tracks
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status Settings */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                Status Settings
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='playlist-status'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Playlist Status
                  </label>
                  <select
                    id='playlist-status'
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value as PlaylistStatus,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='INACTIVE'>Inactive</option>
                    <option value='ACTIVE'>Active</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='playlist-submission-status'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Submission Status
                  </label>
                  <select
                    id='playlist-submission-status'
                    value={formData.submissionStatus}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        submissionStatus: e.target.value as SubmissionStatus,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='CLOSED'>Closed</option>
                    <option value='OPEN'>Open</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-slate-700'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2'
              >
                {isSubmitting && (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                )}
                {playlist ? 'Update Playlist' : 'Create Playlist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
