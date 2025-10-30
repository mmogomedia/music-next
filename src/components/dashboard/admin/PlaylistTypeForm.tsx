'use client';

import { useState, useEffect, FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  PlaylistTypeDefinition,
  CreatePlaylistTypeDefinitionData,
  UpdatePlaylistTypeDefinitionData,
} from '@/types/dynamic-playlist-types';

interface PlaylistTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    _data: CreatePlaylistTypeDefinitionData | UpdatePlaylistTypeDefinitionData
  ) => void;
  playlistType?: PlaylistTypeDefinition | null;
  isEditing?: boolean;
}

export default function PlaylistTypeForm({
  isOpen,
  onClose,
  onSave,
  playlistType,
  isEditing = false,
}: PlaylistTypeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    maxInstances: -1,
    requiresProvince: false,
    defaultMaxTracks: 20,
    displayOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (playlistType && isEditing) {
      setFormData({
        name: playlistType.name,
        slug: playlistType.slug,
        description: playlistType.description || '',
        icon: playlistType.icon || '',
        color: playlistType.color || '#3B82F6',
        maxInstances: playlistType.maxInstances,
        requiresProvince: playlistType.requiresProvince,
        defaultMaxTracks: playlistType.defaultMaxTracks,
        displayOrder: playlistType.displayOrder,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3B82F6',
        maxInstances: -1,
        requiresProvince: false,
        defaultMaxTracks: 20,
        displayOrder: 0,
      });
    }
    setErrors({});
  }, [playlistType, isEditing, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (formData.maxInstances < -1) {
      newErrors.maxInstances =
        'Max instances must be -1 (unlimited) or a positive number';
    }

    if (formData.defaultMaxTracks < 1) {
      newErrors.defaultMaxTracks = 'Default max tracks must be at least 1';
    }

    if (formData.displayOrder < 0) {
      newErrors.displayOrder = 'Display order must be 0 or greater';
    }

    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Color must be a valid hex color (e.g., #3B82F6)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name' && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const predefinedColors = [
    '#3B82F6',
    '#8B5CF6',
    '#F59E0B',
    '#10B981',
    '#EF4444',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
    '#F97316',
    '#84CC16',
  ];

  const predefinedIcons = [
    '🎵',
    '🏆',
    '📊',
    '🏙️',
    '⭐',
    '🔥',
    '💎',
    '🎪',
    '🌍',
    '🎭',
    '🎨',
    '🎸',
    '🎹',
    '🎤',
    '🎧',
    '🎼',
    '🎺',
    '🎻',
    '🥁',
    '🎲',
  ];

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

        <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
          <div className='p-6'>
            {/* Header */}
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                {isEditing ? 'Edit Playlist Type' : 'Create Playlist Type'}
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
                      htmlFor='type-name'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Name *
                    </label>
                    <input
                      id='type-name'
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder='e.g., Genre, Featured, Top Ten'
                    />
                    {errors.name && (
                      <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='type-slug'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Slug *
                    </label>
                    <input
                      id='type-slug'
                      type='text'
                      value={formData.slug}
                      onChange={e => handleInputChange('slug', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.slug
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder='e.g., genre, featured, top-ten'
                      disabled={isEditing}
                    />
                    {errors.slug && (
                      <p className='text-red-500 text-sm mt-1'>{errors.slug}</p>
                    )}
                    <p className='text-gray-500 text-xs mt-1'>
                      {isEditing
                        ? 'Slug cannot be changed after creation'
                        : 'URL-friendly identifier'}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='type-description'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Description
                  </label>
                  <textarea
                    id='type-description'
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Brief description of this playlist type...'
                  />
                </div>
              </div>

              {/* Visual Properties */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white'>
                  Visual Properties
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Icon
                    </label>
                    <div className='grid grid-cols-10 gap-2 mb-3'>
                      {predefinedIcons.map(icon => (
                        <button
                          key={icon}
                          type='button'
                          onClick={() => handleInputChange('icon', icon)}
                          className={`w-10 h-10 text-xl border-2 rounded-lg flex items-center justify-center transition-colors ${
                            formData.icon === icon
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type='text'
                      value={formData.icon}
                      onChange={e => handleInputChange('icon', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Or enter custom emoji/icon'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Color
                    </label>
                    <div className='grid grid-cols-5 gap-2 mb-3'>
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          type='button'
                          onClick={() => handleInputChange('color', color)}
                          className={`w-8 h-8 border-2 rounded-lg transition-colors ${
                            formData.color === color
                              ? 'border-gray-900 dark:border-white scale-110'
                              : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type='color'
                      value={formData.color}
                      onChange={e => handleInputChange('color', e.target.value)}
                      className='w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer'
                    />
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
                      htmlFor='max-instances'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Max Instances
                    </label>
                    <input
                      id='max-instances'
                      type='number'
                      value={formData.maxInstances}
                      onChange={e =>
                        handleInputChange(
                          'maxInstances',
                          parseInt(e.target.value) || -1
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.maxInstances
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder='-1 for unlimited'
                    />
                    {errors.maxInstances && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.maxInstances}
                      </p>
                    )}
                    <p className='text-gray-500 text-xs mt-1'>
                      -1 = unlimited, 1 = single instance (e.g., Featured)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor='default-max-tracks'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Default Max Tracks
                    </label>
                    <input
                      id='default-max-tracks'
                      type='number'
                      value={formData.defaultMaxTracks}
                      onChange={e =>
                        handleInputChange(
                          'defaultMaxTracks',
                          parseInt(e.target.value) || 20
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.defaultMaxTracks
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='1'
                    />
                    {errors.defaultMaxTracks && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.defaultMaxTracks}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='display-order'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Display Order
                    </label>
                    <input
                      id='display-order'
                      type='number'
                      value={formData.displayOrder}
                      onChange={e =>
                        handleInputChange(
                          'displayOrder',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.displayOrder
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='0'
                    />
                    {errors.displayOrder && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.displayOrder}
                      </p>
                    )}
                  </div>

                  <div className='flex items-center'>
                    <input
                      id='requires-province'
                      type='checkbox'
                      checked={formData.requiresProvince}
                      onChange={e =>
                        handleInputChange('requiresProvince', e.target.checked)
                      }
                      className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                    />
                    <label
                      htmlFor='requires-province'
                      className='ml-2 text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                      Requires Province
                    </label>
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
                  {isEditing ? 'Update Type' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
