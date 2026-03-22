'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { StatCard } from '@/components/ui/StatCard';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';

interface AnalyticsData {
  totalPlays?: number;
  uniquePlays?: number;
  totalLikes?: number;
  totalShares?: number;
  totalDownloads?: number;
  totalSaves?: number;
  topTracks?: Array<{
    trackId: string;
    _count: { id: number };
    track?: {
      title: string;
      artist: string;
      completionPercentage?: number;
    } | null;
  }>;
  sourceBreakdown?: Array<{
    source: string;
    _count: { id: number };
  }>;
  platformBreakdown?: Array<{
    platform: string;
    _count: { id: number };
  }>;
  avgDuration?: number;
  avgCompletionRate?: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<
    '24h' | '7d' | '30d' | '90d' | 'all'
  >('7d');
  const [metric, setMetric] = useState<
    'plays' | 'likes' | 'shares' | 'downloads' | 'saves'
  >('plays');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, metric]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/stats/analytics?timeRange=${timeRange}&metric=${metric}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Analytics Dashboard
          </h2>
        </div>
        <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm px-6 py-5'>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='animate-pulse space-y-2'>
                <div className='h-7 bg-gray-200 dark:bg-slate-700 rounded w-14' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-10' />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Analytics Dashboard
        </h2>
        <div className='flex items-center gap-2'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
          >
            <option value='24h'>Last 24 Hours</option>
            <option value='7d'>Last 7 Days</option>
            <option value='30d'>Last 30 Days</option>
            <option value='90d'>Last 90 Days</option>
            <option value='all'>All Time</option>
          </select>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as any)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
          >
            <option value='plays'>Plays</option>
            <option value='likes'>Likes</option>
            <option value='shares'>Shares</option>
            <option value='downloads'>Downloads</option>
            <option value='saves'>Saves</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm px-6 py-5'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700'>
          {metric === 'plays' && (
            <>
              <StatCard
                label='Total Plays'
                value={formatNumber(analytics.totalPlays || 0)}
              />
              <StatCard
                label='Unique Listeners'
                value={formatNumber(analytics.uniquePlays || 0)}
              />
              <StatCard
                label='Avg Duration'
                value={
                  analytics.avgDuration
                    ? formatDuration(analytics.avgDuration)
                    : '0:00'
                }
              />
              <StatCard
                label='Completion Rate'
                value={
                  analytics.avgCompletionRate
                    ? `${analytics.avgCompletionRate.toFixed(1)}%`
                    : '0%'
                }
              />
            </>
          )}
          {metric === 'likes' && (
            <StatCard
              label='Total Likes'
              value={formatNumber(analytics.totalLikes || 0)}
            />
          )}
          {metric === 'shares' && (
            <StatCard
              label='Total Shares'
              value={formatNumber(analytics.totalShares || 0)}
            />
          )}
          {metric === 'downloads' && (
            <StatCard
              label='Total Downloads'
              value={formatNumber(analytics.totalDownloads || 0)}
            />
          )}
          {metric === 'saves' && (
            <StatCard
              label='Total Saves'
              value={formatNumber(analytics.totalSaves || 0)}
            />
          )}
        </div>
      </div>

      {/* Top Tracks */}
      {analytics.topTracks && analytics.topTracks.length > 0 && (
        <Card>
          <CardBody className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Top Tracks
            </h3>
            <div className='space-y-3'>
              {analytics.topTracks.map((track, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={track.trackId}
                    className='flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                        {rank}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-gray-900 dark:text-white truncate flex-1'>
                            {track.track?.title || 'Unknown Track'}
                          </p>
                          {track.track?.completionPercentage !== undefined && (
                            <CompletionBadge
                              percentage={track.track.completionPercentage}
                              size='sm'
                              variant='flat'
                            />
                          )}
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          <ArtistDisplay legacyArtist={track.track?.artist} />
                        </p>
                      </div>
                    </div>
                    <Chip size='sm' color='primary' variant='flat'>
                      {formatNumber(track._count.id)} plays
                    </Chip>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Source Breakdown */}
      {analytics.sourceBreakdown && analytics.sourceBreakdown.length > 0 && (
        <Card>
          <CardBody className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Traffic Sources
            </h3>
            <div className='space-y-2'>
              {analytics.sourceBreakdown.map((source, _index) => (
                <div
                  key={source.source}
                  className='flex items-center justify-between'
                >
                  <span className='text-gray-600 dark:text-gray-400 capitalize'>
                    {source.source.replace('_', ' ')}
                  </span>
                  <Chip size='sm' color='primary' variant='flat'>
                    {formatNumber(source._count.id)}
                  </Chip>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
