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
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getArtistImageUrl } from '@/components/pulse/utils';

interface EligibilityScore {
  artistProfileId: string;
  artistName: string;
  profileImage: string | null;
  score: number;
  rank: number;
  followerScore: number;
  engagementScore: number;
  consistencyScore: number;
  platformDiversityScore: number;
  calculatedAt: string;
}

export default function PulseEligibilityScores() {
  const [scores, setScores] = useState<EligibilityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recalculating, setRecalculating] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pulse/scores');
      if (response.ok) {
        const data = await response.json();
        setScores(data.scores || []);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateScore = async (artistProfileId: string) => {
    setRecalculating(artistProfileId);
    try {
      const response = await fetch(
        `/api/admin/pulse/scores/recalculate/${artistProfileId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        // Refresh scores after recalculation
        setTimeout(fetchScores, 2000);
      } else {
        alert('Failed to recalculate score');
      }
    } catch (error) {
      console.error('Error recalculating score:', error);
      alert('Failed to recalculate score');
    } finally {
      setRecalculating(null);
    }
  };

  const filteredScores = scores.filter(score =>
    score.artistName.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Scores Table - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Eligibility Scores
            </h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              {filteredScores.length} artist(s)
            </p>
          </div>
        </div>
        <Table
          aria-label='Eligibility scores'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn className='w-16'>Rank</TableColumn>
            <TableColumn>Artist</TableColumn>
            <TableColumn className='w-20'>Total</TableColumn>
            <TableColumn className='w-18'>Follower</TableColumn>
            <TableColumn className='w-20'>Engagement</TableColumn>
            <TableColumn className='w-20'>Consistency</TableColumn>
            <TableColumn className='w-24'>Diversity</TableColumn>
            <TableColumn className='w-28'>Calculated</TableColumn>
            <TableColumn className='w-20'>Actions</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No scores found'>
            {filteredScores.map(score => (
              <TableRow
                key={score.artistProfileId}
                className='hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                <TableCell>
                  <Chip
                    size='sm'
                    variant='flat'
                    color='primary'
                    className='text-xs'
                  >
                    #{score.rank}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                      {getArtistImageUrl(score.profileImage) ? (
                        <Image
                          src={getArtistImageUrl(score.profileImage)!}
                          alt={score.artistName}
                          width={24}
                          height={24}
                          className='object-cover'
                        />
                      ) : (
                        <span className='text-[10px] font-semibold text-gray-500 dark:text-gray-300'>
                          {score.artistName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <div className='font-medium text-xs truncate'>
                        {score.artistName}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                        {score.artistProfileId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='font-bold text-base text-blue-600 dark:text-blue-400'>
                    {score.score.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className='text-gray-600 dark:text-gray-400'>
                  {score.followerScore.toFixed(1)}
                </TableCell>
                <TableCell className='text-gray-600 dark:text-gray-400'>
                  {score.engagementScore.toFixed(1)}
                </TableCell>
                <TableCell className='text-gray-600 dark:text-gray-400'>
                  {score.consistencyScore.toFixed(1)}
                </TableCell>
                <TableCell className='text-gray-600 dark:text-gray-400'>
                  {score.platformDiversityScore.toFixed(1)}
                </TableCell>
                <TableCell className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                  {new Date(score.calculatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    color='primary'
                    variant='light'
                    isIconOnly
                    onPress={() => recalculateScore(score.artistProfileId)}
                    isLoading={recalculating === score.artistProfileId}
                    className='min-w-0 w-7 h-7'
                  >
                    <ArrowPathIcon className='h-3.5 w-3.5' />
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
