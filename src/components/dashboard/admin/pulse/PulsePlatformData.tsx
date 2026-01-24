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
  Chip,
  Spinner,
} from '@heroui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getArtistImageUrl } from '@/components/pulse/utils';

interface PlatformConnection {
  artistProfileId: string;
  artistName: string;
  profileImage: string | null;
  platform: string;
  followerCount: number | null;
  videoCount: number | null;
  fetchedAt: string;
  isConnected: boolean;
}

export default function PulsePlatformData() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pulse/platform-data');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {/* Search - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3'>
        <Input
          size='sm'
          placeholder='Search artists...'
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<MagnifyingGlassIcon className='h-4 w-4' />}
          className='w-full'
          classNames={{ input: 'text-xs' }}
        />
      </div>

      {/* Platform Connections Table - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Platform Connections
            </h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              {filteredConnections.length} connection(s)
            </p>
          </div>
        </div>
        <Table
          aria-label='Platform connections'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn>Artist</TableColumn>
            <TableColumn className='w-20'>Platform</TableColumn>
            <TableColumn className='w-24'>Status</TableColumn>
            <TableColumn className='w-24'>Followers</TableColumn>
            <TableColumn className='w-20'>Videos</TableColumn>
            <TableColumn className='w-32'>Last Fetched</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No connections found'>
            {filteredConnections.map((conn, index) => (
              <TableRow
                key={`${conn.artistProfileId}-${conn.platform}-${index}`}
                className='hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                      {getArtistImageUrl(conn.profileImage) ? (
                        <Image
                          src={getArtistImageUrl(conn.profileImage)!}
                          alt={conn.artistName}
                          width={24}
                          height={24}
                          className='object-cover'
                        />
                      ) : (
                        <span className='text-[10px] font-semibold text-gray-500 dark:text-gray-300'>
                          {conn.artistName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <div className='font-medium text-xs truncate'>
                        {conn.artistName}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                        {conn.artistProfileId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    variant='flat'
                    color='primary'
                    className='text-xs'
                  >
                    {conn.platform.toUpperCase()}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={conn.isConnected ? 'success' : 'default'}
                    variant='flat'
                    className='text-xs'
                  >
                    {conn.isConnected ? '✓' : '✗'}
                  </Chip>
                </TableCell>
                <TableCell className='font-medium'>
                  {conn.followerCount
                    ? conn.followerCount.toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell className='font-medium'>
                  {conn.videoCount ? conn.videoCount.toLocaleString() : '—'}
                </TableCell>
                <TableCell className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                  {new Date(conn.fetchedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
