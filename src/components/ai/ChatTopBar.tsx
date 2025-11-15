'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectItem, Button } from '@heroui/react';
import MiniPlayer from '@/components/music/MiniPlayer';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface ChatTopBarProps {
  province?: string;
  onProvinceChange?: (_value: string | undefined) => void;
}

const provinces = [
  'All',
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

export default function ChatTopBar({
  province,
  onProvinceChange,
}: ChatTopBarProps) {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(
    province
  );
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

  const handleProvinceChange = (value: string) => {
    // If "All" is selected, pass undefined to clear province context
    const provinceValue = value === 'All' ? undefined : value;
    setSelectedProvince(provinceValue);
    onProvinceChange?.(provinceValue);
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
            <Select
              aria-label='Province'
              placeholder='All Provinces'
              selectedKeys={selectedProvince ? [selectedProvince] : ['All']}
              onSelectionChange={keys => {
                const val = Array.from(keys)[0] as string;
                handleProvinceChange(val);
              }}
              className='w-full'
              size='sm'
            >
              {provinces.map(p => (
                <SelectItem key={p}>{p}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout: heading, province filter, and mini player side by side
  return (
    <div className='hidden lg:block sticky top-0 z-40 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      <div className='px-4 py-3 flex items-center gap-4'>
        {/* Heading */}
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0'>
          AI Chat Streaming
        </h2>

        {/* Province filter */}
        <div className='flex items-center gap-2.5 flex-shrink-0'>
          <Select
            aria-label='Province'
            placeholder='All Provinces'
            selectedKeys={selectedProvince ? [selectedProvince] : ['All']}
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
