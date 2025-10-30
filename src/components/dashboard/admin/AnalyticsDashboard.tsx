'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import {
  ChartBarIcon,
  PlayIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

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
    track?: { title: string; artist: string } | null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardBody className='p-6'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2'></div>
                <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
              </CardBody>
            </Card>
          ))}
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {metric === 'plays' && (
          <>
            <Card>
              <CardBody className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                    <PlayIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Total Plays
                    </p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {formatNumber(analytics.totalPlays || 0)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                    <ChartBarIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Unique Listeners
                    </p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {formatNumber(analytics.uniquePlays || 0)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center'>
                    <PlayIcon className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Avg Duration
                    </p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {analytics.avgDuration
                        ? formatDuration(analytics.avgDuration)
                        : '0:00'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className='p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center'>
                    <ChartBarIcon className='w-5 h-5 text-orange-600 dark:text-orange-400' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Completion Rate
                    </p>
                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {analytics.avgCompletionRate
                        ? `${analytics.avgCompletionRate.toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {metric === 'likes' && (
          <Card>
            <CardBody className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center'>
                  <HeartIcon className='w-5 h-5 text-red-600 dark:text-red-400' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Total Likes
                  </p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {formatNumber(analytics.totalLikes || 0)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {metric === 'shares' && (
          <Card>
            <CardBody className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                  <ShareIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Total Shares
                  </p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {formatNumber(analytics.totalShares || 0)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {metric === 'downloads' && (
          <Card>
            <CardBody className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center'>
                  <ArrowDownTrayIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Total Downloads
                  </p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {formatNumber(analytics.totalDownloads || 0)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {metric === 'saves' && (
          <Card>
            <CardBody className='p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center'>
                  <BookmarkIcon className='w-5 h-5 text-yellow-600 dark:text-yellow-400' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Total Saves
                  </p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {formatNumber(analytics.totalSaves || 0)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
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
                      <div>
                        <p className='font-medium text-gray-900 dark:text-white'>
                          {track.track?.title || 'Unknown Track'}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {track.track?.artist || 'Unknown Artist'}
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
