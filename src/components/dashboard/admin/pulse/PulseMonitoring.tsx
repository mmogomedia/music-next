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
  Chip,
  Spinner,
} from '@heroui/react';
import { getArtistImageUrl } from '@/components/pulse/utils';

interface MonitoredArtist {
  artistProfileId: string;
  artistName: string;
  profileImage: string | null;
  score: number;
  rank: number;
  isActivelyMonitored: boolean;
  lastScoreUpdate: string;
}

export default function PulseMonitoring() {
  const [monitored, setMonitored] = useState<MonitoredArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pulse/monitoring');
      if (response.ok) {
        const data = await response.json();
        setMonitored(data.artists || []);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
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
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Top 100 Monitored Artists
            </h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              {monitored.length} actively monitored
            </p>
          </div>
        </div>
        <Table
          aria-label='Monitored artists'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn className='w-16'>Rank</TableColumn>
            <TableColumn>Artist</TableColumn>
            <TableColumn className='w-20'>Score</TableColumn>
            <TableColumn className='w-24'>Status</TableColumn>
            <TableColumn className='w-32'>Last Update</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No monitored artists found'>
            {monitored.map(artist => (
              <TableRow
                key={artist.artistProfileId}
                className='hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                <TableCell>
                  <Chip
                    size='sm'
                    variant='flat'
                    color='primary'
                    className='text-xs'
                  >
                    #{artist.rank}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                      {getArtistImageUrl(artist.profileImage) ? (
                        <Image
                          src={getArtistImageUrl(artist.profileImage)!}
                          alt={artist.artistName}
                          width={24}
                          height={24}
                          className='object-cover'
                        />
                      ) : (
                        <span className='text-[10px] font-semibold text-gray-500 dark:text-gray-300'>
                          {artist.artistName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <div className='font-medium text-xs truncate'>
                        {artist.artistName}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                        {artist.artistProfileId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='font-bold text-base text-blue-600 dark:text-blue-400'>
                    {artist.score.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={artist.isActivelyMonitored ? 'success' : 'default'}
                    variant='flat'
                    className='text-xs'
                  >
                    {artist.isActivelyMonitored ? '✓ Active' : 'Inactive'}
                  </Chip>
                </TableCell>
                <TableCell className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                  {new Date(artist.lastScoreUpdate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
