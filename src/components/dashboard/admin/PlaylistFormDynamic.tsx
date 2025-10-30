'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import {
  Playlist,
  PlaylistTypeDefinition,
} from '@/types/dynamic-playlist-types';
import { PlaylistStatus, SubmissionStatus } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';
import { uploadImageToR2 } from '@/lib/image-upload';
import { api } from '@/lib/api-client';

interface PlaylistFormDynamicProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (_playlist: Partial<Playlist>) => void;
  playlist?: Playlist | null;
}

export default function PlaylistFormDynamic({
  isOpen,
  onClose,
  onSave,
  playlist,
}: PlaylistFormDynamicProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    playlistTypeId: '',
    coverImage: '',
    maxTracks: 20,
    maxSubmissionsPerArtist: 1,
    province: '',
    status: PlaylistStatus.INACTIVE,
    submissionStatus: SubmissionStatus.CLOSED,
  });
  const [playlistTypes, setPlaylistTypes] = useState<PlaylistTypeDefinition[]>(
    []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchPlaylistTypes();
      if (playlist) {
        setFormData({
          name: playlist.name,
          description: playlist.description || '',
          playlistTypeId: playlist.playlistTypeId,
          coverImage: playlist.coverImage,
          maxTracks: playlist.maxTracks,
          maxSubmissionsPerArtist: playlist.maxSubmissionsPerArtist,
          province: playlist.province || '',
          status: playlist.status,
          submissionStatus: playlist.submissionStatus,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          playlistTypeId: '',
          coverImage: '',
          maxTracks: 20,
          maxSubmissionsPerArtist: 1,
          province: '',
          status: PlaylistStatus.INACTIVE,
          submissionStatus: SubmissionStatus.CLOSED,
        });
      }
      setErrors({});
    }
  }, [isOpen, playlist]);

  const fetchPlaylistTypes = async () => {
    try {
      const response = await api.admin.getPlaylistTypes();
      setPlaylistTypes(response.data.playlistTypes || []);
    } catch (error) {
      console.error('Error fetching playlist types:', error);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const key = await uploadImageToR2(file);
      setFormData(prev => ({ ...prev, coverImage: key }));
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ ...prev, coverImage: 'Failed to upload image' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.playlistTypeId) {
      newErrors.playlistTypeId = 'Playlist type is required';
    }

    if (!formData.coverImage) {
      newErrors.coverImage = 'Cover image is required';
    }

    if (formData.maxTracks < 1) {
      newErrors.maxTracks = 'Max tracks must be at least 1';
    }

    if (formData.maxSubmissionsPerArtist < 1) {
      newErrors.maxSubmissionsPerArtist =
        'Max submissions per artist must be at least 1';
    }

    // Check if selected type requires province
    const selectedType = playlistTypes.find(
      t => t.id === formData.playlistTypeId
    );
    if (selectedType?.requiresProvince && !formData.province) {
      newErrors.province = 'Province is required for this playlist type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-update maxTracks when type changes
    if (field === 'playlistTypeId') {
      const selectedType = playlistTypes.find(t => t.id === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          maxTracks: selectedType.defaultMaxTracks,
        }));
      }
    }
  };

  const selectedType = playlistTypes.find(
    t => t.id === formData.playlistTypeId
  );

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div
          className='fixed inset-0 bg-black bg-opacity-50'
          onClick={onClose}
          role='button'
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onClose()}
          aria-label='Close modal'
        />

        <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
          <div className='p-6'>
            {/* Header */}
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                {playlist ? 'Edit Playlist' : 'Create Playlist'}
              </h3>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                <XMarkIcon className='w-6 h-6' />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Basic Information */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Basic Information
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder='Enter playlist name'
                    />
                    {errors.name && (
                      <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='playlist-type'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Playlist Type *
                    </label>
                    <select
                      id='playlist-type'
                      value={formData.playlistTypeId}
                      onChange={e =>
                        handleInputChange('playlistTypeId', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.playlistTypeId
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      <option value=''>Select playlist type</option>
                      {playlistTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.icon && `${type.icon} `}
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.playlistTypeId && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.playlistTypeId}
                      </p>
                    )}
                    {selectedType && (
                      <div className='mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                          {selectedType.icon && (
                            <span className='text-lg'>{selectedType.icon}</span>
                          )}
                          <span className='font-medium text-blue-900 dark:text-blue-100'>
                            {selectedType.name}
                          </span>
                        </div>
                        {selectedType.description && (
                          <p className='text-sm text-blue-800 dark:text-blue-200'>
                            {selectedType.description}
                          </p>
                        )}
                        <div className='mt-2 text-xs text-blue-700 dark:text-blue-300'>
                          <div>
                            Max Instances:{' '}
                            {selectedType.maxInstances === -1
                              ? 'Unlimited'
                              : selectedType.maxInstances}
                          </div>
                          <div>
                            Default Tracks: {selectedType.defaultMaxTracks}
                          </div>
                          <div>
                            Requires Province:{' '}
                            {selectedType.requiresProvince ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                      handleInputChange('description', e.target.value)
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Enter playlist description'
                  />
                </div>

                {/* Province field - only show if selected type requires it */}
                {selectedType?.requiresProvince && (
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
                        handleInputChange('province', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.province
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      <option value=''>Select province</option>
                      <option value='Western Cape'>Western Cape</option>
                      <option value='Eastern Cape'>Eastern Cape</option>
                      <option value='Northern Cape'>Northern Cape</option>
                      <option value='Free State'>Free State</option>
                      <option value='KwaZulu-Natal'>KwaZulu-Natal</option>
                      <option value='North West'>North West</option>
                      <option value='Gauteng'>Gauteng</option>
                      <option value='Mpumalanga'>Mpumalanga</option>
                      <option value='Limpopo'>Limpopo</option>
                    </select>
                    {errors.province && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.province}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Cover Image
                </h4>

                <div>
                  <label
                    htmlFor='cover-upload'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Cover Image *
                  </label>
                  <div className='flex items-center space-x-4'>
                    {formData.coverImage ? (
                      <div className='relative'>
                        <img
                          src={constructFileUrl(formData.coverImage)}
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
                      <div className='w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center'>
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
                      {errors.coverImage && (
                        <p className='text-red-500 text-sm mt-1'>
                          {errors.coverImage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Configuration
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='max-tracks'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Max Tracks
                    </label>
                    <input
                      id='max-tracks'
                      type='number'
                      value={formData.maxTracks}
                      onChange={e =>
                        handleInputChange(
                          'maxTracks',
                          parseInt(e.target.value) || 20
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxTracks
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='1'
                    />
                    {errors.maxTracks && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.maxTracks}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='max-submissions'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Max Submissions per Artist
                    </label>
                    <input
                      id='max-submissions'
                      type='number'
                      value={formData.maxSubmissionsPerArtist}
                      onChange={e =>
                        handleInputChange(
                          'maxSubmissionsPerArtist',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxSubmissionsPerArtist
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='1'
                      max='10'
                    />
                    {errors.maxSubmissionsPerArtist && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.maxSubmissionsPerArtist}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Settings */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Status Settings
                </h4>

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
                        handleInputChange(
                          'status',
                          e.target.value as PlaylistStatus
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='INACTIVE'>Inactive</option>
                      <option value='ACTIVE'>Active</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='submission-status'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Submission Status
                    </label>
                    <select
                      id='submission-status'
                      value={formData.submissionStatus}
                      onChange={e =>
                        handleInputChange(
                          'submissionStatus',
                          e.target.value as SubmissionStatus
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='CLOSED'>Closed</option>
                      <option value='OPEN'>Open</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'
                >
                  {playlist ? 'Update Playlist' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
