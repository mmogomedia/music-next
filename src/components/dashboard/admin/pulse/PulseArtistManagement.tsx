'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Button,
  Chip,
  Spinner,
  Select,
  SelectItem,
} from '@heroui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getArtistImageUrl } from '@/components/pulse/utils';

interface TierEntry {
  id: string;
  artistProfileId: string;
  artistName: string;
  profileImage: string | null;
  rank: number;
  score: number;
  bandState: 'SECURE' | 'BELOW_RANGE' | 'ABOVE_RANGE';
  statusChange: string;
  tierCode: string;
  tierName: string;
}

export default function PulseArtistManagement() {
  const [entries, setEntries] = useState<TierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [tiers, setTiers] = useState<Array<{ code: string; name: string }>>([]);

  useEffect(() => {
    fetchTiers();
    fetchEntries();
  }, [selectedTier]);

  const fetchTiers = async () => {
    try {
      const response = await fetch('/api/admin/pulse/tiers');
      if (response.ok) {
        const data = await response.json();
        setTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const url =
        selectedTier === 'all'
          ? '/api/admin/pulse/entries'
          : `/api/admin/pulse/entries?tier=${selectedTier}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeArtistFromTier = async (
    artistProfileId: string,
    tierCode: string
  ) => {
    if (
      !confirm(
        `Remove this artist from ${tierCode}? This will take effect on the next league run.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/admin/pulse/entries/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistProfileId, tierCode }),
      });

      if (response.ok) {
        fetchEntries();
      } else {
        alert('Failed to remove artist from tier');
      }
    } catch (error) {
      console.error('Error removing artist:', error);
      alert('Failed to remove artist from tier');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.artistProfileId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getBandStateColor = (
    state: 'SECURE' | 'BELOW_RANGE' | 'ABOVE_RANGE'
  ) => {
    switch (state) {
      case 'SECURE':
        return 'success';
      case 'BELOW_RANGE':
        return 'warning';
      case 'ABOVE_RANGE':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {/* Filters - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3'>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Input
            size='sm'
            placeholder='Search artists...'
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<MagnifyingGlassIcon className='h-4 w-4' />}
            className='flex-1'
            classNames={{ input: 'text-xs' }}
          />
          <Select
            size='sm'
            placeholder='Filter by tier'
            selectedKeys={[selectedTier]}
            onSelectionChange={keys => {
              const value = Array.from(keys)[0] as string;
              setSelectedTier(value);
            }}
            className='w-full sm:w-40'
            classNames={{ trigger: 'text-xs' }}
          >
            {[{ code: 'all', name: 'All Tiers' }, ...tiers].map(tier => (
              <SelectItem key={tier.code} textValue={tier.name}>
                {tier.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Entries Table - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Artists in Tiers
            </h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              {filteredEntries.length} found
            </p>
          </div>
        </div>
        <Table
          aria-label='Artists in tiers'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn className='w-24'>Tier</TableColumn>
            <TableColumn>Artist</TableColumn>
            <TableColumn className='w-16'>Rank</TableColumn>
            <TableColumn className='w-20'>Score</TableColumn>
            <TableColumn className='w-28'>State</TableColumn>
            <TableColumn className='w-24'>Status</TableColumn>
            <TableColumn className='w-20'>Actions</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No artists found'>
            {filteredEntries.map(entry => (
              <TableRow
                key={`${entry.tierCode}-${entry.artistProfileId}`}
                className='hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                <TableCell>
                  <div>
                    <div className='font-medium text-xs'>{entry.tierName}</div>
                    <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                      {entry.tierCode}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                      {getArtistImageUrl(entry.profileImage) ? (
                        <Image
                          src={getArtistImageUrl(entry.profileImage)!}
                          alt={entry.artistName}
                          width={24}
                          height={24}
                          className='object-cover'
                        />
                      ) : (
                        <span className='text-[10px] font-semibold text-gray-500 dark:text-gray-300'>
                          {entry.artistName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <div className='font-medium text-xs truncate'>
                        {entry.artistName}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                        {entry.artistProfileId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size='sm' variant='flat' className='text-xs'>
                    #{entry.rank}
                  </Chip>
                </TableCell>
                <TableCell className='font-bold text-blue-600 dark:text-blue-400'>
                  {entry.score.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={getBandStateColor(entry.bandState)}
                    variant='flat'
                    className='text-xs'
                  >
                    {entry.bandState.replace('_', ' ')}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size='sm' variant='flat' className='text-xs'>
                    {entry.statusChange}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    color='danger'
                    variant='light'
                    isIconOnly
                    onPress={() =>
                      removeArtistFromTier(
                        entry.artistProfileId,
                        entry.tierCode
                      )
                    }
                    className='min-w-0 w-7 h-7'
                  >
                    <XMarkIcon className='h-3.5 w-3.5' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
