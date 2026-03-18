'use client';

import React, { useState, useEffect } from 'react';
import { Input, Select, SelectItem } from '@heroui/react';
import { WizardFormData } from '../ArtistProfileWizard';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colorHex?: string;
}

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (_updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export default function BasicInfoStep({
  formData,
  updateFormData,
  errors,
}: BasicInfoStepProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        if (response.ok) {
          const data = await response.json();
          setGenres(data.genres || []);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setIsLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  return (
    <div className='space-y-12'>
      <div className='space-y-2'>
        <h3 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Basic Information
        </h3>
        <p className='text-sm text-gray-400 dark:text-gray-500 italic leading-relaxed'>
          Let&apos;s start with the essentials. Your artist name and genre help
          fans discover your music and understand your style.
        </p>
      </div>

      <div className='space-y-10'>
        <div className='space-y-2'>
          <Input
            label='Artist Name'
            placeholder='e.g., DJ Mzansi, Amapiano King, etc.'
            value={formData.artistName}
            onValueChange={value => updateFormData({ artistName: value })}
            isRequired
            isInvalid={!!errors.artistName}
            errorMessage={errors.artistName}
            classNames={{
              input: 'text-base',
              label: 'text-sm font-medium text-gray-900 dark:text-white',
              inputWrapper: 'border-gray-300 dark:border-slate-600',
            }}
          />
          <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
            This is how you&apos;ll appear to fans and other artists. You can
            use your real name or a stage name.
          </p>
        </div>

        <div className='space-y-2'>
          <Select
            label='Primary Genre'
            placeholder='Choose your main genre'
            selectedKeys={formData.genreId ? [formData.genreId] : []}
            onSelectionChange={keys => {
              const selected = Array.from(keys)[0] as string;
              updateFormData({ genreId: selected || '' });
            }}
            isRequired
            isInvalid={!!errors.genreId}
            errorMessage={errors.genreId}
            isLoading={isLoadingGenres}
            classNames={{
              trigger: 'text-base',
              label: 'text-sm font-medium text-gray-900 dark:text-white',
            }}
          >
            {genres.map(genre => (
              <SelectItem key={genre.id}>{genre.name}</SelectItem>
            ))}
          </Select>
          <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
            Select the genre that best represents your music. This helps us
            recommend your tracks to the right audience.
          </p>
        </div>
      </div>
    </div>
  );
}
