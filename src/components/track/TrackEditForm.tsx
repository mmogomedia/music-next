'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  MusicalNoteIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import TrackProtectionSettings from './TrackProtectionSettings';
import {
  ProtectionSettings,
  DEFAULT_PROTECTION_SETTINGS,
} from '@/lib/file-protection';
import ImageUpload from '@/components/ui/ImageUpload';
import { constructFileUrl } from '@/lib/url-utils';
import { uploadImageToR2 } from '@/lib/image-upload';
interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colorHex?: string;
}

interface TrackData {
  id?: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string; // Legacy field, kept for backward compatibility
  genreId?: string; // New field linking to Genre model
  composer?: string;
  year?: number;
  releaseDate?: string;
  bpm?: number;
  isrc?: string;
  description?: string;
  lyrics?: string;
  isPublic: boolean;
  isDownloadable: boolean;
  isExplicit: boolean;
  copyrightInfo?: string;
  licenseType?: string;
  distributionRights?: string;
  albumArtwork?: string;
  protectionSettings?: ProtectionSettings;
}

interface TrackEditFormProps {
  track?: TrackData;
  onSave: (_trackData: TrackData) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

// Using South African genres from shared file

const LICENSE_TYPES = [
  'All Rights Reserved',
  'Creative Commons BY',
  'Creative Commons BY-SA',
  'Creative Commons BY-NC',
  'Creative Commons BY-NC-SA',
  'Creative Commons BY-ND',
  'Creative Commons BY-NC-ND',
  'Public Domain',
];

export default function TrackEditForm({
  track,
  onSave,
  onCancel,
  isLoading = false,
  mode = 'edit',
}: TrackEditFormProps) {
  const [formData, setFormData] = useState<TrackData>({
    title: '',
    artist: '',
    album: '',
    genre: '',
    genreId: undefined,
    composer: '',
    year: new Date().getFullYear(),
    releaseDate: '',
    bpm: undefined,
    isrc: '',
    description: '',
    lyrics: '',
    isPublic: true,
    isDownloadable: false,
    isExplicit: false,
    copyrightInfo: '',
    licenseType: 'All Rights Reserved',
    distributionRights: '',
    albumArtwork: '',
    protectionSettings: DEFAULT_PROTECTION_SETTINGS,
    ...track,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoadingGenres(true);
        const response = await fetch('/api/genres');
        if (response.ok) {
          const data = await response.json();
          setGenres(data.genres || []);
        } else {
          console.error('Failed to fetch genres');
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Auto-generate unique URL when title changes
  useEffect(() => {
    if (formData.title && !track?.id) {
      // In a real app, you'd generate and check for uniqueness
      // const slug = formData.title
      //   .toLowerCase()
      //   .replace(/[^a-z0-9\s-]/g, '')
      //   .replace(/\s+/g, '-')
      //   .replace(/-+/g, '-')
      //   .trim();
    }
  }, [formData.title, track?.id]);

  const handleInputChange = (field: keyof TrackData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-set isDownloadable to false when isPublic is false
    if (field === 'isPublic' && !value) {
      setFormData(prev => ({ ...prev, isDownloadable: false }));
    }
  };

  const handleArtworkUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, albumArtwork: '' }));
      return;
    }

    setIsUploadingArtwork(true);
    setErrors(prev => ({ ...prev, artwork: '' }));

