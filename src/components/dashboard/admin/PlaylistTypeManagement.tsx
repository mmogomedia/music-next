'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  PlaylistTypeDefinition,
  CreatePlaylistTypeDefinitionData,
  UpdatePlaylistTypeDefinitionData,
} from '@/types/dynamic-playlist-types';
import PlaylistTypeForm from './PlaylistTypeForm';

interface PlaylistTypeManagementProps {
  onClose?: () => void;
}

export default function PlaylistTypeManagement({
  onClose: _onClose,
}: PlaylistTypeManagementProps) {
  const [playlistTypes, setPlaylistTypes] = useState<PlaylistTypeDefinition[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] =
    useState<PlaylistTypeDefinition | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPlaylistTypes();
  }, []);

  const fetchPlaylistTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/playlist-types');
      if (response.ok) {
        const data = await response.json();
        setPlaylistTypes(data.playlistTypes || []);
      }
    } catch (error) {
      console.error('Error fetching playlist types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async (
    typeData: CreatePlaylistTypeDefinitionData
  ) => {
    try {
      const response = await fetch('/api/admin/playlist-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeData),
      });

      if (response.ok) {
        await fetchPlaylistTypes();
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Error creating playlist type:', error);
    }
  };

  const handleUpdateType = async (
    id: string,
    typeData: UpdatePlaylistTypeDefinitionData
  ) => {
    try {
      const response = await fetch(`/api/admin/playlist-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeData),
      });

      if (response.ok) {
        await fetchPlaylistTypes();
        setIsFormOpen(false);
        setIsEditing(false);
        setSelectedType(null);
      }
    } catch (error) {
      console.error('Error updating playlist type:', error);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this playlist type? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/playlist-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPlaylistTypes();
      }
    } catch (error) {
      console.error('Error deleting playlist type:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/playlist-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchPlaylistTypes();
      }
    } catch (error) {
      console.error('Error toggling playlist type status:', error);
    }
  };

  const handleReorder = async (_id: string, _direction: 'up' | 'down') => {
    // Implementation for reordering playlist types
    // This would involve updating displayOrder values
  };

  const filteredTypes = playlistTypes.filter(type => {
    if (filter === 'active') return type.isActive;
    if (filter === 'inactive') return !type.isActive;
    return true;
  });

  const sortedTypes = [...filteredTypes].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Playlist Types
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Manage dynamic playlist types and their properties
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setSelectedType(null);
            setIsFormOpen(true);
          }}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'
        >
          <PlusIcon className='w-5 h-5' />
          Add Type
        </button>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <label
            htmlFor='filter-select'
            className='text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Filter:
          </label>
          <select
            id='filter-select'
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>All Types</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
      </div>

      {/* Playlist Types Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {sortedTypes.map(type => (
          <div
            key={type.id}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${
              type.isActive
                ? 'border-gray-200 dark:border-slate-700'
                : 'border-gray-300 dark:border-slate-600 opacity-75'
            } overflow-hidden hover:shadow-lg transition-all duration-200`}
          >
            {/* Header */}
            <div className='p-4 border-b border-gray-200 dark:border-slate-700'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  {type.icon && <span className='text-2xl'>{type.icon}</span>}
                  <div>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                      {type.name}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {type.slug}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => handleToggleActive(type.id, type.isActive)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      type.isActive
                        ? 'text-green-600 hover:text-green-700 dark:text-green-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={type.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {type.isActive ? (
                      <EyeIcon className='w-4 h-4' />
                    ) : (
                      <EyeSlashIcon className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='p-4 space-y-3'>
              {type.description && (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {type.description}
                </p>
              )}

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Max Instances:
                  </span>
                  <span className='ml-2 font-medium text-gray-900 dark:text-white'>
                    {type.maxInstances === -1 ? 'Unlimited' : type.maxInstances}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Default Tracks:
                  </span>
                  <span className='ml-2 font-medium text-gray-900 dark:text-white'>
                    {type.defaultMaxTracks}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Requires Province:
                  </span>
                  <span className='ml-2 font-medium text-gray-900 dark:text-white'>
                    {type.requiresProvince ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Display Order:
                  </span>
                  <span className='ml-2 font-medium text-gray-900 dark:text-white'>
                    {type.displayOrder}
                  </span>
                </div>
              </div>

              {type.color && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    Color:
                  </span>
                  <div
                    className='w-6 h-6 rounded-full border border-gray-300 dark:border-slate-600'
                    style={{ backgroundColor: type.color }}
                  />
                  <span className='text-sm font-mono text-gray-600 dark:text-gray-400'>
                    {type.color}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => handleReorder(type.id, 'up')}
                    className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
                    title='Move up'
                  >
                    <ArrowUpIcon className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleReorder(type.id, 'down')}
                    className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
                    title='Move down'
                  >
                    <ArrowDownIcon className='w-4 h-4' />
                  </button>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => {
                      setSelectedType(type);
                      setIsEditing(true);
                      setIsFormOpen(true);
                    }}
                    className='p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors'
                    title='Edit'
                  >
                    <PencilIcon className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className='p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors'
                    title='Delete'
                  >
                    <TrashIcon className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedTypes.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-4xl'>🎵</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            No playlist types found
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            {filter === 'all'
              ? 'Create your first playlist type to get started.'
              : `No ${filter} playlist types found.`}
          </p>
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedType(null);
              setIsFormOpen(true);
            }}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'
          >
            Add First Type
          </button>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <PlaylistTypeForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditing(false);
            setSelectedType(null);
          }}
          onSave={
            isEditing && selectedType
              ? (
                  data:
                    | CreatePlaylistTypeDefinitionData
                    | UpdatePlaylistTypeDefinitionData
                ) =>
                  handleUpdateType(
                    selectedType.id,
                    data as UpdatePlaylistTypeDefinitionData
                  )
              : (
                  data:
                    | CreatePlaylistTypeDefinitionData
                    | UpdatePlaylistTypeDefinitionData
                ) => handleCreateType(data as CreatePlaylistTypeDefinitionData)
          }
          playlistType={selectedType}
          isEditing={isEditing}
        />
      )}
    </div>
  );
}
