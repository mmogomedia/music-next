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
  Divider,
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
} from '@heroicons/react/24/outline';
import TrackProtectionSettings from './TrackProtectionSettings';
import {
  ProtectionSettings,
  DEFAULT_PROTECTION_SETTINGS,
} from '@/lib/file-protection';

interface TrackData {
  id?: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
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

const GENRES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'R&B',
  'Country',
  'Electronic',
  'Jazz',
  'Classical',
  'Blues',
  'Folk',
  'Reggae',
  'Punk',
  'Metal',
  'Funk',
  'Soul',
  'Gospel',
  'Alternative',
  'Indie',
  'Ambient',
  'Techno',
  'House',
  'Trance',
  'Dubstep',
  'Trap',
  'Drill',
  'Afrobeat',
  'Latin',
  'World',
  'Other',
];

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

  // Auto-generate unique URL when title changes
  useEffect(() => {
    if (formData.title && !track?.id) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      // In a real app, you'd check for uniqueness
      console.log('Generated URL slug:', slug);
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

          {/* Basic Information */}
          <div className='space-y-4'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              <DocumentTextIcon className='w-5 h-5' />
              Basic Information
            </h4>

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
                placeholder='Select genre'
                selectedKeys={formData.genre ? [formData.genre] : []}
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange('genre', selected || '');
                }}
              >
                {GENRES.map(genre => (
                  <SelectItem key={genre}>{genre}</SelectItem>
                ))}
              </Select>
            </div>

            <Textarea
              label='Description'
              placeholder='Describe your track...'
              value={formData.description || ''}
              onValueChange={value => handleInputChange('description', value)}
              rows={3}
            />
          </div>

          <Divider />

          {/* Advanced Metadata */}
          <div className='space-y-4'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              <CalendarIcon className='w-5 h-5' />
              Advanced Metadata
            </h4>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Input
                label='Composer'
                placeholder='Composer name'
                value={formData.composer || ''}
                onValueChange={value => handleInputChange('composer', value)}
              />

              <Input
                type='number'
                label='Year'
                placeholder='2024'
                value={formData.year?.toString() || ''}
                onValueChange={value =>
                  handleInputChange('year', value ? parseInt(value) : undefined)
                }
                isInvalid={!!errors.year}
                errorMessage={errors.year}
              />

              <Input
                type='date'
                label='Release Date'
                value={formData.releaseDate || ''}
                onValueChange={value => handleInputChange('releaseDate', value)}
              />

              <Input
                type='number'
                label='BPM'
                placeholder='120'
                value={formData.bpm?.toString() || ''}
                onValueChange={value =>
                  handleInputChange('bpm', value ? parseInt(value) : undefined)
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

          <Divider />

          {/* Privacy & Access Control */}
          <div className='space-y-4'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              <ShieldCheckIcon className='w-5 h-5' />
              Privacy & Access Control
            </h4>

            <div className='space-y-4'>
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
                  onValueChange={value => handleInputChange('isPublic', value)}
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
          </div>

          <Divider />

          {/* Copyright & Protection */}
          <div className='space-y-4'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              <DocumentTextIcon className='w-5 h-5' />
              Copyright & Protection
            </h4>

            <div className='space-y-4'>
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
          </div>

          <Divider />

          {/* Advanced Protection Settings */}
          <div className='space-y-4'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              <ShieldCheckIcon className='w-5 h-5' />
              Advanced Protection Settings
            </h4>
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
              isLoading={isSubmitting || isLoading}
              disabled={!formData.title.trim()}
            >
              {mode === 'create' ? 'Create Track' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
