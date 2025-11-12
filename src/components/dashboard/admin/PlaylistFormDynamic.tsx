'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  Bars3Icon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  Playlist,
  PlaylistTypeDefinition,
} from '@/types/dynamic-playlist-types';
import { PlaylistStatus, SubmissionStatus } from '@/types/playlist';
import { Track } from '@/types/track';
import { constructFileUrl } from '@/lib/url-utils';
import { uploadImageToR2 } from '@/lib/image-upload';
import { api } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';

interface PlaylistFormDynamicProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (_playlist: Partial<Playlist>) => void;
  playlist?: Playlist | null;
}

type TabType = 'details' | 'tracks';

export default function PlaylistFormDynamic({
  isOpen,
  onClose,
  onSave,
  playlist,
}: PlaylistFormDynamicProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [trackSearch, setTrackSearch] = useState('');
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const { showToast } = useToast();

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
        fetchPlaylistTracks(playlist.id);
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
        setTracks([]);
      }
      setErrors({});
      setActiveTab('details');
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

  const fetchPlaylistTracks = async (playlistId: string) => {
    try {
      setIsLoadingTracks(true);
      const response = await api.playlists.getTracks(playlistId);
      const playlistTracks = response.data.tracks || [];
      // Sort by order if available
      setTracks(playlistTracks);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      setTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const fetchAllTracks = async (searchQuery: string = '') => {
    try {
      const response = await api.adminTracks.getAll();
      // API returns { success: true, data: { tracks: [...], total: ... } }
      // The apiClient returns { data: <server response>, success, status }
      // So response.data is { success: true, data: { tracks: [...] } }
      let allTracksData = response.data?.data?.tracks || [];

      if (!Array.isArray(allTracksData)) {
        console.error('Unexpected tracks data format:', {
          responseData: response.data,
          tracksData: allTracksData,
        });
        setAllTracks([]);
        return;
      }

      // Apply search filter if query provided
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        allTracksData = allTracksData.filter(
          (track: Track) =>
            track.title?.toLowerCase().includes(query) ||
            track.artist?.toLowerCase().includes(query) ||
            track.genre?.toLowerCase().includes(query)
        );
      }

      // Filter out tracks already in playlist
      const currentTrackIds = new Set(tracks.map(t => t.id));
      const filteredTracks = allTracksData.filter(
        (t: Track) => !currentTrackIds.has(t.id)
      );

      setAllTracks(filteredTracks);
    } catch (error) {
      console.error('Error fetching all tracks:', error);
      setAllTracks([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracks') {
      const searchTerm = trackSearch.trim();
      if (searchTerm) {
        // Debounce search queries
        const debounce = setTimeout(() => {
          fetchAllTracks(searchTerm);
        }, 300);
        return () => clearTimeout(debounce);
      } else {
        // Load all tracks immediately when no search query
        fetchAllTracks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, trackSearch]);

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

    const selectedType = playlistTypes.find(
      t => t.id === formData.playlistTypeId
    );
    if (selectedType?.requiresProvince && !formData.province) {
      newErrors.province = 'Province is required for this playlist type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setActiveTab('details');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

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

  const handleAddTrack = async (trackId: string) => {
    if (!playlist?.id) return;

    setAddingTrackId(trackId);
    try {
      await api.admin.addTracksToPlaylist(playlist.id, [trackId]);

      // Find track name for toast
      const trackToAdd = allTracks.find(t => t.id === trackId);
      const trackName = trackToAdd?.title || 'Track';

      // Update playlist tracks
      await fetchPlaylistTracks(playlist.id);

      // Immediately remove from search list
      setAllTracks(prev => prev.filter(t => t.id !== trackId));

      showToast(`${trackName} added to playlist`, 'success');
    } catch (error) {
      console.error('Error adding track:', error);
      showToast('Failed to add track to playlist', 'error');
    } finally {
      setAddingTrackId(null);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist?.id) return;

    const trackToRemove = tracks.find(t => t.id === trackId);
    const trackName = trackToRemove?.title || 'Track';

    try {
      await api.admin.removeTracksFromPlaylist(playlist.id, [trackId]);
      await fetchPlaylistTracks(playlist.id);

      // Refetch available tracks to add it back to search
      fetchAllTracks(trackSearch);

      showToast(`${trackName} removed from playlist`, 'success');
    } catch (error) {
      console.error('Error removing track:', error);
      showToast('Failed to remove track from playlist', 'error');
    }
  };

  const handleMoveTrack = async (trackId: string, direction: 'up' | 'down') => {
    if (!playlist?.id) return;

    const currentIndex = tracks.findIndex(t => t.id === trackId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === tracks.length - 1)
    ) {
      return;
    }

    setReordering(true);
    const newTracks = [...tracks];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newTracks[currentIndex], newTracks[newIndex]] = [
      newTracks[newIndex],
      newTracks[currentIndex],
    ];

    setTracks(newTracks);

    try {
      await api.admin.reorderPlaylistTracks(
        playlist.id,
        newTracks.map(t => t.id)
      );
      showToast('Playlist order updated', 'success');
    } catch (error) {
      console.error('Error reordering tracks:', error);
      // Revert on error
      await fetchPlaylistTracks(playlist.id);
      showToast('Failed to reorder tracks', 'error');
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!playlist?.id) return;

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex || dragIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setReordering(true);
    const newTracks = [...tracks];
    const [removed] = newTracks.splice(dragIndex, 1);
    newTracks.splice(dropIndex, 0, removed);

    setTracks(newTracks);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await api.admin.reorderPlaylistTracks(
        playlist.id,
        newTracks.map(t => t.id)
      );
      showToast('Playlist order updated', 'success');
    } catch (error) {
      console.error('Error reordering tracks:', error);
      await fetchPlaylistTracks(playlist.id);
      showToast('Failed to reorder tracks', 'error');
    } finally {
      setReordering(false);
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

        <div className='relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
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

          {/* Tabs */}
          {playlist && (
            <div className='flex border-b border-gray-200 dark:border-slate-700'>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('tracks')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'tracks'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Tracks ({tracks.length}/{formData.maxTracks})
              </button>
            </div>
          )}

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            {activeTab === 'details' ? (
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Basic Info - Compact Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='playlist-name'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Name *
                    </label>
                    <input
                      id='playlist-name'
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder='Playlist name'
                    />
                    {errors.name && (
                      <p className='text-red-500 text-xs mt-1'>{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='playlist-type'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Type *
                    </label>
                    <select
                      id='playlist-type'
                      value={formData.playlistTypeId}
                      onChange={e =>
                        handleInputChange('playlistTypeId', e.target.value)
                      }
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                        errors.playlistTypeId
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      <option value=''>Select type</option>
                      {playlistTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.icon && `${type.icon} `}
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.playlistTypeId && (
                      <p className='text-red-500 text-xs mt-1'>
                        {errors.playlistTypeId}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='playlist-description'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                  >
                    Description
                  </label>
                  <textarea
                    id='playlist-description'
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={2}
                    className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    placeholder='Brief description'
                  />
                </div>

                {/* Cover Image - Compact */}
                <div>
                  <label
                    htmlFor='cover-upload'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                  >
                    Cover Image *
                  </label>
                  <div className='flex items-center gap-3'>
                    {formData.coverImage ? (
                      <div className='relative w-16 h-16 rounded-lg overflow-hidden'>
                        <Image
                          src={constructFileUrl(formData.coverImage)}
                          alt='Cover'
                          fill
                          className='object-cover'
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setFormData(prev => ({ ...prev, coverImage: '' }))
                          }
                          className='absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600'
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className='w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center'>
                        <PhotoIcon className='w-6 h-6 text-gray-400' />
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
                        className='cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-lg font-medium transition-colors'
                      >
                        Upload
                      </label>
                      {errors.coverImage && (
                        <p className='text-red-500 text-xs mt-1'>
                          {errors.coverImage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Config - Compact Grid */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div>
                    <label
                      htmlFor='max-tracks'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
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
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                        errors.maxTracks
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='1'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='max-submissions'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Max Submissions
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
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                        errors.maxSubmissionsPerArtist
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      min='1'
                      max='10'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='playlist-status'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Status
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
                      className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='INACTIVE'>Inactive</option>
                      <option value='ACTIVE'>Active</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='submission-status'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Submissions
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
                      className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='CLOSED'>Closed</option>
                      <option value='OPEN'>Open</option>
                    </select>
                  </div>
                </div>

                {/* Province - if required */}
                {selectedType?.requiresProvince && (
                  <div>
                    <label
                      htmlFor='playlist-province'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
                    >
                      Province *
                    </label>
                    <select
                      id='playlist-province'
                      value={formData.province}
                      onChange={e =>
                        handleInputChange('province', e.target.value)
                      }
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
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
                      <p className='text-red-500 text-xs mt-1'>
                        {errors.province}
                      </p>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <div className='space-y-4'>
                {/* Track List */}
                <div>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                    Playlist Tracks ({tracks.length}/{formData.maxTracks})
                  </h4>
                  {isLoadingTracks ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className='text-center py-8 text-gray-500 dark:text-gray-400 text-sm'>
                      No tracks in playlist
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {tracks.map((track, index) => (
                        <div
                          key={track.id}
                          draggable={!reordering}
                          onDragStart={e => handleDragStart(e, index)}
                          onDragOver={e => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                          onDrop={e => handleDrop(e, index)}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                            draggedIndex === index
                              ? 'opacity-50 bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-500 border-dashed'
                              : dragOverIndex === index
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 border-dashed'
                                : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'
                          } ${reordering ? 'cursor-wait' : 'cursor-move'}`}
                        >
                          <Bars3Icon
                            className={`w-5 h-5 flex-shrink-0 ${
                              draggedIndex === index
                                ? 'text-blue-500'
                                : 'text-gray-400'
                            }`}
                          />
                          <div className='relative w-12 h-12 rounded overflow-hidden flex-shrink-0'>
                            {track.coverImageUrl ? (
                              <Image
                                src={constructFileUrl(track.coverImageUrl)}
                                alt={track.title}
                                fill
                                className='object-cover'
                              />
                            ) : (
                              <div className='w-full h-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center'>
                                <PhotoIcon className='w-6 h-6 text-gray-400' />
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm text-gray-900 dark:text-white truncate'>
                              {track.title}
                            </div>
                            <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                              {track.artist || 'Unknown Artist'}
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <button
                              onClick={() => handleMoveTrack(track.id, 'up')}
                              disabled={index === 0 || reordering}
                              className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              title='Move up'
                            >
                              <ArrowUpIcon className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleMoveTrack(track.id, 'down')}
                              disabled={
                                index === tracks.length - 1 || reordering
                              }
                              className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              title='Move down'
                            >
                              <ArrowDownIcon className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleRemoveTrack(track.id)}
                              disabled={reordering}
                              className='p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              title='Remove'
                            >
                              <TrashIcon className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Tracks */}
                {tracks.length < formData.maxTracks && (
                  <div>
                    <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                      Add Tracks
                    </h4>
                    <div className='mb-3'>
                      <div className='relative'>
                        <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <input
                          type='text'
                          value={trackSearch}
                          onChange={e => setTrackSearch(e.target.value)}
                          placeholder='Search tracks...'
                          className='w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    </div>
                    <div className='max-h-64 overflow-y-auto space-y-2'>
                      {allTracks.length === 0 ? (
                        <div className='text-center py-4 text-gray-500 dark:text-gray-400 text-sm'>
                          {trackSearch
                            ? 'No tracks found'
                            : 'Search for tracks to add'}
                        </div>
                      ) : (
                        allTracks.slice(0, 20).map(track => {
                          const isAdding = addingTrackId === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                                isAdding
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                                  : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <div className='relative w-10 h-10 rounded overflow-hidden flex-shrink-0'>
                                {track.coverImageUrl ? (
                                  <Image
                                    src={constructFileUrl(track.coverImageUrl)}
                                    alt={track.title}
                                    fill
                                    className='object-cover'
                                  />
                                ) : (
                                  <div className='w-full h-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center'>
                                    <PhotoIcon className='w-5 h-5 text-gray-400' />
                                  </div>
                                )}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='font-medium text-sm text-gray-900 dark:text-white truncate'>
                                  {track.title}
                                </div>
                                <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                  {track.artist || 'Unknown Artist'}
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddTrack(track.id)}
                                disabled={isAdding}
                                className={`p-1.5 transition-all duration-200 ${
                                  isAdding
                                    ? 'text-blue-500 cursor-wait'
                                    : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                } disabled:opacity-50`}
                                title={
                                  isAdding ? 'Adding...' : 'Add to playlist'
                                }
                              >
                                {isAdding ? (
                                  <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                                ) : (
                                  <PlusIcon className='w-4 h-4' />
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors'
            >
              Cancel
            </button>
            {activeTab === 'details' && (
              <button
                type='submit'
                onClick={handleSubmit}
                disabled={isSaving}
                className='px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSaving
                  ? 'Saving...'
                  : playlist
                    ? 'Update Playlist'
                    : 'Create Playlist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
