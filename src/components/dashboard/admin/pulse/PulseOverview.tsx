'use client';

import { useState, useEffect } from 'react';
import { Chip, Spinner } from '@heroui/react';
import {
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
  EyeIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

interface PulseStats {
  totalArtistsWithScores: number;
  activeTiers: number;
  totalLeagueEntries: number;
  lastEligibilityRecalc: string | null;
  lastLeagueRun: string | null;
  top100Monitored: number;
  tiktokConnections: number;
}

export default function PulseOverview() {
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPulseStats();
  }, []);

  const fetchPulseStats = async () => {
    try {
      const response = await fetch('/api/admin/pulse/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching PULSE³ stats:', error);
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

  if (!stats) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        Failed to load PULSE³ statistics
      </div>
    );
  }

  const statCards = [
    {
      title: 'Artists with Scores',
      value: stats.totalArtistsWithScores.toLocaleString(),
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Tiers',
      value: stats.activeTiers.toString(),
      icon: TrophyIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'League Entries',
      value: stats.totalLeagueEntries.toLocaleString(),
      icon: ChartBarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Top 100 Monitored',
      value: stats.top100Monitored.toLocaleString(),
      icon: EyeIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'TikTok Connections',
      value: stats.tiktokConnections.toLocaleString(),
      icon: CloudIcon,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
  ];

  return (
    <div className='space-y-4'>
      {/* Stats Grid - Compact */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate'>
                    {stat.title}
                  </p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white leading-tight'>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.bgColor} ${stat.color} p-2 rounded-lg flex-shrink-0 ml-2`}
                >
                  <Icon className='h-5 w-5' />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Run Status - Compact */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Last Eligibility Recalc
            </h3>
            {stats.lastEligibilityRecalc ? (
              <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />
            ) : (
              <div className='h-2 w-2 rounded-full bg-gray-300' />
            )}
          </div>
          {stats.lastEligibilityRecalc ? (
            <div className='space-y-1.5'>
              <p className='text-xs text-gray-600 dark:text-gray-400 font-mono'>
                {new Date(stats.lastEligibilityRecalc).toLocaleString()}
              </p>
              <Chip
                size='sm'
                color='success'
                variant='flat'
                className='text-xs'
              >
                ✓ Completed
              </Chip>
            </div>
          ) : (
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              No runs yet
            </p>
          )}
        </div>

        <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
              Last League Run
            </h3>
            {stats.lastLeagueRun ? (
              <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />
            ) : (
              <div className='h-2 w-2 rounded-full bg-gray-300' />
            )}
          </div>
          {stats.lastLeagueRun ? (
            <div className='space-y-1.5'>
              <p className='text-xs text-gray-600 dark:text-gray-400 font-mono'>
                {new Date(stats.lastLeagueRun).toLocaleString()}
              </p>
              <Chip
                size='sm'
                color='success'
                variant='flat'
                className='text-xs'
              >
                ✓ Completed
              </Chip>
            </div>
          ) : (
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              No runs yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