    try {
      const key = await uploadImageToR2(file);
      setFormData(prev => ({ ...prev, albumArtwork: key }));
    } catch (error) {
      console.error('Artwork upload error:', error);
      setErrors(prev => ({
        ...prev,
        artwork:
          error instanceof Error ? error.message : 'Failed to upload artwork',
      }));
    } finally {
      setIsUploadingArtwork(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (
      formData.year &&
      (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)
    ) {
      newErrors.year = 'Please enter a valid year';
    }

    if (formData.bpm && (formData.bpm < 60 || formData.bpm > 200)) {
      newErrors.bpm = 'BPM should be between 60 and 200';
    }

    if (formData.isrc && !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(formData.isrc)) {
      newErrors.isrc =
        'ISRC format: 2 letters, 3 alphanumeric, 7 digits (e.g., USRC17607839)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSave(formData);
      if (!success) {
        setErrors({ submit: 'Failed to save track. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Header */}
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              {mode === 'create' ? 'Track Details' : 'Edit Track'}
            </h3>
          </div>

          {/* Tabs */}
          <Tabs aria-label='Track edit tabs' className='w-full'>
            {/* Basic Information Tab */}
            <Tab
              key='basic'
              title={
                <div className='flex items-center gap-2'>
                  <DocumentTextIcon className='w-4 h-4' />
                  <span>Basic Info</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Input
                    label='Title *'
                    placeholder='Enter track title'
                    value={formData.title}
                    onValueChange={value => handleInputChange('title', value)}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    isRequired
                  />

                  <Input
                    label='Artist'
                    placeholder='Artist name'
                    value={formData.artist || ''}
                    onValueChange={value => handleInputChange('artist', value)}
                  />

                  <Input
                    label='Album'
                    placeholder='Album name'
                    value={formData.album || ''}
                    onValueChange={value => handleInputChange('album', value)}
                  />

                  <Select
                    label='Genre'
                    placeholder={
                      loadingGenres ? 'Loading genres...' : 'Select genre'
                    }
                    selectedKeys={formData.genreId ? [formData.genreId] : []}
                    onSelectionChange={keys => {
                      const selectedId = Array.from(keys)[0] as string;
                      const selectedGenre = genres.find(
                        g => g.id === selectedId
                      );
                      handleInputChange('genreId', selectedId || undefined);
                      // Also update genre string for backward compatibility
                      handleInputChange('genre', selectedGenre?.name || '');
                    }}
                    isLoading={loadingGenres}
                    disabled={loadingGenres}
                  >
                    {genres.map(genre => (
                      <SelectItem key={genre.id}>{genre.name}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label='Description'
                  placeholder='Describe your track...'
                  value={formData.description || ''}
                  onValueChange={value =>
                    handleInputChange('description', value)
                  }
                  rows={3}
                />
              </div>
            </Tab>

            {/* Artwork Tab */}
            <Tab
              key='artwork'
              title={
                <div className='flex items-center gap-2'>
                  <PhotoIcon className='w-4 h-4' />
                  <span>Artwork</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Upload artwork for your track. Recommended size: 1000x1000px
                  or larger.
                </p>

                <ImageUpload
                  label='Album Artwork'
                  preview={
                    formData.albumArtwork
                      ? constructFileUrl(formData.albumArtwork)
                      : undefined
                  }
                  onImageChange={handleArtworkUpload}
                  onError={error =>
                    setErrors(prev => ({ ...prev, artwork: error }))
                  }
                  disabled={isUploadingArtwork || isSubmitting}
                  aspectRatio={1}
                  minWidth={500}
                  minHeight={500}
                  maxWidth={2000}
                  maxHeight={2000}
                  maxFileSize={5}
                  previewSize='lg'
                  showCropButton={true}
                  showRemoveButton={true}
                />

                {errors.artwork && (
                  <p className='text-sm text-red-600 dark:text-red-400'>
                    {errors.artwork}
                  </p>
                )}
              </div>
            </Tab>

            {/* Metadata Tab */}
            <Tab
              key='metadata'
              title={
                <div className='flex items-center gap-2'>
                  <CalendarIcon className='w-4 h-4' />
                  <span>Metadata</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <Input
                    label='Composer'
                    placeholder='Composer name'
                    value={formData.composer || ''}
                    onValueChange={value =>
                      handleInputChange('composer', value)
                    }
                  />

                  <Input
                    type='number'
                    label='Year'
                    placeholder='2024'
                    value={formData.year?.toString() || ''}
                    onValueChange={value =>
                      handleInputChange(
                        'year',
                        value ? parseInt(value) : undefined
                      )
                    }
                    isInvalid={!!errors.year}
                    errorMessage={errors.year}
                  />

                  <Input
                    type='date'
                    label='Release Date'
                    value={formData.releaseDate || ''}
                    onValueChange={value =>
                      handleInputChange('releaseDate', value)
                    }
                  />

                  <Input
                    type='number'
                    label='BPM'
                    placeholder='120'
                    value={formData.bpm?.toString() || ''}
                    onValueChange={value =>
                      handleInputChange(
                        'bpm',
                        value ? parseInt(value) : undefined
                      )
                    }
                    isInvalid={!!errors.bpm}
                    errorMessage={errors.bpm}
                  />

                  <Input
                    label='ISRC'
                    placeholder='USRC17607839'
                    value={formData.isrc || ''}
                    onValueChange={value => handleInputChange('isrc', value)}
                    isInvalid={!!errors.isrc}
                    errorMessage={errors.isrc}
                    description='International Standard Recording Code'
                  />
                </div>

                <Textarea
                  label='Lyrics'
                  placeholder='Enter song lyrics...'
                  value={formData.lyrics || ''}
                  onValueChange={value => handleInputChange('lyrics', value)}
                  rows={6}
                />
              </div>
            </Tab>

            {/* Privacy Tab */}
            <Tab
              key='privacy'
              title={
                <div className='flex items-center gap-2'>
                  <ShieldCheckIcon className='w-4 h-4' />
                  <span>Privacy</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    {formData.isPublic ? (
                      <EyeIcon className='w-5 h-5 text-green-600' />
                    ) : (
                      <EyeSlashIcon className='w-5 h-5 text-gray-400' />
                    )}
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        Public Track
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {formData.isPublic
                          ? 'Visible to everyone'
                          : 'Only visible to you'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    isSelected={formData.isPublic}
                    onValueChange={value =>
                      handleInputChange('isPublic', value)
                    }
                  />
                </div>

                <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <ArrowDownTrayIcon className='w-5 h-5 text-blue-600' />
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        Allow Downloads
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {formData.isDownloadable
                          ? 'Users can download this track'
                          : 'Download disabled'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    isSelected={formData.isDownloadable}
                    onValueChange={value =>
                      handleInputChange('isDownloadable', value)
                    }
                    isDisabled={!formData.isPublic}
                  />
                </div>

                <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <ExclamationTriangleIcon className='w-5 h-5 text-orange-600' />
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        Explicit Content
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Mark if this track contains explicit content
                      </p>
                    </div>
                  </div>
                  <Switch
                    isSelected={formData.isExplicit}
                    onValueChange={value =>
                      handleInputChange('isExplicit', value)
                    }
                  />
                </div>
              </div>
            </Tab>

            {/* Copyright Tab */}
            <Tab
              key='copyright'
              title={
                <div className='flex items-center gap-2'>
                  <DocumentTextIcon className='w-4 h-4' />
                  <span>Copyright</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <Select
                  label='License Type'
                  placeholder='Select license type'
                  selectedKeys={
                    formData.licenseType ? [formData.licenseType] : []
                  }
                  onSelectionChange={keys => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange('licenseType', selected || '');
                  }}
                >
                  {LICENSE_TYPES.map(license => (
                    <SelectItem key={license}>{license}</SelectItem>
                  ))}
                </Select>

                <Textarea
                  label='Copyright Information'
                  placeholder='© 2024 Artist Name. All rights reserved.'
                  value={formData.copyrightInfo || ''}
                  onValueChange={value =>
                    handleInputChange('copyrightInfo', value)
                  }
                  rows={2}
                />

                <Textarea
                  label='Distribution Rights'
                  placeholder='Describe distribution rights and restrictions...'
                  value={formData.distributionRights || ''}
                  onValueChange={value =>
                    handleInputChange('distributionRights', value)
                  }
                  rows={3}
                />
              </div>
            </Tab>

            {/* Protection Tab */}
            <Tab
              key='protection'
              title={
                <div className='flex items-center gap-2'>
                  <ShieldCheckIcon className='w-4 h-4' />
                  <span>Protection</span>
                </div>
              }
            >
              <div className='space-y-4 pt-4'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Configure advanced file protection and access controls
                </p>

                <TrackProtectionSettings
                  settings={
                    formData.protectionSettings || DEFAULT_PROTECTION_SETTINGS
                  }
                  onSettingsChange={settings =>
                    handleInputChange('protectionSettings', settings)
                  }
                />
              </div>
            </Tab>
          </Tabs>

          {/* Error Message */}
          {errors.submit && (
            <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-red-600 dark:text-red-400 text-sm'>
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 justify-end pt-4'>
            <Button variant='light' onPress={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type='submit'
              color='primary'
              isLoading={isSubmitting || isLoading || isUploadingArtwork}
              disabled={!formData.title.trim() || isUploadingArtwork}
            >
              {isUploadingArtwork
                ? 'Uploading Artwork...'
                : mode === 'create'
                  ? 'Create Track'
                  : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
