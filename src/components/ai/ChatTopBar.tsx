'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectItem, Button } from '@heroui/react';
import MiniPlayer from '@/components/music/MiniPlayer';
import { FunnelIcon } from '@heroicons/react/24/outline';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile layout: Filters only (player is in navigation header)
  if (isMobile) {
    return (
      <div className='fixed top-14 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-slate-700/80'>
        {/* Filter toggle button */}
        <div className='px-3 py-2'>
          <Button
            size='sm'
            variant='light'
            className='w-full justify-start'
            startContent={<FunnelIcon className='w-4 h-4' />}
            onPress={() => setShowFilters(!showFilters)}
            aria-label='Toggle filters'
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Collapsible filters section */}
        {showFilters && (
          <div className='px-3 pb-3 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50'>
            <div className='flex items-center gap-2'>
              <Select
                aria-label='Province'
                placeholder='Province'
                selectedKeys={selectedProvince ? [selectedProvince] : []}
                onSelectionChange={keys => {
                  const val = Array.from(keys)[0] as string;
                  handleProvinceChange(val);
                }}
                className='flex-1'
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
                className='flex-1'
                size='sm'
              >
                {genres.map(g => (
                  <SelectItem key={g}>{g}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout: filters and mini player side by side
  return (
    <div className='hidden lg:block sticky top-0 z-40 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      <div className='px-4 py-3 flex items-center gap-4'>
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

        <div className='flex-1 flex justify-end min-w-0'>
          <div className='w-full max-w-md'>
          <MiniPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
