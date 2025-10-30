'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectItem } from '@heroui/react';
import MiniPlayer from '@/components/music/MiniPlayer';

interface ChatTopBarProps {
  province?: string;
  genre?: string;
  onProvinceChange?: (_value: string) => void;
  onGenreChange?: (_value: string) => void;
}

const provinces = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Free State',
];

const genres = [
  'Amapiano',
  'Afrobeat',
  'Hip-Hop',
  'House',
  'Gqom',
  'Pop',
  'R&B',
  'Jazz',
];

export default function ChatTopBar({
  province,
  genre,
  onProvinceChange,
  onGenreChange,
}: ChatTopBarProps) {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(
    province
  );
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(genre);

  useEffect(() => {
    setSelectedProvince(province);
  }, [province]);

  useEffect(() => {
    setSelectedGenre(genre);
  }, [genre]);

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    onProvinceChange?.(value);
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    onGenreChange?.(value);
  };

  return (
    <div className='fixed top-0 right-0 left-0 lg:left-64 z-40 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      <div className='px-4 py-3 flex items-center gap-4'>
        {/* Filters section */}
        <div className='flex items-center gap-2.5 flex-shrink-0'>
          <Select
            aria-label='Province'
            placeholder='Province'
            selectedKeys={selectedProvince ? [selectedProvince] : []}
            onSelectionChange={keys => {
              const val = Array.from(keys)[0] as string;
              handleProvinceChange(val);
            }}
            className='w-40'
            size='sm'
          >
            {provinces.map(p => (
              <SelectItem key={p}>{p}</SelectItem>
            ))}
          </Select>
          <Select
            aria-label='Genre'
            placeholder='Genre'
            selectedKeys={selectedGenre ? [selectedGenre] : []}
            onSelectionChange={keys => {
              const val = Array.from(keys)[0] as string;
              handleGenreChange(val);
            }}
            className='w-36'
            size='sm'
          >
            {genres.map(g => (
              <SelectItem key={g}>{g}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Mini player component */}
        <div className='flex-1 flex justify-end'>
          <MiniPlayer />
        </div>
      </div>
    </div>
  );
}
